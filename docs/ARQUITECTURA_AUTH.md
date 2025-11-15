# 🔐 Arquitectura del Sistema de Autenticación

## 📋 Resumen Ejecutivo

Sistema de autenticación basado en **REST API propio** con Next.js 15 y Supabase, utilizando cookies httpOnly para máxima seguridad. El frontend NO interactúa directamente con Supabase Auth, todo pasa por API Routes.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Login.tsx  │───▶│ AuthContext  │◀───│ Dashboard    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                               │
│         └────────────────────┼───────────────────────────────┤
│                              ▼                               │
│                    ┌──────────────────┐                      │
│                    │  AuthService     │                      │
│                    │  (fetch API)     │                      │
│                    └──────────────────┘                      │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              │ HTTP Requests
                              │ (cookies httpOnly)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/auth/   │  │ /api/auth/   │  │ /api/auth/   │      │
│  │   register   │  │    login     │  │   logout     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            ▼                                 │
│                  ┌──────────────────┐                        │
│                  │ Supabase Server  │                        │
│                  │     Client       │                        │
│                  └──────────────────┘                        │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Supabase     │         │  PostgreSQL  │                  │
│  │    Auth      │◀───────▶│   Database   │                  │
│  │ (ANON KEY)   │         │  (usuarios)  │                  │
│  └──────────────┘         └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Autenticación

### 1️⃣ Registro de Usuario

```
Usuario → Login.tsx → AuthContext.signUp()
    ↓
AuthService.register()
    ↓
POST /api/auth/register
    ↓
Supabase Auth: signUp()
    ↓
DB: INSERT usuarios (trigger/manual)
    ↓
Supabase Auth: signOut() (cerrar sesión automática)
    ↓
Response: "Cuenta creada, espera aprobación"
```

**Código:**
```typescript
// Frontend
await signUp(email, password, nombre, apellido, rol);

// Backend
supabase.auth.signUp({ email, password, options: { data } })
supabase.from('usuarios').insert({ ... })
supabase.auth.signOut()
```

---

### 2️⃣ Inicio de Sesión

```
Usuario → Login.tsx → AuthContext.signIn()
    ↓
AuthService.login()
    ↓
POST /api/auth/login (credentials: 'include')
    ↓
Supabase Auth: signInWithPassword()
    ↓
Validar usuario en DB (activo, aprobado)
    ↓
Supabase SSR: Guardar sesión en cookies httpOnly
    ↓
Response: { user: { id, email, nombre, rol } }
    ↓
AuthContext: Cargar usuario completo
    ↓
Redirigir según rol:
  - admin → /dashboard/admin
  - docente → /dashboard/docente
  - estudiante → /dashboard/estudiante
```

**Cookies creadas:**
- `sb-<project>-auth-token` (httpOnly, secure, sameSite)
- Contiene: access_token, refresh_token

---

### 3️⃣ Verificación de Sesión

```
App carga → AuthContext useEffect
    ↓
AuthService.getCurrentUser()
    ↓
GET /api/auth/me (credentials: 'include')
    ↓
Supabase: getUser() (lee cookies)
    ↓
DB: SELECT usuarios WHERE auth_id = user.id
    ↓
Response: { user, usuario }
    ↓
AuthContext: setUser(), setUsuario()
```

---

### 4️⃣ Cierre de Sesión

```
Usuario → LogoutButton → AuthContext.signOut()
    ↓
AuthService.logout()
    ↓
POST /api/auth/logout (credentials: 'include')
    ↓
Supabase Auth: signOut()
    ↓
Supabase SSR: Eliminar cookies
    ↓
Response: { success: true }
    ↓
AuthContext: setUser(null), setUsuario(null)
    ↓
Redirigir a "/"
```

---

## 📁 Estructura de Archivos

