#!/bin/bash
PROJECT_DIR="$HOME/Desktop/всякое/tapPN"

echo "🍎 Tap Fruit — запускаю..."

osascript <<EOF
tell application "Terminal"
  do script "cd '$PROJECT_DIR/backend' && echo '📡 BACKEND' && npm run dev"
  activate
end tell
EOF

sleep 2

osascript <<EOF
tell application "Terminal"
  do script "cd '$PROJECT_DIR/frontend' && echo '🎨 FRONTEND' && npm run dev"
end tell
EOF

sleep 2

osascript <<EOF
tell application "Terminal"
  do script "echo '🌐 NGROK' && ngrok http 5173"
end tell
EOF

echo "✅ Запущено!"
echo "📡 Backend  →  http://localhost:4000"
echo "🎨 Frontend →  http://localhost:5173"
echo "🌐 Ngrok    →  смотри в окне NGROK"
