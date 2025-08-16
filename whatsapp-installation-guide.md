# 🚀 Guia Completo de Instalação - WhatsApp Automation Backend

## 📋 Pré-requisitos do Sistema

### Requisitos Mínimos
- **Sistema Operacional**: Ubuntu 20.04+ / Windows 10+ / macOS 10.15+
- **RAM**: 4GB (8GB recomendado)
- **Armazenamento**: 20GB livres
- **CPU**: 2 cores (4 cores recomendado)

### Software Necessário
- Node.js 18.x ou superior
- PostgreSQL 14+
- Redis 6+
- Git
- Docker e Docker Compose (opcional, mas recomendado)

---

## 🎯 Método 1: Instalação com Docker (RECOMENDADO - Mais Fácil)

### Passo 1: Instalar Docker e Docker Compose

#### **Ubuntu/Debian:**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose -y

# Verificar instalação
docker --version
docker-compose --version
```

#### **Windows:**
1. Baixe [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Execute o instalador
3. Reinicie o computador
4. Abra Docker Desktop

#### **macOS:**
```bash
# Usando Homebrew
brew install --cask docker

# Ou baixe Docker Desktop para Mac
# https://www.docker.com/products/docker-desktop/
```

### Passo 2: Clonar o Repositório
```bash
# Criar diretório do projeto
mkdir -p ~/projects
cd ~/projects

# Clonar repositório (substitua pela URL real)
git clone https://github.com/seu-usuario/whatsapp-automation-backend.git
cd whatsapp-automation-backend
```

### Passo 3: Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

**Configurações essenciais no .env:**
```env
# IMPORTANTE: Altere estas configurações!

# Database
DATABASE_URL="postgresql://whatsapp_user:SenhaForte123!@postgres:5432/whatsapp_automation"

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=RedisPassword123!

# JWT (Gere chaves únicas!)
JWT_SECRET=gere_uma_chave_com_64_caracteres_aleatorios_aqui
JWT_REFRESH_SECRET=outra_chave_diferente_com_64_caracteres_aqui

# Encryption (32 caracteres exatos)
ENCRYPTION_KEY=12345678901234567890123456789012

# Email (Use suas credenciais)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app

# Application
NODE_ENV=production
PORT=3000
APP_URL=http://localhost:3000
```

### Passo 4: Criar Script de Instalação Automatizado
```bash
# Criar arquivo de instalação
cat > install-docker.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando instalação com Docker..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado${NC}"
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado${NC}"
    exit 1
fi

# Criar rede Docker
echo -e "${YELLOW}📦 Criando rede Docker...${NC}"
docker network create whatsapp-network 2>/dev/null || true

# Criar volumes
echo -e "${YELLOW}📂 Criando volumes...${NC}"
docker volume create whatsapp_postgres_data
docker volume create whatsapp_redis_data

# Build das imagens
echo -e "${YELLOW}🔨 Construindo imagens...${NC}"
docker-compose build

# Iniciar serviços
echo -e "${YELLOW}🚀 Iniciando serviços...${NC}"
docker-compose up -d

# Aguardar banco de dados
echo -e "${YELLOW}⏳ Aguardando banco de dados...${NC}"
sleep 10

# Executar migrations
echo -e "${YELLOW}🗄️ Executando migrations...${NC}"
docker-compose exec -T app npx prisma migrate deploy

# Gerar Prisma Client
echo -e "${YELLOW}⚙️ Gerando Prisma Client...${NC}"
docker-compose exec -T app npx prisma generate

# Verificar status
echo -e "${YELLOW}✅ Verificando status dos serviços...${NC}"
docker-compose ps

echo -e "${GREEN}✅ Instalação concluída com sucesso!${NC}"
echo -e "${GREEN}📚 Acesse a documentação em: http://localhost:3000/api-docs${NC}"
echo -e "${GREEN}🔑 Não esqueça de configurar o arquivo .env${NC}"
EOF

# Tornar executável
chmod +x install-docker.sh
```

### Passo 5: Executar Instalação
```bash
# Executar script de instalação
./install-docker.sh

# Verificar logs
docker-compose logs -f
```

---

## 🛠️ Método 2: Instalação Manual (Controle Total)

### Passo 1: Instalar Node.js 18

#### **Ubuntu/Debian:**
```bash
# Usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versão
node --version  # Deve mostrar v18.x.x
npm --version
```

#### **Windows:**
1. Baixe o instalador em [nodejs.org](https://nodejs.org/)
2. Execute o instalador MSI
3. Marque a opção "Add to PATH"
4. Reinicie o terminal

#### **macOS:**
```bash
# Usando Homebrew
brew install node@18

