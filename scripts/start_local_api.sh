#!/bin/bash

# Start Local API Server for Artifice Dashboard
# This script starts both the Python stream and the API server

echo "🚀 Starting Artifice Local API Server"
echo "====================================="

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

# Function to start a service
start_service() {
    local service_name=$1
    local command=$2
    local description=$3
    
    if is_running "$service_name"; then
        echo -e "${YELLOW}⚠️  $description is already running${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🔄 Starting $description...${NC}"
    
    # Check if we're in the scripts directory or project root
    if [ -f "$service_name" ]; then
        # We're in the scripts directory
        eval "$command" &
    elif [ -f "scripts/$service_name" ]; then
        # We're in the project root
        cd scripts && eval "$command" &
        cd ..
    else
        echo -e "${RED}❌ Error: $service_name not found${NC}"
        return 1
    fi
    
    local pid=$!
    echo -e "${GREEN}✅ $description started with PID $pid${NC}"
    return 0
}

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    # Kill all Python processes running our scripts
    pkill -f "stream_orders.py"
    pkill -f "api_server.py"
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"
    echo "=================="
    
    local services=(
        "stream_orders.py:Live Orders Stream"
        "api_server.py:Local API Server"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r script desc <<< "$service"
        if is_running "$script"; then
            echo -e "${GREEN}✅ $desc${NC}"
        else
            echo -e "${RED}❌ $desc${NC}"
        fi
    done
}

# Function to show API endpoints
show_endpoints() {
    echo -e "${BLUE}🌐 API Endpoints:${NC}"
    echo "=================="
    echo "  - http://localhost:3001/api/orders"
    echo "  - http://localhost:3001/api/whales"
    echo "  - http://localhost:3001/api/health"
    echo "  - http://localhost:3001/api/status"
    echo ""
    echo -e "${YELLOW}💡 Update your main webapp to use: http://localhost:3001${NC}"
}

# Main script logic
case "${1:-start}" in
    "start")
        echo -e "${BLUE}🎯 Starting all services...${NC}"
        echo ""
        
        # Install API server dependencies
        echo -e "${BLUE}📦 Installing API server dependencies...${NC}"
        pip install -r scripts/api_requirements.txt
        
        # Start the Python stream
        start_service "stream_orders.py" "python3 stream_orders.py" "Live Orders Stream"
        sleep 3
        
        # Start the API server
        start_service "api_server.py" "python3 api_server.py" "Local API Server"
        sleep 2
        
        echo ""
        echo -e "${GREEN}🎉 All services started!${NC}"
        echo ""
        show_status
        echo ""
        show_endpoints
        echo ""
        echo -e "${BLUE}💡 Tips:${NC}"
        echo "  - Run './scripts/start_local_api.sh status' to check status"
        echo "  - Run './scripts/start_local_api.sh stop' to stop all services"
        echo "  - Press Ctrl+C to stop this script (services will continue running)"
        echo ""
        echo -e "${YELLOW}🔄 Monitoring services... (Press Ctrl+C to exit)${NC}"
        
        # Monitor services
        while true; do
            sleep 10
            # Check if any critical services have died
            if ! is_running "stream_orders.py"; then
                echo -e "${RED}⚠️  Live Orders stream died, restarting...${NC}"
                start_service "stream_orders.py" "python3 stream_orders.py" "Live Orders Stream"
            fi
            if ! is_running "api_server.py"; then
                echo -e "${RED}⚠️  API server died, restarting...${NC}"
                start_service "api_server.py" "python3 api_server.py" "Local API Server"
            fi
        done
        ;;
        
    "stop")
        stop_services
        ;;
        
    "restart")
        stop_services
        sleep 3
        exec "$0" start
        ;;
        
    "status")
        show_status
        echo ""
        show_endpoints
        ;;
        
    "help"|"-h"|"--help")
        echo "Artifice Local API Server Manager"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     Start all services (default)"
        echo "  stop      Stop all services"
        echo "  restart   Restart all services"
        echo "  status    Show service status"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Start all services"
        echo "  $0 start             # Start all services"
        echo "  $0 status            # Check which services are running"
        echo "  $0 stop              # Stop all services"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
