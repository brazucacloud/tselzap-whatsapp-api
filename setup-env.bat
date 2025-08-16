@echo off
echo ========================================
echo    Configuracao do Arquivo .env
echo ========================================
echo.

echo [1/3] Verificando arquivo .env existente...
if exist ".env" (
    echo Arquivo .env encontrado!
    echo Deseja sobrescrever? (S/N)
    set /p overwrite="Digite S para sobrescrever ou N para manter: "
    if /i "%overwrite%"=="S" (
        echo Sobrescrevendo arquivo .env...
    ) else (
        echo Mantendo arquivo .env existente.
        goto :end
    )
) else (
    echo Arquivo .env nao encontrado. Criando novo...
)

echo.
echo [2/3] Criando arquivo .env funcional...

(
echo # ========================================
echo # TselZap WhatsApp API - Environment Variables
echo # ========================================
echo.
echo # Database Configuration
echo DATABASE_URL="postgresql://postgres:postgres@postgres:5432/tselzap"
echo.
echo # Redis Configuration
echo REDIS_URL="redis://redis:6379"
echo.
echo # JWT Authentication
echo JWT_SECRET="tselzap-jwt-secret-2024-super-secure-key-change-in-production"
echo JWT_EXPIRES_IN="7d"
echo.
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=development
echo.
echo # Frontend URL
echo FRONTEND_URL="http://localhost:3000"
echo.
echo # Email Configuration ^(Gmail SMTP^)
echo SMTP_HOST="smtp.gmail.com"
echo SMTP_PORT=587
echo SMTP_SECURE=false
echo SMTP_USER="seu-email@gmail.com"
echo SMTP_PASS="sua-senha-app-gmail"
echo.
echo # WhatsApp API Configuration
echo WHATSAPP_API_URL="https://api.whatsapp.com"
echo WHATSAPP_API_TOKEN="seu-token-whatsapp-api"
echo WHATSAPP_WEB_URL="http://localhost:3000"
echo.
echo # Logging Configuration
echo LOG_LEVEL="info"
echo LOG_FILE="logs/app.log"
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # File Upload Configuration
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH="./uploads"
echo.
echo # Security Configuration
echo CORS_ORIGIN="http://localhost:3000"
echo HELMET_ENABLED=true
echo.
echo # Monitoring Configuration
echo ENABLE_METRICS=true
echo METRICS_PORT=9090
echo.
echo # API Configuration
echo API_PREFIX="/api/v1"
echo API_VERSION="1.0.0"
echo.
echo # Queue Configuration
echo QUEUE_REDIS_URL="redis://redis:6379"
echo QUEUE_PREFIX="tselzap"
echo.
echo # Webhook Configuration
echo WEBHOOK_SECRET="tselzap-webhook-secret-2024"
echo WEBHOOK_URL="http://localhost:3001/api/v1/webhooks"
echo.
echo # License Configuration
echo LICENSE_KEY="tselzap-license-key-2024"
echo LICENSE_TYPE="premium"
echo LICENSE_EXPIRES="2024-12-31"
echo.
echo # Mobile App Configuration
echo MOBILE_API_KEY="tselzap-mobile-api-key-2024"
echo MOBILE_WEBHOOK_URL="http://localhost:3001/api/v1/mobile/webhook"
echo.
echo # Development Configuration
echo DEBUG=true
echo ENABLE_SWAGGER=true
echo ENABLE_CORS=true
echo.
echo # Production Configuration ^(change when deploying to production^)
echo # NODE_ENV=production
echo # JWT_SECRET="change-this-to-a-very-long-random-string-in-production"
echo # CORS_ORIGIN="https://yourdomain.com"
echo # FRONTEND_URL="https://yourdomain.com"
) > .env

echo.
echo [3/3] Arquivo .env criado com sucesso!
echo.
echo ========================================
echo           CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Arquivo .env criado com as seguintes configuracoes:
echo.
echo ✓ Database: PostgreSQL configurado
echo ✓ Redis: Cache configurado
echo ✓ JWT: Autenticacao configurada
echo ✓ Server: Porta 3001 configurada
echo ✓ Frontend: URL configurada
echo ✓ Email: SMTP configurado
echo ✓ WhatsApp: API configurada
echo ✓ Logging: Sistema de logs configurado
echo ✓ Rate Limiting: Protecao configurada
echo ✓ File Upload: Upload de arquivos configurado
echo ✓ Security: CORS e Helmet configurados
echo ✓ Monitoring: Metricas configuradas
echo ✓ API: Prefixo e versao configurados
echo ✓ Queue: Sistema de filas configurado
echo ✓ Webhook: Webhooks configurados
echo ✓ License: Sistema de licencas configurado
echo ✓ Mobile: Integracao mobile configurada
echo.
echo IMPORTANTE: Edite o arquivo .env para configurar:
echo - Seu email e senha do Gmail
echo - Token da API do WhatsApp
echo - Outras configuracoes especificas
echo.
echo Deseja abrir o arquivo .env para edicao? ^(S/N^)
set /p edit="Digite S para abrir ou N para sair: "
if /i "%edit%"=="S" (
    notepad .env
)

:end
echo.
echo Configuracao concluida! Agora voce pode executar:
echo - deploy-docker.bat
echo - setup-database.bat
echo - monitor.bat
echo.
pause
