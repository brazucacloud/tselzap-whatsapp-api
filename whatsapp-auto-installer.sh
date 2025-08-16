#!/bin/bash
# ========================================
# install.sh - Instalador Principal Inteligente
# ========================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="WhatsApp Automation Backend"
REQUIRED_NODE_VERSION=18
REQUIRED_POSTGRES_VERSION=14
REQUIRED_REDIS_VERSION=6

# Banner
clear
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║     WhatsApp Automation Backend - Auto Installer        ║"
echo "║                    Version 2.0                          ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Função para verificar comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para detectar OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            DISTRO=$(lsb_release -si 2>/dev/null || echo "Debian")
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
            DISTRO=$(cat /etc/redhat-release | cut -d' ' -f1)
        else
            OS="linux"
            DISTRO="Unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macOS"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        DISTRO="Windows"
    else
        OS="unknown"
        DISTRO="Unknown"
    fi
    
    echo -e "${BLUE}📍 Sistema Detectado: ${WHITE}$DISTRO ($OS)${NC}"
}

# Função para verificar requisitos
check_requirements() {
    echo -e "\n${YELLOW}🔍 Verificando requisitos do sistema...${NC}\n"
    
    local all_ok=true
    
    # Verificar Node.js
    if command_exists node; then
        NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
        if [ "$NODE_VERSION" -ge "$REQUIRED_NODE_VERSION" ]; then
            echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"
        else
            echo -e "${RED}❌ Node.js: Versão $(node -v) (Requer v${REQUIRED_NODE_VERSION}+)${NC}"
            all_ok=false
        fi
    else
        echo -e "${RED}❌ Node.js: Não instalado${NC}"
        all_ok=false
    fi
    
    # Verificar npm
    if command_exists npm; then
        echo -e "${GREEN}✅ npm: $(npm -v)${NC}"
    else
        echo -e "${RED}❌ npm: Não instalado${NC}"
        all_ok=false
    fi
    
    # Verificar Git
    if command_exists git; then
        echo -e "${GREEN}✅ Git: $(git --version | cut -d' ' -f3)${NC}"
    else
        echo -e "${RED}❌ Git: Não instalado${NC}"
        all_ok=false
    fi
    
    # Verificar PostgreSQL
    if command_exists psql; then
        PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1)
        if [ "$PG_VERSION" -ge "$REQUIRED_POSTGRES_VERSION" ]; then
            echo -e "${GREEN}✅ PostgreSQL: $(psql --version | awk '{print $3}')${NC}"
        else
            echo -e "${YELLOW}⚠️  PostgreSQL: Versão antiga detectada${NC}"
        fi
    else
        echo -e "${RED}❌ PostgreSQL: Não instalado${NC}"
        all_ok=false
    fi
    
    # Verificar Redis
    if command_exists redis-cli; then
        echo -e "${GREEN}✅ Redis: $(redis-cli --version | cut -d' ' -f2)${NC}"
    else
        echo -e "${RED}❌ Redis: Não instalado${NC}"
        all_ok=false
    fi
    
    # Verificar Docker (opcional)
    if command_exists docker; then
        echo -e "${GREEN}✅ Docker: $(docker --version | cut -d' ' -f3 | sed 's/,//')${NC}"
    else
        echo -e "${YELLOW}ℹ️  Docker: Não instalado (opcional)${NC}"
    fi
    
    if [ "$all_ok" = false ]; then
        echo -e "\n${RED}❌ Alguns requisitos não foram atendidos${NC}"
        echo -e "${YELLOW}Deseja instalar os componentes faltantes? (s/n)${NC}"
        read -r response
        if [[ "$response" =~ ^[Ss]$ ]]; then
            install_missing_requirements
        else
            echo -e "${RED}Instalação cancelada${NC}"
            exit 1
        fi
    else
        echo -e "\n${GREEN}✅ Todos os requisitos foram atendidos!${NC}"
    fi
}

# Função para instalar requisitos faltantes
install_missing_requirements() {
    echo -e "\n${YELLOW}📦 Instalando componentes faltantes...${NC}\n"
    
    case "$OS" in
        debian)
            install_debian_requirements
            ;;
        redhat)
            install_redhat_requirements
            ;;
        macos)
            install_macos_requirements
            ;;
        windows)
            install_windows_requirements
            ;;
        *)
            echo -e "${RED}Sistema operacional não suportado para instalação automática${NC}"
            exit 1
            ;;
    esac
}

