from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ConnectionResponse(BaseModel):
    table_count: int
    table_names: List[str]
    message: str

class ErrorResponse(BaseModel):
    error: str
    details: str

class StartAnalysisResponse(BaseModel):
    id: Optional[str] = None
    error: Optional[str] = None

class CreateSpaceResponse(BaseModel):
    id: str

class GetSpaceResponse(BaseModel):
    analysis_ids: List[str]

class GetReportResponse(BaseModel):
    done: bool
    progress: str = ""
    query: str = ""
    error: str = ""
    python_code: str = ""
    content: List[Dict[str, Any]] = []
    steps: Optional[List[Dict[str, Any]]] = None

class LLMMODEL(BaseModel):
    id: str
    name: str
    description: str

class GetModelListResponse(BaseModel):
    models: List[LLMMODEL]

