# Deploy a GitHub + DigitalOcean App Platform

## Estado actual del proyecto

- Es una SPA de Vite/React que genera archivos estaticos en `dist/`.
- El frontend usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- La autenticacion de Supabase usa `window.location.origin` y la ruta `/auth/confirm`.
- Los webhooks de n8n se cargan desde variables `VITE_` del frontend.

## Checklist antes de subir a GitHub

1. Verifica que `.env` no se suba.
2. Revisa que no haya secretos hardcodeados en archivos `.js`, `.ts`, `.tsx`, `.sql` o `.md`.
3. Ejecuta localmente:
   `npm install`
4. Luego valida:
   `npm run build`

## Variables necesarias en `.env`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_N8N_WEBHOOK_URLS_DATA=
VITE_N8N_WEBHOOK_UPDATE_GEMINI_COMMENTS=
VITE_N8N_WEBHOOK_UPDATE_GPT_COMMENTS=
VITE_N8N_WEBHOOK_UPDATE_CLAUDE_COMMENTS=
VITE_N8N_WEBHOOK_UPDATE_SCRIPT=
```

## Crear el repo local y subirlo a GitHub

1. Inicializa git:
   `git init`
2. Cambia a la rama principal:
   `git checkout -b main`
3. Agrega archivos:
   `git add .`
4. Crea el primer commit:
   `git commit -m "Initial import from Bolt"`
5. Crea un repo vacio en GitHub.
6. Conecta el remoto:
   `git remote add origin https://github.com/TU_USUARIO/TU_REPO.git`
7. Sube el codigo:
   `git push -u origin main`

## Configuracion recomendada en DigitalOcean App Platform

### Opcion 1: desde la interfaz

1. Crea una app nueva desde GitHub.
2. Selecciona este repo y la rama `main`.
3. Usa tipo de recurso `Static Site`.
4. Deja `Source Directory` en `/`.
5. Usa `Build Command`:
   `npm run build`
6. Usa `Output Directory`:
   `dist`
7. Agrega variables de entorno de build:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_N8N_WEBHOOK_URLS_DATA`
   - `VITE_N8N_WEBHOOK_UPDATE_GEMINI_COMMENTS`
   - `VITE_N8N_WEBHOOK_UPDATE_GPT_COMMENTS`
   - `VITE_N8N_WEBHOOK_UPDATE_CLAUDE_COMMENTS`
   - `VITE_N8N_WEBHOOK_UPDATE_SCRIPT`
8. En paginas personalizadas, configura `Catchall document` como `index.html`.

### Opcion 2: con app spec despues

Cuando ya tengas el repo creado, puedes versionar un `.do/app.yaml` para repetir el despliegue sin configurarlo a mano cada vez.

## Ajustes en Supabase despues del deploy

1. Ve a `Authentication > URL Configuration`.
2. Define `Site URL` con la URL final de produccion.
3. Agrega al allowlist al menos:
   - `http://localhost:5173/**`
   - `https://TU_APP.ondigitalocean.app/auth/confirm`
4. Si luego usas dominio propio, agrega tambien su variante:
   - `https://tudominio.com/auth/confirm`

## Limpieza opcional recomendada

- `vercel.json` ya no es necesario si te quedas en DigitalOcean.
- `public/_redirects` es util para Netlify, no para App Platform.
- `.bolt/` puede dejarse fuera del repo si solo fue parte del export.
- Las variables `VITE_` del frontend no son secretas en produccion; si necesitas ocultar esos webhooks, debes mover la llamada a un backend o edge function.
