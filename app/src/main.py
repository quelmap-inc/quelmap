from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from .routers import data_router, health_router, new_analysis_router,model_list_router
from .utils.prompts import set_db_schema

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← ここの値を確認
    allow_credentials=True,
    allow_methods=["*"],  # OPTIONSメソッドが許可されているか
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(data_router)
app.include_router(health_router)
app.include_router(new_analysis_router)
app.include_router(model_list_router)

#アプリケーション起動時にデータベーススキーマを設定
@app.on_event("startup")
async def startup_event():
    # データベーススキーマを設定
    set_db_schema()