# Slidev Docker 部署指南

本指南提供了多种 Docker 部署方案，适用于不同的使用场景。

## 📋 目录

- [快速开始](#快速开始)
- [部署场景](#部署场景)
- [配置说明](#配置说明)
- [使用方法](#使用方法)
- [故障排除](#故障排除)
- [性能优化](#性能优化)

## 🚀 快速开始

### 1. 克隆项目并准备环境

```bash
git clone <repository-url>
cd slidev-sga
cp .env.example .env
```

### 2. 选择部署方案

#### 方案 A: API Server（推荐用于生产环境）
```bash
# 启动 API Server
docker-compose up -d slidev-api

# 访问 API 文档
curl http://localhost:3000/api/health
```

#### 方案 B: 单个演示文稿
```bash
# 准备演示文稿文件
mkdir -p slides
echo "# 我的演示文稿\n\n这是第一页" > slides/slides.md

# 启动演示文稿服务
docker-compose --profile presentation up -d
```

#### 方案 C: 开发环境
```bash
# 启动开发环境
docker-compose --profile development up -d
```

## 🎯 部署场景

### 场景 1: API Server 模式

**适用于**: 需要动态生成多个演示文稿的生产环境

**特点**:
- REST API 接口
- 支持多个并发演示文稿
- 自动资源管理
- 完整的监控和日志

**启动命令**:
```bash
docker-compose up -d slidev-api
```

**API 使用示例**:
```bash
# 创建演示文稿
curl -X POST http://localhost:3000/api/presentations \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# 我的演示文稿\n\n---\n\n# 第二页\n\n内容...",
    "title": "测试演示文稿",
    "theme": "default"
  }'

# 查看所有演示文稿
curl http://localhost:3000/api/presentations
```

### 场景 2: 单个演示文稿模式

**适用于**: 运行单个固定演示文稿

**特点**:
- 简单直接
- 资源占用少
- 适合演示和展示

**准备工作**:
```bash
# 创建演示文稿目录
mkdir -p slides

# 创建演示文稿文件
cat > slides/slides.md << 'EOF'
---
theme: default
background: https://source.unsplash.com/1920x1080/?nature
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Slidev 演示文稿
  
  使用 Docker 部署的演示文稿
drawings:
  persist: false
transition: slide-left
title: 我的演示文稿
---

# 欢迎使用 Slidev

基于 Docker 的演示文稿解决方案

---

# 第二页

这里是内容...

EOF
```

**启动命令**:
```bash
docker-compose --profile presentation up -d
```

### 场景 3: 开发环境模式

**适用于**: 开发和调试

**特点**:
- 热重载
- 完整开发工具
- 源码挂载

**启动命令**:
```bash
docker-compose --profile development up -d
```

### 场景 4: 完整生产环境（含 Nginx）

**适用于**: 生产环境，需要负载均衡和 SSL

**启动命令**:
```bash
docker-compose --profile nginx up -d
```

## ⚙️ 配置说明

### 环境变量配置

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
# 基本配置
API_PORT=3000
API_HOST=0.0.0.0
BASE_URL=http://localhost

# 资源限制
MAX_CONCURRENT=10
DEFAULT_TTL=3600000

# 端口范围
PORT_RANGE_START=3001
PORT_RANGE_END=3100
```

### Docker Compose 配置

#### 服务说明

- `slidev-api`: API Server 服务
- `slidev-presentation`: 单个演示文稿服务
- `slidev-dev`: 开发环境服务
- `nginx`: 反向代理服务

#### Profile 说明

- `presentation`: 启动单个演示文稿服务
- `development`: 启动开发环境
- `nginx`: 启动 Nginx 反向代理

## 📖 使用方法

### API Server 使用

#### 创建演示文稿
```bash
curl -X POST http://localhost:3000/api/presentations \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# 标题\n\n内容...",
    "title": "演示文稿标题",
    "theme": "seriph",
    "ttl": 7200000
  }'
```

#### 获取演示文稿列表
```bash
curl http://localhost:3000/api/presentations
```

#### 删除演示文稿
```bash
curl -X DELETE http://localhost:3000/api/presentations/{id}
```

#### 健康检查
```bash
curl http://localhost:3000/api/health
```

### 单个演示文稿使用

1. 将演示文稿文件放在 `slides/slides.md`
2. 启动服务：`docker-compose --profile presentation up -d`
3. 访问：http://localhost:3030

### 开发环境使用

1. 启动开发环境：`docker-compose --profile development up -d`
2. 修改源码会自动重载
3. 访问：http://localhost:3000

## 🔧 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 修改 .env 文件中的端口配置
API_PORT=3001
```

#### 2. 权限问题
```bash
# 确保目录权限正确
sudo chown -R $USER:$USER slides/
chmod 755 slides/
```

#### 3. 内存不足
```bash
# 检查 Docker 内存限制
docker stats

# 减少并发数量
MAX_CONCURRENT=5
```

#### 4. 网络问题
```bash
# 检查 Docker 网络
docker network ls
docker network inspect slidev_slidev-network
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs slidev-api

# 实时查看日志
docker-compose logs -f slidev-api
```

### 健康检查

```bash
# 检查服务状态
docker-compose ps

# 检查健康状态
curl http://localhost:3000/api/health
```

## 🚀 性能优化

### 1. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  slidev-api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### 2. 缓存优化

```bash
# 使用 BuildKit 加速构建
export DOCKER_BUILDKIT=1
docker-compose build --parallel
```

### 3. 网络优化

```yaml
networks:
  slidev-network:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1450
```

### 4. 存储优化

```yaml
volumes:
  slidev_temp:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
      o: size=1g,uid=1001,gid=1001
```

## 📊 监控和维护

### 监控指标

- API 响应时间
- 并发演示文稿数量
- 内存和 CPU 使用率
- 磁盘空间使用

### 定期维护

```bash
# 清理未使用的镜像
docker image prune -f

# 清理未使用的容器
docker container prune -f

# 清理未使用的卷
docker volume prune -f

# 查看磁盘使用
docker system df
```

### 备份和恢复

```bash
# 备份数据卷
docker run --rm -v slidev_temp:/data -v $(pwd):/backup alpine tar czf /backup/slidev_backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v slidev_temp:/data -v $(pwd):/backup alpine tar xzf /backup/slidev_backup.tar.gz -C /data
```

## 🔒 安全建议

1. **使用非 root 用户**: 所有 Dockerfile 都配置了非 root 用户
2. **网络隔离**: 使用自定义网络隔离服务
3. **资源限制**: 设置适当的 CPU 和内存限制
4. **定期更新**: 定期更新基础镜像和依赖
5. **SSL 配置**: 生产环境建议启用 HTTPS

## 📞 支持

如果遇到问题，请：

1. 检查日志：`docker-compose logs`
2. 查看健康状态：`curl http://localhost:3000/api/health`
3. 参考故障排除部分
4. 提交 Issue 到项目仓库
