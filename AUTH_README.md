# 🔐 Sistema de Autenticación - English27

> Sistema de autenticación profesional basado en REST API con Next.js 15 y Supabase

---

## 🎯 ¿Qué se implementó?

Un sistema de autenticación **COMPLETO** donde:

- ✅ TODO el login pasa por `/api/auth/login`
- ✅ TODO el logout pasa por `/api/auth/logout`
- ✅ El registro pasa por `/api/auth/register`
- ✅ La sesión se obtiene desde `/api/auth/me`
- ✅ El frontend NO usa `supabase.auth` directamente
- ✅ Las sesiones se guardan en cookies httpOnly
- ✅ Soporte para 3 roles: estudiante, docente, administrador
- ✅ Validación de usuarios activos y aprobados

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 2. Configurar variables de entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Configurar base de datos

Ejecuta el SQL en `INSTALACION_AUTH.md` → Paso 4

### 4. Iniciar servidor

```bash
npm run dev
```

### 5. Probar

1. Ve a `http://localhost:3000`
2. Regístrate como estudiante o docente
3. Aprueba el usuario en Supabase Dashboard
4. Inicia sesión
5. ¡Listo! 🎉

---

## 📁 Archivos Creados

### API Routes (Backend)
```
app/api/auth/
├── register/route.ts    ← Registro de usuarios
├── login/route.ts       ← Inicio de sesión
├── logout/route.ts      ← Cierre de sesión
└── me/route.ts          ← Usuario actual
```

### Servicios y Contextos (Frontend)
```
src/
├── types/auth.types.ts           ← Tipos TypeScript
├── lib/
│   ├── supabase-server.ts        ← Cliente server-side
│   ├── supabase-browser.ts       ← Cliente browser-side
│   └── get-current-user.ts       ← Helpers de sesión
├── services/
│   └── auth.service.ts           ← Servicio de autenticación
├── contexts/
│   └── AuthContext.tsx           ← Contexto global
└── components/features/auth/
    ├── LogoutButton.tsx          ← Botón de logout
    └── ProtectedRoute.tsx        ← Protección de rutas
```

### Documentación
```
docs/
├── ARQUITECTURA_AUTH.md          ← Arquitectura detallada
├── EJEMPLOS_USO_AUTH.md          ← Ejemplos de código
└── RESUMEN_AUTH_SISTEMA.md       ← Resumen ejecutivo

INSTALACION_AUTH.md               ← Guía de instalación
AUTH_README.md                    ← Este archivo
```

---

## 🔄 Flujo de Autenticación

### Registro
```
1. Usuario completa formulario
2. Frontend → POST /api/auth/register
3. Backend crea usuario en Supabase Auth
4. Backend crea registro en tabla usuarios
5. Backend cierra sesión automática
6. Usuario espera aprobación del admin
```

### Login
```
1. Usuario ingresa email/password
2. Frontend → POST /api/auth/login
3. Backend valida credenciales con Supabase
4. Backend valida que usuario esté activo y aprobado
5. Backend guarda sesión en cookies httpOnly
6. Frontend recibe datos del usuario
7. Redirección según rol:
   - admin → /dashboard/admin
   - docente → /dashboard/docente
   - estudiante → /dashboard/estudiante
```

### Verificar Sesión
```
1. App carga
2. AuthContext → GET /api/auth/me
3. Backend lee cookies
4. Backend obtiene usuario de Supabase
5. Backend obtiene datos de tabla usuarios
6. Frontend actualiza estado global
```

### Logout
```
1. Usuario click en "Cerrar Sesión"
2. Frontend → POST /api/auth/logout
3. Backend elimina sesión de Supabase
4. Backend elimina cookies
5. Frontend limpia estado
6. Redirección a página principal
```

---

## 💻 Ejemplos de Uso

### Usar en un Componente

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/features/auth/LogoutButton';

export default function MiComponente() {
  const { user, usuario, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;

  return (
    <div>
      <h1>Hola, {usuario?.nombre}!</h1>
      <p>Rol: {usuario?.rol}</p>
      <LogoutButton />
    </div>
  );
}
```

### Proteger una Ruta

```tsx
import ProtectedRoute from '@/components/features/auth/ProtectedRoute';

export default function DashboardEstudiante() {
  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div>Contenido solo para estudiantes</div>
    </ProtectedRoute>
  );
}
```

### Llamar API Protegida

```tsx
// En cualquier servicio
async function getData() {
  const response = await fetch('/api/mi-endpoint', {
    method: 'GET',
    credentials: 'include', // ← IMPORTANTE: Enviar cookies
  });
  
  return response.json();
}
```

### Proteger API Route

```tsx
// app/api/mi-endpoint/route.ts
import { requireAuth, requireRole } from '@/lib/get-current-user';

