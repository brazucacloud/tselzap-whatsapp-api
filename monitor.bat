@echo off
echo ========================================
echo         Monitoramento e Logs
echo ========================================
echo.

:menu
echo Escolha uma opcao:
echo.
echo 1. Ver status dos containers
echo 2. Ver logs da API
echo 3. Ver logs do frontend
echo 4. Ver logs do banco de dados
echo 5. Ver logs do Redis
echo 6. Ver logs de todos os servicos
echo 7. Verificar saude da aplicacao
echo 8. Acessar Prisma Studio
echo 9. Backup do banco de dados
echo 0. Sair
echo.
set /p choice="Digite sua escolha (0-9): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto api-logs
if "%choice%"=="3" goto frontend-logs
if "%choice%"=="4" goto db-logs
if "%choice%"=="5" goto redis-logs
if "%choice%"=="6" goto all-logs
if "%choice%"=="7" goto health
if "%choice%"=="8" goto prisma
if "%choice%"=="9" goto backup
if "%choice%"=="0" goto exit
goto menu

:status
cls
echo ========================================
echo         Status dos Containers
echo ========================================
docker-compose ps
echo.
pause
goto menu

:api-logs
cls
echo ========================================
echo         Logs da API
echo ========================================
docker-compose logs -f api
goto menu

:frontend-logs
cls
echo ========================================
echo         Logs do Frontend
echo ========================================
docker-compose logs -f frontend
goto menu

:db-logs
cls
echo ========================================
echo         Logs do Banco de Dados
echo ========================================
docker-compose logs -f postgres
goto menu

:redis-logs
cls
echo ========================================
echo         Logs do Redis
echo ========================================
docker-compose logs -f redis
goto menu

:all-logs
cls
echo ========================================
echo         Logs de Todos os Servicos
echo ========================================
docker-compose logs -f
goto menu

:health
cls
echo ========================================
echo         Verificando Saude da API
echo ========================================
curl -s http://localhost:3001/health
echo.
echo.
pause
goto menu

:prisma
cls
echo ========================================
echo         Abrindo Prisma Studio
echo ========================================
echo Prisma Studio sera aberto em: http://localhost:5555
echo Pressione Ctrl+C para fechar
docker-compose exec api npx prisma studio
goto menu

:backup
cls
echo ========================================
echo         Backup do Banco de Dados
echo ========================================
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
docker-compose exec postgres pg_dump -U postgres -d tselzap > backup_%timestamp%.sql
echo Backup criado: backup_%timestamp%.sql
echo.
pause
goto menu

:exit
echo Saindo...
exit /b 0
