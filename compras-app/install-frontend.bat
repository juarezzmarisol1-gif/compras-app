@echo off
echo Instalando dependencias del frontend...
set PATH=%PATH%;C:\Program Files\nodejs
cd compras-app\frontend
call npm install
echo.
echo Instalacion completada!
echo Para iniciar el servidor de desarrollo, ejecuta:
echo   npm run dev
pause