export async function GET() {
  // Solo usuarios autenticados
  const session = await requireAuth();
  
  // O solo roles específicos
  const session = await requireRole(['docente', 'administrador']);
  
  // Tu lógica aquí...
}
```

---

## 🔐 Seguridad

### ✅ Implementado

- **Cookies httpOnly**: No accesibles desde JavaScript
- **Cookies Secure**: Solo HTTPS en producción
- **SameSite**: Protección contra CSRF
- **Sin localStorage**: Sin exposición de tokens
- **Validación Backend**: Cada request validado
- **RLS Supabase**: Seguridad a nivel de base de datos
- **ANON KEY**: No se expone service_role

### 🛡️ Validaciones

- Usuario debe existir en la base de datos
- Usuario debe estar activo (`activo = true`)
- Usuario debe estar aprobado (`aprobado = true`)
- Contraseña mínimo 6 caracteres
- Email válido y único

---

## 👥 Roles

### Estudiante
- ✅ Ver su propio progreso
- ✅ Completar actividades
- ❌ No puede crear actividades
- ❌ No puede ver otros usuarios

### Docente
- ✅ Crear actividades
- ✅ Ver estudiantes
- ✅ Asignar actividades
- ❌ No puede gestionar usuarios

### Administrador
- ✅ Gestión completa de usuarios
- ✅ Aprobar/rechazar cuentas
- ✅ Ver estadísticas globales
- ✅ Todos los permisos

---

## 🧪 Testing

### Probar con cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  -c cookies.txt

# Usuario actual
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Verificar Cookies

1. Abre DevTools (F12)
2. Application → Cookies
3. Busca cookies que empiecen con `sb-`
4. Verifica que tengan `HttpOnly` y `Secure` (en producción)

---

## 🐛 Solución de Problemas

### "No autenticado" al hacer login

**Causa**: Usuario no aprobado o inactivo

**Solución**:
```sql
UPDATE usuarios
SET aprobado = true, activo = true
WHERE email = 'tu-email@example.com';
```

### Cookies no se guardan

**Causa**: Falta `credentials: 'include'` en fetch

**Solución**:
```tsx
fetch('/api/auth/login', {
  credentials: 'include', // ← Agregar esto
  // ...
});
```

### "User not found in database"

**Causa**: Trigger no se ejecutó

**Solución**: Crear usuario manualmente en tabla `usuarios`

### Error de CORS

**Causa**: Configuración incorrecta

**Solución**: Asegúrate de que frontend y backend estén en el mismo dominio

---

## 📚 Documentación Completa

Para más detalles, consulta:

1. **[INSTALACION_AUTH.md](./INSTALACION_AUTH.md)** - Guía paso a paso
2. **[ARQUITECTURA_AUTH.md](./docs/ARQUITECTURA_AUTH.md)** - Arquitectura detallada
3. **[EJEMPLOS_USO_AUTH.md](./docs/EJEMPLOS_USO_AUTH.md)** - Ejemplos de código
4. **[RESUMEN_AUTH_SISTEMA.md](./docs/RESUMEN_AUTH_SISTEMA.md)** - Resumen ejecutivo

---

## ✅ Checklist de Implementación

- [ ] Instalar dependencias
- [ ] Configurar variables de entorno
- [ ] Crear tabla `usuarios` en Supabase
- [ ] Configurar RLS
- [ ] Crear triggers
- [ ] Copiar archivos de código
- [ ] Actualizar `app/layout.tsx` con `AuthProvider`
- [ ] Crear usuario administrador inicial
- [ ] Probar registro
- [ ] Probar login
- [ ] Probar logout
- [ ] Verificar cookies
- [ ] Probar protección de rutas

---

## 🎓 Para tu Tesis

### Puntos Clave

1. **Arquitectura REST API propia** en lugar de cliente directo
2. **Cookies httpOnly** para máxima seguridad
3. **Separación de responsabilidades** (Frontend/Backend)
4. **Validación en múltiples capas** (Frontend + Backend + DB)
5. **Escalabilidad** mediante API Routes independientes

### Diagrama para Tesis

Ver `docs/ARQUITECTURA_AUTH.md` para diagramas completos.

---

## 🚀 Próximos Pasos

1. ✅ Sistema de autenticación (COMPLETADO)
2. ⏭️ Implementar recuperación de contraseña
3. ⏭️ Agregar autenticación con Google/GitHub
4. ⏭️ Implementar refresh tokens
5. ⏭️ Agregar tests unitarios
6. ⏭️ Agregar tests E2E

---

## 📞 Soporte

¿Problemas? Revisa:
1. La guía de instalación
2. La sección de solución de problemas
3. Los ejemplos de uso
4. La documentación de arquitectura

---

## 🙏 Créditos

- **Next.js** - Framework React
- **Supabase** - Backend as a Service
- **TypeScript** - Type Safety

---

**Desarrollado para**: Unidad Educativa Delice  
**Proyecto**: English27  
**Versión**: 1.0.0  
**Estado**: ✅ Producción  
**Fecha**: 2024

---

## 📄 Licencia

Este proyecto es privado y está desarrollado para uso educativo.

---

**¡Sistema listo para usar!** 🎉

Para comenzar, sigue la guía en `INSTALACION_AUTH.md`
