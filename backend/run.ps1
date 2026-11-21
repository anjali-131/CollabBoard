Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Use an explicitly configured key first. If none exists, keep a DPAPI-encrypted
# per-user copy outside the repository and expose it to Spring as JWT_SECRET.
$jwtSecret = [Environment]::GetEnvironmentVariable('JWT_SECRET', 'Process')
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = [Environment]::GetEnvironmentVariable('JWT_SECRET', 'User')
}

$secretPath = Join-Path $env:LOCALAPPDATA 'CollabBoard\jwt-secret.dpapi'
if ([string]::IsNullOrWhiteSpace($jwtSecret) -and (Test-Path -LiteralPath $secretPath)) {
    $protectedSecret = Get-Content -LiteralPath $secretPath -Raw
    $secureSecret = ConvertTo-SecureString -String $protectedSecret
    $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
    try {
        $jwtSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    }
}

if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    # 48 random bytes provide 384 bits of entropy; Base64 keeps the value env-safe.
    $secretBytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($secretBytes)
    }
    finally {
        $rng.Dispose()
    }
    $jwtSecret = [Convert]::ToBase64String($secretBytes)
    $secureSecret = ConvertTo-SecureString -String $jwtSecret -AsPlainText -Force
    $protectedSecret = ConvertFrom-SecureString -SecureString $secureSecret
    $secretDirectory = Split-Path -Parent $secretPath
    New-Item -ItemType Directory -Path $secretDirectory -Force | Out-Null
    Set-Content -LiteralPath $secretPath -Value $protectedSecret -Encoding ASCII -NoNewline
}

if ([Text.Encoding]::UTF8.GetByteCount($jwtSecret) -lt 32) {
    throw 'JWT_SECRET is configured but too short. Set it to at least 32 random bytes, then rerun this script.'
}

$env:JWT_SECRET = $jwtSecret
# Use the local Mailpit inbox unless this shell has an explicit SMTP setup.
if ([string]::IsNullOrWhiteSpace($env:SMTP_HOST)) { $env:SMTP_HOST = 'localhost' }
if ([string]::IsNullOrWhiteSpace($env:SMTP_PORT)) { $env:SMTP_PORT = '1025' }
if ([string]::IsNullOrWhiteSpace($env:SMTP_AUTH)) { $env:SMTP_AUTH = 'false' }
if ([string]::IsNullOrWhiteSpace($env:SMTP_STARTTLS)) { $env:SMTP_STARTTLS = 'false' }
if ([string]::IsNullOrWhiteSpace($env:MAIL_FROM)) { $env:MAIL_FROM = 'collabboard@localhost' }
if ([string]::IsNullOrWhiteSpace($env:APP_PUBLIC_BASE_URL)) { $env:APP_PUBLIC_BASE_URL = 'http://localhost:5173' }
Set-Location -LiteralPath $PSScriptRoot
mvn "-Dmaven.repo.local=$PSScriptRoot\.m2\repository" spring-boot:run
