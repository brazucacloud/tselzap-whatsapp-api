# 🐳 Guia Completo de Deploy com Docker

## 📋 Pré-requisitos

### **1. Instalar Docker Desktop**
- Baixe em: https://www.docker.com/products/docker-desktop/
- Instale e reinicie o computador
- Verifique se está rodando (ícone na bandeja do sistema)

### **2. Verificar Instalação**
```bash
docker --version
docker-compose --version
```

---

## 🚀 Deploy Rápido (Recomendado)

### **Opção 1: Script Automatizado**
```bash
# Execute o script de deploy
deploy-docker.bat

# Configure o banco de dados
setup-database.bat

# Monitore os serviços
monitor.bat
```

### **Opção 2: Comandos Manuais**
```bash
# 1. Configurar ambiente
copy env.example .env

# 2. Deploy completo
docker-compose up -d --build

# 3. Configurar banco
docker-compose exec api npx prisma generate
docker-compose exec api npx prisma migrate deploy

# 4. Verificar status
docker-compose ps
```

---

## 📊 Monitoramento

### **Script de Monitoramento**
```bash
# Menu interativo com todas as opções
monitor.bat
```

### **Comandos Manuais**
```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis

# Verificar saúde da API
curl http://localhost:3001/health
```

---

## 🔧 Configuração de Ambiente

### **Arquivo .env**
Edite o arquivo `.env` com suas configurações:

```env
# Database (Docker)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/tselzap"

# Redis (Docker)
REDIS_URL="redis://redis:6379"

# JWT (MUDE EM PRODUÇÃO!)
JWT_SECRET="seu-jwt-secret-super-seguro"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"

# WhatsApp API
WHATSAPP_API_KEY="sua-chave-api"
WHATSAPP_WEB_URL="http://localhost:3000"

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Security
CORS_ORIGIN="http://localhost:3000"
HELMET_ENABLED=true
```

---

## 🌐 URLs de Acesso

Após o deploy bem-sucedido:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api-docs
- **Health Check:** http://localhost:3001/health
- **Redis Commander:** http://localhost:8081

---

## 🔄 Gerenciamento de Containers

### **Comandos Básicos**
```bash
# Parar todos os containers
docker-compose down

# Reiniciar todos os containers
docker-compose restart

# Reiniciar um serviço específico
docker-compose restart api

# Reconstruir e reiniciar
docker-compose up -d --build

# Ver uso de recursos
docker stats
```

### **Banco de Dados**
```bash
# Acessar Prisma Studio
docker-compose exec api npx prisma studio

# Executar migrações
docker-compose exec api npx prisma migrate deploy

# Resetar banco (CUIDADO!)
docker-compose exec api npx prisma migrate reset

# Backup do banco
docker-compose exec postgres pg_dump -U postgres -d tselzap > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres -d tselzap < backup.sql
```

---

## 🏭 Deploy em Produção

### **Script de Produção**
```bash
# Deploy em modo produção
deploy-prod.bat
```

### **Comandos Manuais**
```bash
# Deploy com configuração de produção
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Configurar banco para produção
docker-compose exec api npx prisma migrate deploy
```

### **Configurações de Produção**
- Configure `NODE_ENV=production` no `.env`
- Use um `JWT_SECRET` forte e único
- Configure HTTPS/SSL
- Configure backup automático
- Configure monitoramento

---

## 🧹 Limpeza e Manutenção

### **Limpar Recursos**
```bash
# Parar e remover containers
docker-compose down

# Remover volumes (CUIDADO - perde dados!)
docker-compose down -v

# Limpar imagens não utilizadas
docker image prune

# Limpar tudo (CUIDADO!)
docker system prune -a
```

### **Backup Automático**
```bash
# Criar script de backup
echo @echo off > backup-db.bat
echo set timestamp=%%date:~-4,4%%%%date:~-10,2%%%%date:~-7,2%%_%%time:~0,2%%%%time:~3,2%%%%time:~6,2%% >> backup-db.bat
echo set timestamp=%%timestamp: =0%% >> backup-db.bat
echo docker-compose exec postgres pg_dump -U postgres -d tselzap ^> backup_%%timestamp%%.sql >> backup-db.bat
```

---

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. Docker não inicia**
- Verifique se o Docker Desktop está rodando
- Reinicie o Docker Desktop
- Verifique se o WSL2 está habilitado (Windows)

#### **2. Porta já em uso**
```bash
# Verificar portas em uso
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Matar processo
taskkill /PID <PID> /F
```

#### **3. Erro de memória**
- Aumente a memória no Docker Desktop
- Settings > Resources > Memory

#### **4. Container não inicia**
```bash
# Ver logs detalhados
docker-compose logs api

# Verificar variáveis de ambiente
docker-compose exec api env | grep DATABASE
```

#### **5. Erro de conexão com banco**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Testar conexão
docker-compose exec api npx prisma db push
```

---

## 📱 Fluxo de Trabalho

### **Desenvolvimento**
```bash
# 1. Iniciar ambiente
deploy-docker.bat

# 2. Configurar banco
setup-database.bat

# 3. Monitorar
monitor.bat

# 4. Fazer alterações no código

# 5. Reconstruir
docker-compose up -d --build
```

### **Produção**
```bash
# 1. Configurar .env para produção
# 2. Deploy
deploy-prod.bat

# 3. Monitorar
docker-compose logs -f

# 4. Backup regular
# Configurar backup automático
```

---

## 🔒 Segurança

### **Checklist de Segurança**
- [ ] JWT_SECRET configurado e seguro
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Helmet.js ativo
- [ ] HTTPS em produção
- [ ] Variáveis sensíveis no .env
- [ ] Logs de segurança ativos
- [ ] Backup automático configurado

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs:** `docker-compose logs -f`
2. **Use o monitor:** `monitor.bat`
3. **Consulte a documentação:** README.md
4. **Teste a saúde:** http://localhost:3001/health
5. **Verifique o status:** `docker-compose ps`

---

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. **Configure o domínio** (se necessário)
2. **Configure SSL/HTTPS**
3. **Configure backup automático**
4. **Configure monitoramento**
5. **Configure CI/CD**
6. **Teste todas as funcionalidades**

---

## 💡 Dicas

- **Use os scripts `.bat`** para facilitar o gerenciamento
- **Monitore os logs** regularmente
- **Faça backup** do banco de dados
- **Configure alertas** para problemas
- **Teste em ambiente de desenvolvimento** antes de produção

**Boa sorte com o deploy! 🚀**
