@echo off
echo ========================================
echo    TselZap WhatsApp API - Docker Deploy
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
echo [2/5] Verificando arquivo .env...
if not exist ".env" (
    echo ERRO: Arquivo .env nao encontrado!
    echo Copiando env.example para .env...
    copy env.example .env
    echo ✓ Arquivo .env criado!
    echo.
    echo IMPORTANTE: Edite o arquivo .env com suas configuracoes antes de continuar!
    echo Pressione qualquer tecla para abrir o arquivo .env...
    pause
    notepad .env
) else (
    echo ✓ Arquivo .env encontrado!
)

echo.
echo [3/5] Parando containers existentes...
docker-compose down

echo.
echo [4/5] Construindo e iniciando containers...
docker-compose up -d --build

echo.
echo [5/5] Verificando status dos containers...
docker-compose ps

echo.
echo ========================================
echo           DEPLOY CONCLUIDO!
echo ========================================
echo.
echo URLs de acesso:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - API Docs: http://localhost:3001/api-docs
echo - Health Check: http://localhost:3001/health
echo.
echo Comandos uteis:
echo - Ver logs: docker-compose logs -f
echo - Parar: docker-compose down
echo - Reiniciar: docker-compose restart
echo - Status: docker-compose ps
echo.
pause
