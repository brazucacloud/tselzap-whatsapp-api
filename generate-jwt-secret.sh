#!/bin/bash

echo "Gerando JWT Secret seguro..."

# Caracteres para gerar o secret
chars="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"

# Gerar secret de 128 caracteres
jwt_secret=""
for i in {1..128}; do
    # Selecionar caractere aleatório
    random_char="${chars:RANDOM%${#chars}:1}"
    jwt_secret="${jwt_secret}${random_char}"
done

echo "JWT Secret gerado:"
echo "$jwt_secret"

# Salvar em arquivo temporário
echo "$jwt_secret" > jwt-secret-temp.txt

echo "JWT Secret salvo em jwt-secret-temp.txt"
echo "Copie o secret acima e cole no arquivo .env"
