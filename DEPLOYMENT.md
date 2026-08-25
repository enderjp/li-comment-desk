# Deploy a GitHub + DigitalOcean App Platform

## Estado actual del proyecto

- Es una SPA de Vite/React que genera archivos estaticos en `dist/`.
- El frontend usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- La autenticacion de Supabase usa `window.location.origin` y las rutas
  `/auth/confirm` y `/auth/reset-password`.
- Los webhooks de n8n se llaman a traves de la edge function `n8n-proxy`; sus URLs viven en secrets de Supabase, no en el bundle.

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
```

Las URLs de n8n ya no son variables `VITE_`. Ver "Proxy de webhooks n8n" mas abajo.

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
8. En paginas personalizadas, configura `Catchall document` como `index.html`.

### Opcion 2: con app spec despues

Cuando ya tengas el repo creado, puedes versionar un `.do/app.yaml` para repetir el despliegue sin configurarlo a mano cada vez.

## Ajustes en Supabase despues del deploy

1. Ve a `Authentication > URL Configuration`.
2. Define `Site URL` con la URL final de produccion.
3. Agrega al allowlist al menos:
   - `http://localhost:5173/**`
   - `https://comment-desk.leadsicon.com/auth/confirm`
   - `https://comment-desk.leadsicon.com/auth/reset-password`
4. Si luego usas dominio propio, agrega tambien su variante:
   - `https://tudominio.com/auth/confirm`
   - `https://tudominio.com/auth/reset-password`

## Limpieza opcional recomendada

- `vercel.json` ya no es necesario si te quedas en DigitalOcean.
- `public/_redirects` es util para Netlify, no para App Platform.
- `.bolt/` puede dejarse fuera del repo si solo fue parte del export.
- Las variables `VITE_` del frontend no son secretas en produccion. Por eso los webhooks de n8n pasan por `n8n-proxy` (ver abajo).

## Proxy de webhooks n8n

Las siete llamadas a n8n pasan por la edge function `supabase/functions/n8n-proxy`.
El navegador nunca ve las URLs de n8n ni el token compartido.

Flujo: `callWebhook(target, payload)` -> `POST /functions/v1/n8n-proxy/<target>`
con el JWT del usuario -> la funcion valida sesion y rol -> reenvia a n8n con
la cabecera `X-Webhook-Token`.

### Targets

| Target | Secret con la URL | Requiere admin |
|---|---|---|
| `createComments` | `N8N_WEBHOOK_URLS_DATA` | no |
| `regenerateGemini` | `N8N_WEBHOOK_UPDATE_GEMINI_COMMENTS` | no |
| `regenerateGpt` | `N8N_WEBHOOK_UPDATE_GPT_COMMENTS` | no |
| `regenerateClaude` | `N8N_WEBHOOK_UPDATE_CLAUDE_COMMENTS` | no |
| `regenerateScript` | `N8N_WEBHOOK_UPDATE_SCRIPT` | no |
| `reprocessErrors` | `N8N_WEBHOOK_REPROCESS_ERRORS` | si |
| `updateFacebookCookies` | `N8N_WEBHOOK_UPDATE_FB_COOKIES` | si |

El rol se lee de `profiles.role`. `SUPABASE_URL`, `SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automaticamente.

### Puesta en marcha

1. Carga los secrets (lee las URLs de `.env`, genera el token y lo imprime una vez):
   `./scripts-set-n8n-secrets.sh`
2. Despliega la funcion:
   `supabase functions deploy n8n-proxy`
3. En cada uno de los 7 workflows de n8n, en el nodo Webhook:
   - Authentication: `Header Auth`
   - Credencial nueva: Name `X-Webhook-Token`, Value = el token del paso 1
4. Comprueba que un usuario no-admin recibe 403 en `reprocessErrors`.

### Nota sobre `userId`

La funcion sobrescribe `userId` / `UserId` del payload con el id del JWT, asi
que ya no es falsificable desde el navegador. Los workflows de n8n siguen
recibiendo el mismo campo con el mismo nombre.

## Cambio administrativo de contrasena

La edge function `supabase/functions/update-user-password` permite que un
administrador cambie la contrasena de un usuario sin exponer la
`SUPABASE_SERVICE_ROLE_KEY` en el navegador.

La funcion exige:

- un JWT valido en la cabecera `Authorization`;
- que el usuario autenticado tenga `profiles.role = 'admin'`;
- un `userId` UUID valido;
- una contrasena de entre 8 y 72 caracteres.

Ejemplo desde codigo cliente autenticado:

```ts
const { data, error } = await supabase.functions.invoke('update-user-password', {
  body: {
    userId,
    password,
  },
})
```

No guardes contrasenas en el repositorio, logs, variables `VITE_` ni historial
del shell. La funcion tampoco registra la contrasena recibida.

Para desplegarla manualmente:

```sh
supabase functions deploy update-user-password
```
