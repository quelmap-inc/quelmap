-- db_init/init.sql

CREATE USER reader WITH PASSWORD 'quelmap_reader_pass_j30hcnidm3cbirubco3JKN';

-- DBへの接続権限を付与
GRANT CONNECT ON DATABASE main_db TO reader;

-- publicスキーマの使用権限を付与
GRANT USAGE ON SCHEMA public TO reader;

-- publicスキーマ内の全ての既存テーブルに対するSELECT権限を付与
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reader;

-- 今後作成されるテーブルに対しても自動でSELECT権限を付与する設定
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reader;