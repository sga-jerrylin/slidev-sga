#!/bin/bash

# Slidev API Server Demo Startup Script

set -e

echo "🎯 Starting Slidev API Server Demo"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_PORT=${API_PORT:-3000}
API_HOST=${API_HOST:-localhost}
BASE_URL="http://${API_HOST}:${API_PORT}"

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  API URL: ${BASE_URL}"
echo -e "  Port: ${API_PORT}"
echo -e "  Host: ${API_HOST}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ and try again"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required${NC}"
    echo "Current version: $(node --version)"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found, installing...${NC}"
    npm install -g pnpm
fi

echo -e "${GREEN}✅ pnpm $(pnpm --version) detected${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
fi

# Build the project if needed
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}🔨 Building project...${NC}"
    pnpm build
fi

echo -e "${GREEN}✅ Dependencies and build ready${NC}"
echo ""

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Check if API port is available
if ! check_port $API_PORT; then
    echo -e "${RED}❌ Port $API_PORT is already in use${NC}"
    echo "Please stop the service using this port or set a different API_PORT"
    exit 1
fi

echo -e "${GREEN}✅ Port $API_PORT is available${NC}"

# Create logs directory
mkdir -p logs

# Set environment variables
export NODE_ENV=${NODE_ENV:-development}
export API_PORT=$API_PORT
export API_HOST=$API_HOST
export BASE_URL=$BASE_URL
export LOG_LEVEL=${LOG_LEVEL:-info}
export TEMP_DIR=${TEMP_DIR:-/tmp/slidev-api}
export MAX_CONCURRENT=${MAX_CONCURRENT:-5}
export PORT_RANGE_START=${PORT_RANGE_START:-3001}
export PORT_RANGE_END=${PORT_RANGE_END:-3020}

echo -e "${BLUE}🚀 Starting API Server...${NC}"
echo ""

# Start the server in background
pnpm start &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Server failed to start${NC}"
    exit 1
fi

# Test server health
echo -e "${BLUE}🏥 Testing server health...${NC}"
for i in {1..10}; do
    if curl -s "${BASE_URL}/ping" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is healthy and responding${NC}"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Server health check failed${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    echo -e "${YELLOW}⏳ Waiting for server... (attempt $i/10)${NC}"
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 Slidev API Server is running!${NC}"
echo ""
echo -e "${BLUE}📋 Available endpoints:${NC}"
echo -e "  Health Check: ${BASE_URL}/api/health"
echo -e "  Documentation: ${BASE_URL}/api/docs"
echo -e "  Create Presentation: POST ${BASE_URL}/api/presentations"
echo -e "  List Presentations: GET ${BASE_URL}/api/presentations"
echo ""

# Run demo client if requested
if [ "$1" = "--demo" ] || [ "$1" = "-d" ]; then
    echo -e "${BLUE}🎯 Running demo client...${NC}"
    echo ""
    sleep 2
    
    # Run the demo client
    node examples/client.js
    
    echo ""
    echo -e "${GREEN}✅ Demo completed!${NC}"
fi

echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "  • Run 'node examples/client.js' to test the API"
echo -e "  • Check logs in the 'logs/' directory"
echo -e "  • Use Ctrl+C to stop the server"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down server...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Server stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running
echo -e "${BLUE}🔄 Server is running. Press Ctrl+C to stop.${NC}"
wait $SERVER_PID
