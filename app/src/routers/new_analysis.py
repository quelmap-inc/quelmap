from fastapi import APIRouter, HTTPException
from ..models.requests import StartAnalysisRequest
from ..models.responses import StartAnalysisResponse, GetReportResponse ,CreateSpaceResponse, GetSpaceResponse
from ..analysis_manager import start_analysis, get_analysis_state, create_space, get_space

router = APIRouter()

@router.post("/start-analysis", response_model=StartAnalysisResponse)
async def start_analysis_endpoint(request: StartAnalysisRequest):
    """分析を開始する"""
    try:
        analysis_id = start_analysis(request)
        return StartAnalysisResponse(id=analysis_id)
    except ValueError as e:
        # バリデーションエラー
        return StartAnalysisResponse(error=str(e))
    except Exception as e:
        return StartAnalysisResponse(error=f"分析開始エラー: {str(e)}")

@router.get("/get-report", response_model=GetReportResponse)
async def get_report(id: str):
    """分析結果を取得する"""
    try:
        state = get_analysis_state(id)

        return GetReportResponse(
            done=state.get("done", True),
            progress=state.get("progress", ""),
            query=state.get("query", ""),
            error=state.get("error", ""),
            python_code=state.get("python_code", ""),
            steps=state.get("steps", []),
            content=state.get("content", [])
        )
    except Exception as e:
        return GetReportResponse(
            done=True,
            error=f"レポート取得エラー: {str(e)}",
            progress="",
            query="",
            python_code="",
            content=[],
            steps=[]
        )

# spaceの作成と取得
@router.post("/create-space", response_model=CreateSpaceResponse)
async def create_space_endpoint():
    """新しいスペースを作成する"""
    try:
        space_id = create_space()
        return CreateSpaceResponse(id=space_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スペース作成エラー: {str(e)}")

@router.get("/get-space/{space_id}", response_model=GetSpaceResponse)
async def get_space_endpoint(space_id: str):
    """指定されたスペースIDの分析IDを取得する"""
    try:
        analysis_ids = get_space(space_id)
        return GetSpaceResponse(analysis_ids=analysis_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スペース取得エラー: {str(e)}")