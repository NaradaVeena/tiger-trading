#!/bin/bash
# Research portal web server + Cloudflare tunnel
# Run: bash scripts/research-server.sh

RESEARCH_DIR="/home/vamsi/.openclaw/workspace/research"
PORT=8090
LOG="/tmp/cf-tunnel.log"

# Kill existing
pkill -f "http.server $PORT" 2>/dev/null
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 1

# Start web server
cd "$RESEARCH_DIR"
nohup python3 -m http.server $PORT --bind 0.0.0.0 &>/dev/null &
echo "Web server PID: $!"

sleep 1

# Start tunnel
nohup cloudflared tunnel --url http://127.0.0.1:$PORT > "$LOG" 2>&1 &
disown
echo "Tunnel PID: $!"

sleep 6
TUNNEL_URL=$(grep "trycloudflare.com" "$LOG" | grep -oP 'https://[^\s|]+')
echo "Tunnel URL: $TUNNEL_URL"
