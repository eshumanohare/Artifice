#!/bin/bash
set -e

echo "🚀 Starting Artifice Dashboard..."

# Create cache directory if it doesn't exist
mkdir -p .cache

# Function to handle cleanup on exit
cleanup() {
    echo "🛑 Shutting down..."
    if [ ! -z "$STREAM_PID" ]; then
        kill $STREAM_PID 2>/dev/null || true
    fi
    if [ ! -z "$NEXT_PID" ]; then
        kill $NEXT_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start Python streams in background
echo "📡 Starting HyperSync streams..."
python3 scripts/stream_orders.py &
STREAM_PID=$!

# Wait a moment for streams to initialize
echo "⏳ Waiting for streams to initialize..."
sleep 10

# Check if streams are working
if ! kill -0 $STREAM_PID 2>/dev/null; then
    echo "❌ Stream process failed to start"
    exit 1
fi

echo "✅ Streams started successfully"

# Start Next.js application
echo "🌐 Starting Next.js server..."
npm start &
NEXT_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 15

# Check if Next.js is running
if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "❌ Next.js process failed to start"
    cleanup
    exit 1
fi

echo "✅ Next.js started successfully"
echo "🎉 Artifice Dashboard is running!"
echo "📊 Dashboard: http://localhost:3000"
echo "📡 API: http://localhost:3000/api/orders"

# Monitor both processes
while true; do
    # Check if stream process is still running
    if ! kill -0 $STREAM_PID 2>/dev/null; then
        echo "⚠️  Stream process died, restarting..."
        python3 scripts/stream_orders.py &
        STREAM_PID=$!
    fi
    
    # Check if Next.js process is still running
    if ! kill -0 $NEXT_PID 2>/dev/null; then
        echo "⚠️  Next.js process died, restarting..."
        npm start &
        NEXT_PID=$!
    fi
    
    sleep 30
done
