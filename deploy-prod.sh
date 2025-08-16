#!/bin/bash

echo "========================================"
echo "   TselZap WhatsApp API - Deploy Producao"
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
echo "[3/6] Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "ERRO: Arquivo .env não encontrado!"
    echo "Copiando env.example para .env..."
    cp env.example .env
    echo "✓ Arquivo .env criado!"
    echo
    echo "IMPORTANTE: Configure as variaveis de ambiente para PRODUCAO!"
    echo "Pressione qualquer tecla para abrir o arquivo .env..."
    read -n 1 -s
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "Editor não encontrado. Abra o arquivo .env manualmente."
    fi
else
    echo "✓ Arquivo .env encontrado!"
fi

echo
echo "[4/6] Parando containers existentes..."
docker-compose down

echo
echo "[5/6] Construindo e iniciando containers em modo PRODUCAO..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo
echo "[6/6] Verificando status dos containers..."
docker-compose ps

echo
echo "========================================"
echo "         DEPLOY PRODUCAO CONCLUIDO!"
echo "========================================"
echo
echo "URLs de acesso:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- API Docs: http://localhost:3001/api-docs"
echo "- Health Check: http://localhost:3001/health"
echo "- Redis Commander: http://localhost:8081"
echo
echo "Comandos uteis:"
echo "- Ver logs: docker-compose logs -f"
echo "- Parar: docker-compose down"
echo "- Reiniciar: docker-compose restart"
echo "- Status: docker-compose ps"
echo "- Monitor: ./monitor.sh"
echo
echo "ATENCAO: Configure SSL/HTTPS para producao real!"
echo
