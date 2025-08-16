@echo off
echo ========================================
echo    Atualizando JWT Secret no .env
echo ========================================
echo.

echo [1/3] Verificando arquivo .env...
if not exist ".env" (
    echo ERRO: Arquivo .env nao encontrado!
    echo Execute primeiro: setup-env.bat
    pause
    exit /b 1
)
echo ✓ Arquivo .env encontrado!

echo.
echo [2/3] Verificando JWT Secret gerado...
if not exist "jwt-secret-temp.txt" (
    echo ERRO: JWT Secret nao foi gerado!
    echo Execute primeiro: powershell -ExecutionPolicy Bypass -File generate-jwt-secret.ps1
    pause
    exit /b 1
)
echo ✓ JWT Secret encontrado!

echo.
echo [3/3] Atualizando arquivo .env...

REM Ler o JWT Secret do arquivo temporário
set /p JWT_SECRET=<jwt-secret-temp.txt

REM Criar backup do arquivo .env
copy .env .env.backup

REM Atualizar o JWT_SECRET no arquivo .env
powershell -Command "(Get-Content .env) -replace 'JWT_SECRET=.*', 'JWT_SECRET=\"%JWT_SECRET%\"' | Set-Content .env"

echo ✓ JWT Secret atualizado no arquivo .env!
echo ✓ Backup criado: .env.backup

echo.
echo ========================================
echo         ATUALIZACAO CONCLUIDA!
echo ========================================
echo.
echo JWT Secret atualizado com sucesso!
echo.
echo Para verificar, abra o arquivo .env e procure por:
echo JWT_SECRET="[seu-secret-gerado]"
echo.
echo Deseja abrir o arquivo .env para verificar? (S/N)
set /p verify="Digite S para abrir ou N para sair: "
if /i "%verify%"=="S" (
    notepad .env
)

echo.
echo Agora voce pode executar:
echo - deploy-docker.bat
echo - setup-database.bat
echo.
pause
