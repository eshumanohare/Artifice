#!/bin/bash

echo "🛑 Stopping Artifice API Services"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null
}

# Stop Python stream
if is_running "stream_orders.py"; then
    echo -e "${BLUE}🔄 Stopping Python stream...${NC}"
    pkill -f "stream_orders.py"
    sleep 1
    if is_running "stream_orders.py"; then
        echo -e "${YELLOW}⚠️  Force killing Python stream...${NC}"
        pkill -9 -f "stream_orders.py"
    fi
    echo -e "${GREEN}✅ Python stream stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Python stream was not running${NC}"
fi

# Stop API server
if is_running "api_server.py"; then
    echo -e "${BLUE}🔄 Stopping API server...${NC}"
    pkill -f "api_server.py"
    sleep 1
    if is_running "api_server.py"; then
        echo -e "${YELLOW}⚠️  Force killing API server...${NC}"
        pkill -9 -f "api_server.py"
    fi
    echo -e "${GREEN}✅ API server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  API server was not running${NC}"
fi

# Check final status
echo ""
echo -e "${BLUE}📊 Final Status:${NC}"
echo "=================="

if is_running "stream_orders.py"; then
    echo -e "${RED}❌ Python stream still running${NC}"
else
    echo -e "${GREEN}✅ Python stream stopped${NC}"
fi

if is_running "api_server.py"; then
    echo -e "${RED}❌ API server still running${NC}"
else
    echo -e "${GREEN}✅ API server stopped${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All services stopped!${NC}"
