# WhatsApp Automation Platform

Uma plataforma completa de automação do WhatsApp com integração mobile e web, construída com TypeScript, Node.js, React e Prisma.

## 🚀 Características

### Backend
- **API RESTful** completa com TypeScript
- **Autenticação JWT** e API Keys
- **Integração com MobZap** para automação mobile
- **WhatsApp Web** integração
- **Sistema de filas** com Bull/Redis
- **Banco de dados** PostgreSQL com Prisma
- **Webhooks** para integrações externas
- **Sistema de licenças** e limites
- **Logs estruturados** com Winston
- **Documentação Swagger** automática

### Frontend
- **Interface moderna** com React + TypeScript
- **Design responsivo** com Tailwind CSS
- **Animações fluidas** com Framer Motion
- **Gráficos interativos** com Chart.js
- **Gerenciamento de estado** com Zustand
- **Queries otimizadas** com React Query
- **Notificações** com React Hot Toast

### Mobile Integration
- **API MobZap** para dispositivos Android
- **Auto-registro** de dispositivos
- **Sincronização em tempo real**
- **Callbacks** de status de tarefas
- **Recebimento de mensagens**

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- npm ou yarn

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/your-org/whatsapp-automation-platform.git
cd whatsapp-automation-platform
```

### 2. Instale as dependências do backend
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_automation"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV=development

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 4. Configure o banco de dados
```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma migrate dev --name init

# (Opcional) Popule com dados de exemplo
npm run db:seed
```

### 5. Instale as dependências do frontend
```bash
cd frontend
npm install
```

## 🚀 Executando o projeto

### Backend
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

# Worker de filas
npm run queue:worker
```

### Frontend
```bash
cd frontend
npm start
```

### Acesse a aplicação
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000
- **Documentação**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 📱 Integração Mobile (MobZap)

### Configuração do App Android
1. Configure o app MobZap com a URL da API
2. Use sua API Key para autenticação
3. O app irá automaticamente:
   - Registrar dispositivos
   - Buscar tarefas pendentes
   - Enviar callbacks de status
   - Receber mensagens

### Endpoints MobZap
- `POST /api/v1/mobzap/fetch` - Buscar tarefas
- `POST /api/v1/mobzap/callback` - Callback de status
- `POST /api/v1/mobzap/message/receive` - Receber mensagem
- `GET /api/v1/mobzap/devices` - Status dos dispositivos

## 🔧 Estrutura do Projeto

```
├── src/
│   ├── config/           # Configurações (DB, Redis, etc.)
│   ├── controllers/      # Controladores da API
│   ├── middlewares/      # Middlewares (auth, validation, etc.)
│   ├── models/          # Modelos Prisma
│   ├── routes/          # Rotas da API
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários
│   ├── workers/         # Workers de filas
│   └── app.ts           # Aplicação principal
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── contexts/    # Contextos (Auth, Socket)
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── services/    # Serviços de API
│   │   └── App.tsx      # Componente principal
│   └── package.json
├── prisma/
│   ├── schema.prisma    # Schema do banco
│   └── migrations/      # Migrações
└── package.json
```

## 📊 Funcionalidades

### Dashboard
- **Visão geral** de dispositivos e mensagens
- **Gráficos** de atividade
- **Estatísticas** em tempo real
- **Atividade recente**

### Dispositivos
- **Registro** de novos dispositivos
- **Geração de QR Code** para WhatsApp Web
- **Monitoramento** de status
- **Gerenciamento** de conexões

### Mensagens
- **Envio individual** e em massa
- **Histórico** de conversas
- **Status** de entrega
- **Filtros** avançados

### Automação
- **Agendamento** de mensagens
- **Respostas automáticas**
- **Webhooks** para integrações
- **Templates** de mensagem

## 🔐 Autenticação

### JWT Token
```bash
# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": { ... }
  }
}
```

### API Key (Mobile)
```bash
# Headers
X-API-Key: wz_your_api_key_here
X-User-ID: user_id_here
```

## 📈 Monitoramento

### Logs
- **Arquivos rotativos** por data
- **Níveis** de log configuráveis
- **Estrutura** JSON para análise

### Métricas
- **Health checks** automáticos
- **Performance** de queries
- **Status** de filas
- **Uso** de recursos

## 🚀 Deploy

### Docker
```bash
# Build da imagem
docker build -t whatsapp-automation .

# Executar
docker run -p 3000:3000 whatsapp-automation
```

### PM2
```bash
# Instalar PM2
npm install -g pm2

# Executar
pm2 start ecosystem.config.js
```

### Scripts de Deploy
```bash
# Setup inicial
npm run setup

# Deploy em produção
npm run deploy
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Cobertura
npm run test:coverage

# Testes em watch mode
npm run test:watch
```

## 📚 Documentação da API

Acesse a documentação interativa em:
- **Swagger UI**: http://localhost:3000/api-docs
- **Postman Collection**: Disponível no projeto

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Email**: support@whatsapp-automation.com
- **Documentação**: [Wiki do projeto](https://github.com/your-org/whatsapp-automation-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/whatsapp-automation-platform/issues)

## 🔄 Changelog

### v2.0.0
- ✨ Interface moderna com React + TypeScript
- 🚀 Integração completa com MobZap
- 📊 Dashboard com gráficos interativos
- 🔐 Sistema de autenticação robusto
- 📱 API para dispositivos móveis
- 🎯 Sistema de licenças e limites

### v1.0.0
- 🎉 Lançamento inicial
- 📡 API REST básica
- 💾 Integração com banco de dados
- 🔑 Autenticação JWT

---

**Desenvolvido com ❤️ pela equipe WhatsApp Automation**
