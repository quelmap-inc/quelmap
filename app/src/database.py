# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# .envファイルなどからデータベース接続情報を取得することを推奨
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
POSTGRES_DB = os.environ.get("POSTGRES_DB")

DEFAULT_DB_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@quelmap-db:5432/{POSTGRES_DB}"

# USER_DATABASE_URLが設定されていればそれを優先
DATABASE_URL = os.getenv("USER_DATABASE_URL", DEFAULT_DB_URL)

# アプリケーション全体で共有されるエンジンを作成
engine = create_engine(DATABASE_URL)

# セッションを作成するためのファクトリ
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# FastAPIの依存性注入（Dependency Injection）に使用する関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()