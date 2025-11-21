#!/bin/bash

# Complete development environment startup script
PROJECT_DIR="/Users/zoopark/dev/weet-ai_v3(claude)"
cd "$PROJECT_DIR"

echo "================================"
echo "🚀 Starting Weet AI Development Environment"
echo "================================"

# Stop existing processes
echo ""
echo "📋 Stopping existing processes..."
if [ -f .dev-server.pid ]; then
    kill $(cat .dev-server.pid) 2>/dev/null
    rm .dev-server.pid
    echo "✅ Old dev server stopped"
fi

if [ -f .monitor.pid ]; then
    kill $(cat .monitor.pid) 2>/dev/null
    rm .monitor.pid
    echo "✅ Old monitor stopped"
fi

# Clear old logs (optional)
echo ""
echo "🧹 Cleaning old logs..."
rm -f error.log
echo "✅ Error log cleared"

# Start dev server
echo ""
echo "🖥️  Starting dev server..."
npm run dev > dev-server.log 2>&1 &
echo $! > .dev-server.pid
sleep 3

# Check if server started
if ps -p $(cat .dev-server.pid) > /dev/null; then
    echo "✅ Dev server started (PID: $(cat .dev-server.pid))"

    # Get the port from log
    PORT=$(grep -oE "localhost:[0-9]+" dev-server.log | head -1 | cut -d: -f2)
    if [ ! -z "$PORT" ]; then
        echo "🌐 Server running on: http://localhost:$PORT"
    fi
else
    echo "❌ Failed to start dev server"
    echo "📄 Check dev-server.log for details"
    exit 1
fi

# Start log monitor
echo ""
echo "📊 Starting log monitor..."
./monitor-logs.sh > runtime.log 2>&1 &
echo $! > .monitor.pid
echo "✅ Log monitor started (PID: $(cat .monitor.pid))"

echo ""
echo "================================"
echo "✨ Development Environment Ready!"
echo "================================"
echo ""
echo "📂 Log files:"
echo "   - dev-server.log  : All server output"
echo "   - error.log       : Auto-detected errors"
echo "   - runtime.log     : Monitor system logs"
echo ""
echo "🔧 Useful commands:"
echo "   ./check-errors.sh : Quick error check"
echo "   tail -f dev-server.log : Live server logs"
echo "   ./stop-dev.sh     : Stop all processes"
echo ""
echo "💡 Server is logging in real-time!"
echo "================================"
