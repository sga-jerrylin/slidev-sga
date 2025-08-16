# Slidev 主项目 Dockerfile
# 多阶段构建：构建阶段 + 运行阶段

# ================================
# 构建阶段
# ================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    libc6-compat

# 安装 pnpm
RUN npm install -g pnpm@10.13.1

# 复制 package 配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/

# 复制 patches 目录（pnpm需要）
COPY patches ./patches

# 安装依赖
RUN pnpm install --no-frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# ================================
# API Server 运行阶段
# ================================
FROM node:18-alpine AS api-server

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache git

# 安装 pnpm
RUN npm install -g pnpm@10.13.1

# 从构建阶段复制必要文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 设置环境变量
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=3000

# 创建必要目录
RUN mkdir -p /app/temp /app/logs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动 API Server
CMD ["pnpm", "api:start"]

# ================================
# Slidev CLI 运行阶段
# ================================
FROM node:18-alpine AS slidev-cli

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache git

# 从构建阶段复制 CLI 包
COPY --from=builder /app/packages/slidev ./packages/slidev
COPY --from=builder /app/packages/client ./packages/client
COPY --from=builder /app/packages/parser ./packages/parser
COPY --from=builder /app/packages/types ./packages/types

# 全局安装 Slidev CLI
RUN npm install -g ./packages/slidev

# 创建工作目录
RUN mkdir -p /slides

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 工作目录设置为 slides
WORKDIR /slides

# 启动命令
CMD ["slidev", "--host", "0.0.0.0", "--port", "3000"]

# ================================
# 开发环境阶段
# ================================
FROM node:18-alpine AS development

WORKDIR /app

# 安装开发依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    libc6-compat

# 安装 pnpm
RUN npm install -g pnpm@10.13.1

# 复制 package 配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/

# 复制 patches 目录（pnpm需要）
COPY patches ./patches

# 安装所有依赖（包括开发依赖）
RUN pnpm install --no-frozen-lockfile

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000 3001-3100

# 启动开发服务器
CMD ["pnpm", "dev"]
