import os
import io
import traceback
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import json 
import re
import matplotlib.pyplot as plt
import japanize_matplotlib
import base64
import time

app = FastAPI()

# --- 環境変数からDB接続情報を取得 ---

DB_READER_USER = os.getenv("DB_READER_USER")
DB_READER_PASSWORD = os.getenv("DB_READER_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")
DEFAULT_DB_URL = f"postgresql://{DB_READER_USER}:{DB_READER_PASSWORD}@quelmap-db:5432/{POSTGRES_DB}"

# USER_DATABASE_URLが設定されていればそれを優先
DATABASE_URL = os.getenv("USER_DATABASE_URL", DEFAULT_DB_URL)

try:
    engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 5})
    with engine.connect() as connection:
        print("Database connection successful for code_runner.")
except Exception as e:
    print(f"Error connecting to database: {e}")
    engine = None

### コンテナの状態管理 ###
QUE = 0
STRAGE = {}
STRAGE_ROLLBACK = {}

IS_RUNNING = {}


### エンドポイント　###
# コンテナのキューの数を返す
@app.get("/status")
def get_status():
    return {"que": QUE}

#コードの実行
class CodeExecutionRequest(BaseModel):
    id :str
    code: str
@app.post("/code")
def execute_code(request: CodeExecutionRequest):
    if engine is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    global QUE
    global STRAGE
    global STRAGE_ROLLBACK
    global IS_RUNNING
    QUE += 1
    if request.id in STRAGE and STRAGE[request.id] is not None:
        localvars = STRAGE[request.id]
    else:
        localvars = {"engine": engine }

    # ロールバック用の変数を保存
    STRAGE_ROLLBACK[request.id] = localvars.copy()

    #コードの前処理
    code = request.code
    #バックスラッシュを戻す
    code = code.replace("%@", "\\")
    #engine = で始まる行を削除
    code = re.sub(r'^engine\s*=.*\n?', '', code, flags=re.MULTILINE)

    IS_RUNNING[request.id] = True

    #コードの実行
    try:
        exec(code, localvars)
    except Exception as e:
        QUE -= 1
        IS_RUNNING[request.id] = False
        return {"error": str(e), "trace": traceback.format_exc(), "id": request.id}

    #変数の保存
    STRAGE[request.id] = localvars
    QUE -= 1
    IS_RUNNING[request.id] = False
    return {"ok": "code executed successfully"}

#変数をロールバック(アクションモデルが実行中にエラーが発生した場合など)
class VariableRollbackRequest(BaseModel):
    id: str
@app.post("/rollback")
def rollback_variable(request: VariableRollbackRequest):
    global STRAGE
    global STRAGE_ROLLBACK
    global IS_RUNNING
    if request.id not in STRAGE or request.id not in STRAGE_ROLLBACK:
        return {"error": "Id not found"}
    
    # IS_RUNNING[request.id] = Falseなら完了するまで待つ
    timeout = 10
    start_time = time.time()
    while IS_RUNNING[request.id] and (time.time() - start_time) < timeout:
        pass
    if IS_RUNNING[request.id]:
        return {"error": "Code is still running, please try again later"}
    
    # ロールバック
    STRAGE[request.id] = STRAGE_ROLLBACK[request.id]
    return {"ok": "variables rolled back successfully"}


#保存された変数の取得
class VariableRetrievalResponse(BaseModel):
    id: str
    name: str
@app.post("/var")
def get_variable(request: VariableRetrievalResponse):
    global STRAGE
    global IS_RUNNING
    if request.id not in STRAGE or request.id not in IS_RUNNING:
        return {"error": "Id not found"}
    
    # IS_RUNNING[request.id] = Falseなら完了するまで待つ
    timeout = 10
    start_time = time.time()
    while IS_RUNNING[request.id] and (time.time() - start_time) < timeout:
        pass
    if IS_RUNNING[request.id]:
        return {"error": "Code is still running, please try again later"}
    
    currentstrage = STRAGE[request.id]

    # :.の対策
    if ":." in request.name:
        requestcode = f"f'''{{{request.name}}}'''"
    else:
        requestcode = request.name

    # evalで"df.shape"や"df.columns"を実行できるようにする(dfなどの変数はcurrentstrageに入っている)
    try:
        result = eval(requestcode, {}, currentstrage)
    except Exception as e:
        if "error" in request.name or "log" in request.name:
            return {"data": "", "type": "string"}
        return {"error": "エラー: " + str(e)}
    
    def _to_json(result):
        if isinstance(result, pd.DataFrame):
            # indexが意味のある値を持っているかチェック
            df_copy = result.copy()
            if not df_copy.index.equals(pd.RangeIndex(len(df_copy))):
                # indexが意味のある値を持っている場合、先頭に空のカラム名でindexを追加
                df_copy.insert(0, '', df_copy.index)
            return {"data": df_copy.to_json(orient="records"), "type": "table"}
        elif isinstance(result, pd.Series):
            # Seriesの場合もindexをチェック
            series_copy = result.copy()
            df_from_series = pd.DataFrame([series_copy])
            if not series_copy.index.equals(pd.RangeIndex(len(series_copy))):
                # indexが意味のある値を持っている場合、先頭に空のカラム名でindexを追加
                df_from_series.insert(0, '', series_copy.index)
            return {"data": df_from_series.to_json(orient="records"), "type": "table"}
        # 2. pltグラフの時: base64画像にして返す
        elif isinstance(result, plt.Figure):
            buf = io.BytesIO()
            result.savefig(buf, format='jpeg')
            buf.seek(0)
            base64_image = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close(result)  # メモリリークを防ぐためにFigureを閉じる
            return {"data": base64_image, "type": "image"}
        # 3. それ以外の時 : 文字列にして返す
        else:
            return {"data": str(result), "type": "string"}
    
    if isinstance(result, list):
        # リストの場合は、各要素をJSONに変換
        result_data = [_to_json(item) for item in result]
    elif isinstance(result, dict):
        # 辞書の場合は、各キーをStringにして値をJSONに変換
        result_data = []
        for key, value in result.items():
            result_data.append({"data": str(key), "type": "string"})
            result_data.append(_to_json(value))
    else:
        # 単一のオブジェクトの場合は、直接JSONに変換
        result_data = [_to_json(result)]
    
    return {"result": result_data}
