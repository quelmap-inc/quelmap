# ベースイメージ
FROM python:3.10-slim

# 作業ディレクトリ設定
WORKDIR /usr/src/app

# 依存関係をコピーしてインストール
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードと関連ディレクトリをコピー
COPY src /usr/src/app/

# EXPOSE 8000 (ドキュメント用、オプション)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
