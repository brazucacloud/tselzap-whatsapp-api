#!/bin/bash

while true; do
    clear
    echo "========================================"
    echo "         Monitoramento e Logs"
    echo "========================================"
    echo
    echo "Escolha uma opcao:"
    echo
    echo "1. Ver status dos containers"
    echo "2. Ver logs da API"
    echo "3. Ver logs do frontend"
    echo "4. Ver logs do banco de dados"
    echo "5. Ver logs do Redis"
    echo "6. Ver logs de todos os servicos"
    echo "7. Verificar saude da aplicacao"
    echo "8. Acessar Prisma Studio"
    echo "9. Backup do banco de dados"
    echo "0. Sair"
    echo
    read -p "Digite sua escolha (0-9): " choice

    case $choice in
        1)
            clear
            echo "========================================"
            echo "         Status dos Containers"
            echo "========================================"
            docker-compose ps
            echo
            read -p "Pressione Enter para continuar..."
            ;;
        2)
            clear
            echo "========================================"
            echo "         Logs da API"
            echo "========================================"
            docker-compose logs -f api
            ;;
        3)
            clear
            echo "========================================"
            echo "         Logs do Frontend"
            echo "========================================"
            docker-compose logs -f frontend
            ;;
        4)
            clear
            echo "========================================"
            echo "         Logs do Banco de Dados"
            echo "========================================"
            docker-compose logs -f postgres
            ;;
        5)
            clear
            echo "========================================"
            echo "         Logs do Redis"
            echo "========================================"
            docker-compose logs -f redis
            ;;
        6)
            clear
            echo "========================================"
            echo "         Logs de Todos os Servicos"
            echo "========================================"
            docker-compose logs -f
            ;;
        7)
            clear
            echo "========================================"
            echo "         Verificando Saude da API"
            echo "========================================"
            if command -v curl &> /dev/null; then
                curl -s http://localhost:3001/health
                echo
            else
                echo "curl não está instalado. Instale com: sudo apt-get install curl"
            fi
            echo
            read -p "Pressione Enter para continuar..."
            ;;
        8)
            clear
            echo "========================================"
            echo "         Abrindo Prisma Studio"
            echo "========================================"
            echo "Prisma Studio sera aberto em: http://localhost:5555"
            echo "Pressione Ctrl+C para fechar"
            docker-compose exec api npx prisma studio
            ;;
        9)
            clear
            echo "========================================"
            echo "         Backup do Banco de Dados"
            echo "========================================"
            timestamp=$(date +"%Y%m%d_%H%M%S")
            docker-compose exec postgres pg_dump -U postgres -d tselzap > "backup_${timestamp}.sql"
            echo "Backup criado: backup_${timestamp}.sql"
            echo
            read -p "Pressione Enter para continuar..."
            ;;
        0)
            echo "Saindo..."
            exit 0
            ;;
        *)
            echo "Opcao invalida!"
            read -p "Pressione Enter para continuar..."
            ;;
    esac
done
