# ベースイメージ
FROM python:3.11-slim

# 作業ディレクトリ設定
WORKDIR /usr/src/app

# 依存関係をコピーしてインストール
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY main.py .