# Gerador de JWT Secret Seguro
Write-Host "Gerando JWT Secret seguro..." -ForegroundColor Green

# Caracteres para gerar o secret
$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"

# Gerar secret de 128 caracteres
$jwtSecret = ""
for ($i = 0; $i -lt 128; $i++) {
    $jwtSecret += $chars[(Get-Random -Maximum $chars.Length)]
}

Write-Host "JWT Secret gerado:" -ForegroundColor Yellow
Write-Host $jwtSecret -ForegroundColor Cyan

# Salvar em arquivo temporário
$jwtSecret | Out-File -FilePath "jwt-secret-temp.txt" -Encoding UTF8

Write-Host "JWT Secret salvo em jwt-secret-temp.txt" -ForegroundColor Green
Write-Host "Copie o secret acima e cole no arquivo .env" -ForegroundColor Yellow
