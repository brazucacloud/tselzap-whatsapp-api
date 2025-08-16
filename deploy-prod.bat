@echo off
echo ========================================
echo    TselZap WhatsApp API - Deploy Producao
echo ========================================
echo.

echo [1/6] Verificando Docker...
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
echo [2/6] Verificando arquivo .env...
if not exist ".env" (
    echo ERRO: Arquivo .env nao encontrado!
    echo Copiando env.example para .env...
    copy env.example .env
    echo ✓ Arquivo .env criado!
    echo.
    echo IMPORTANTE: Configure as variaveis de ambiente para PRODUCAO!
    echo Pressione qualquer tecla para abrir o arquivo .env...
    pause
    notepad .env
) else (
    echo ✓ Arquivo .env encontrado!
)

echo.
echo [3/6] Parando containers existentes...
docker-compose down

echo.
echo [4/6] Construindo e iniciando containers em modo PRODUCAO...
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo.
echo [5/6] Verificando status dos containers...
docker-compose ps

echo.
echo [6/6] Configurando banco de dados...
docker-compose exec api npx prisma generate
docker-compose exec api npx prisma migrate deploy

echo.
echo ========================================
echo         DEPLOY PRODUCAO CONCLUIDO!
echo ========================================
echo.
echo URLs de acesso:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - API Docs: http://localhost:3001/api-docs
echo - Health Check: http://localhost:3001/health
echo - Redis Commander: http://localhost:8081
echo.
echo Comandos uteis:
echo - Ver logs: docker-compose logs -f
echo - Parar: docker-compose down
echo - Reiniciar: docker-compose restart
echo - Status: docker-compose ps
echo - Monitor: monitor.bat
echo.
echo ATENCAO: Configure SSL/HTTPS para producao real!
echo.
pause