```
appWebIngles/
├── app/
│   └── api/
│       └── auth/
│           ├── register/
│           │   └── route.ts          # POST - Registro
│           ├── login/
│           │   └── route.ts          # POST - Login
│           ├── logout/
│           │   └── route.ts          # POST - Logout
│           └── me/
│               └── route.ts          # GET - Usuario actual
│
├── src/
│   ├── types/
│   │   └── auth.types.ts             # Tipos TS
│   │
│   ├── lib/
│   │   ├── supabase-server.ts        # Cliente server-side
│   │   ├── supabase-browser.ts       # Cliente browser-side
│   │   └── get-current-user.ts       # Helper sesión
│   │
│   ├── services/
│   │   └── auth.service.ts           # Servicio frontend
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx           # Contexto global
│   │
│   └── components/
│       └── features/
│           └── auth/
│               ├── Login.tsx         # Componente login
│               ├── LogoutButton.tsx  # Botón logout
│               └── ProtectedRoute.tsx # Protección rutas
```

---

## 🔒 Seguridad

### ✅ Implementado

1. **Cookies httpOnly**
   - No accesibles desde JavaScript
   - Protección contra XSS

2. **Cookies Secure**
   - Solo HTTPS en producción
   - Protección contra MITM

3. **SameSite**
   - Protección contra CSRF
   - Configurado por Supabase SSR

4. **Validaciones Backend**
   - Usuario activo
   - Usuario aprobado
   - Rol válido

5. **ANON KEY**
   - No se expone service_role
   - Row Level Security (RLS)

6. **Sin localStorage**
   - No se guarda información sensible
   - Todo en cookies httpOnly

---

## 🎯 Roles y Permisos

### Estudiante
- ✅ Ver su progreso
- ✅ Completar actividades
- ❌ Crear actividades
- ❌ Ver otros usuarios

### Docente
- ✅ Crear actividades
- ✅ Ver estudiantes
- ✅ Asignar actividades
- ❌ Gestionar usuarios

### Administrador
- ✅ Gestión completa
- ✅ Aprobar usuarios
- ✅ Ver estadísticas
- ✅ Todos los permisos

---

## 🔧 Configuración

### Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### Dependencias

```json
{
  "@supabase/ssr": "^0.0.10",
  "@supabase/supabase-js": "^2.38.4",
  "next": "^15.0.0",
  "react": "^19.0.0"
}
```

---

## 📊 Diagrama de Secuencia - Login

```
┌─────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│User │          │ Frontend │          │   API    │          │ Supabase │
└──┬──┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
   │                  │                     │                     │
   │ 1. Submit Form   │                     │                     │
   ├─────────────────▶│                     │                     │
   │                  │                     │                     │
   │                  │ 2. POST /api/auth/login                   │
   │                  ├────────────────────▶│                     │
   │                  │                     │                     │
   │                  │                     │ 3. signInWithPassword()
   │                  │                     ├────────────────────▶│
   │                  │                     │                     │
   │                  │                     │ 4. Return session   │
   │                  │                     │◀────────────────────┤
   │                  │                     │                     │
   │                  │                     │ 5. Query usuarios   │
   │                  │                     ├────────────────────▶│
   │                  │                     │                     │
   │                  │                     │ 6. Return usuario   │
   │                  │                     │◀────────────────────┤
   │                  │                     │                     │
   │                  │ 7. Set cookies + Response                 │
   │                  │◀────────────────────┤                     │
   │                  │                     │                     │
   │                  │ 8. GET /api/auth/me │                     │
   │                  ├────────────────────▶│                     │
   │                  │                     │                     │
   │                  │ 9. Return full user │                     │
   │                  │◀────────────────────┤                     │
   │                  │                     │                     │
   │ 10. Redirect     │                     │                     │
   │◀─────────────────┤                     │                     │
   │                  │                     │                     │
```

---

## 🧪 Testing

### Probar Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  -c cookies.txt
```

### Probar Usuario Actual

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### Probar Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## 🚀 Ventajas de esta Arquitectura

1. **Seguridad Máxima**
   - Cookies httpOnly
   - No exposición de tokens
   - Backend valida todo

2. **Consistencia**
   - Todo pasa por API Routes
   - Un solo flujo de autenticación
   - Fácil de mantener

3. **Escalabilidad**
   - Fácil agregar endpoints
   - Fácil agregar validaciones
   - Fácil agregar roles

4. **Testeable**
   - API Routes independientes
   - Fácil hacer tests unitarios
   - Fácil hacer tests E2E

5. **Profesional**
   - Patrón estándar de la industria
   - Documentación clara
   - Código limpio

---

## 📚 Referencias

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)

---

**Última actualización**: 2024
**Versión**: 1.0.0
