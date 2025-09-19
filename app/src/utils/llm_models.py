import uuid
import hashlib
import openai

import requests

def get_model_name_from_api(baseurl, apikey):
    print("Fetching available models from the API...")
    try:
        response = requests.get(
            f"{baseurl}/models",
            headers={"Authorization": f"Bearer {apikey}"},
            timeout=20,
        )
        if response.status_code == 200:
            # レスポンス形式：{"object":"list","data":[{"id":"quelmap/polaris-4b-2-grpo-h200-600step","object":"model","created":1751442481,"owned_by":"vllm","root":"quelmap/polaris-4b-2-grpo-h200-600step","parent":null,"max_model_len":30000,"permission":[{"id":"modelperm-30ab45eae2ec4f4fb2b113af00f48200","object":"model_permission","created":1751442481,"allow_create_engine":false,"allow_sampling":true,"allow_logprobs":true,"allow_search_indices":false,"allow_view":true,"allow_fine_tuning":false,"organization":"*","group":null,"is_blocking":false}]}]}
            models = response.json().get("data", [])
            if models:
                # 最初のモデルを選択
                print(f"Available models: {[model['id'] for model in models]}")
                return [m["id"] for m in models]
        else:
            print(f"Error fetching models: {response.status_code} - {response.text}")
        return ["no models available"]
    except requests.RequestException as e:
        print(f"Error connecting to the API: {str(e)}")
        return ["no models available"]

def string_to_uuid(text: str) -> str:
    # return str(uuid.uuid5(uuid.NAMESPACE_DNS, text))
    return hashlib.md5(text.encode()).hexdigest()


MODELS = []
OPENAI_CLIENTS = {}

def get_model_list(base_url: str , api_key: str):
    base_url = base_url.replace("http://localhost:", "http://host.docker.internal:")
    base_url = base_url.replace("/v1/", "")
    base_url = base_url.replace("/v1", "")
    base_url += "/v1"
    """利用可能なモデルのリストを取得"""
    global MODELS, OPENAI_CLIENTS
    # base_urlとapi_keyに基づいてモデルリストを動的に取得
    model_names = get_model_name_from_api(base_url, api_key)
    if model_names:
        MODELS = []
        OPENAI_CLIENTS = {}
        for model_name in model_names:
            model_id = model_name
            MODELS.append(
                {
                    "id": model_id,
                    "model_name": model_name,
                    "base_url": base_url,
                    "api_key": api_key,
                    "display_name": model_name,
                    "description": "",
                    "config"  : {}
                }
            )
            if api_key == "":
                api_key = "none"
            OPENAI_CLIENTS[model_id]=openai.AsyncOpenAI(base_url=base_url, api_key=api_key)
        return MODELS
    return []


def get_openai_client(model_id):
    """指定されたモデルIDに対応するOpenAIクライアントを取得"""
    return OPENAI_CLIENTS.get(model_id)


def get_model_by_id(model_id):
    """指定されたモデルIDに対応するモデルを取得"""
    for model in MODELS:
        if model["id"] == model_id:
            return model
    raise ValueError(f"Model ID {model_id} not found.")
