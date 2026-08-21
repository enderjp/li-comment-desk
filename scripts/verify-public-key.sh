#!/usr/bin/env bash
#
# Verifica que una API key publica de Supabase pueda leer public_comments
# y nada mas. Uso:
#
#   ./scripts/verify-public-key.sh sb_publishable_xxx [URL]
#
# La URL sale de VITE_SUPABASE_URL en .env si no se pasa como segundo arg.

set -uo pipefail

KEY="${1:-}"
if [ -z "$KEY" ]; then
  echo "uso: $0 <publishable-key> [url]" >&2
  exit 2
fi

# tr -d '\r' porque el .env esta en CRLF y el \r corrompe la URL
URL="${2:-$(grep -m1 '^VITE_SUPABASE_URL=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r"')}"
if [ -z "$URL" ]; then
  echo "no encontre la URL: pasala como segundo argumento" >&2
  exit 2
fi

# Tablas que deben estar cerradas para una key publica.
CLOSED=(comments profiles notifications request_errors prompt_templates
        gemini_comments gpt_comments claude_comments
        media_buyer vertical customer_service_agents)

fails=0
ok()   { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
bad()  { printf '  \033[31mFALLA\033[0m %s\n' "$1"; fails=$((fails + 1)); }

get() { curl -s --max-time 20 "$URL/rest/v1/$1" -H "apikey: $KEY"; }

echo "URL: $URL"
echo "key: ${KEY:0:16}…  (largo ${#KEY})"

echo
echo "1. lectura de public_comments"
body=$(get 'public_comments?select=*&limit=3')
rows=$(printf '%s' "$body" | python3 -c 'import sys,json
try: d = json.load(sys.stdin)
except Exception: print(-1); raise SystemExit
print(len(d) if isinstance(d, list) else -1)')
if [ "$rows" -gt 0 ]; then
  cols=$(printf '%s' "$body" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)[0]))')
  ok "devuelve $rows filas, $cols columnas"
elif [ "$rows" = "0" ]; then
  bad "responde pero sin filas (revisa el GRANT o los filtros de la vista)"
else
  bad "no devolvio una lista: $(printf '%s' "$body" | head -c 120)"
fi

echo
echo "2. escritura rechazada"
code=$(curl -s --max-time 20 -o /dev/null -w '%{http_code}' \
  -X PATCH "$URL/rest/v1/public_comments?id=eq.1" \
  -H "apikey: $KEY" -H 'Content-Type: application/json' -d '{"script":"probe"}')
case "$code" in
  401|403) ok "PATCH rechazado (http $code)" ;;
  *)       bad "PATCH devolvio http $code, deberia ser 401/403" ;;
esac

echo
echo "3. tablas base cerradas"
for t in "${CLOSED[@]}"; do
  body=$(get "$t?select=*&limit=1")
  case "$body" in
    '[]')  ok "$t vacio" ;;
    '['*)  bad "$t DEVUELVE DATOS" ;;
    *)     ok "$t sin acceso ($(printf '%s' "$body" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("code","?"))' 2>/dev/null || echo '?'))" ;;
  esac
done

echo
if [ "$fails" -eq 0 ]; then
  echo "Todo OK: la key lee public_comments y nada mas."
else
  echo "$fails verificacion(es) fallaron."
fi
exit $((fails > 0))
