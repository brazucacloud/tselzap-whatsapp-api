# 🚀 Guia Completo de Deploy - TselZap WhatsApp API

## 📋 Pré-requisitos

Antes de fazer o deploy, você precisa instalar:

### **1. Node.js e npm**
- Baixe e instale o [Node.js](https://nodejs.org/) (versão 18 ou superior)
- O npm vem junto com o Node.js

### **2. PostgreSQL**
- [PostgreSQL](https://www.postgresql.org/download/) (versão 14 ou superior)
- Ou use um serviço cloud como:
  - [Supabase](https://supabase.com/) (gratuito)
  - [Railway](https://railway.app/) (gratuito)
  - [Neon](https://neon.tech/) (gratuito)

### **3. Redis**
- [Redis](https://redis.io/download) (versão 6 ou superior)
- Ou use um serviço cloud como:
  - [Redis Cloud](https://redis.com/try-free/) (gratuito)
  - [Upstash](https://upstash.com/) (gratuito)

### **4. Docker (Opcional)**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) para Windows
- Facilita muito o deploy

---

## 🎯 Opções de Deploy

### **Opção 1: Deploy Local (Recomendado para Desenvolvimento)**

#### **Passo 1: Configurar Variáveis de Ambiente**
```bash
# Copie o arquivo de exemplo
copy env.example .env

# Edite o arquivo .env com suas configurações
notepad .env
```

#### **Passo 2: Configurar Banco de Dados**
```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# (Opcional) Popular com dados de teste
npx prisma db seed
```

#### **Passo 3: Iniciar Backend**
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm run build
npm start
```

#### **Passo 4: Iniciar Frontend**
```bash
# Em outro terminal
cd frontend
npm install
npm start
```

#### **Passo 5: Iniciar Worker (Opcional)**
```bash
# Em outro terminal
npm run queue:worker
```

---

### **Opção 2: Deploy com Docker (Recomendado para Produção)**

#### **Pré-requisitos:**
- Docker Desktop instalado
- Docker Compose

#### **Passo 1: Configurar Ambiente**
```bash
# Copiar arquivo de exemplo
copy env.example .env

# Editar configurações
notepad .env
```

#### **Passo 2: Deploy Completo**
```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

#### **Passo 3: Executar Migrações**
```bash
# Executar migrações no container
docker-compose exec api npx prisma migrate deploy
```

---

### **Opção 3: Deploy em Cloud (Produção)**

#### **A. Railway (Recomendado - Gratuito)**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Deploy
railway up
```

#### **B. Render**
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático

#### **C. Heroku**
```bash
# Instalar Heroku CLI
# Login
heroku login

# Criar app
heroku create tselzap-api

# Adicionar add-ons
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# Deploy
git push heroku main
```

#### **D. DigitalOcean App Platform**
1. Conecte o repositório
2. Configure as variáveis
3. Deploy automático

---

### **Opção 4: Deploy com PM2 (Produção Local)**

#### **Passo 1: Instalar PM2**
```bash
npm install -g pm2
```

#### **Passo 2: Configurar**
```bash
# O arquivo ecosystem.config.js já está configurado
# Apenas ajuste as variáveis de ambiente se necessário
```

#### **Passo 3: Deploy**
```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Monitorar
pm2 monit

# Ver logs
pm2 logs

# Reiniciar
pm2 restart all
```

---

## 🔧 Configuração de Variáveis de Ambiente

### **Arquivo .env**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tselzap"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="seu-jwt-secret-super-seguro"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=production

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

Após o deploy, você terá acesso a:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api-docs
- **Health Check:** http://localhost:3001/health

---

## 📊 Monitoramento

### **Comandos Úteis**
```bash
# Verificar status dos serviços
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f api

# Verificar saúde da aplicação
curl http://localhost:3001/health

# Verificar banco de dados
npx prisma studio

# Backup do banco
pg_dump -h localhost -U user -d tselzap > backup.sql
```

---

## 🔒 Segurança

### **Checklist de Segurança**
- [ ] JWT_SECRET configurado e seguro
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Helmet.js ativo
- [ ] HTTPS em produção
- [ ] Variáveis sensíveis em .env
- [ ] Logs de segurança ativos

---

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. Erro de Conexão com Banco**
```bash
# Verificar se PostgreSQL está rodando
# Verificar DATABASE_URL no .env
# Testar conexão
npx prisma db push
```

#### **2. Erro de Redis**
```bash
# Verificar se Redis está rodando
# Verificar REDIS_URL no .env
redis-cli ping
```

#### **3. Erro de Porta em Uso**
```bash
# Verificar portas em uso
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Matar processo se necessário
taskkill /PID <PID> /F
```

#### **4. Erro de Dependências**
```bash
# Limpar cache
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs:** `docker-compose logs -f`
2. **Consulte a documentação:** README.md
3. **Verifique as issues:** GitHub Issues
4. **Teste a saúde:** http://localhost:3001/health

---

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. **Configure o domínio** (se necessário)
2. **Configure SSL/HTTPS**
3. **Configure backup automático**
4. **Configure monitoramento**
5. **Configure CI/CD**
6. **Teste todas as funcionalidades**

**Boa sorte com o deploy! 🚀**
