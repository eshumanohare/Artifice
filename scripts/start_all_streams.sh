#!/bin/bash

# Start All HyperSync Streams for Artifice Dashboard
# This script manages all Python streaming processes for the dashboard

echo "🚀 Starting Artifice HyperSync Dashboard Streams"
echo "================================================"

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

# Function to start a stream
start_stream() {
    local script_name=$1
    local description=$2
    
    # Check if we're in the scripts directory or project root
    if [ -f "$script_name" ]; then
        # We're in the scripts directory
        local script_path="$script_name"
    elif [ -f "scripts/$script_name" ]; then
        # We're in the project root
        local script_path="scripts/$script_name"
    else
        echo -e "${RED}❌ Error: $script_name not found${NC}"
        return 1
    fi
    
    if is_running "$script_name"; then
        echo -e "${YELLOW}⚠️  $description is already running${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🔄 Starting $description...${NC}"
    
    # Check if we're in scripts directory and need to go up one level for env
    if [ -f "$script_name" ] && [ -f "../env/bin/activate" ]; then
        source ../env/bin/activate && python3 "$script_path" &
    elif [ -f "env/bin/activate" ]; then
        source env/bin/activate && python3 "$script_path" &
    else
        python3 "$script_path" &
    fi
    
    local pid=$!
    echo -e "${GREEN}✅ $description started with PID $pid${NC}"
    return 0
}

# Function to stop all streams
stop_streams() {
    echo -e "${YELLOW}🛑 Stopping all streams...${NC}"
    
    # Kill all Python processes running our scripts
    pkill -f "stream_orders.py"
    pkill -f "stream_whale_activity.py"
    
    echo -e "${GREEN}✅ All streams stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Stream Status:${NC}"
    echo "=================="
    
    local streams=(
        "stream_orders.py:Live Orders"
        "stream_whale_activity.py:Whale Activity"
    )
    
    for stream in "${streams[@]}"; do
        IFS=':' read -r script desc <<< "$stream"
        if is_running "$script"; then
            echo -e "${GREEN}✅ $desc${NC}"
        else
            echo -e "${RED}❌ $desc${NC}"
        fi
    done
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Recent logs:${NC}"
    echo "==============="
    
    # Show recent log entries from each stream
    local log_files=(
        ".cache/live_orders.json"
        ".cache/whale_activity.json"
    )
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            echo -e "${YELLOW}$log_file:${NC}"
            # Show last update time
            if command -v jq > /dev/null; then
                last_update=$(jq -r '.lastUpdate // "unknown"' "$log_file" 2>/dev/null)
                if [ "$last_update" != "unknown" ] && [ "$last_update" != "null" ]; then
                    last_update_formatted=$(date -d "@$((last_update/1000))" 2>/dev/null || echo "unknown")
                    echo "  Last update: $last_update_formatted"
                fi
            fi
            echo ""
        fi
    done
}

# Main script logic
case "${1:-start}" in
    "start")
        echo -e "${BLUE}🎯 Starting all HyperSync streams...${NC}"
        echo ""
        
        # Start each stream
        start_stream "stream_orders.py" "Live Orders Stream"
        sleep 2
        
        sleep 2
        
        sleep 2
        
        # Note: whale_activity.py is integrated into analytics.py for now
        # start_stream "stream_whale_activity.py" "Whale Activity Stream"
        
        echo ""
        echo -e "${GREEN}🎉 All streams started!${NC}"
        echo ""
        show_status
        echo ""
        echo -e "${BLUE}💡 Tips:${NC}"
        echo "  - Run './scripts/start_all_streams.sh status' to check status"
        echo "  - Run './scripts/start_all_streams.sh stop' to stop all streams"
        echo "  - Run './scripts/start_all_streams.sh logs' to view recent activity"
        echo "  - Press Ctrl+C to stop this script (streams will continue running)"
        echo ""
        echo -e "${YELLOW}🔄 Monitoring streams... (Press Ctrl+C to exit)${NC}"
        
        # Monitor streams
        while true; do
            sleep 10
            # Check if any critical streams have died
            if ! is_running "stream_orders.py"; then
                echo -e "${RED}⚠️  Live Orders stream died, restarting...${NC}"
                start_stream "stream_orders.py" "Live Orders Stream"
            fi
        done
        ;;
        
    "stop")
        stop_streams
        ;;
        
    "restart")
        stop_streams
        sleep 3
        exec "$0" start
        ;;
        
    "status")
        show_status
        ;;
        
    "logs")
        show_logs
        ;;
        
    "help"|"-h"|"--help")
        echo "Artifice HyperSync Stream Manager"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     Start all streams (default)"
        echo "  stop      Stop all streams"
        echo "  restart   Restart all streams"
        echo "  status    Show stream status"
        echo "  logs      Show recent activity logs"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Start all streams"
        echo "  $0 start             # Start all streams"
        echo "  $0 status            # Check which streams are running"
        echo "  $0 stop              # Stop all streams"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
