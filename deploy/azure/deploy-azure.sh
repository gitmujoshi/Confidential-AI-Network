#!/bin/bash
# Run the local Confidential AI Network stack on one Azure VM.
#
# This is the laptop layout: Postgres and Keycloak in Docker, then the API
# and the UI from this checkout. It does not create AKS, Azure Database for
# PostgreSQL, Key Vault, or an application gateway.
#
# Usage:
#   ./deployment/deploy-azure.sh vm          # print the plan
#   ./deployment/deploy-azure.sh vm -y       # create the VM and start the stack
#   ./deployment/deploy-azure.sh vm cleanup -y

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-can-local-vm-rg}"
LOCATION="${AZURE_LOCATION:-eastus}"
VM_NAME="${AZURE_VM_NAME:-can-local}"
VM_SIZE="${AZURE_VM_SIZE:-Standard_D4s_v5}"
VM_IMAGE="${AZURE_VM_IMAGE:-Canonical:0001-com-ubuntu-server-jammy:22_04-lts:latest}"
ADMIN_USERNAME="${AZURE_ADMIN_USERNAME:-azureuser}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa.pub}"
VNET_NAME="${VM_NAME}-vnet"
SUBNET_NAME="${VM_NAME}-subnet"
NSG_NAME="${VM_NAME}-nsg"
PUBLIC_IP_NAME="${VM_NAME}-ip"
REMOTE_DIR="Confidential-AI-Network"

AUTO_APPROVE=false
ACTION="deploy"

for arg in "$@"; do
  case "$arg" in
    -y|--yes) AUTO_APPROVE=true ;;
    cleanup|destroy) ACTION="cleanup" ;;
    info) ACTION="info" ;;
    help|-h|--help) ACTION="help" ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: ./deployment/deploy-azure.sh vm [-y|cleanup -y|info]" >&2
      exit 1
      ;;
  esac
done

print_plan() {
  cat <<EOF
Local instance on one Azure VM

This copies this checkout to a single Ubuntu VM and runs ./start-system.sh.
Keycloak and both Postgres databases stay in Docker on that VM.
Nothing is created until you pass -y.

  Resource group: ${RESOURCE_GROUP}
  Location:       ${LOCATION}
  VM:             ${VM_NAME} (${VM_SIZE})
  SSH user:       ${ADMIN_USERNAME}
  SSH key:        ${SSH_KEY_PATH}

Network rules allow SSH, the UI (3000), the API (5001), and Keycloak
(8080 and 8443) only from AZURE_VM_SOURCE_CIDR, or from this machine's
public address when that variable is unset. Database ports stay closed.
The script refuses 0.0.0.0/0.

Requires config.env and secrets.env in the repo root. Those files are
copied to the VM and are not printed.

  ./deployment/deploy-azure.sh vm -y
EOF
}

require_file() {
  local path="$1"
  local label="$2"
  if [ ! -f "$path" ]; then
    echo "Missing ${label}: ${path}" >&2
    exit 1
  fi
}

az_exists() {
  az "$@" >/dev/null 2>&1
}

ensure_nsg_rule() {
  local name="$1"
  local priority="$2"
  local port="$3"
  local cidr="$4"
  if az_exists network nsg rule show --resource-group "$RESOURCE_GROUP" --nsg-name "$NSG_NAME" --name "$name"; then
    az network nsg rule update \
      --resource-group "$RESOURCE_GROUP" \
      --nsg-name "$NSG_NAME" \
      --name "$name" \
      --source-address-prefixes "$cidr" \
      --destination-port-ranges "$port" \
      --access Allow \
      --protocol Tcp \
      --output none
  else
    az network nsg rule create \
      --resource-group "$RESOURCE_GROUP" \
      --nsg-name "$NSG_NAME" \
      --name "$name" \
      --priority "$priority" \
      --source-address-prefixes "$cidr" \
      --destination-port-ranges "$port" \
      --access Allow \
      --protocol Tcp \
      --output none
  fi
}

vm_public_ip() {
  az vm show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --show-details \
    --query publicIps \
    --output tsv
}

wait_for_ssh() {
  local ip="$1"
  local attempt
  for attempt in $(seq 1 36); do
    if ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 \
      "${ADMIN_USERNAME}@${ip}" true 2>/dev/null; then
      return 0
    fi
    sleep 5
  done
  echo "SSH to ${ip} did not become ready." >&2
  exit 1
}

create_vm() {
  local source_cidr="$1"

  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

  if ! az_exists network vnet show --resource-group "$RESOURCE_GROUP" --name "$VNET_NAME"; then
    az network vnet create \
      --resource-group "$RESOURCE_GROUP" \
      --name "$VNET_NAME" \
      --address-prefix 10.20.0.0/16 \
      --subnet-name "$SUBNET_NAME" \
      --subnet-prefix 10.20.1.0/24 \
      --output none
  fi

  if ! az_exists network nsg show --resource-group "$RESOURCE_GROUP" --name "$NSG_NAME"; then
    az network nsg create --resource-group "$RESOURCE_GROUP" --name "$NSG_NAME" --output none
  fi

  ensure_nsg_rule SSH 1000 22 "$source_cidr"
  ensure_nsg_rule UI 1010 3000 "$source_cidr"
  ensure_nsg_rule API 1020 5001 "$source_cidr"
  ensure_nsg_rule KeycloakHttp 1030 8080 "$source_cidr"
  ensure_nsg_rule KeycloakHttps 1040 8443 "$source_cidr"

  if ! az_exists network public-ip show --resource-group "$RESOURCE_GROUP" --name "$PUBLIC_IP_NAME"; then
    az network public-ip create \
      --resource-group "$RESOURCE_GROUP" \
      --name "$PUBLIC_IP_NAME" \
      --allocation-method Static \
      --sku Standard \
      --output none
  fi

  if ! az_exists vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME"; then
    az vm create \
      --resource-group "$RESOURCE_GROUP" \
      --name "$VM_NAME" \
      --image "$VM_IMAGE" \
      --size "$VM_SIZE" \
      --admin-username "$ADMIN_USERNAME" \
      --ssh-key-values "$(cat "$SSH_KEY_PATH")" \
      --vnet-name "$VNET_NAME" \
      --subnet "$SUBNET_NAME" \
      --nsg "$NSG_NAME" \
      --public-ip-address "$PUBLIC_IP_NAME" \
      --storage-sku Premium_LRS \
      --output none
  fi
}

