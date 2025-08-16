@echo off
echo ========================================
echo    Slidev Docker 部署脚本
echo ========================================
echo.

REM 检查Docker是否运行
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行或未安装
    echo 请先启动 Docker Desktop
    pause
    exit /b 1
)

echo ✅ Docker 已就绪
echo.

REM 停止可能冲突的容器
echo 🛑 停止可能冲突的容器...
docker stop $(docker ps -q) 2>nul
echo.

REM 创建环境配置文件
if not exist .env (
    echo 📝 创建环境配置文件...
    copy .env.example .env >nul
    echo ✅ 已创建 .env 文件
    echo.
)

REM 显示部署选项
echo 请选择部署方案：
echo.
echo 1. API Server 模式 (推荐) - 端口 8000
echo 2. 单个演示文稿模式 - 端口 8030  
echo 3. 开发环境模式 - 端口 8080
echo 4. 查看运行状态
echo 5. 停止所有服务
echo.

set /p choice=请输入选择 (1-5): 

if "%choice%"=="1" goto api_mode
if "%choice%"=="2" goto presentation_mode
if "%choice%"=="3" goto dev_mode
if "%choice%"=="4" goto status
if "%choice%"=="5" goto stop_all

echo ❌ 无效选择
pause
exit /b 1

:api_mode
echo.
echo 🚀 启动 API Server 模式...
echo 构建并启动服务，请稍候...
docker-compose up -d slidev-api
if %errorlevel% equ 0 (
    echo.
    echo ✅ API Server 启动成功！
    echo.
    echo 🌐 访问地址：
    echo    API 服务: http://localhost:8000
    echo    健康检查: http://localhost:8000/api/health
    echo    API 文档: http://localhost:8000/api/presentations
    echo.
    echo 📖 使用示例：
    echo    curl -X POST http://localhost:8000/api/presentations \
    echo      -H "Content-Type: application/json" \
    echo      -d "{\"content\": \"# 我的演示\\n\\n内容...\", \"title\": \"测试\"}"
) else (
    echo ❌ 启动失败，请检查错误信息
)
goto end

:presentation_mode
echo.
echo 📄 启动单个演示文稿模式...

REM 检查slides目录
if not exist slides\slides.md (
    echo 📝 创建示例演示文稿...
    if not exist slides mkdir slides
    echo # 我的演示文稿 > slides\slides.md
    echo. >> slides\slides.md
    echo 这是一个示例演示文稿 >> slides\slides.md
    echo. >> slides\slides.md
    echo --- >> slides\slides.md
    echo. >> slides\slides.md
    echo # 第二页 >> slides\slides.md
    echo. >> slides\slides.md
    echo 更多内容... >> slides\slides.md
    echo ✅ 已创建示例文件 slides\slides.md
)

docker-compose --profile presentation up -d
if %errorlevel% equ 0 (
    echo.
    echo ✅ 演示文稿服务启动成功！
    echo.
    echo 🌐 访问地址: http://localhost:8030
    echo 📁 演示文稿文件: slides\slides.md
) else (
    echo ❌ 启动失败，请检查错误信息
)
goto end

:dev_mode
echo.
echo 🛠️ 启动开发环境模式...
docker-compose --profile development up -d
if %errorlevel% equ 0 (
    echo.
    echo ✅ 开发环境启动成功！
    echo.
    echo 🌐 访问地址: http://localhost:8080
    echo 🔄 支持热重载
) else (
    echo ❌ 启动失败，请检查错误信息
)
goto end

:status
echo.
echo 📊 当前运行状态：
echo.
docker-compose ps
echo.
echo 🌐 端口占用情况：
netstat -ano | findstr :8000
netstat -ano | findstr :8030
netstat -ano | findstr :8080
goto end

:stop_all
echo.
echo 🛑 停止所有服务...
docker-compose down
echo ✅ 所有服务已停止
goto end

:end
echo.
echo 📋 常用命令：
echo    查看日志: docker-compose logs -f
echo    停止服务: docker-compose down
echo    重启服务: docker-compose restart
echo.
pause
