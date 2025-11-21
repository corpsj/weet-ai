#!/bin/bash

# Quick error check script
LOG_DIR="/Users/zoopark/dev/weet-ai_v3(claude)"
DEV_LOG="$LOG_DIR/dev-server.log"
ERROR_LOG="$LOG_DIR/error.log"

echo "================================"
echo "🔍 Checking for errors..."
echo "================================"

# Check if dev server log exists
if [ ! -f "$DEV_LOG" ]; then
    echo "❌ Dev server log not found: $DEV_LOG"
    exit 1
fi

# Extract recent errors from dev log
echo ""
echo "📋 Recent errors from dev server:"
echo "--------------------------------"
tail -100 "$DEV_LOG" | grep -iE "error|exception|failed|cannot|undefined|warning" | tail -20

# Check error log if it exists
if [ -f "$ERROR_LOG" ]; then
    ERROR_COUNT=$(wc -l < "$ERROR_LOG")
    echo ""
    echo "📊 Total errors logged: $ERROR_COUNT"

    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo ""
        echo "🔴 Last 10 errors:"
        echo "--------------------------------"
        tail -10 "$ERROR_LOG"
    fi
else
    echo ""
    echo "✅ No error log file found (no errors detected)"
fi

echo ""
echo "================================"
echo "💡 To view live logs: tail -f $DEV_LOG"
echo "💡 To clear error log: rm $ERROR_LOG"
echo "================================"
