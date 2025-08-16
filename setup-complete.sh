#!/bin/bash

echo "========================================"
echo "   TselZap WhatsApp API - Setup Completo"
echo "========================================"
echo

echo "[1/6] Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker não está instalado!"
    echo "Por favor, instale o Docker primeiro:"
    echo "https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✓ Docker encontrado!"

echo
echo "[2/6] Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "ERRO: Docker Compose não está instalado!"
    echo "Por favor, instale o Docker Compose primeiro:"
    echo "https://docs.docker.com/compose/install/"
    exit 1
fi
echo "✓ Docker Compose encontrado!"

echo
echo "[3/6] Gerando JWT Secret seguro..."
./generate-jwt-secret.sh

echo
echo "[4/6] Configurando arquivo .env..."
./setup-env.sh

echo
echo "[5/6] Atualizando JWT Secret no .env..."
./update-jwt-secret.sh

echo
echo "[6/6] Limpando arquivos temporarios..."
if [ -f "jwt-secret-temp.txt" ]; then
    rm jwt-secret-temp.txt
fi
if [ -f "env-functional.txt" ]; then
    rm env-functional.txt
fi

echo
echo "========================================"
echo "         SETUP COMPLETO CONCLUIDO!"
echo "========================================"
echo
echo "✓ Docker verificado"
echo "✓ Docker Compose verificado"
echo "✓ JWT Secret gerado e configurado"
echo "✓ Arquivo .env configurado"
echo "✓ Arquivos temporarios limpos"
echo
echo "URLs de acesso apos o deploy:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- API Docs: http://localhost:3001/api-docs"
echo "- Health Check: http://localhost:3001/health"
echo "- Redis Commander: http://localhost:8081"
echo
echo "Proximos passos:"
echo "1. ./deploy-docker.sh"
echo "2. ./setup-database.sh"
echo "3. ./monitor.sh"
echo
echo "Deseja executar o deploy agora? (s/n)"
read -r deploy
if [[ $deploy =~ ^[Ss]$ ]]; then
    ./deploy-docker.sh
fi

echo
echo "Setup completo finalizado!"
