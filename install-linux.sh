#!/bin/bash

echo "========================================"
echo "   TselZap WhatsApp API - Instalacao Linux"
echo "========================================"
echo

# Detectar distribuição Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "Não foi possível detectar a distribuição Linux"
    exit 1
fi

echo "Distribuição detectada: $OS $VER"
echo

echo "[1/4] Verificando se o Docker está instalado..."
if command -v docker &> /dev/null; then
    echo "✓ Docker já está instalado"
else
    echo "Docker não encontrado. Instalando..."
    
    case $ID in
        ubuntu|debian)
            echo "Instalando Docker no Ubuntu/Debian..."
            sudo apt-get update
            sudo apt-get install -y docker.io docker-compose
            ;;
        centos|rhel|fedora)
            echo "Instalando Docker no CentOS/RHEL/Fedora..."
            if command -v dnf &> /dev/null; then
                sudo dnf install -y docker docker-compose
            else
                sudo yum install -y docker docker-compose
            fi
            ;;
        *)
            echo "Distribuição não suportada. Instale o Docker manualmente:"
            echo "https://docs.docker.com/get-docker/"
            exit 1
            ;;
    esac
    
    # Habilitar e iniciar Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Adicionar usuário ao grupo docker
    sudo usermod -aG docker $USER
    echo "✓ Docker instalado e configurado"
    echo "IMPORTANTE: Faça logout e login novamente para aplicar as permissões do Docker"
fi

echo
echo "[2/4] Verificando se o curl está instalado..."
if ! command -v curl &> /dev/null; then
    echo "Instalando curl..."
    case $ID in
        ubuntu|debian)
            sudo apt-get install -y curl
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                sudo dnf install -y curl
            else
                sudo yum install -y curl
            fi
            ;;
    esac
    echo "✓ curl instalado"
else
    echo "✓ curl já está instalado"
fi

echo
echo "[3/4] Tornando scripts executáveis..."
chmod +x *.sh
echo "✓ Scripts tornados executáveis"

echo
echo "[4/4] Verificando instalação..."
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✓ Docker: $(docker --version)"
    echo "✓ Docker Compose: $(docker-compose --version)"
    echo "✓ curl: $(curl --version | head -n 1)"
else
    echo "❌ Erro na instalação"
    exit 1
fi

echo
echo "========================================"
echo "         INSTALACAO CONCLUIDA!"
echo "========================================"
echo
echo "✓ Docker instalado e configurado"
echo "✓ Docker Compose instalado"
echo "✓ curl instalado"
echo "✓ Scripts tornados executáveis"
echo
echo "IMPORTANTE: Se você foi adicionado ao grupo docker, faça logout e login novamente"
echo
echo "Para iniciar o setup, execute:"
echo "./setup-complete.sh"
echo
echo "Scripts disponíveis:"
echo "- ./setup-complete.sh - Setup completo"
echo "- ./deploy-docker.sh - Deploy com Docker"
echo "- ./monitor.sh - Monitoramento"
echo "- ./setup-database.sh - Configurar banco"
echo
