# PowerShell Script: SSL Certificate Setup for Windows
# Downloads and installs Let's Encrypt certificates for local testing
# Or guides setup using Cloudflare

# Configuration
$domain = "fafaaccess.com"
$emailAddress = "admin@fafaaccess.com"
$certPath = "$PSScriptRoot\..\certs"

# Colors
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

# Helper functions
function Write-Success {
  Write-Host "✅ $args" -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
  Write-Host "❌ $args" -ForegroundColor $ErrorColor
}

function Write-Warning-Custom {
  Write-Host "⚠️  $args" -ForegroundColor $WarningColor
}

function Write-Info {
  Write-Host "ℹ️  $args" -ForegroundColor $InfoColor
}

# Check if running as admin
function Test-Administrator {
  $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
  $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Create self-signed certificate for development
function Create-SelfSignedCert {
  param(
    [string]$Domain = "localhost",
    [string]$CertPath = "."
  )
  
  Write-Info "Creating self-signed certificate for $Domain..."
  
  # Create cert directory
  if (!(Test-Path $CertPath)) {
    New-Item -ItemType Directory -Path $CertPath -Force | Out-Null
    Write-Success "Created certificate directory: $CertPath"
  }
  
  # Generate private key
  $keyFile = Join-Path $CertPath "$Domain.key"
  $certFile = Join-Path $CertPath "$Domain.crt"
  $pfxFile = Join-Path $CertPath "$Domain.pfx"
  
  # Using OpenSSL (requires installation)
  $opensslPath = "C:\Program Files\Git\usr\bin\openssl.exe"
  
  if (Test-Path $opensslPath) {
    # Generate certificate using OpenSSL
    & $opensslPath genrsa -out $keyFile 2048
    & $opensslPath req -new -x509 -key $keyFile -out $certFile -days 365 `
      -subj "/C=GH/ST=Greater Accra/L=Accra/O=Fafa Access/CN=$Domain"
    
    Write-Success "Certificate created: $certFile"
    Write-Success "Private key created: $keyFile"
    Write-Info "Certificate path: $certFile"
    Write-Info "Private key path: $keyFile"
    
    return @{
      CertPath = $certFile
      KeyPath = $keyFile
      PfxPath = $pfxFile
    }
  }
  else {
    Write-Warning-Custom "OpenSSL not found at $opensslPath"
    Write-Info "Using PowerShell to create self-signed certificate..."
    
    # Using PowerShell New-SelfSignedCertificate (Windows 10+)
    $params = @{
      CertStoreLocation = "Cert:\CurrentUser\My"
      DnsName           = $Domain
      FriendlyName      = "Fafa Access - $Domain"
      KeyLength         = 2048
      KeyUsage          = "DigitalSignature", "KeyEncipherment"
      TextExtension     = @("2.5.29.19={text}CA=FALSE")
    }
    
    $cert = New-SelfSignedCertificate @params
    Write-Success "Self-signed certificate created: $($cert.Thumbprint)"
    Write-Info "Certificate stored in Certificate Store"
    
    # Export to files
    Export-PfxCertificate -Cert $cert -FilePath $pfxFile -Password (ConvertTo-SecureString -String "password" -AsPlainText -Force)
    Write-Success "Certificate exported to: $pfxFile"
    
    return @{
      Thumbprint = $cert.Thumbprint
      PfxPath    = $pfxFile
    }
  }
}

# Display Cloudflare setup instructions
function Show-CloudflareSetup {
  Write-Host "`n" + ("="*60) -ForegroundColor $InfoColor
  Write-Host "CLOUDFLARE SETUP (Recommended for Production)" -ForegroundColor $InfoColor
  Write-Host ("="*60) -ForegroundColor $InfoColor
  
  Write-Host @"

1. Go to cloudflare.com and sign up (free tier available)

2. Register your domain:
   - Click "Register" → Search for your domain
   - Add to cart → Purchase
   - Cloudflare automatically enables SSL

3. DNS Configuration:
   - Go to DNS tab
   - Add A record:
     Name: @
     Type: A
     Content: YOUR_SERVER_IP
     Proxy: Proxied
   
   - Add www record:
     Name: www
     Type: A  
     Content: YOUR_SERVER_IP
     Proxy: Proxied

4. SSL/TLS Settings:
   - Go to SSL/TLS tab
   - Select "Full (Strict)" mode
   - Cloudflare automatically renews certificates

5. Email Configuration:
   - Add MX records for email delivery
   - Set up email forwarding (if needed)

✅ Benefits:
   - Free SSL certificates (auto-renewed)
   - Global DDoS protection
   - Free CDN
   - Email forwarding
   - Zero additional cost

" -ForegroundColor $InfoColor
}

# Display Let's Encrypt setup instructions
function Show-LetsEncryptSetup {
  Write-Host "`n" + ("="*60) -ForegroundColor $InfoColor
  Write-Host "LET'S ENCRYPT SETUP (For Direct Server Certificates)" -ForegroundColor $InfoColor
  Write-Host ("="*60) -ForegroundColor $InfoColor
  
  Write-Host @"

1. Install Certbot (Windows):
   Option A: Using Windows Subsystem for Linux (WSL):
   - Enable WSL: wsl --install
   - In WSL terminal: sudo apt-get install certbot
   
   Option B: Using Certbot standalone for Windows:
   - Download from: https://certbot.eff.org/instructions
   - Follow Windows-specific installation

2. Issue Certificate:
   Inside WSL or after installation:
   certbot certonly --standalone \
     -d fafaaccess.com \
     -d www.fafaaccess.com \
     --email admin@fafaaccess.com \
     --agree-tos

3. Configure Auto-Renewal:
   Linux/WSL:
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   
   Windows (scheduled task):
   PowerShell (as admin):
   schtasks /create /tn "CertbotRenewal" /tr `
     "certbot renew --quiet" /sc daily /st 02:00

4. Certificate Location:
   Linux/WSL: /etc/letsencrypt/live/fafaaccess.com/
   Files:
   - fullchain.pem (certificate chain)
   - privkey.pem (private key)

✅ Benefits:
   - Free certificates
   - Widely trusted
   - Automatic renewal
   - Works with any domain registrar

⚠️ Considerations:
   - Requires Linux/WSL on Windows
   - Certificates expire every 90 days
   - Must renew before expiration

" -ForegroundColor $InfoColor
}

# Display development setup (self-signed)
function Show-DevelopmentSetup {
  Write-Host "`n" + ("="*60) -ForegroundColor $WarningColor
  Write-Host "DEVELOPMENT SETUP (Self-Signed Certificate)" -ForegroundColor $WarningColor
  Write-Host ("="*60) -ForegroundColor $WarningColor
  
  Write-Host @"

Self-signed certificates are for local development only.
Browsers will show security warnings in production.

1. Create Self-Signed Certificate:
   .$($MyInvocation.MyCommand.Name) -CreateSelfSigned -Domain localhost
   
   Or use PowerShell directly:
   `$cert = New-SelfSignedCertificate -CertStoreLocation Cert:\CurrentUser\My `
     -DnsName localhost -FriendlyName "Local Dev"

2. Trust Certificate in Windows:
   - Open certlm.msc (Certificate Manager)
   - Go to: Personal → Certificates
   - Right-click your cert → Properties
   - Install to: Trusted Root Certification Authorities

3. Configure Express Server:
   NODE_ENV=development
   SSL_KEY_PATH=path/to/localhost.key
   SSL_CERT_PATH=path/to/localhost.crt

4. Test HTTPS:
   https://localhost:3000

⚠️ Important:
   - Self-signed certs trigger browser warnings
   - Never use in production
   - Use Cloudflare or Let's Encrypt for production

" -ForegroundColor $WarningColor
}

# Main menu
function Show-MainMenu {
  Write-Host "`n"
  Write-Host ("="*60) -ForegroundColor $InfoColor
  Write-Host "SSL Certificate Setup for Fafa Access" -ForegroundColor $InfoColor
  Write-Host ("="*60) -ForegroundColor $InfoColor
  
  Write-Host @"
Select Setup Option:

1. Cloudflare (Recommended for Production)
   ✅ Free SSL, auto-renewal, DDoS protection
   ✅ Global CDN included
   ✅ Easy setup, no server configuration needed

2. Let's Encrypt (Direct Server Certificate)
   ✅ Free SSL, auto-renewal
   ✅ Works with any domain registrar
   ⚠️ Requires Linux/WSL on Windows
   ⚠️ Needs server configuration

3. Self-Signed (Development Only)
   ✅ For local testing
   ✅ No external dependencies
   ⚠️ Browser security warnings
   ⚠️ Never use in production

4. Show DNS Configuration
   ℹ️  Display required DNS records

5. Exit

Enter your choice (1-5):
" -ForegroundColor $InfoColor
}

# Process user choice
function Process-Choice {
  param([string]$Choice)
  
  switch ($Choice) {
    "1" {
      Show-CloudflareSetup
    }
    "2" {
      Show-LetsEncryptSetup
    }
    "3" {
      Show-DevelopmentSetup
      $response = Read-Host "Create self-signed certificate? (y/n)"
      if ($response -eq "y") {
        $certInfo = Create-SelfSignedCert -Domain "localhost" -CertPath $certPath
        Write-Success "Certificate created successfully!"
        Write-Info "Update your .env file with certificate paths"
      }
    }
    "4" {
      Write-Host "`n" + ("="*60) -ForegroundColor $InfoColor
      Write-Host "Required DNS Records" -ForegroundColor $InfoColor
      Write-Host ("="*60) -ForegroundColor $InfoColor
      Get-Content (Join-Path $PSScriptRoot "..\DNS_RECORDS_CONFIG.txt") | Select-Object -First 50
      Write-Host "... (see DNS_RECORDS_CONFIG.txt for full details)" -ForegroundColor $InfoColor
    }
    "5" {
      Write-Host "Exiting..." -ForegroundColor $InfoColor
      exit 0
    }
    default {
      Write-Error-Custom "Invalid choice. Please enter 1-5."
    }
  }
}

# Main script execution
Write-Host "`n"
Write-Success "SSL Certificate Setup Script"
Write-Info "Domain: $domain"
Write-Info "Email: $emailAddress`n"

# Interactive menu
do {
  Show-MainMenu
  $choice = Read-Host
  Process-Choice $choice
  $continue = Read-Host "`nContinue? (y/n)"
} while ($continue -eq "y" -or $continue -eq "Y")

Write-Host "`n"
Write-Success "Setup complete!"
Write-Info "Next steps:"
Write-Info "1. Update .env with SSL certificate paths"
Write-Info "2. Restart Express server: npm run server"
Write-Info "3. Test HTTPS: https://fafaaccess.com"
Write-Info "`nFor detailed instructions, see: DOMAIN_AND_SSL_SETUP.md"
