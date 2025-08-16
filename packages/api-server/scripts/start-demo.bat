@echo off
setlocal enabledelayedexpansion

echo 🎯 Starting Slidev API Server Demo
echo ==================================

REM Configuration
if "%API_PORT%"=="" set API_PORT=3000
if "%API_HOST%"=="" set API_HOST=localhost
set BASE_URL=http://%API_HOST%:%API_PORT%

echo 📋 Configuration:
echo   API URL: %BASE_URL%
echo   Port: %API_PORT%
echo   Host: %API_HOST%
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    echo Please install Node.js 18+ and try again
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  pnpm not found, installing...
    npm install -g pnpm
)

echo ✅ pnpm detected
pnpm --version

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    pnpm install
)

REM Build the project if needed
if not exist "dist" (
    echo 🔨 Building project...
    pnpm build
)

echo ✅ Dependencies and build ready
echo.

REM Create logs directory
if not exist "logs" mkdir logs

REM Set environment variables
set NODE_ENV=development
set LOG_LEVEL=info
if "%TEMP_DIR%"=="" set TEMP_DIR=%TEMP%\slidev-api
if "%MAX_CONCURRENT%"=="" set MAX_CONCURRENT=5
if "%PORT_RANGE_START%"=="" set PORT_RANGE_START=3001
if "%PORT_RANGE_END%"=="" set PORT_RANGE_END=3020

echo 🚀 Starting API Server...
echo.

REM Start the server
start /b pnpm start

REM Wait for server to start
echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Slidev API Server should be running!
echo.
echo 📋 Available endpoints:
echo   Health Check: %BASE_URL%/api/health
echo   Documentation: %BASE_URL%/api/docs
echo   Create Presentation: POST %BASE_URL%/api/presentations
echo   List Presentations: GET %BASE_URL%/api/presentations
echo.

REM Run demo client if requested
if "%1"=="--demo" goto :demo
if "%1"=="-d" goto :demo
goto :tips

:demo
echo 🎯 Running demo client...
echo.
timeout /t 2 /nobreak >nul
node examples/client.js
echo.
echo ✅ Demo completed!

:tips
echo 💡 Tips:
echo   • Run 'node examples/client.js' to test the API
echo   • Check logs in the 'logs/' directory
echo   • Close this window to stop the server
echo.
echo 🔄 Server is running. Close this window to stop.
pause
