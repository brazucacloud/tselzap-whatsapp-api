#!/bin/bash

echo "========================================"
echo "   TselZap WhatsApp API - Setup .env"
echo "========================================"
echo

echo "[1/3] Verificando arquivo .env existente..."
if [ -f ".env" ]; then
    echo "Arquivo .env encontrado!"
    echo "Deseja sobrescrever? (s/n)"
    read -r overwrite
    if [[ $overwrite =~ ^[Ss]$ ]]; then
        echo "Sobrescrevendo arquivo .env..."
    else
        echo "Mantendo arquivo .env existente."
        exit 0
    fi
else
    echo "Arquivo .env não encontrado. Criando novo..."
fi

echo
echo "[2/3] Criando arquivo .env funcional..."

cat > .env << 'EOF'
# ========================================
# TselZap WhatsApp API - Environment Variables
# ========================================

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/tselzap"

# Redis Configuration
REDIS_URL="redis://redis:6379"

# JWT Authentication
JWT_SECRET="tselzap-jwt-secret-2024-super-secure-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Email Configuration (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app-gmail"

# WhatsApp API Configuration
WHATSAPP_API_URL="https://api.whatsapp.com"
WHATSAPP_API_TOKEN="seu-token-whatsapp-api"
WHATSAPP_WEB_URL="http://localhost:3000"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Security Configuration
CORS_ORIGIN="http://localhost:3000"
HELMET_ENABLED=true

# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090

# API Configuration
API_PREFIX="/api/v1"
API_VERSION="1.0.0"

# Queue Configuration
QUEUE_REDIS_URL="redis://redis:6379"
QUEUE_PREFIX="tselzap"

# Webhook Configuration
WEBHOOK_SECRET="tselzap-webhook-secret-2024"
WEBHOOK_URL="http://localhost:3001/api/v1/webhooks"

# License Configuration
LICENSE_KEY="tselzap-license-key-2024"
LICENSE_TYPE="premium"
LICENSE_EXPIRES="2024-12-31"

# Mobile App Configuration
MOBILE_API_KEY="tselzap-mobile-api-key-2024"
MOBILE_WEBHOOK_URL="http://localhost:3001/api/v1/mobile/webhook"

# Development Configuration
DEBUG=true
ENABLE_SWAGGER=true
ENABLE_CORS=true

# Production Configuration (change when deploying to production)
# NODE_ENV=production
# JWT_SECRET="change-this-to-a-very-long-random-string-in-production"
# CORS_ORIGIN="https://yourdomain.com"
# FRONTEND_URL="https://yourdomain.com"
EOF

echo
echo "[3/3] Arquivo .env criado com sucesso!"
echo
echo "========================================"
echo "         CONFIGURACAO CONCLUIDA!"
echo "========================================"
echo
echo "Arquivo .env criado com as seguintes configuracoes:"
echo
echo "✓ Database: PostgreSQL configurado"
echo "✓ Redis: Cache configurado"
echo "✓ JWT: Autenticacao configurada"
echo "✓ Server: Porta 3001 configurada"
echo "✓ Frontend: URL configurada"
echo "✓ Email: SMTP configurado"
echo "✓ WhatsApp: API configurada"
echo "✓ Logging: Sistema de logs configurado"
echo "✓ Rate Limiting: Protecao configurada"
echo "✓ File Upload: Upload de arquivos configurado"
echo "✓ Security: CORS e Helmet configurados"
echo "✓ Monitoring: Metricas configuradas"
echo "✓ API: Prefixo e versao configurados"
echo "✓ Queue: Sistema de filas configurado"
echo "✓ Webhook: Webhooks configurados"
echo "✓ License: Sistema de licencas configurado"
echo "✓ Mobile: Integracao mobile configurada"
echo
echo "IMPORTANTE: Edite o arquivo .env para configurar:"
echo "- Seu email e senha do Gmail"
echo "- Token da API do WhatsApp"
echo "- Outras configuracoes especificas"
echo
echo "Deseja abrir o arquivo .env para edicao? (s/n)"
read -r edit
if [[ $edit =~ ^[Ss]$ ]]; then
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "Editor não encontrado. Abra o arquivo .env manualmente."
    fi
fi

echo
echo "Configuracao concluida! Agora voce pode executar:"
echo "- ./deploy-docker.sh"
echo "- ./setup-database.sh"
echo "- ./monitor.sh"
echo
