@echo off
echo 停止所有运行中的容器...

REM 停止所有运行中的容器
docker stop $(docker ps -q) 2>nul

REM 删除所有容器
docker rm $(docker ps -aq) 2>nul

echo 清理完成！

REM 显示当前状态
echo.
echo 当前运行的容器：
docker ps

echo.
echo 端口占用情况：
netstat -ano | findstr :5000
netstat -ano | findstr :3000

pause
