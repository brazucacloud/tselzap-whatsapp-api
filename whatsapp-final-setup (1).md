# 📱 WhatsApp Automation Backend - Guia Completo de Uso

## 🎯 Início Rápido

### Instalação em 1 Comando

```bash
# Linux/Mac
curl -sSL https://raw.githubusercontent.com/seu-repo/quick-start.sh | bash

# Ou clone e execute
git clone https://github.com/seu-usuario/whatsapp-backend.git
cd whatsapp-backend
./install.sh
```

### Verificar Sistema

```bash
# Verificação completa
node health-check.js

# Troubleshooting
node health-check.js troubleshoot
```

---

## 🔧 Comandos Úteis do Dia a Dia

### Desenvolvimento

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Iniciar com watch mode
npm run dev:watch

# Iniciar com debug
npm run debug

# Verificar logs em tempo real
tail -f logs/application-*.log

# Limpar logs antigos
find logs -name "*.log" -mtime +7 -delete
```

### Banco de Dados

```bash
# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations pendentes
npx prisma migrate deploy

# Reset do banco (CUIDADO!)
npx prisma migrate reset

# Abrir Prisma Studio (GUI)
npx prisma studio

# Backup do banco
pg_dump -U whatsapp_user -h localhost whatsapp_automation > backup.sql

# Restaurar backup
psql -U whatsapp_user -h localhost whatsapp_automation < backup.sql

# Consulta rápida
psql -U whatsapp_user -d whatsapp_automation -c "SELECT COUNT(*) FROM \"User\";"
```

### Docker

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar serviços
docker-compose down

# Limpar tudo (volumes inclusos)
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache

# Executar comando dentro do container
docker-compose exec app npm run migrate

# Ver status
docker-compose ps

# Estatísticas de recursos
docker stats
```

### PM2 (Produção)

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs

# Monitorar
pm2 monit

# Recarregar sem downtime
pm2 reload all

# Parar
pm2 stop all

# Deletar processos
pm2 delete all

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

### Redis

```bash
# Conectar ao Redis CLI
redis-cli

# Com senha
redis-cli -a sua_senha

# Comandos úteis no Redis
PING                    # Testar conexão
INFO                    # Informações do servidor
FLUSHDB                 # Limpar banco atual
KEYS *                  # Listar todas as chaves
GET chave              # Obter valor
SET chave valor        # Definir valor
DEL chave              # Deletar chave
TTL chave              # Tempo de vida restante
```

### Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes específicos
npm test -- --testPathPattern=mobzap

# Testes em watch mode
npm run test:watch

# Testes E2E
npm run test:e2e

# Gerar relatório HTML
npm run test:coverage -- --coverageReporters=html
```

---

## 📡 API - Exemplos de Uso

### 1. Autenticação

#### Registrar Usuário
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "username": "usuario123",
    "password": "SenhaForte@123",
    "fullName": "Nome Completo"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaForte@123"
  }'

# Resposta incluirá token JWT e API Key
```

### 2. Configuração MobZap

#### Buscar Tarefas (Endpoint MobZap)
```bash
curl -X POST http://localhost:3000/api/v1/mobzap/fetch \
  -H "X-API-Key: wak_xxx_yyy" \
  -H "X-User-ID: uuid-do-usuario" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_normal": "+5511999887766",
    "battery_level": 85,
    "is_charging": false,
    "device_model": "Samsung Galaxy S21"
  }'
```

#### Callback de Status
```bash
curl -X POST http://localhost:3000/api/v1/mobzap/callback \
  -H "X-API-Key: wak_xxx_yyy" \
  -H "X-User-ID: uuid-do-usuario" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task_123",
    "status": "completed",
    "result": {
      "messageId": "msg_456"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### 3. Enviar Mensagens

#### Mensagem de Texto
```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_uuid",
    "phoneNumber": "+5511999887766",
    "messageType": "TEXT",
    "content": "Olá! Esta é uma mensagem de teste."
  }'
```

#### Enviar Mídia
```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_uuid",
    "phoneNumber": "+5511999887766",
    "messageType": "IMAGE",
    "mediaUrl": "https://example.com/image.jpg",
    "content": "Legenda da imagem"
  }'
```

#### Mensagem em Massa
```bash
curl -X POST http://localhost:3000/api/v1/messages/bulk \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_uuid",
    "phoneNumbers": [
      "+5511999887766",
      "+5511888776655",
      "+5511777665544"
    ],
    "content": "Mensagem para múltiplos contatos",
    "delay": 5000
  }'
```

### 4. Gerenciar Dispositivos

#### Registrar Dispositivo
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+5511999887766",
    "deviceName": "Meu WhatsApp",
    "deviceType": "NORMAL"
  }'
```

#### Listar Dispositivos
```bash
curl -X GET http://localhost:3000/api/v1/devices \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

#### Gerar QR Code
```bash
curl -X POST http://localhost:3000/api/v1/devices/DEVICE_ID/qr \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 5. Dashboard e Estatísticas

