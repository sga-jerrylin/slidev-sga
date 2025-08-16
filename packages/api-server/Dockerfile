# 简单的 API 服务器 Docker 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache git python3 make g++

# 复制 package.json 和安装依赖
COPY package.json ./
RUN npm install

# 复制构建好的代码
COPY dist ./dist

# 创建临时目录
RUN mkdir -p temp

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV API_PORT=3001

# 启动命令
CMD ["node", "dist/index.js"]
