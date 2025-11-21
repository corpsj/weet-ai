#!/bin/bash

# Stop all development processes
PROJECT_DIR="/Users/zoopark/dev/weet-ai_v3(claude)"
cd "$PROJECT_DIR"

echo "================================"
echo "🛑 Stopping Development Environment"
echo "================================"

# Stop dev server
if [ -f .dev-server.pid ]; then
    PID=$(cat .dev-server.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        echo "✅ Dev server stopped (PID: $PID)"
    else
        echo "⚠️  Dev server was not running"
    fi
    rm .dev-server.pid
else
    echo "⚠️  No dev server PID file found"
fi

# Stop monitor
if [ -f .monitor.pid ]; then
    PID=$(cat .monitor.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        echo "✅ Log monitor stopped (PID: $PID)"
    else
        echo "⚠️  Log monitor was not running"
    fi
    rm .monitor.pid
else
    echo "⚠️  No monitor PID file found"
fi

echo ""
echo "================================"
echo "✅ All processes stopped"
echo "================================"
