# Configuración de Supabase para Email Confirmation

## ✅ LA RUTA YA EXISTE EN TU APLICACIÓN

La página `/auth/confirm` **ya está funcionando** en tu código. Solo necesitas autorizar esta URL en Supabase.

## 🚨 PASO OBLIGATORIO - Configura Supabase AHORA:

1. Abre: https://supabase.com/dashboard/project/wmfhrhgevyrjjswkblgt
2. Ve a: **Authentication** → **URL Configuration**
3. En **Redirect URLs**, agrega estas URLs (copia y pega exactamente):

**Para Bolt.new (IMPORTANTE - Agrega esta primero):**
```
https://bolt.new/~/sb1-wrxd6vpu
```

**Para desarrollo local:**
```
http://localhost:5173
```

**Para producción (Vercel/Netlify):**
Después de desplegar, agrega:
```
https://tu-app.vercel.app
```

4. **Guarda los cambios y espera 1-2 minutos**

## Verificar la configuración:

1. La URL debe ser exactamente la raíz de tu aplicación (SIN rutas adicionales)
2. Asegúrate de guardar los cambios en Supabase
3. Puede tomar unos minutos para que los cambios se apliquen

## Cómo funciona:

1. El usuario se registra en la plataforma
2. Supabase envía un email con un enlace de confirmación
3. Cuando el usuario hace clic en el enlace, es redirigido a la raíz con el token en el hash
4. La aplicación React detecta automáticamente el token de confirmación en la URL
5. Se muestra la página de confirmación exitosa
6. El usuario puede hacer clic en "Ir al Login" para acceder a la plataforma

## Solución de problemas:

Si ves un error de "página no disponible":
- Verifica que las URLs de redirección estén configuradas correctamente en Supabase
- Asegúrate de que la URL coincida exactamente con la configurada
- Revisa la consola del navegador para ver errores adicionales