install_runtime() {
  local ip="$1"
  ssh -o StrictHostKeyChecking=accept-new "${ADMIN_USERNAME}@${ip}" bash -s <<'EOF'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v20\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y git ca-certificates curl
cd "$HOME/Confidential-AI-Network"
npm install --prefix backend
npm install --prefix frontend
EOF
}

start_stack() {
  local ip="$1"
  ssh -o StrictHostKeyChecking=accept-new "${ADMIN_USERNAME}@${ip}" \
    "cd ~/${REMOTE_DIR} && sg docker -c 'HOST=0.0.0.0 BROWSER=none DANGEROUSLY_DISABLE_HOST_CHECK=true REACT_APP_API_URL=http://${ip}:5001 ./start-system.sh'"
}

sync_checkout() {
  local ip="$1"
  rsync -az \
    --exclude node_modules \
    --exclude logs \
    --exclude .terraform \
    --exclude '*.tfstate' \
    --exclude '*.tfstate.*' \
    --exclude terraform.tfvars \
    -e "ssh -o StrictHostKeyChecking=accept-new" \
    "${REPO_ROOT}/" "${ADMIN_USERNAME}@${ip}:~/${REMOTE_DIR}/"
}

deploy() {
  if [ "$AUTO_APPROVE" != true ]; then
    print_plan
    exit 0
  fi

  command -v az >/dev/null 2>&1 || { echo "Install the Azure CLI and run az login." >&2; exit 1; }
  command -v rsync >/dev/null 2>&1 || { echo "Install rsync. The VM receives this checkout, not a fresh git clone." >&2; exit 1; }
  az account show >/dev/null 2>&1 || { echo "Run az login first." >&2; exit 1; }
  require_file "$SSH_KEY_PATH" "SSH public key"
  require_file "${REPO_ROOT}/config.env" "config.env"
  require_file "${REPO_ROOT}/secrets.env" "secrets.env"

  local source_cidr="${AZURE_VM_SOURCE_CIDR:-}"
  if [ -z "$source_cidr" ]; then
    local caller_ip
    caller_ip="$(curl -fsS --max-time 5 https://api.ipify.org || true)"
    if [ -n "$caller_ip" ]; then
      source_cidr="${caller_ip}/32"
    fi
  fi
  if [ -z "$source_cidr" ] || [ "$source_cidr" = "0.0.0.0/0" ] || [ "$source_cidr" = "*" ]; then
    echo "Set AZURE_VM_SOURCE_CIDR to your public address, for example 203.0.113.10/32." >&2
    echo "This script does not open the VM to every address." >&2
    exit 1
  fi

  echo "Creating ${VM_NAME} in ${RESOURCE_GROUP}. Access is limited to ${source_cidr}."
  create_vm "$source_cidr"
  local ip
  ip="$(vm_public_ip)"
  echo "Waiting for SSH on ${ip}."
  wait_for_ssh "$ip"
  echo "Copying this checkout."
  sync_checkout "$ip"
  echo "Installing Docker and Node on the VM."
  install_runtime "$ip"
  echo "Starting the local stack."
  start_stack "$ip"

  cat <<EOF

Local instance is running on the VM.
  UI:       http://${ip}:3000
  API:      http://${ip}:5001/health
  Keycloak: the API on the VM uses KEYCLOAK_URL from config.env
  SSH:      ssh ${ADMIN_USERNAME}@${ip}

Postgres and Keycloak data stay on this VM. This is the local stack, not the AKS deploy.
EOF
}

cleanup() {
  if [ "$AUTO_APPROVE" != true ]; then
    echo "This deletes resource group ${RESOURCE_GROUP}."
    echo "Re-run with: ./deployment/deploy-azure.sh vm cleanup -y"
    exit 0
  fi
  az account show >/dev/null 2>&1 || { echo "Run az login first." >&2; exit 1; }
  az group delete --name "$RESOURCE_GROUP" --yes --no-wait
  echo "Deletion of ${RESOURCE_GROUP} has started."
}

info() {
  az account show >/dev/null 2>&1 || { echo "Run az login first." >&2; exit 1; }
  local ip
  ip="$(vm_public_ip)"
  echo "Resource group: ${RESOURCE_GROUP}"
  echo "VM: ${VM_NAME}"
  echo "Public IP: ${ip}"
  echo "UI: http://${ip}:3000"
  echo "API: http://${ip}:5001/health"
}

case "$ACTION" in
  help)
    print_plan
    ;;
  cleanup)
    cleanup
    ;;
  info)
    info
    ;;
  deploy)
    deploy
    ;;
esac
