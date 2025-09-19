import uuid
import asyncio
import json
import os
import re
import requests
from typing import Dict, List, Any
import openai
from .models.requests import StartAnalysisRequest
from .utils.prompts import (
    get_db_embedded_prompt,
    is_database_registered,
)
from .code_service import CodeService
from .utils.llm_models import (
    get_openai_client,
    get_model_by_id,
)

# 個別分析の状態を保持するためのグローバル変数
analysis_states: Dict[str, Dict[str, Any]] = {}

# 個別分析の集合をspaceとする
spaces: Dict[str, List[str]] = {}  # analysis_idのリスト

space_history: Dict[str, List[List[Dict]]] = {}  # スペースの履歴を保持するリスト(履歴は二次元配列で)

code_service = CodeService()

ACTION_MODEL_TEMPERATURE = 0.2

def create_space():
    """新しいspaceを作成し、space_idを返す"""
    global spaces
    global space_history
    space_id = str(uuid.uuid4())
    spaces[space_id] = []
    space_history[space_id] = []
    return space_id

def get_space(space_id: str) -> List[str]:
    """指定されたspace_idの分析IDリストを取得"""
    return spaces.get(space_id, [])

def start_analysis(request: StartAnalysisRequest) -> str:
    """分析を開始し、analysis_idを返す"""
    global analysis_states
    global spaces
    global space_history
    # バリデーション
    _validate_request(request)
    if request.index != -1:
        # 履歴のindexが指定されている場合、そのindexまで履歴を戻す
        print(f"Reverting to history index {request.index} for space {request.space_id}")
        if 0 <= request.index < len(space_history[request.space_id]):
            # space_history[request.space_id] = space_history[request.space_id][: (request.index)]
            # spaces[request.space_id] = spaces[request.space_id][: request.index]
            del space_history[request.space_id][request.index:]
            del spaces[request.space_id][request.index:]
        else:
            raise ValueError("Invalid history index")
    analysis_id = str(uuid.uuid4())
    spaces[request.space_id].append(analysis_id)
    
    analysis_states[analysis_id] = {
        "query": request.query,
        "tables": request.tables,
        "mode": request.mode,
        "model": request.model,
        "done": False,
        "progress": "Analysis in progress...",
        "error": "",
        "python_code": "",
        "content": [],
        "steps": [],
        "full_response": "",
    }

    # 非同期でAI分析を開始
    if request.mode == "agentic":
        # エージェント型分析
        print("Starting agentic analysis...")
        asyncio.create_task(_run_analysis(request.space_id,analysis_id, request))
    else:
        # 通常の分析
        print("Starting standard analysis...")
        asyncio.create_task(_run_analysis(request.space_id,analysis_id, request))
        # asyncio.create_task(_run_analysis_non_streaming(analysis_id, request))

    return analysis_id

def _validate_request(request: StartAnalysisRequest):
    """リクエストのバリデーション"""
    # データベース登録チェック
    if not is_database_registered():
        raise ValueError("データベース未登録")

    # クエリ長さチェック
    if len(request.query.strip()) <= 5:
        raise ValueError("クエリが短すぎます")


