from fastapi import APIRouter, File, UploadFile, Form, Depends, Query, HTTPException
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.types import String, Text
from typing import List, Optional
from ..models.responses import ConnectionResponse
from ..data_service import DataService
from ..database import engine, get_db

router = APIRouter()
data_service = DataService()

@router.get("/api/get-table-list", response_model=ConnectionResponse)
async def get_table_list():
    """PostgreSQLデータベースのテーブル一覧を取得"""
    return data_service.get_table_list()

@router.post("/api/upload-csv-xlsx", response_model=ConnectionResponse)
async def upload_csv_xlsx(files: List[UploadFile] = File(...)):
    """CSV/XLSXファイルをアップロードしてPostgreSQLに保存"""
    return await data_service.upload_csv_xlsx(files)

@router.post("/api/connect-external-postgres", response_model=ConnectionResponse)
async def connect_external_postgres(connection_string: str = Form(...)):
    """外部PostgreSQLデータベースに接続し、全データをメインPostgreSQLにコピー"""
    return data_service.connect_external_postgres(connection_string)

@router.post("/api/upload-sqlite-db", response_model=ConnectionResponse)
async def upload_sqlite_db(file: UploadFile = File(...)):
    """SQLiteファイルをアップロードし、データをPostgreSQLにコピー"""
    return await data_service.upload_sqlite_db(file)

@router.delete("/api/delete-table/{table_name}")
async def delete_table(table_name: str):
    """指定されたテーブルを削除"""
    return data_service.delete_table(table_name)

@router.put("/api/rename-table/{table_name}", response_model=ConnectionResponse)
async def rename_table(table_name: str, new_table_name: str = Form(...)):
    """指定されたテーブルの名前を変更"""
    result = data_service.change_table_name(table_name, new_table_name)
    return {
        "message": result["message"],
        "table_count": 1,
        "table_names": [new_table_name]
    }

@router.get("/api/table-data/{table_name}")
async def get_table_data(
    table_name: str,
    limit: int = 100,
    offset: int = 0,
    sort_column: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filter_column: Optional[str] = None,
    filter_value: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """PostgreSQLのテーブルデータを安全かつ効率的に取得（プレビュー用）"""
    try:
        inspector = inspect(engine)
        
        # テーブルの存在確認とカラム情報の取得を1回で実行
        try:
            columns_info = inspector.get_columns(table_name, schema='public')
            if not columns_info:
                raise HTTPException(status_code=404, detail=f"テーブル '{table_name}' が見つかりません。")
        except Exception:
            raise HTTPException(status_code=404, detail=f"テーブル '{table_name}' が見つかりません。")

        # カラム名のリストを作成（キャッシュ）
        valid_columns = {col['name']: col['type'] for col in columns_info}

        # --- パラメータの検証 ---
        if sort_column:
            if sort_column not in valid_columns:
                raise HTTPException(status_code=400, detail=f"無効なソートカラム: {sort_column}")
            if not sort_direction or sort_direction.lower() not in ['asc', 'desc']:
                raise HTTPException(status_code=400, detail=f"無効なソート方向: {sort_direction}")

        if filter_column and filter_column not in valid_columns:
            raise HTTPException(status_code=400, detail=f"無効なフィルターカラム: {filter_column}")

        # --- 効率的なクエリ構築 ---
        params = {"limit_val": limit, "offset_val": offset}
        where_clause = []


        # フィルター条件の構築
        if filter_column and filter_value is not None:
            column_type = valid_columns[filter_column]
            param_name = f"filter_val_{filter_column}"
            
            # 型に応じたフィルター条件を構築
            if isinstance(column_type, (String, Text)):
                where_clause.append(f'"{filter_column}" ILIKE :{param_name}')
                params[param_name] = f"%{filter_value}%"
            else:
                where_clause.append(f'"{filter_column}" = :{param_name}')
                params[param_name] = filter_value

        # WHERE句の構築
        where_str = " WHERE " + " AND ".join(where_clause) if where_clause else ""

        # ORDER BY句の構築
        order_str = f' ORDER BY "{sort_column}" {sort_direction.upper()}' if sort_column and sort_direction else ""

        # --- 効率的なクエリ実行 ---
        # 1. 総行数を取得（フィルター適用後）
        count_query = text(f'SELECT COUNT(*) FROM public."{table_name}"{where_str}')
        total_rows = db.execute(count_query, params).scalar_one()

        # 2. ページネーションを適用してデータを取得
        data_query = text(
            f'SELECT * FROM public."{table_name}"{where_str}{order_str} '
            'LIMIT :limit_val OFFSET :offset_val'
        )
        result = db.execute(data_query, params)
        
        columns = result.keys()
        data = [dict(row) for row in result.mappings()]

        return {
            "table_name": table_name,
            "columns": list(columns),
            "data": data,
            "total_rows": total_rows,
            "preview_rows": len(data),
            "sort_column": sort_column,
            "sort_direction": sort_direction,
            "filter_column": filter_column,
            "filter_value": filter_value
        }
        
    except ProgrammingError as e:
        # 型の不一致(例: INTカラムに'abc'を渡す)などもここで捕捉される
        raise HTTPException(status_code=400, detail=f"クエリ実行エラー: {e.orig}")
    except OperationalError as e:
        raise HTTPException(status_code=503, detail=f"データベース接続エラー: {e.orig}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"不明なサーバーエラー: {str(e)}")
