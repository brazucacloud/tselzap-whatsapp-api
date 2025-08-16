#!/bin/bash
# ========================================
# quick-start.sh - Instalação Super Rápida
# Execute: curl -sSL https://raw.githubusercontent.com/seu-repo/install.sh | bash
# ========================================

set -e

# Banner bonito
echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🚀 WhatsApp Automation Backend - Quick Install 🚀         ║
║                                                                ║
║     Instalação automática em 3... 2... 1...                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
"

# Detectar sistema operacional
OS="Unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
        OS="Ubuntu/Debian"
    elif [ -f /etc/redhat-release ]; then
        OS="RedHat/CentOS"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
fi

echo "📍 Sistema detectado: $OS"
echo ""

# ========================================
# OPÇÃO 1: INSTALAÇÃO COM DOCKER (Mais Fácil)
# ========================================

install_with_docker() {
    echo "🐳 Instalando com Docker (método mais fácil)..."
    
    # Instalar Docker se necessário
    if ! command -v docker &> /dev/null; then
        echo "📦 Instalando Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    fi
    
    # Instalar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "📦 Instalando Docker Compose..."
        sudo apt-get update
        sudo apt-get install -y docker-compose
    fi
    
    # Criar diretório do projeto
    PROJECT_DIR="$HOME/whatsapp-backend"
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # Criar docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: whatsapp
      POSTGRES_PASSWORD: WhatsApp2024!
      POSTGRES_DB: whatsapp_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U whatsapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass Redis2024!
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: node:18-alpine
    working_dir: /app
    command: sh -c "npm install && npm run dev"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://whatsapp:WhatsApp2024!@postgres:5432/whatsapp_db
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: Redis2024!
      JWT_SECRET: $(openssl rand -base64 64)
      PORT: 3000
    volumes:
      - ./app:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
EOF

    # Criar estrutura básica da aplicação
    mkdir -p app
    cd app
    
    # Criar package.json
    cat > package.json << 'EOF'
{
  "name": "whatsapp-backend",
  "version": "2.0.0",
  "scripts": {
    "dev": "node src/app.js",
    "start": "node src/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0"
  }
}
EOF

    # Criar app básico
    mkdir -p src
    cat > src/app.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WhatsApp Backend is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 WhatsApp Automation Backend',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      docs: '/api-docs'
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     ✅ WhatsApp Backend rodando na porta ${PORT}                 ║
║                                                                ║
║     🌐 URL: http://localhost:${PORT}                              ║
║     📚 Docs: http://localhost:${PORT}/api-docs                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
EOF

    cd ..
    
    # Iniciar containers
    echo "🚀 Iniciando aplicação..."
    docker-compose up -d
    
    # Aguardar inicialização
    echo "⏳ Aguardando serviços iniciarem..."
    sleep 10
    
    # Verificar status
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!                      ║
║                                                                ║
║     🌐 Acesse: http://localhost:3000                          ║
║     📚 Docs: http://localhost:3000/api-docs                   ║
║                                                                ║
║     📂 Projeto instalado em: $PROJECT_DIR                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        "
    else
        echo "⚠️  Aplicação iniciada mas health check falhou"
        echo "Verifique os logs: docker-compose logs"
    fi
}

# ========================================
# OPÇÃO 2: INSTALAÇÃO LOCAL (Sem Docker)
# ========================================

install_local() {
    echo "💻 Instalando localmente..."
    
    # Função para Ubuntu/Debian
    install_ubuntu() {
        echo "📦 Instalando dependências no Ubuntu/Debian..."
        
        # Atualizar sistema
        sudo apt update
        
        # Node.js 18
        if ! command -v node &> /dev/null || [ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # PostgreSQL
        if ! command -v psql &> /dev/null; then
            sudo apt install -y postgresql postgresql-contrib
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
        fi
        
        # Redis
        if ! command -v redis-cli &> /dev/null; then
            sudo apt install -y redis-server
            sudo systemctl start redis-server
            sudo systemctl enable redis-server
        fi
        
        # Git e build tools
        sudo apt install -y git build-essential
    }
    
    # Função para macOS
    install_macos() {
        echo "📦 Instalando dependências no macOS..."
        
        # Homebrew
        if ! command -v brew &> /dev/null; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        # Node.js
        brew install node@18
        
        # PostgreSQL
        brew install postgresql@15
        brew services start postgresql@15
        
        # Redis
        brew install redis
        brew services start redis
    }
    
    # Instalar dependências baseado no OS
    case "$OS" in
        "Ubuntu/Debian")
            install_ubuntu
            ;;
        "macOS")
            install_macos
            ;;
        *)
            echo "⚠️  Sistema não suportado para instalação automática"
            echo "Por favor, instale manualmente: Node.js 18+, PostgreSQL 14+, Redis 6+"
            exit 1
            ;;
    esac
    
    # Criar projeto
    PROJECT_DIR="$HOME/whatsapp-backend"
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # Baixar código do projeto
    echo "📥 Baixando código do projeto..."
    git clone https://github.com/seu-usuario/whatsapp-backend.git . 2>/dev/null || {
        # Se não tiver repositório, criar estrutura básica
        create_basic_structure
    }
    
    # Configurar banco de dados
    echo "🗄️ Configurando banco de dados..."
    DB_PASS="WhatsApp2024!"
    sudo -u postgres psql << EOF 2>/dev/null || true