async def _run_analysis(space_id:str,analysis_id: str, request: StartAnalysisRequest):
    """実際の分析処理を行う"""
    global analysis_states
    global space_history
    try:
        state = analysis_states[analysis_id]

        # プログレス更新
        state["progress"] = "Thinking..."

        # OpenAIクライアントの設定
        print("Starting analysis with model:", request.model)
        # カスタムモデルが指定されている場合は現在未対応
        # AI応答の生成
        actionmodel_client = get_openai_client(request.model)
        model = get_model_by_id(request.model)
        if "quelmap" in model["model_name"] or "lightning" in model["model_name"]:
            messages = [{"role": "system", "content": get_db_embedded_prompt(request.tables)[1]}]
        else:
            messages = [{"role": "system", "content": get_db_embedded_prompt(request.tables)[0]}]
        for history in space_history[space_id]:
            messages.extend(history)
        messages.append({"role": "user", "content": request.query})
        stream = await actionmodel_client.chat.completions.create(
            model=model["model_name"],
            messages=messages,
            temperature=ACTION_MODEL_TEMPERATURE,
            stream=True,
            **model["config"],
        )
        full_response = ""
        executed = False
        code_task = None

        # ストリーミング処理
        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                full_response += content
            if "<python>" not in full_response:
                state["progress"] = f"Thinking... {full_response[-20:]}"
            # Pythonコード実行開始の検出
            if "<python>" in full_response and "</python>" not in full_response:
                state["progress"] = "Executing Python code..."

            # Pythonコード実行
            if not executed and "</python>" in full_response:
                executed = True
                python_code = _del_think_tag(full_response).split("<python>")[1].split("</python>")[0]
                state["python_code"] = python_code
                # 非ブロッキングでコード実行を開始
                code_task = asyncio.create_task(
                    code_service.code_execution(python_code, space_id)
                )

            # レポート生成の検出
            if "<report>" in full_response and "</report>" not in full_response:
                state["progress"] = "Generating report..."
                report_buffer = _del_think_tag(full_response).split("<report>")[1]
                state["content"] = [{"type": "markdown", "content": report_buffer}]

        # コードの実行が完了するまで待機（タイムアウト付き）
        if code_task and not code_task.done():
            try:
                # 最大10秒間待機
                code_result = await asyncio.wait_for(code_task, timeout=10.0)
            except asyncio.TimeoutError:
                state["error"] = "Code execution timed out"
                state["done"] = True
                return
        else:
            code_result = (
                code_task.result() if code_task else {"result": "No code executed"}
            )
        print(full_response)
        if full_response == "":
            state["error"] = "No response from model"
            state["done"] = True
            return

        if code_result and ("error" in code_result or "code_error" in code_result):
            error_msg = code_result.get(
                "error", code_result.get("code_error", "Unknown error")
            )
            # エラーが発生した場合
            #### new⭐️ LLMを使用してpythonコードを書き換えて再実行する
            #
            #
            state["progress"] = "Fixing code execution error..."
            message = f"以下のエラーが発生しました。\n{error_msg}\n\n修正後のpythonコードを<python></python>タグで囲んで返してください。"
            messages.append({"role": "assistant", "content": full_response})
            messages.append({"role": "user", "content": message})
            fixed_response = await actionmodel_client.chat.completions.create(
                model=model["model_name"],
                messages=messages,
                temperature=ACTION_MODEL_TEMPERATURE,
            )
            if not fixed_response.choices or not fixed_response.choices[0].message:
                state["error"] = "モデルからの応答がありません。"
                state["done"] = True
                return
            fixed_full_response = fixed_response.choices[0].message.content
            print("## 修正後のコード")
            print(fixed_full_response)
            if (
                "<python>" not in fixed_full_response
                or "</python>" not in fixed_full_response
            ):
                state["error"] = "修正されたpythonコードがありません。"
                state["done"] = True
                return
            fixed_python_code = _del_think_tag(fixed_full_response).split("<python>")[1].split(
                "</python>"
            )[0]
            state["python_code"] = fixed_python_code
            # full_response 内のpythonタグの内容をfixed_python_codeに置き換える
            full_response = full_response.split("<python>")[0] + "<python>" + fixed_python_code + "</python>" + full_response.split("</python>")[1]
            # 修正されたコードを再実行
            code_task = await code_service.code_execution(
                fixed_python_code, space_id
            )
            if code_task and ("error" in code_task or "code_error" in code_task):
                error_msg = code_task.get(
                    "error", code_task.get("code_error", "Unknown error")
                )
                state["progress"] = f"再実行後のコード実行エラー: {error_msg}"
                state["done"] = True
                state["error"] = f"再実行後のコード実行エラー: {error_msg}"
                return
        if "</report>" not in full_response:
            full_response += "\n</report>"
        state["full_response"] = full_response
        # レスポンスの解析とコンテンツの生成
        content = await _parse_response_to_content(
            full_response, space_id, ignore_errors=True
        )
        state["content"] = content

        # 完了
        state["done"] = True
        state["progress"] = ""

        # レポートの保存
        # save_report(request.model or "default", request.query, full_response, "ok")

        # 通常の分析の時は全部履歴に入れる
        space_history[space_id].append([{"role":"user", "content": request.query},{"role":"assistant", "content": full_response}])

    except Exception as e:
        print(f"Analysis error for {analysis_id}: {str(e)}")
        state = analysis_states.get(analysis_id, {})
        state["error"] = f"Error: {str(e)}"
        state["done"] = True
        state["progress"] = ""

