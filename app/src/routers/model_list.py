from fastapi import APIRouter
from ..models.responses import GetModelListResponse
from ..models.responses import LLMMODEL
from ..utils.llm_models import get_model_list as get_model_list_util


router = APIRouter()

@router.get("/get-model-list", response_model=GetModelListResponse)
def get_model_list(base_url: str , api_key=""):
    models = get_model_list_util(base_url, api_key)
    return GetModelListResponse(models=[LLMMODEL(id=model["id"], name=model["display_name"] if model["display_name"] else model["model_name"], description=model["description"]) for model in models])