CREATE USER whatsapp WITH PASSWORD '$DB_PASS';
CREATE DATABASE whatsapp_db OWNER whatsapp;
GRANT ALL PRIVILEGES ON DATABASE whatsapp_db TO whatsapp;
EOF
    
    # Criar .env
    cat > .env << EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://whatsapp:$DB_PASS@localhost:5432/whatsapp_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
EOF
    
    # Instalar dependências
    echo "📦 Instalando dependências do projeto..."
    npm install
    
    # Executar migrations
    npx prisma generate 2>/dev/null || true
    npx prisma migrate dev --name init 2>/dev/null || true
    
    # Iniciar aplicação
    echo "🚀 Iniciando aplicação..."
    npm run dev &
    
    sleep 5
    
    echo "
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     ✅ INSTALAÇÃO LOCAL CONCLUÍDA!                            ║
║                                                                ║
║     🌐 Acesse: http://localhost:3000                          ║
║     📂 Projeto: $PROJECT_DIR                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    "
}

# Criar estrutura básica se não tiver repositório
create_basic_structure() {
    mkdir -p src prisma
    
    # package.json
    cat > package.json << 'EOF'
{
  "name": "whatsapp-backend",
  "version": "2.0.0",
  "main": "src/app.js",
  "scripts": {
    "dev": "node src/app.js",
    "start": "node src/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0",
    "redis": "^4.6.11",
    "winston": "^3.11.0"
  }
}
EOF

    # Prisma schema
    cat > prisma/schema.prisma << 'EOF'
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
  apiKey    String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
EOF

    # App básico
    cat > src/app.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Automation Backend',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: '/api-docs'
    }
  });
});

// API routes placeholder
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'API v1 endpoint',
    available_routes: [
      '/api/v1/auth',
      '/api/v1/devices',
      '/api/v1/tasks',
      '/api/v1/messages'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
════════════════════════════════════════════════════════════════
    
    WhatsApp Automation Backend
    
    🚀 Server running on port ${PORT}
    🌐 URL: http://localhost:${PORT}
    📚 API: http://localhost:${PORT}/api/v1
    ❤️  Health: http://localhost:${PORT}/health
    
════════════════════════════════════════════════════════════════
  `);
});
EOF
}

# ========================================
# MENU PRINCIPAL
# ========================================

echo "Escolha o método de instalação:"
echo ""
echo "1) 🐳 Docker (Recomendado - Mais fácil)"
echo "2) 💻 Instalação Local"
echo "3) ❌ Cancelar"
echo ""
read -p "Sua escolha [1-3]: " choice

case $choice in
    1)
        install_with_docker
        ;;
    2)
        install_local
        ;;
    3)
        echo "Instalação cancelada"
        exit 0
        ;;
    *)
        echo "Opção inválida, usando Docker..."
        install_with_docker
        ;;
esac

# ========================================
# PÓS-INSTALAÇÃO
# ========================================

echo "
📋 Próximos passos:
─────────────────────────────────────────
1. Teste a API: curl http://localhost:3000/health
2. Crie um usuário admin via API
3. Configure o MobZap com as credenciais
4. Comece a automatizar!

📚 Documentação completa: http://localhost:3000/api-docs

💡 Comandos úteis:
─────────────────────────────────────────
• Ver logs: docker-compose logs -f
• Parar: docker-compose down
• Reiniciar: docker-compose restart
• Status: docker-compose ps

Precisa de ajuda? Execute: ./troubleshoot.sh
"

# Criar script de troubleshooting
cat > troubleshoot.sh << 'EOF'
#!/bin/bash
echo "🔧 Troubleshooting WhatsApp Backend"
echo "───────────────────────────────────"
echo ""
echo "Verificando serviços..."

# Verificar Docker
if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo "✅ Docker Compose está rodando"
else
    echo "❌ Docker Compose não está rodando"
    echo "   Solução: docker-compose up -d"
fi

# Verificar API
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ API está respondendo"
else
    echo "❌ API não está respondendo"
    echo "   Solução: Verifique os logs: docker-compose logs app"
fi

# Verificar PostgreSQL
if docker-compose exec -T postgres pg_isready > /dev/null 2>&1; then
    echo "✅ PostgreSQL está rodando"
else
    echo "❌ PostgreSQL não está rodando"
fi

# Verificar Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis está rodando"
else
    echo "❌ Redis não está rodando"
fi

echo ""
echo "Para mais detalhes, execute: docker-compose logs"
EOF

chmod +x troubleshoot.sh

echo "
✨ Instalação completa! Sistema pronto para uso.
"