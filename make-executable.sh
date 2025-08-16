#!/bin/bash

echo "========================================"
echo "   Tornando Scripts Executaveis"
echo "========================================"
echo

echo "Dando permissao de execucao aos scripts..."

chmod +x setup-env.sh
chmod +x generate-jwt-secret.sh
chmod +x update-jwt-secret.sh
chmod +x deploy-docker.sh
chmod +x setup-database.sh
chmod +x monitor.sh
chmod +x setup-complete.sh
chmod +x deploy-prod.sh

echo "✓ Scripts tornados executaveis!"
echo
echo "Scripts disponiveis:"
echo "- ./setup-env.sh - Configurar arquivo .env"
echo "- ./generate-jwt-secret.sh - Gerar JWT Secret"
echo "- ./update-jwt-secret.sh - Atualizar JWT Secret"
echo "- ./deploy-docker.sh - Deploy com Docker"
echo "- ./setup-database.sh - Configurar banco"
echo "- ./monitor.sh - Monitoramento e logs"
echo "- ./setup-complete.sh - Setup completo"
echo "- ./deploy-prod.sh - Deploy em producao"
echo
echo "Para iniciar, execute:"
echo "./setup-complete.sh"
