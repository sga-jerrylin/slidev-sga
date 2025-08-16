#!/bin/sh

# Slidev 容器启动脚本

set -e

echo "🚀 Starting Slidev container..."

# 检查是否有 slides.md 文件
if [ ! -f "/app/slides/slides.md" ]; then
    echo "❌ Error: slides.md not found"
    echo "Please mount your slides directory to /app/slides"
    exit 1
fi

echo "📄 Found slides.md, starting Slidev..."

# 复制 slides.md 到工作目录
cp /app/slides/slides.md /app/slides.md

# 如果有自定义 CSS，也复制过来
if [ -f "/app/slides/custom.css" ]; then
    mkdir -p /app/styles
    cp /app/slides/custom.css /app/styles/custom.css
fi

# 启动 Slidev 开发服务器
exec npx slidev --host 0.0.0.0 --port 3000
