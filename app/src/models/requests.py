from pydantic import BaseModel
from typing import List

class VariableRetrievalResponse(BaseModel):
    id: str
    name: str

class StartAnalysisRequest(BaseModel):
    space_id: str
    query: str
    tables: List[str] = []
    mode: str = "standard"
    model: str = ""
    index: int = -1
