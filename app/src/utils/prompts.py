import os
from ..database import engine
from ..db_to_schema import main as db_to_schema_main

# プロンプトファイルの読み込み
prompts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")
with open(os.path.join(prompts_dir, "prompt-v3.txt"), "r", encoding="utf-8") as f:
    PromptText = f.read()
with open(os.path.join(prompts_dir, "prompt-v3+.txt"), "r", encoding="utf-8") as f:
    PromptText_with_Example = f.read()

dbinfo_dir = os.path.join(prompts_dir, "dbinfo")
databaseinfo = {}

def get_db_embedded_prompt(tables = []):
    """
    DBのテーブル情報を取得し、プロンプトに埋め込む関数
    """
    dbinfo = ""
    if len(tables) == 0:
        # 全てのテーブル情報を取得
        tables = databaseinfo.keys()
    for table in tables:
        if table in databaseinfo:
            dbinfo += databaseinfo[table]
            dbinfo += "\n\n"
    return [PromptText_with_Example.replace("@databaseinfo", dbinfo), PromptText.replace("@databaseinfo", dbinfo)]

def set_db_schema():
    global databaseinfo
    databaseinfo = db_to_schema_main(engine)
    if "error" in databaseinfo:
        print("Error retrieving database schema:", databaseinfo["error"])

def is_database_registered() -> bool:
    """データベースが登録されているかチェック"""
    return len(databaseinfo) > 0