# Ou usando NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Passo 2: Instalar PostgreSQL

#### **Ubuntu/Debian:**
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql << EOF
CREATE USER whatsapp_user WITH PASSWORD 'SenhaForte123!';
CREATE DATABASE whatsapp_automation OWNER whatsapp_user;
GRANT ALL PRIVILEGES ON DATABASE whatsapp_automation TO whatsapp_user;
\q
EOF

# Testar conexão
psql -h localhost -U whatsapp_user -d whatsapp_automation
```

#### **Windows:**
1. Baixe o instalador em [postgresql.org](https://www.postgresql.org/download/windows/)
2. Execute o instalador
3. Defina senha para usuário postgres
4. Use pgAdmin para criar banco e usuário

#### **macOS:**
```bash
# Usando Homebrew
brew install postgresql@14
brew services start postgresql@14

# Criar banco
createdb whatsapp_automation
```

### Passo 3: Instalar Redis

#### **Ubuntu/Debian:**
```bash
# Instalar Redis
sudo apt update
sudo apt install redis-server -y

# Configurar senha (opcional)
sudo nano /etc/redis/redis.conf
# Descomente e altere: requirepass SuaSenhaRedis123

# Reiniciar Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Testar
redis-cli ping
```

#### **Windows:**
```bash
# Baixar Redis para Windows
# https://github.com/microsoftarchive/redis/releases

# Ou usar WSL2
wsl --install
# Depois siga as instruções do Ubuntu
```

#### **macOS:**
```bash
# Usando Homebrew
brew install redis
brew services start redis

# Testar
redis-cli ping
```

### Passo 4: Instalar Dependências do Projeto
```bash
# Entrar no diretório do projeto
cd whatsapp-automation-backend

# Instalar dependências
npm install

# Se houver erros, tente:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Passo 5: Configurar Banco de Dados
```bash
# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate dev --name init

# Se houver erro de conexão, verifique DATABASE_URL no .env
# Formato: postgresql://usuario:senha@localhost:5432/nome_banco
```

### Passo 6: Criar Script de Verificação
```bash
# Criar arquivo check-system.js
cat > check-system.js << 'EOF'
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Verificando sistema...\n');

// Verificar Node.js
try {
  const nodeVersion = execSync('node --version').toString().trim();
  console.log('✅ Node.js:', nodeVersion);
  
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  if (major < 18) {
    console.log('⚠️  Versão do Node.js deve ser 18 ou superior');
  }
} catch (e) {
  console.log('❌ Node.js não encontrado');
}

// Verificar PostgreSQL
try {
  const pgVersion = execSync('psql --version').toString().trim();
  console.log('✅ PostgreSQL:', pgVersion);
} catch (e) {
  console.log('❌ PostgreSQL não encontrado ou não está no PATH');
}

// Verificar Redis
try {
  const redisVersion = execSync('redis-cli --version').toString().trim();
  console.log('✅ Redis:', redisVersion);
} catch (e) {
  console.log('❌ Redis não encontrado');
}

// Verificar arquivo .env
if (fs.existsSync('.env')) {
  console.log('✅ Arquivo .env encontrado');
} else {
  console.log('❌ Arquivo .env não encontrado');
  console.log('   Execute: cp .env.example .env');
}

// Verificar node_modules
if (fs.existsSync('node_modules')) {
  console.log('✅ Dependências instaladas');
} else {
  console.log('❌ Dependências não instaladas');
  console.log('   Execute: npm install');
}

console.log('\n📋 Verificação concluída!');
EOF

# Executar verificação
node check-system.js
```

### Passo 7: Iniciar Aplicação
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm run build
npm start

# Usando PM2 (recomendado para produção)
npm install -g pm2
pm2 start ecosystem.config.js
```

---

## 🐛 Troubleshooting - Soluções para Erros Comuns

### Erro: "Cannot connect to PostgreSQL"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -h localhost -U whatsapp_user -d whatsapp_automation

# Verificar pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Altere "peer" para "md5" para conexões locais

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Erro: "Redis connection refused"
```bash
# Verificar se Redis está rodando
sudo systemctl status redis-server

# Testar conexão
redis-cli ping

# Se usar senha
redis-cli -a SuaSenhaRedis123 ping

