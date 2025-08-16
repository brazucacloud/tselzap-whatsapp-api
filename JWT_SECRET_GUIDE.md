# 🔐 Guia Completo - JWT Secret Configuration

## 📋 O que é JWT_SECRET?

O **JWT_SECRET** é uma chave secreta usada para assinar e verificar tokens JWT (JSON Web Tokens) na aplicação. É essencial para a segurança da autenticação.

## 🚀 Configuração Automática

### **Script Completo (Recomendado)**
```bash
# Execute o setup completo
setup-complete.bat
```

Este script irá:
1. ✅ Verificar se o Docker está instalado
2. ✅ Gerar um JWT_SECRET seguro
3. ✅ Configurar o arquivo .env
4. ✅ Atualizar o JWT_SECRET no .env
5. ✅ Limpar arquivos temporários

### **Configuração Manual**

#### **1. Gerar JWT Secret**
```bash
# Gerar JWT Secret seguro
powershell -ExecutionPolicy Bypass -File generate-jwt-secret.ps1
```

#### **2. Configurar .env**
```bash
# Configurar arquivo .env
setup-env.bat
```

#### **3. Atualizar JWT Secret**
```bash
# Atualizar JWT_SECRET no .env
update-jwt-simple.bat
```

## 🔧 Configuração Manual do .env

### **Arquivo .env Funcional**
```env
# ========================================
# TselZap WhatsApp API - Environment Variables
# ========================================

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/tselzap"

# Redis Configuration
REDIS_URL="redis://redis:6379"

# JWT Authentication (IMPORTANTE: Mude em produção!)
JWT_SECRET="seu-jwt-secret-gerado-aqui"
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
```

## 🔒 Segurança do JWT_SECRET

### **Requisitos de Segurança**
- ✅ **Mínimo 128 caracteres**
- ✅ **Caracteres aleatórios** (letras, números, símbolos)
- ✅ **Único por ambiente** (dev, staging, prod)
- ✅ **Mantido em segredo** (não commitar no Git)

### **Exemplo de JWT_SECRET Seguro**
```
ap,6%}*#0?B]T|PVHW-Q{J9nV3{|S<Z[rK*&{(PbUGUoh^ln{uPEHfBZ2oU!<b=]0ph@tSUxeQtcjMnFigh#sBS?t?[3YW(bkl?8BOt]^8%&Ve_-bu:D)${Bw+PAyKsP
```

## 🛠️ Scripts Disponíveis

### **1. generate-jwt-secret.ps1**
- Gera JWT_SECRET seguro de 128 caracteres
- Salva em arquivo temporário
- Usa caracteres aleatórios

### **2. setup-env.bat**
- Cria arquivo .env completo
- Configura todas as variáveis
- Permite edição manual

### **3. update-jwt-simple.bat**
- Atualiza JWT_SECRET no .env
- Cria backup automático
- Verifica a atualização

### **4. setup-complete.bat**
- Script completo de configuração
- Combina todos os passos
- Verifica Docker

## 🔍 Verificação

### **Verificar JWT_SECRET no .env**
```bash
# Verificar se foi configurado
findstr "JWT_SECRET" .env

# Verificar formato
type .env | findstr "JWT_SECRET"
```

### **Verificar Backup**
```bash
# Verificar backup criado
dir .env.backup
```

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. JWT_SECRET não foi atualizado**
```bash
# Reexecutar atualização
update-jwt-simple.bat
```

#### **2. Arquivo .env não existe**
```bash
# Criar arquivo .env
setup-env.bat
```

#### **3. JWT_SECRET muito curto**
```bash
# Regenerar JWT_SECRET
powershell -ExecutionPolicy Bypass -File generate-jwt-secret.ps1
```

#### **4. Caracteres especiais no JWT_SECRET**
- O script já trata caracteres especiais
- Se houver problemas, use apenas letras e números

## 📱 Configuração para Produção

### **Alterações Necessárias**
```env
# Produção
NODE_ENV=production
JWT_SECRET="jwt-secret-muito-longo-e-seguro-para-producao"
CORS_ORIGIN="https://seudominio.com"
FRONTEND_URL="https://seudominio.com"
```

### **Geração de JWT_SECRET para Produção**
```bash
# Gerar JWT_SECRET mais longo para produção
powershell -ExecutionPolicy Bypass -File generate-jwt-secret.ps1
```

## 🔄 Fluxo de Trabalho

### **Desenvolvimento**
```bash
# 1. Setup inicial
setup-complete.bat

# 2. Deploy
deploy-docker.bat

# 3. Configurar banco
setup-database.bat

# 4. Monitorar
monitor.bat
```

### **Produção**
```bash
# 1. Configurar .env para produção
# 2. Gerar novo JWT_SECRET
# 3. Deploy
deploy-prod.bat
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs:** `docker-compose logs -f`
2. **Use o monitor:** `monitor.bat`
3. **Consulte a documentação:** README.md
4. **Teste a saúde:** http://localhost:3001/health

---

## 🎯 Resumo

✅ **JWT_SECRET configurado com sucesso!**
- Chave de 128 caracteres gerada
- Arquivo .env atualizado
- Backup criado
- Pronto para deploy

**Próximos passos:**
1. `deploy-docker.bat`
2. `setup-database.bat`
3. `monitor.bat`

**Boa sorte com o deploy! 🚀**
