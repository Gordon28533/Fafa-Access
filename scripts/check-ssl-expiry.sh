#!/usr/bin/env bash

# SSL Certificate Monitoring Script
# Monitors certificate expiry and sends alerts
# Usage: ./check-ssl-expiry.sh [domain] [alert-days]

set -e

# Configuration
DOMAIN="${1:-fafaaccess.com}"
ALERT_DAYS="${2:-30}"
ALERT_EMAIL="${SSL_ALERT_EMAIL:-admin@fafaaccess.com}"
LOG_FILE="/var/log/ssl-cert-monitor.log"

# Colors for console output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Logging function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
  log "❌ ERROR: $1"
  exit 1
}

# Success message
success() {
  echo -e "${GREEN}✅ $1${NC}"
  log "✅ $1"
}

# Warning message
warning() {
  echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
  log "⚠️  WARNING: $1"
}

# Error message
error() {
  echo -e "${RED}❌ ERROR: $1${NC}"
  log "❌ ERROR: $1"
}

# Send email alert
send_alert_email() {
  local subject="$1"
  local message="$2"
  
  # Check if mail command is available
  if ! command -v mail &> /dev/null; then
    warning "mail command not found, skipping email alert"
    return
  fi
  
  echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || \
    warning "Failed to send alert email to $ALERT_EMAIL"
}

# Get certificate expiry date
get_cert_expiry() {
  local domain="$1"
  local port="${2:-443}"
  
  echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | \
    openssl x509 -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2
}

# Parse date and calculate days remaining
calculate_days_remaining() {
  local expiry_date="$1"
  
  # Convert date to epoch
  local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
  
  if [ -z "$expiry_epoch" ]; then
    error_exit "Failed to parse certificate date: $expiry_date"
  fi
  
  local now_epoch=$(date +%s)
  local days_remaining=$(( ($expiry_epoch - $now_epoch) / 86400 ))
  
  echo "$days_remaining"
}

# Get certificate details
get_cert_details() {
  local domain="$1"
  local port="${2:-443}"
  
  echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | \
    openssl x509 -noout -text 2>/dev/null
}

# Check certificate validity
check_certificate() {
  local domain="$1"
  local port="${2:-443}"
  
  log "Checking SSL certificate for $domain:$port..."
  
  # Test connection
  if ! timeout 5 bash -c "echo > /dev/tcp/$domain/$port" 2>/dev/null; then
    error_exit "Cannot connect to $domain:$port"
  fi
  
  # Get expiry date
  local expiry_date=$(get_cert_expiry "$domain" "$port")
  
  if [ -z "$expiry_date" ]; then
    error_exit "Failed to retrieve certificate for $domain"
  fi
  
  log "Certificate for $domain expires: $expiry_date"
  
  # Calculate days remaining
  local days_remaining=$(calculate_days_remaining "$expiry_date")
  
  echo "Domain: $domain"
  echo "Expiry Date: $expiry_date"
  echo "Days Remaining: $days_remaining"
  
  # Check if certificate is expired
  if [ "$days_remaining" -lt 0 ]; then
    error "Certificate EXPIRED $((days_remaining * -1)) days ago!"
    send_alert_email \
      "🚨 CRITICAL: SSL Certificate Expired for $domain" \
      "Your SSL certificate for $domain has expired $((days_remaining * -1)) days ago!

Domain: $domain
Expiry Date: $expiry_date
Days Overdue: $((days_remaining * -1))

Please renew immediately using:
  certbot renew --force-renewal

For more information:
  certbot certificates
  
Automated by SSL Certificate Monitor"
    return 1
  fi
  
  # Check if certificate expires soon
  if [ "$days_remaining" -le "$ALERT_DAYS" ]; then
    warning "Certificate expires in $days_remaining days (alert threshold: $ALERT_DAYS days)"
    send_alert_email \
      "⚠️  WARNING: SSL Certificate Expiring Soon for $domain" \
      "Your SSL certificate for $domain will expire in $days_remaining days.

Domain: $domain
Expiry Date: $expiry_date
Days Remaining: $days_remaining
Alert Threshold: $ALERT_DAYS days

Please renew using:
  certbot renew

For more information:
  certbot certificates

Automated by SSL Certificate Monitor"
    return 0
  fi
  
  if [ "$days_remaining" -lt $((ALERT_DAYS * 2)) ]; then
    warning "Certificate expires in $days_remaining days (renewal window approaching)"
  else
    success "Certificate for $domain is valid for $days_remaining more days"
  fi
  
  return 0
}

# Display certificate details
display_cert_details() {
  local domain="$1"
  local port="${2:-443}"
  
  echo ""
  echo "=== Full Certificate Details for $domain ==="
  echo ""
  
  get_cert_details "$domain" "$port" | head -30
  
  echo ""
  echo "=== Certificate Chain ==="
  echo ""
  
  echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | \
    grep "subject=" | head -5
}

# Renew certificate (Let's Encrypt)
renew_certificate() {
  local domain="$1"
  
  log "Attempting to renew certificate for $domain..."
  
  if ! command -v certbot &> /dev/null; then
    error_exit "certbot not found. Install with: sudo apt-get install certbot"
  fi
  
  sudo certbot renew --force-renewal -d "$domain" --quiet && \
    success "Certificate renewed successfully for $domain" || \
    error "Failed to renew certificate for $domain"
}

# List all monitored certificates
list_certificates() {
  log "Listing all certificates managed by certbot..."
  
  if command -v certbot &> /dev/null; then
    sudo certbot certificates
  else
    error "certbot not installed"
  fi
}

# Monitor mode (continuous checking)
monitor_mode() {
  local domain="$1"
  local interval="${2:-3600}"  # Default 1 hour
  
  log "Starting continuous monitoring for $domain (check every ${interval}s)"
  
  while true; do
    check_certificate "$domain" 443
    sleep "$interval"
  done
}

# Help message
show_help() {
  cat << EOF
SSL Certificate Monitoring Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  check [domain] [alert-days]     Check certificate expiry (default)
  details [domain]                Show full certificate details
  renew [domain]                  Renew certificate (Let's Encrypt)
  list                            List all managed certificates
  monitor [domain] [interval]     Continuous monitoring mode
  help                            Show this help message

Examples:
  # Check certificate for fafaaccess.com (alert if expires in 30 days)
  $0 check fafaaccess.com 30
  
  # Show certificate details
  $0 details fafaaccess.com
  
  # Renew certificate
  $0 renew fafaaccess.com
  
  # Monitor continuously (check every hour)
  $0 monitor fafaaccess.com 3600
  
  # List all certificates
  $0 list

Environment Variables:
  SSL_ALERT_EMAIL    Email to send alerts to (default: admin@fafaaccess.com)

Exit Codes:
  0  Certificate is valid
  1  Certificate is expired or will expire soon
  2  Error occurred

EOF
}

# Main script
main() {
  local command="${1:-check}"
  
  case "$command" in
    check)
      check_certificate "$DOMAIN" 443
      ;;
    details)
      display_cert_details "$DOMAIN" 443
      ;;
    renew)
      renew_certificate "$DOMAIN"
      ;;
    list)
      list_certificates
      ;;
    monitor)
      monitor_mode "$DOMAIN" "${2:-3600}"
      ;;
    help|-h|--help)
      show_help
      ;;
    *)
      echo "Unknown command: $command"
      show_help
      exit 1
      ;;
  esac
}

# Run main function
main "$@"
