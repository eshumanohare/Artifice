#!/bin/bash

echo "🛑 Stopping Artifice HyperSync Dashboard Streams"
echo "================================================"

# Function to kill processes by name
kill_processes() {
    local process_name=$1
    local pids=$(ps aux | grep "$process_name" | grep -v grep | awk '{print $2}')
    
    if [ -n "$pids" ]; then
        echo "🔍 Found $process_name processes: $pids"
        for pid in $pids; do
            echo "🛑 Killing PID $pid..."
            kill -9 $pid 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ Successfully killed PID $pid"
            else
                echo "❌ Failed to kill PID $pid"
            fi
        done
    else
        echo "ℹ️  No $process_name processes found"
    fi
}

# Kill all related processes
echo "🔍 Searching for running streams..."

# Kill Python stream processes
kill_processes "stream_orders.py"

# Kill monitor cache processes  
kill_processes "monitor_cache.py"

# Kill start_all_streams.sh processes
kill_processes "start_all_streams.sh"

# Additional cleanup - kill any remaining Python processes related to the project
echo "🧹 Cleaning up any remaining project processes..."
pids=$(ps aux | grep -E "(python.*stream_orders|python.*monitor_cache|start_all_streams)" | grep -v grep | awk '{print $2}')

if [ -n "$pids" ]; then
    echo "🛑 Found additional processes: $pids"
    for pid in $pids; do
        echo "🛑 Force killing PID $pid..."
        kill -9 $pid 2>/dev/null
    done
else
    echo "✅ No additional processes found"
fi

echo ""
echo "📊 Final Status Check:"
echo "======================"

# Check if any processes are still running
remaining=$(ps aux | grep -E "(stream_orders|monitor_cache|start_all_streams)" | grep -v grep | wc -l)

if [ $remaining -eq 0 ]; then
    echo "✅ All streams successfully stopped!"
    echo "🎉 No running processes found"
else
    echo "⚠️  $remaining processes may still be running"
    echo "🔍 Remaining processes:"
    ps aux | grep -E "(stream_orders|monitor_cache|start_all_streams)" | grep -v grep
fi

echo ""
echo "💡 Tips:"
echo "  - Run 'ps aux | grep python' to check for any remaining Python processes"
echo "  - Run 'ps aux | grep stream' to check for any remaining stream processes"
echo "  - If processes persist, you may need to restart your terminal"
