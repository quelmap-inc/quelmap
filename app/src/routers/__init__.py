from .data import router as data_router
from .health import router as health_router
from .new_analysis import router as new_analysis_router
from .model_list import router as model_list_router

__all__ = [
    "data_router",
    "health_router",
    "new_analysis_router",
    "model_list_router"
]
