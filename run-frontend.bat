@echo off
echo Iniciando servidor de desarrollo del frontend...
set PATH=%PATH%;C:\Program Files\nodejs
cd compras-app\frontend
call npm run dev
pause