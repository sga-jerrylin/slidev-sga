#!/bin/bash

# 构建 Slidev Docker 镜像脚本

set -e

echo "🐳 Building Slidev Docker image..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# 构建镜像
echo "📦 Building image: slidev-api:latest"
docker build -t slidev-api:latest -f docker/Dockerfile.slidev .

# 验证镜像
echo "✅ Verifying image..."
docker images slidev-api:latest

echo "🎉 Docker image built successfully!"
echo ""
echo "You can now test the image with:"
echo "docker run --rm -p 3000:3000 -v \$(pwd)/test-slides.md:/app/slides.md slidev-api:latest"
