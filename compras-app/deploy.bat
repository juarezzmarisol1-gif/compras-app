@echo off
echo ========================================
echo   Deploy de Compras App
echo ========================================
echo.

REM Verificar si git está instalado
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git no está instalado o no está en PATH
    echo Instala Git desde https://git-scm.com/
    pause
    exit /b 1
)

REM Verificar si estamos en un repositorio git
if not exist .git (
    echo Inicializando repositorio Git...
    git init
    git add .
    git commit -m "Initial commit - Compras App"
    echo.
    echo ✅ Repositorio Git inicializado
    echo.
    echo AHORA DEBES:
    echo 1. Crear un repositorio en GitHub
    echo 2. Ejecutar: git remote add origin https://github.com/TU_USUARIO/compras-app.git
    echo 3. Ejecutar: git push -u origin main
    echo.
) else (
    echo Actualizando repositorio...
    git add .
    git status | findstr /C:"nothing to commit" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Todo está actualizado, no hay cambios para hacer commit
    ) else (
        set /p COMMIT_MSG="Mensaje del commit (o Enter para usar default): "
        if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update - Compras App
        git commit -m "%COMMIT_MSG%"
        echo ✅ Cambios commiteados
    )
    echo.
    echo Para desplegar:
    echo 1. Asegúrate de haber subido el código a GitHub: git push
    echo 2. Sigue las instrucciones en GUIA_DEPLOY.md
    echo.
)

echo ========================================
echo   Próximos Pasos:
echo ========================================
echo.
echo 1. Lee GUIA_DEPLOY.md para instrucciones completas
echo 2. Configura Google Sheets y Service Account
echo 3. Sube el código a GitHub
echo 4. Despliega backend en Vercel
echo 5. Despliega frontend en Netlify
echo.
echo URLs importantes:
echo - Vercel (Backend): https://vercel.com
echo - Netlify (Frontend): https://netlify.com
echo - Google Cloud Console: https://console.cloud.google.com
echo.
pause