#### Overview do Dashboard
```bash
curl -X GET http://localhost:3000/api/v1/dashboard/overview \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

#### Estatísticas de Mensagens
```bash
curl -X GET "http://localhost:3000/api/v1/messages/stats?period=7d" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

## 🔐 Variáveis de Ambiente (.env)

### Configuração Essencial

```env
# ===== APLICAÇÃO =====
NODE_ENV=production
PORT=3000
APP_URL=https://api.seudominio.com

# ===== BANCO DE DADOS =====
DATABASE_URL="postgresql://usuario:senha@localhost:5432/whatsapp_db"

# ===== REDIS =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=senha_redis_forte

# ===== JWT =====
JWT_SECRET=chave_secreta_64_caracteres_aleatoria
JWT_REFRESH_SECRET=outra_chave_secreta_diferente
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ===== CRIPTOGRAFIA =====
ENCRYPTION_KEY=chave_32_caracteres_exatos_12345

# ===== EMAIL (Gmail) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app-gmail

# ===== RATE LIMITING =====
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# ===== LOGS =====
LOG_LEVEL=info
LOG_DIR=./logs

# ===== UPLOAD =====
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# ===== WEBHOOK =====
WEBHOOK_TIMEOUT=10000
WEBHOOK_MAX_RETRIES=3
```

### Gerar Chaves Seguras

```bash
# JWT Secret (64 caracteres)
openssl rand -base64 64 | tr -d '\n'

# Encryption Key (32 caracteres)
openssl rand -base64 32 | tr -d '=' | cut -c1-32

# Redis Password
openssl rand -base64 32 | tr -d "=+/"
```

---

## 🚨 Troubleshooting Comum

### Problema: "Cannot connect to PostgreSQL"

```bash
# Verificar se está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -h localhost -U whatsapp_user -d whatsapp_automation

# Se falhar, verificar pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Mudar "peer" para "md5" em conexões locais

# Reiniciar
sudo systemctl restart postgresql
```

### Problema: "Port 3000 already in use"

```bash
# Encontrar processo
sudo lsof -i :3000

# Matar processo
sudo kill -9 PID

# Ou usar outra porta
PORT=3001 npm run dev
```

### Problema: "Prisma migration failed"

```bash
# Reset completo (CUIDADO - apaga dados!)
npx prisma migrate reset --force

# Sincronizar com banco existente
npx prisma db pull
npx prisma generate
```

### Problema: "Redis connection refused"

```bash
# Verificar se está rodando
redis-cli ping

# Iniciar Redis
sudo systemctl start redis-server

# Verificar logs
sudo journalctl -u redis-server -n 50
```

### Problema: "npm install failing"

```bash
# Limpar tudo
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstalar
npm install

# Se persistir, usar Yarn
npm install -g yarn
yarn install
```

---

## 📊 Monitoramento

### Verificar Saúde do Sistema

```bash
# Health check da API
curl http://localhost:3000/health

# Dashboard de estatísticas
curl http://localhost:3000/api/v1/dashboard/health \
  -H "Authorization: Bearer TOKEN"
```

### Logs em Tempo Real

```bash
# Todos os logs
tail -f logs/*.log

# Apenas erros
tail -f logs/error-*.log | grep ERROR

# Com PM2
pm2 logs --lines 100

# Com Docker
docker-compose logs -f --tail=100
```

### Métricas do Sistema

```bash
# CPU e Memória
htop

# Espaço em disco
df -h

# Conexões de rede
netstat -tulpn | grep LISTEN

# Processos Node
ps aux | grep node
```

---

## 🚀 Deploy em Produção

### 1. Preparação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/whatsapp-backend.git
cd whatsapp-backend

# Configurar ambiente
cp .env.example .env
nano .env  # Editar com valores de produção

# Instalar dependências
npm ci --only=production

# Build
npm run build

# Migrations
npx prisma migrate deploy
```

### 2. Configurar Nginx

```nginx
server {
    listen 80;
    server_name api.seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/api.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d api.seudominio.com

# Auto-renovação
sudo certbot renew --dry-run
```

### 4. Iniciar com PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup systemd
```

### 5. Backup Automático

```bash
# Criar script de backup
cat > /home/user/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup banco de dados
pg_dump -U whatsapp_user whatsapp_automation | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" /app/uploads

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup concluído: $TIMESTAMP"
EOF

chmod +x /home/user/backup.sh

# Agendar no cron (todo dia às 3h)
crontab -e
# Adicionar: 0 3 * * * /home/user/backup.sh
```

---

## 🎉 Conclusão

Sistema completo instalado e configurado! 

### Links Importantes

- **API**: http://localhost:3000
- **Documentação**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Prisma Studio**: http://localhost:5555

### Suporte

- **Logs**: `./logs/`
- **Uploads**: `./uploads/`
- **Sessions**: `./sessions/`

### Comandos Rápidos

```bash
# Status geral
npm run status

# Reiniciar tudo
npm run restart

# Limpar e reinstalar
npm run clean && npm install

# Modo debug
DEBUG=* npm run dev
```

---

**🚀 Pronto para produção!**