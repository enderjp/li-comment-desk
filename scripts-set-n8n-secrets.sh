#!/usr/bin/env bash
# Loads the n8n webhook URLs into Supabase secrets, reading them from the
# commented-out VITE_N8N_* lines left in .env. Values are never printed.
set -euo pipefail

PROJECT_REF="wmfhrhgevyrjjswkblgt"
# Override with e.g. SUPABASE_CMD="npx supabase@latest" if the CLI is not installed.
SUPABASE_CMD="${SUPABASE_CMD:-supabase}"

if [ ! -f .env ]; then
  echo "No .env found in $(pwd)" >&2
  exit 1
fi

args=()
while IFS= read -r line; do
  pair="${line#*VITE_}"          # strip the leading comment marker
  key="${pair%%=*}"             # VITE_N8N_FOO -> N8N_FOO
  value="${pair#*=}"
  [ -z "$value" ] && continue
  args+=("${key}=${value}")
  echo "  will set ${key}"
done < <(grep -oE 'VITE_N8N_[A-Z_]+=.+' .env)

if [ ${#args[@]} -eq 0 ]; then
  echo "No VITE_N8N_* values found in .env" >&2
  exit 1
fi

# Shared secret sent to n8n as the X-Webhook-Token header.
if [ -z "${N8N_WEBHOOK_TOKEN:-}" ]; then
  N8N_WEBHOOK_TOKEN="$(openssl rand -hex 32)"
  echo
  echo "Generated N8N_WEBHOOK_TOKEN (paste this into each n8n Header Auth credential):"
  echo "  $N8N_WEBHOOK_TOKEN"
  echo
fi
args+=("N8N_WEBHOOK_TOKEN=${N8N_WEBHOOK_TOKEN}")

$SUPABASE_CMD secrets set --project-ref "$PROJECT_REF" "${args[@]}"
