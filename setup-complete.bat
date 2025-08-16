@echo off
echo ========================================
echo    TselZap WhatsApp API - Setup Completo
echo ========================================
echo.

echo [1/5] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker nao esta instalado!
    echo Por favor, instale o Docker Desktop primeiro:
    echo https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo ✓ Docker encontrado!

echo.
echo [2/5] Gerando JWT Secret seguro...
powershell -ExecutionPolicy Bypass -File generate-jwt-secret.ps1

echo.
echo [3/5] Configurando arquivo .env...
call setup-env.bat

echo.
echo [4/5] Atualizando JWT Secret no .env...
call update-jwt-simple.bat

echo.
echo [5/5] Limpando arquivos temporarios...
if exist "jwt-secret-temp.txt" del jwt-secret-temp.txt
if exist "env-functional.txt" del env-functional.txt

echo.
echo ========================================
echo         SETUP COMPLETO CONCLUIDO!
echo ========================================
echo.
echo ✓ Docker verificado
echo ✓ JWT Secret gerado e configurado
echo ✓ Arquivo .env configurado
echo ✓ Arquivos temporarios limpos
echo.
echo URLs de acesso apos o deploy:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - API Docs: http://localhost:3001/api-docs
echo - Health Check: http://localhost:3001/health
echo - Redis Commander: http://localhost:8081
echo.
echo Proximos passos:
echo 1. deploy-docker.bat
echo 2. setup-database.bat
echo 3. monitor.bat
echo.
echo Deseja executar o deploy agora? (S/N)
set /p deploy="Digite S para fazer deploy ou N para sair: "
if /i "%deploy%"=="S" (
    call deploy-docker.bat
)

echo.
echo Setup completo finalizado!
pause
