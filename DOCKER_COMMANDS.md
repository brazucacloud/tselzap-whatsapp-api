# 🐳 Comandos Docker - Guia Rápido

## 🚀 Deploy Inicial

### **1. Deploy Completo (Recomendado)**
```bash
# Usar o script automatizado
deploy-docker.bat

# Ou manualmente:
docker-compose up -d --build
```

### **2. Configurar Banco de Dados**
```bash
# Usar o script automatizado
setup-database.bat

# Ou manualmente:
docker-compose exec api npx prisma generate
docker-compose exec api npx prisma migrate deploy
```

## 📊 Monitoramento

### **Status dos Containers**
```bash
# Ver status
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### **Usar o Script de Monitoramento**
```bash
monitor.bat
```

## 🔧 Comandos Úteis

### **Gerenciamento de Containers**
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

### **Shell nos Containers**
```bash
# Acessar shell da API
docker-compose exec api sh

# Acessar shell do banco
docker-compose exec postgres psql -U postgres -d tselzap

# Acessar shell do Redis
docker-compose exec redis redis-cli
```

## 🧹 Limpeza

### **Limpar Recursos Docker**
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

## 🔍 Troubleshooting

### **Problemas Comuns**

#### **1. Porta já em uso**
```bash
# Verificar portas em uso
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Matar processo
taskkill /PID <PID> /F
```

#### **2. Erro de permissão**
```bash
# Executar como administrador
# Ou verificar se o Docker Desktop está rodando
```

#### **3. Erro de memória**
```bash
# Aumentar memória no Docker Desktop
# Settings > Resources > Memory
```

#### **4. Container não inicia**
```bash
# Ver logs detalhados
docker-compose logs api

# Verificar variáveis de ambiente
docker-compose exec api env | grep DATABASE
```

## 📱 URLs de Acesso

Após o deploy bem-sucedido:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api-docs
- **Health Check:** http://localhost:3001/health
- **Prisma Studio:** http://localhost:5555 (quando aberto)

## 🎯 Fluxo de Trabalho

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
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Configurar banco
docker-compose exec api npx prisma migrate deploy

# 4. Monitorar
docker-compose logs -f
```

## 🔒 Segurança

### **Checklist**
- [ ] Variáveis sensíveis no .env
- [ ] Portas expostas apenas quando necessário
- [ ] Volumes com permissões corretas
- [ ] Logs de segurança ativos
- [ ] Backup automático configurado

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs:** `docker-compose logs -f`
2. **Use o monitor:** `monitor.bat`
3. **Consulte a documentação:** README.md
4. **Teste a saúde:** http://localhost:3001/health

---

**💡 Dica:** Use os scripts `.bat` para facilitar o gerenciamento!