# Instalação para Debian/Ubuntu
install_debian_requirements() {
    echo -e "${YELLOW}Atualizando sistema...${NC}"
    sudo apt update && sudo apt upgrade -y
    
    # Node.js
    if ! command_exists node || [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        echo -e "${YELLOW}Instalando Node.js ${REQUIRED_NODE_VERSION}...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_${REQUIRED_NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Git
    if ! command_exists git; then
        echo -e "${YELLOW}Instalando Git...${NC}"
        sudo apt install -y git
    fi
    
    # PostgreSQL
    if ! command_exists psql; then
        echo -e "${YELLOW}Instalando PostgreSQL...${NC}"
        sudo apt install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    # Redis
    if ! command_exists redis-cli; then
        echo -e "${YELLOW}Instalando Redis...${NC}"
        sudo apt install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    fi
    
    # Build tools
    sudo apt install -y build-essential
}

# Instalação para RedHat/CentOS/Fedora
install_redhat_requirements() {
    echo -e "${YELLOW}Atualizando sistema...${NC}"
    sudo yum update -y
    
    # Node.js
    if ! command_exists node || [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        echo -e "${YELLOW}Instalando Node.js ${REQUIRED_NODE_VERSION}...${NC}"
        curl -fsSL https://rpm.nodesource.com/setup_${REQUIRED_NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    # Git
    if ! command_exists git; then
        echo -e "${YELLOW}Instalando Git...${NC}"
        sudo yum install -y git
    fi
    
    # PostgreSQL
    if ! command_exists psql; then
        echo -e "${YELLOW}Instalando PostgreSQL...${NC}"
        sudo yum install -y postgresql-server postgresql-contrib
        sudo postgresql-setup initdb
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    # Redis
    if ! command_exists redis-cli; then
        echo -e "${YELLOW}Instalando Redis...${NC}"
        sudo yum install -y redis
        sudo systemctl start redis
        sudo systemctl enable redis
    fi
}

# Instalação para macOS
install_macos_requirements() {
    # Verificar Homebrew
    if ! command_exists brew; then
        echo -e "${YELLOW}Instalando Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Node.js
    if ! command_exists node || [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        echo -e "${YELLOW}Instalando Node.js ${REQUIRED_NODE_VERSION}...${NC}"
        brew install node@${REQUIRED_NODE_VERSION}
    fi
    
    # Git
    if ! command_exists git; then
        echo -e "${YELLOW}Instalando Git...${NC}"
        brew install git
    fi
    
    # PostgreSQL
    if ! command_exists psql; then
        echo -e "${YELLOW}Instalando PostgreSQL...${NC}"
        brew install postgresql@${REQUIRED_POSTGRES_VERSION}
        brew services start postgresql@${REQUIRED_POSTGRES_VERSION}
    fi
    
    # Redis
    if ! command_exists redis-cli; then
        echo -e "${YELLOW}Instalando Redis...${NC}"
        brew install redis
        brew services start redis
    fi
}

# Instalação para Windows
install_windows_requirements() {
    echo -e "${YELLOW}No Windows, recomendamos usar o WSL2 ou Docker Desktop${NC}"
    echo -e "${CYAN}1. Instale o WSL2: wsl --install${NC}"
    echo -e "${CYAN}2. Após reiniciar, execute este script novamente no WSL${NC}"
    echo -e "${CYAN}Ou baixe Docker Desktop: https://www.docker.com/products/docker-desktop/${NC}"
    exit 0
}

# Configurar banco de dados
setup_database() {
    echo -e "\n${YELLOW}🗄️  Configurando banco de dados...${NC}\n"
    
    # Gerar senha aleatória
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    DB_NAME="whatsapp_automation"
    DB_USER="whatsapp_user"
    
    echo -e "${CYAN}Configurações do banco de dados:${NC}"
    echo -e "  Nome do banco: ${WHITE}$DB_NAME${NC}"
    echo -e "  Usuário: ${WHITE}$DB_USER${NC}"
    echo -e "  Senha: ${WHITE}$DB_PASSWORD${NC}"
    echo
    
    # Criar usuário e banco
    echo -e "${YELLOW}Criando banco de dados...${NC}"
    
    if [[ "$OS" == "macos" ]]; then
        psql postgres << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
    else
        sudo -u postgres psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Banco de dados criado com sucesso!${NC}"
        
        # Salvar credenciais
        echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME\"" > .db_credentials
        echo -e "${YELLOW}Credenciais salvas em .db_credentials${NC}"
    else
        echo -e "${YELLOW}⚠️  Banco pode já existir ou houve um erro${NC}"
    fi
}

# Configurar Redis
setup_redis() {
    echo -e "\n${YELLOW}🔴 Configurando Redis...${NC}\n"
    
    # Gerar senha para Redis
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    echo -e "${CYAN}Senha Redis: ${WHITE}$REDIS_PASSWORD${NC}"
    
    # Configurar senha no Redis (opcional)
    if [[ "$OS" == "debian" ]]; then
        sudo sed -i "s/# requirepass foobared/requirepass $REDIS_PASSWORD/" /etc/redis/redis.conf
        sudo systemctl restart redis-server
    fi
    
    # Salvar credenciais
    echo "REDIS_PASSWORD=\"$REDIS_PASSWORD\"" >> .db_credentials
    
    echo -e "${GREEN}✅ Redis configurado!${NC}"
}

# Clonar e configurar projeto
setup_project() {
    echo -e "\n${YELLOW}📂 Configurando projeto...${NC}\n"
    
    # Verificar se já existe
    if [ -d "whatsapp-automation-backend" ]; then
        echo -e "${YELLOW}Diretório do projeto já existe.${NC}"
        echo -e "Deseja sobrescrever? (s/n)"
        read -r response
        if [[ "$response" =~ ^[Ss]$ ]]; then
            rm -rf whatsapp-automation-backend
        else
            cd whatsapp-automation-backend
        fi
    fi
    
    # Clonar repositório (use seu repositório real)
    if [ ! -d "whatsapp-automation-backend" ]; then
        echo -e "${YELLOW}Clonando repositório...${NC}"
        git clone https://github.com/seu-usuario/whatsapp-automation-backend.git 2>/dev/null || {
            echo -e "${YELLOW}Criando estrutura do projeto...${NC}"
            mkdir -p whatsapp-automation-backend
            cd whatsapp-automation-backend
            
            # Criar estrutura básica
            mkdir -p src/{controllers,services,routes,middlewares,models,utils,config,queues,websocket}
            mkdir -p tests prisma scripts logs uploads
            
            # Criar package.json básico
            cat > package.json << 'PACKAGE'
{
  "name": "whatsapp-automation-backend",
  "version": "2.0.0",
  "description": "WhatsApp Automation Backend System",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "redis": "^4.6.11",
    "bull": "^4.11.5",
    "socket.io": "^4.6.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.4",
    "@types/express": "^4.17.21",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
PACKAGE
        }
    else
        cd whatsapp-automation-backend
    fi
    
    # Configurar arquivo .env
    echo -e "${YELLOW}Configurando variáveis de ambiente...${NC}"
    
    if [ -f "../.db_credentials" ]; then
        source ../.db_credentials
    fi
    
    # Gerar chaves JWT
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Criar arquivo .env
    cat > .env << ENV
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL="$DATABASE_URL"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD="$REDIS_PASSWORD"

# JWT Secrets
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"

# Encryption
ENCRYPTION_KEY="$ENCRYPTION_KEY"

# Email Service (Configure com suas credenciais)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp API
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
LOG_DIR=./logs
ENV
    
    echo -e "${GREEN}✅ Arquivo .env criado!${NC}"
    
    # Instalar dependências
    echo -e "${YELLOW}Instalando dependências do projeto...${NC}"
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependências instaladas!${NC}"
    else
        echo -e "${RED}❌ Erro ao instalar dependências${NC}"
        exit 1
    fi
    
    # Configurar Prisma
    echo -e "${YELLOW}Configurando Prisma...${NC}"
    
    # Criar schema.prisma se não existir
    if [ ! -f "prisma/schema.prisma" ]; then
        mkdir -p prisma
        cat > prisma/schema.prisma << 'PRISMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  fullName  String
  role      String   @default("USER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
PRISMA
    fi
    
    # Executar migrations
    npx prisma generate
    npx prisma migrate dev --name init
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Banco de dados migrado!${NC}"
    else
        echo -e "${YELLOW}⚠️  Erro nas migrations (pode ser normal se já existem)${NC}"
    fi
}

# Iniciar aplicação
start_application() {
    echo -e "\n${YELLOW}🚀 Iniciando aplicação...${NC}\n"
    
    # Verificar se PM2 está instalado
    if ! command_exists pm2; then
        echo -e "${YELLOW}Instalando PM2...${NC}"
        npm install -g pm2
    fi
    
    # Criar ecosystem.config.js se não existir
    if [ ! -f "ecosystem.config.js" ]; then
        cat > ecosystem.config.js << 'PM2'
module.exports = {
  apps: [{
    name: 'whatsapp-api',
    script: './dist/app.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
PM2
    fi
    
    echo -e "${CYAN}Como deseja iniciar a aplicação?${NC}"
    echo "1) Modo desenvolvimento (npm run dev)"
    echo "2) Modo produção com PM2"
    echo "3) Docker Compose"
    echo "4) Não iniciar agora"
    
    read -p "Escolha [1-4]: " choice
    
    case $choice in
        1)
            echo -e "${GREEN}Iniciando em modo desenvolvimento...${NC}"
            npm run dev
            ;;
        2)
            echo -e "${GREEN}Construindo e iniciando com PM2...${NC}"
            npm run build
            pm2 start ecosystem.config.js
            pm2 save
            pm2 logs
            ;;
        3)
            echo -e "${GREEN}Iniciando com Docker Compose...${NC}"
            docker-compose up -d
            docker-compose logs -f
            ;;
        4)
            echo -e "${YELLOW}Aplicação não iniciada${NC}"
            ;;
        *)
            echo -e "${RED}Opção inválida${NC}"
            ;;
    esac
}

# Função principal
main() {
    echo -e "${CYAN}Bem-vindo ao instalador do $PROJECT_NAME${NC}\n"
    
    # Detectar sistema operacional
    detect_os
    
    # Menu principal
    echo -e "\n${CYAN}Escolha o tipo de instalação:${NC}"
    echo "1) Instalação completa (recomendado)"
    echo "2) Apenas verificar requisitos"
    echo "3) Apenas configurar banco de dados"
    echo "4) Apenas configurar projeto"
    echo "5) Instalação com Docker"
    echo "6) Sair"
    
    read -p "Escolha [1-6]: " choice
    
    case $choice in
        1)
            check_requirements
            setup_database
            setup_redis
            setup_project
            start_application
            ;;
        2)
            check_requirements
            ;;
        3)
            setup_database
            setup_redis
            ;;
        4)
            setup_project
            ;;
        5)
            install_docker
            ;;
        6)
            echo -e "${YELLOW}Instalação cancelada${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Opção inválida${NC}"
            exit 1
            ;;
    esac
    
    # Resumo final
    echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Instalação concluída com sucesso!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}\n"
    
    echo -e "${CYAN}📋 Informações importantes:${NC}"
    echo -e "  URL da API: ${WHITE}http://localhost:3000${NC}"
    echo -e "  Documentação: ${WHITE}http://localhost:3000/api-docs${NC}"
    echo -e "  Credenciais do banco: ${WHITE}Veja .db_credentials${NC}"
    echo -e "  Arquivo de configuração: ${WHITE}.env${NC}"
    
    echo -e "\n${CYAN}📱 Para configurar o MobZap:${NC}"
    echo -e "  1. Crie um usuário via API"
    echo -e "  2. Copie o API Key gerado"
    echo -e "  3. Configure no app Android"
    
    echo -e "\n${YELLOW}🎯 Próximos passos:${NC}"
    echo -e "  - Configure o SMTP no arquivo .env"
    echo -e "  - Crie seu primeiro usuário"
    echo -e "  - Configure webhooks se necessário"
    echo -e "  - Monitore os logs em ./logs"
    
    echo -e "\n${GREEN}Obrigado por usar o $PROJECT_NAME!${NC}"
}

# Instalação com Docker
install_docker() {
    echo -e "\n${YELLOW}🐳 Instalação com Docker${NC}\n"
    
    if ! command_exists docker; then
        echo -e "${RED}Docker não está instalado${NC}"
        echo -e "${YELLOW}Instale o Docker primeiro: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
    
    # Criar docker-compose.yml
    cat > docker-compose.yml << 'DOCKER'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: whatsapp_postgres
    environment:
      POSTGRES_USER: whatsapp_user
      POSTGRES_PASSWORD: whatsapp_pass
      POSTGRES_DB: whatsapp_automation
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U whatsapp_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: whatsapp_redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: whatsapp_app
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://whatsapp_user:whatsapp_pass@postgres:5432/whatsapp_automation
      REDIS_HOST: redis
      REDIS_PORT: 6379
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
DOCKER
    
    # Criar Dockerfile
    cat > Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
DOCKERFILE
    
    echo -e "${GREEN}Iniciando containers...${NC}"
    docker-compose up -d
    
    echo -e "${GREEN}✅ Aplicação rodando com Docker!${NC}"
    echo -e "${CYAN}Ver logs: docker-compose logs -f${NC}"
}

# Executar função principal
main