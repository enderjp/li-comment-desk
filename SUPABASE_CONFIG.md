# Configuración de Supabase para Email Confirmation y Password Reset

## ✅ LAS RUTAS YA EXISTEN EN TU APLICACIÓN

Las páginas `/auth/confirm` y `/auth/reset-password` **ya están implementadas**. Solo necesitas autorizar sus URLs en Supabase.

## 🚨 PASO OBLIGATORIO - Configura Supabase AHORA:

1. Abre: https://supabase.com/dashboard/project/wmfhrhgevyrjjswkblgt
2. Ve a: **Authentication** → **URL Configuration**
3. En **Redirect URLs**, agrega estas URLs (copia y pega exactamente):

**Para Bolt.new (IMPORTANTE - Agrega esta primero):**
```
https://bolt.new/~/sb1-wrxd6vpu
```

**Para desarrollo local (Vite):**
```
http://localhost:5173/auth/confirm
http://localhost:5173/auth/reset-password
```

**Para producción:**
```
https://comment-desk.leadsicon.com/
https://comment-desk.leadsicon.com/auth/confirm
```

4. **Guarda los cambios y espera 1-2 minutos**

## Verificar la configuración:

1. Las URLs deben incluir las rutas exactas indicadas arriba
2. Asegúrate de guardar los cambios en Supabase
3. Puede tomar unos minutos para que los cambios se apliquen

## Cómo funciona:

1. El usuario se registra en la plataforma
2. Supabase envía un email con un enlace de confirmación
3. Cuando el usuario hace clic en el enlace, es redirigido a la raíz con el token en el hash
4. La aplicación React detecta automáticamente el token de confirmación en la URL
5. Se muestra la página de confirmación exitosa
6. El usuario puede hacer clic en "Ir al Login" para acceder a la plataforma

## Cómo funciona la recuperación de contraseña:

1. El usuario selecciona "¿Olvidaste tu contraseña?" en el login
2. Supabase envía un correo sin revelar si la cuenta existe
3. El enlace vuelve a la raíz y crea una sesión de recuperación temporal
4. La aplicación detecta `PASSWORD_RECOVERY` y muestra el formulario de nueva contraseña
5. El usuario escribe y confirma su nueva contraseña
6. La aplicación actualiza la contraseña y cierra la sesión de recuperación

## Solución de problemas:

Si ves un error de "página no disponible":
- Verifica que las URLs de redirección estén configuradas correctamente en Supabase
- Asegúrate de que la URL coincida exactamente con la configurada
- Revisa la consola del navegador para ver errores adicionales
