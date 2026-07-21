# set-github-secrets.ps1
# Sube todos los GitHub Actions secrets del proyecto miDrive desde archivos locales.
#
# Prerequisitos:
#   1. GitHub CLI instalado: https://cli.github.com
#   2. Autenticado: gh auth login
#   3. Copiar .github\secrets.example.env a .github\secrets.env y rellenar los valores
#   4. Colocar el JSON del service account de GCP en .github\gcp-service-account.json

$repo       = "J3RRYG3/mi-drive"
$secretsFile = ".github\secrets.env"
$saKeyFile   = ".github\gcp-service-account.json"

# Verificar gh CLI
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI no encontrado. Instalar desde https://cli.github.com"
    exit 1
}

# Verificar autenticacion
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "No autenticado. Ejecutar: gh auth login"
    exit 1
}

# Verificar archivo de secrets
if (-not (Test-Path $secretsFile)) {
    Write-Error "Archivo no encontrado: $secretsFile"
    Write-Host "Copia .github\secrets.example.env a .github\secrets.env y rellena los valores faltantes."
    exit 1
}

# Subir secrets desde el archivo .env
Write-Host "`nSubiendo secrets desde $secretsFile..." -ForegroundColor Cyan
gh secret set --env-file $secretsFile --repo $repo
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al subir secrets desde el archivo."
    exit 1
}
Write-Host "Secrets del archivo subidos correctamente." -ForegroundColor Green

# Subir GCP_SERVICE_ACCOUNT_KEY desde archivo JSON
if (Test-Path $saKeyFile) {
    Write-Host "`nSubiendo GCP_SERVICE_ACCOUNT_KEY desde $saKeyFile..." -ForegroundColor Cyan
    Get-Content $saKeyFile -Raw | gh secret set GCP_SERVICE_ACCOUNT_KEY --repo $repo
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al subir GCP_SERVICE_ACCOUNT_KEY."
        exit 1
    }
    Write-Host "GCP_SERVICE_ACCOUNT_KEY subido correctamente." -ForegroundColor Green
} else {
    Write-Warning "Archivo no encontrado: $saKeyFile"
    Write-Host "Coloca el JSON del service account de GCP en $saKeyFile y vuelve a ejecutar el script."
    Write-Host "O subelo manualmente: gh secret set GCP_SERVICE_ACCOUNT_KEY --body-file <ruta>.json --repo $repo"
}

Write-Host "`nListo. Verifica los secrets en:" -ForegroundColor Green
Write-Host "https://github.com/$repo/settings/secrets/actions"
