#!/bin/bash

# Log monitoring script for Weet AI v3
LOG_DIR="/Users/zoopark/dev/weet-ai_v3(claude)"
DEV_LOG="$LOG_DIR/dev-server.log"
ERROR_LOG="$LOG_DIR/error.log"
RUNTIME_LOG="$LOG_DIR/runtime.log"

# Create log files if they don't exist
touch "$DEV_LOG" "$ERROR_LOG" "$RUNTIME_LOG"

echo "=== Log Monitoring Started ===" | tee -a "$RUNTIME_LOG"
echo "Dev Server Log: $DEV_LOG" | tee -a "$RUNTIME_LOG"
echo "Error Log: $ERROR_LOG" | tee -a "$RUNTIME_LOG"
echo "Runtime Log: $RUNTIME_LOG" | tee -a "$RUNTIME_LOG"
echo "================================" | tee -a "$RUNTIME_LOG"

# Monitor dev server logs for errors
tail -f "$DEV_LOG" | while read line; do
    echo "$line"

    # Check for errors and save to error log
    if echo "$line" | grep -iE "error|exception|failed|cannot|undefined" > /dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line" >> "$ERROR_LOG"
        echo "⚠️  Error detected and logged to $ERROR_LOG"
    fi
done