def _del_think_tag(content:str) ->str:
    return re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL)

import re
from typing import List, Dict, Any

async def _parse_response_to_content(
    response: str,
    analysis_id: str,
    ignore_errors: bool = True
) -> List[Dict[str, Any]]:
    """AIの応答を解析してコンテンツ形式に変換（安全版）"""
    content: List[Dict[str, Any]] = []

    # 入力チェック
    if not isinstance(response, str):
        raise TypeError(f"response must be str, got {type(response).__name__}")

    # <report> タグ抽出（大文字小文字非依存）
    match = re.search(r"<report>(.*?)</report>", response, re.IGNORECASE | re.DOTALL)
    report_content = match.group(1) if match else response

    # 変数パターン（改行も許容）
    variable_pattern = r"\{([^\{\}]+?)\}"
    variables_iter = list(re.finditer(variable_pattern, report_content))
    print(f"Found {len(variables_iter)} variables in report content")

    # 処理カーソル
    cursor = 0

    for var_match in variables_iter:
        placeholder = var_match.group(0)
        var_name = var_match.group(1)

        # プレースホルダより前のテキストを追加
        before_text = report_content[cursor:var_match.start()]
        if before_text.strip():
            content.append({"type": "markdown", "content": before_text.strip()})

        # 変数の値を取得
        try:
            var_result = await code_service.get_variable_value(analysis_id, var_name)
        except Exception as e:
            if ignore_errors:
                print(f"Error retrieving variable '{var_name}': {e}")
                cursor = var_match.end()
                continue
            else:
                raise

        if var_result and isinstance(var_result, dict):
            if "result" in var_result and isinstance(var_result["result"], list):
                for var_content in var_result["result"]:
                    var_type = var_content.get("type", "string")
                    data = var_content.get("data")

                    if var_type == "image":
                        content.append({"type": "image", "base64": data})
                    elif var_type == "table":
                        content.append({"type": "table", "table": data})
                    else:
                        content.append({"type": "variable", "data": data})

            elif "error" in var_result:
                if ignore_errors:
                    print(f"Variable retrieval error for {var_name}: {var_result['error']}")
                else:
                    raise ValueError(
                        f"Variable retrieval error for {var_name}: {var_result['error']}"
                    )
            else:
                if ignore_errors:
                    print(f"Unexpected variable result format for {var_name}: {var_result}")
        else:
            if ignore_errors:
                print(f"No data returned for variable '{var_name}'")
            else:
                raise ValueError(f"No data returned for variable '{var_name}'")

        cursor = var_match.end()

    # 残りのテキストをmarkdownとして追加
    remaining_text = report_content[cursor:]
    if remaining_text.strip():
        content.append({"type": "markdown", "content": remaining_text.strip()})

    return content



def get_analysis_state(analysis_id: str) -> Dict[str, Any]:
    global analysis_states
    if analysis_id not in analysis_states:
        return {
            "done": True,
            "error": "Analysis ID not found",
            "progress": "",
            "query": "",
            "python_code": "",
            "content": [],
        }

    # 状態のコピーを返してスレッドセーフにする
    state = analysis_states[analysis_id].copy()
    return state
