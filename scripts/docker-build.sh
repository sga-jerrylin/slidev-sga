#!/bin/bash

# Slidev Docker 构建脚本
# 用于构建不同的 Docker 镜像

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
Slidev Docker 构建脚本

用法: $0 [选项] [目标]

目标:
  all         构建所有镜像
  api         构建 API Server 镜像
  slidev      构建 Slidev CLI 镜像
  main        构建主项目镜像

选项:
  -h, --help     显示此帮助信息
  -t, --tag      指定镜像标签 (默认: latest)
  -p, --push     构建后推送到仓库
  -c, --clean    构建前清理旧镜像
  --no-cache     不使用缓存构建
  --platform     指定目标平台 (如: linux/amd64,linux/arm64)

示例:
  $0 all                    # 构建所有镜像
  $0 api -t v1.0.0         # 构建 API 镜像并标记为 v1.0.0
  $0 slidev --no-cache     # 不使用缓存构建 Slidev 镜像
  $0 all -p -t latest      # 构建所有镜像并推送

EOF
}

# 默认参数
TAG="latest"
PUSH=false
CLEAN=false
NO_CACHE=""
PLATFORM=""
TARGET=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --platform)
            PLATFORM="--platform $2"
            shift 2
            ;;
        all|api|slidev|main)
            TARGET="$1"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查 Docker 是否可用
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装或不可用"
    exit 1
fi

# 检查是否在项目根目录
if [[ ! -f "package.json" ]] || [[ ! -f "pnpm-workspace.yaml" ]]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 清理旧镜像
clean_images() {
    if [[ "$CLEAN" == true ]]; then
        log_info "清理旧镜像..."
        docker image prune -f
        docker images | grep "slidev" | awk '{print $3}' | xargs -r docker rmi -f || true
        log_success "清理完成"
    fi
}

# 构建镜像
build_image() {
    local dockerfile=$1
    local image_name=$2
    local target_stage=$3
    
    log_info "构建镜像: $image_name:$TAG"
    
    local build_cmd="docker build $NO_CACHE $PLATFORM -f $dockerfile -t $image_name:$TAG"
    
    if [[ -n "$target_stage" ]]; then
        build_cmd="$build_cmd --target $target_stage"
    fi
    
    build_cmd="$build_cmd ."
    
    log_info "执行命令: $build_cmd"
    
    if eval $build_cmd; then
        log_success "构建成功: $image_name:$TAG"
        
        if [[ "$PUSH" == true ]]; then
            log_info "推送镜像: $image_name:$TAG"
            if docker push $image_name:$TAG; then
                log_success "推送成功: $image_name:$TAG"
            else
                log_error "推送失败: $image_name:$TAG"
                return 1
            fi
        fi
    else
        log_error "构建失败: $image_name:$TAG"
        return 1
    fi
}

# 构建 API Server 镜像
build_api() {
    log_info "开始构建 API Server 镜像..."
    build_image "Dockerfile.api" "slidev/api-server"
}

# 构建 Slidev CLI 镜像
build_slidev() {
    log_info "开始构建 Slidev CLI 镜像..."
    build_image "Dockerfile.slidev" "slidev/cli"
}

# 构建主项目镜像
build_main() {
    log_info "开始构建主项目镜像..."
    build_image "Dockerfile" "slidev/main" "api-server"
    build_image "Dockerfile" "slidev/main-cli" "slidev-cli"
    build_image "Dockerfile" "slidev/main-dev" "development"
}

# 构建所有镜像
build_all() {
    log_info "开始构建所有镜像..."
    build_api
    build_slidev
    build_main
}

# 主逻辑
main() {
    log_info "Slidev Docker 构建脚本启动"
    log_info "标签: $TAG"
    log_info "推送: $PUSH"
    log_info "清理: $CLEAN"
    
    clean_images
    
    case $TARGET in
        all)
            build_all
            ;;
        api)
            build_api
            ;;
        slidev)
            build_slidev
            ;;
        main)
            build_main
            ;;
        "")
            log_error "请指定构建目标"
            show_help
            exit 1
            ;;
        *)
            log_error "未知构建目标: $TARGET"
            show_help
            exit 1
            ;;
    esac
    
    log_success "构建完成!"
    
    # 显示构建的镜像
    log_info "构建的镜像:"
    docker images | grep "slidev" | grep "$TAG"
}

# 执行主函数
main
