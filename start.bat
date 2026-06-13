@echo off
echo Starting Finova...

start "Finova API Server" cmd /k "pnpm --filter @workspace/api-server run dev"
start "Finova Web App"    cmd /k "pnpm --filter @workspace/finance run dev"

echo Both services are starting in separate windows.
echo API Server: http://localhost:8080
echo Web App:    http://localhost:5173
pause