# Verificar configuração
sudo nano /etc/redis/redis.conf
# bind 127.0.0.1 ::1
# protected-mode yes
```

### Erro: "Prisma migration failed"
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Resetar banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset --force

# Criar migrations do zero
npx prisma migrate dev --name init

# Se o banco já existe
npx prisma db pull
npx prisma generate
```

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Ou mudar porta no .env
PORT=3001
```

### Erro: "npm install failing"
```bash
# Limpar cache
npm cache clean --force

# Remover node_modules e package-lock
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Se persistir, usar yarn
npm install -g yarn
yarn install
```

---

## ✅ Verificação Final

### 1. Testar Health Check
```bash
curl http://localhost:3000/health
# Deve retornar: {"status":"OK","timestamp":"...","uptime":...}
```

### 2. Acessar Documentação
Abra no navegador: http://localhost:3000/api-docs

### 3. Criar Primeiro Usuário
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "Admin@123456",
    "fullName": "Administrator"
  }'
```

### 4. Verificar Logs
```bash
# Com Docker
docker-compose logs -f app

# Sem Docker
tail -f logs/application-*.log
```

---

## 🚀 Scripts de Automação

### Script de Instalação Completa (Ubuntu/Debian)
```bash
#!/bin/bash
# save as: full-install.sh

set -e

echo "🚀 Instalação Completa - WhatsApp Backend"
echo "========================================="

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências do sistema
sudo apt install -y curl git build-essential

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Instalar Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Criar banco de dados
sudo -u postgres psql << EOF
CREATE USER whatsapp_user WITH PASSWORD 'ChangeMe123!';
CREATE DATABASE whatsapp_automation OWNER whatsapp_user;
GRANT ALL PRIVILEGES ON DATABASE whatsapp_automation TO whatsapp_user;
EOF

# Clonar e configurar projeto
git clone https://github.com/seu-usuario/whatsapp-backend.git
cd whatsapp-backend
cp .env.example .env

# Instalar dependências
npm install

# Configurar Prisma
npx prisma generate
npx prisma migrate deploy

# Instalar PM2
sudo npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Instalação concluída!"
echo "📚 Acesse: http://localhost:3000/api-docs"
```

### Script de Backup
```bash
#!/bin/bash
# save as: backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup banco de dados
pg_dump -U whatsapp_user -h localhost whatsapp_automation > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Backup arquivos .env
cp .env "$BACKUP_DIR/env_$TIMESTAMP"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" uploads/

echo "✅ Backup criado: $BACKUP_DIR/*_$TIMESTAMP.*"
```

---

## 📱 Configuração para MobZap

### 1. Obter API Key
```bash
# Fazer login e copiar apiKey da resposta
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@example.com",
    "password": "SuaSenha123!"
  }'
```

### 2. Configurar no App Android
1. Abra o MobZap
2. Vá em Configurações → API
3. Configure:
   - URL: `http://seu-ip:3000/api/v1`
   - API Key: `wak_xxx_yyy`
   - User ID: `uuid-do-usuario`

### 3. Testar Conexão
```bash
curl -X POST http://localhost:3000/api/v1/tasks/fetch \
  -H "X-API-Key: sua-api-key" \
  -H "X-User-ID: seu-user-id" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_normal": "+5511999999999"
  }'
```

---

## 🎯 Checklist de Instalação

- [ ] Sistema operacional compatível
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 14+ instalado e configurado
- [ ] Redis 6+ instalado e rodando
- [ ] Projeto clonado do repositório
- [ ] Arquivo .env configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco de dados criado
- [ ] Migrations executadas
- [ ] Aplicação rodando
- [ ] Health check respondendo
- [ ] Documentação acessível
- [ ] Primeiro usuário criado
- [ ] PM2 configurado (produção)

---

## 📞 Suporte

### Logs para Diagnóstico
```bash
# Coletar logs para suporte
./collect-logs.sh

# Arquivo será criado: support-logs-TIMESTAMP.tar.gz
```

### Informações do Sistema
```bash
# Gerar relatório do sistema
npx envinfo --system --binaries --npmPackages --duplicates
```

### Reset Completo (Desenvolvimento)
```bash
# CUIDADO: Remove todos os dados!
npm run reset:all
```

---

## 🎉 Sucesso!

Se você chegou até aqui, seu sistema está instalado e funcionando! 

**Próximos passos:**
1. Configurar dispositivos WhatsApp
2. Criar tarefas de automação
3. Configurar webhooks
4. Monitorar dashboard

**Links úteis:**
- 📚 Documentação API: http://localhost:3000/api-docs
- 📊 Dashboard: http://localhost:3000/dashboard
- 🔧 Configurações: http://localhost:3000/settings