#!/bin/bash

echo "========================================"
echo "   TselZap WhatsApp API - Docker Deploy"
echo "========================================"
echo

echo "[1/5] Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker não está instalado!"
    echo "Por favor, instale o Docker primeiro:"
    echo "https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✓ Docker encontrado!"

echo
echo "[2/5] Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "ERRO: Docker Compose não está instalado!"
    echo "Por favor, instale o Docker Compose primeiro:"
    echo "https://docs.docker.com/compose/install/"
    exit 1
fi
echo "✓ Docker Compose encontrado!"

echo
echo "[3/5] Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "ERRO: Arquivo .env não encontrado!"
    echo "Copiando env.example para .env..."
    cp env.example .env
    echo "✓ Arquivo .env criado!"
    echo
    echo "IMPORTANTE: Edite o arquivo .env com suas configuracoes antes de continuar!"
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
echo "[4/5] Parando containers existentes..."
docker-compose down

echo
echo "[5/5] Construindo e iniciando containers..."
docker-compose up -d --build

echo
echo "========================================"
echo "           DEPLOY CONCLUIDO!"
echo "========================================"
echo
echo "URLs de acesso:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- API Docs: http://localhost:3001/api-docs"
echo "- Health Check: http://localhost:3001/health"
echo
echo "Comandos uteis:"
echo "- Ver logs: docker-compose logs -f"
echo "- Parar: docker-compose down"
echo "- Reiniciar: docker-compose restart"
echo "- Status: docker-compose ps"
echo
