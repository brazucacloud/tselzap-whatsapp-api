@echo off
echo ========================================
echo    Configuracao do Banco de Dados
echo ========================================
echo.

echo [1/4] Verificando se os containers estao rodando...
docker-compose ps | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo ERRO: Containers nao estao rodando!
    echo Execute primeiro: deploy-docker.bat
    pause
    exit /b 1
)
echo ✓ Containers estao rodando!

echo.
echo [2/4] Gerando cliente Prisma...
docker-compose exec api npx prisma generate

echo.
echo [3/4] Executando migracoes do banco...
docker-compose exec api npx prisma migrate deploy

echo.
echo [4/4] Verificando conexao com o banco...
docker-compose exec api npx prisma db push

echo.
echo ========================================
echo     BANCO CONFIGURADO COM SUCESSO!
echo ========================================
echo.
echo Para acessar o Prisma Studio (interface do banco):
echo docker-compose exec api npx prisma studio
echo.
echo Para fazer backup do banco:
echo docker-compose exec postgres pg_dump -U postgres -d tselzap > backup.sql
echo.
pause
