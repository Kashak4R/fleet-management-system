@echo off
start "FleetFlow API" cmd /k "cd /d %~dp0server && npm run dev"
start "FleetFlow Client" cmd /k "cd /d %~dp0client && npm run dev"
echo FleetFlow is starting. Open http://localhost:5173 after both terminals are ready.

