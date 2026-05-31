#!/bin/bash

# Script para testar permissões do CarteiraPessoal
# Uso: ./test_permissions.sh [grant|revoke|check|all]

PACKAGE_NAME="com.carteirapessoal"
PERMISSIONS=(
  "android.permission.ACCESS_FINE_LOCATION"
  "android.permission.ACCESS_COARSE_LOCATION"
  "android.permission.SEND_SMS"
  "android.permission.READ_SMS"
  "android.permission.RECEIVE_SMS"
  "android.permission.READ_CONTACTS"
)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Teste de Permissões - CarteiraPessoal${NC}\n"

# Função para grantar permissões
grant_permissions() {
  echo -e "${GREEN}✓ Concedendo todas as permissões...${NC}"
  for perm in "${PERMISSIONS[@]}"; do
    adb shell pm grant $PACKAGE_NAME "$perm"
    echo "  → Concedida: $perm"
  done
  echo -e "${GREEN}✓ Todas as permissões concedidas!${NC}\n"
}

# Função para revogar permissões
revoke_permissions() {
  echo -e "${RED}✗ Revogando todas as permissões...${NC}"
  for perm in "${PERMISSIONS[@]}"; do
    adb shell pm revoke $PACKAGE_NAME "$perm"
    echo "  → Revogada: $perm"
  done
  echo -e "${RED}✗ Todas as permissões revogadas!${NC}\n"
}

# Função para verificar status
check_permissions() {
  echo -e "${YELLOW}📋 Status das Permissões:${NC}\n"
  
  local location_fine=$(adb shell pm dump $PACKAGE_NAME | grep "android.permission.ACCESS_FINE_LOCATION" | grep "granted")
  local location_coarse=$(adb shell pm dump $PACKAGE_NAME | grep "android.permission.ACCESS_COARSE_LOCATION" | grep "granted")
  local sms=$(adb shell pm dump $PACKAGE_NAME | grep "android.permission.SEND_SMS" | grep "granted")
  
  if [ ! -z "$location_fine" ] && [ ! -z "$location_coarse" ]; then
    echo -e "${GREEN}✓ Localização: CONCEDIDA${NC}"
  else
    echo -e "${RED}✗ Localização: NEGADA${NC}"
  fi
  
  if [ ! -z "$sms" ]; then
    echo -e "${GREEN}✓ SMS: CONCEDIDA${NC}"
  else
    echo -e "${RED}✗ SMS: NEGADA${NC}"
  fi
  echo ""
}

# Função para ver logs
show_logs() {
  echo -e "${YELLOW}📱 Logs de Permissões (pressione Ctrl+C para parar):${NC}\n"
  adb logcat | grep -i "permission\|permission_request" 2>/dev/null || adb logcat
}

# Função para teste completo
run_all_tests() {
  echo -e "${YELLOW}🧪 Executando Teste Completo...${NC}\n"
  
  echo "1️⃣  Estado inicial:"
  check_permissions
  
  echo "2️⃣  Concedendo todas as permissões..."
  grant_permissions
  check_permissions
  
  echo "3️⃣  Estado após concessão:"
  check_permissions
  
  echo "4️⃣  Revogando todas as permissões..."
  revoke_permissions
  check_permissions
  
  echo -e "${GREEN}✓ Teste completo finalizado!${NC}\n"
}

# Menu principal
case "${1:-help}" in
  grant)
    grant_permissions
    check_permissions
    ;;
  revoke)
    revoke_permissions
    check_permissions
    ;;
  check)
    check_permissions
    ;;
  logs)
    show_logs
    ;;
  all)
    run_all_tests
    ;;
  *)
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  grant   - Conceder todas as permissões"
    echo "  revoke  - Revogar todas as permissões"
    echo "  check   - Verificar status das permissões"
    echo "  logs    - Ver logs em tempo real"
    echo "  all     - Executar teste completo"
    echo ""
    echo "Exemplo:"
    echo "  $0 grant"
    echo "  $0 check"
    echo "  $0 all"
    ;;
esac
