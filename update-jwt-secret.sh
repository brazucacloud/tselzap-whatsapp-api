#!/bin/bash

echo "========================================"
echo "   Atualizando JWT Secret no .env"
echo "========================================"
echo

echo "[1/3] Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "ERRO: Arquivo .env não encontrado!"
    echo "Execute primeiro: ./setup-env.sh"
    exit 1
fi
echo "✓ Arquivo .env encontrado!"

echo
echo "[2/3] Verificando JWT Secret gerado..."
if [ ! -f "jwt-secret-temp.txt" ]; then
    echo "ERRO: JWT Secret não foi gerado!"
    echo "Execute primeiro: ./generate-jwt-secret.sh"
    exit 1
fi
echo "✓ JWT Secret encontrado!"

echo
echo "[3/3] Atualizando arquivo .env..."

# Ler o JWT Secret do arquivo temporário
jwt_secret=$(cat jwt-secret-temp.txt)

# Criar backup do arquivo .env
cp .env .env.backup

# Atualizar o JWT_SECRET no arquivo .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=\"$jwt_secret\"/" .env

echo "✓ JWT Secret atualizado no arquivo .env!"
echo "✓ Backup criado: .env.backup"

echo
echo "========================================"
echo "         ATUALIZACAO CONCLUIDA!"
echo "========================================"
echo
echo "JWT Secret atualizado com sucesso!"
echo
echo "Para verificar, abra o arquivo .env e procure por:"
echo "JWT_SECRET=\"[seu-secret-gerado]\""
echo
echo "Deseja abrir o arquivo .env para verificar? (s/n)"
read -r verify
if [[ $verify =~ ^[Ss]$ ]]; then
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "Editor não encontrado. Abra o arquivo .env manualmente."
    fi
fi

echo
echo "Agora você pode executar:"
echo "- ./deploy-docker.sh"
echo "- ./setup-database.sh"
echo
