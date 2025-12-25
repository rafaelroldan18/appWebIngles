# 🌐 Documentación API RESTful - English27

## 📍 Ubicación de la API

La API RESTful de tu aplicación está implementada usando **Next.js 15 App Router** y se encuentra en:

```
📂 c:\Users\rp121\Documents\appWebIngles\app\api\
```

---

## 🗂️ Estructura de la API

### 📁 `/api/auth` - Autenticación
Endpoints para gestión de autenticación y sesiones.

```
app/api/auth/
├── init-admin/route.ts          POST   - Inicializar administrador
├── login/route.ts               POST   - Iniciar sesión
├── logout/route.ts              POST   - Cerrar sesión
├── me/route.ts                  GET    - Obtener usuario actual
├── register/route.ts            POST   - Registrar nuevo usuario
├── reset-password/route.ts      POST   - Resetear contraseña
└── update-password/route.ts     PUT    - Actualizar contraseña
```

**Ejemplos de uso:**
```bash
# Iniciar sesión
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }

# Obtener usuario actual
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }

# Registrar usuario
POST /api/auth/register
Body: { "nombre": "Juan", "apellido": "Pérez", "email": "juan@example.com", ... }
```

---

### 📁 `/api/gamification` - Sistema de Gamificación
Endpoints para misiones, actividades, badges, progreso y leaderboard.

```
app/api/gamification/
├── route.ts                                    GET    - Info general gamificación
│
├── achievements/
│   ├── route.ts                                GET/POST - Listar/crear logros
│   ├── [id]/students/route.ts                  GET    - Estudiantes con logro específico
│   └── user/route.ts                           GET    - Logros del usuario actual
│
├── activities/
│   ├── route.ts                                GET/POST - Listar/crear actividades
│   └── [id]/route.ts                           GET/PUT/DELETE - Gestión actividad específica
│
├── badges/
│   └── route.ts                                GET/POST - Listar/crear badges
│
├── challenges/
│   └── route.ts                                GET/POST - Listar/crear desafíos
│
├── debug/
│   └── student-data/route.ts                   GET    - Debug: datos de estudiante
│
├── leaderboard/
│   └── route.ts                                GET    - Obtener tabla de clasificación
│
├── missions/
│   ├── route.ts                                GET/POST - Listar/crear misiones
│   └── [id]/route.ts                           GET/PUT/DELETE - Gestión misión específica
│
├── progress/
│   ├── route.ts                                GET    - Progreso general
│   ├── student/[id]/route.ts                   GET    - Progreso de estudiante específico
│   ├── activities/complete/route.ts            POST   - Completar actividad
│   └── missions/
│       ├── route.ts                            GET    - Progreso de misiones
│       └── [id]/attempt/route.ts               POST   - Iniciar intento de misión
│
└── student-progress/
    ├── route.ts                                GET    - Progreso de estudiantes
    └── [id]/route.ts                           GET    - Progreso de estudiante específico
```

**Ejemplos de uso:**
```bash
# Obtener misiones disponibles
GET /api/gamification/missions

# Crear nueva misión (Docente/Admin)
POST /api/gamification/missions
Body: {
  "unit_number": 1,
  "topic": "Present Simple",
  "title": "Introducción al Present Simple",
  "description": "...",
  "difficulty_level": "medio",
  "base_points": 200
}

# Iniciar intento de misión
POST /api/gamification/progress/missions/[missionId]/attempt

# Completar actividad
POST /api/gamification/progress/activities/complete
Body: {
  "activityId": "uuid",
  "missionAttemptId": "uuid",
  "answers": [...],
  "timeSpent": 120
}

# Obtener leaderboard
GET /api/gamification/leaderboard
Query: ?limit=10

# Obtener progreso de estudiante
GET /api/gamification/progress/student/[studentId]
```

---

### 📁 `/api/invitations` - Sistema de Invitaciones
Endpoints para gestión de invitaciones de usuarios.

```
app/api/invitations/
├── route.ts                    GET/POST - Listar/crear invitaciones
├── [id]/route.ts               GET/PUT/DELETE - Gestión invitación específica
├── activate/route.ts           POST   - Activar invitación
├── bulk/route.ts               POST   - Crear invitaciones en masa
├── template/route.ts           GET    - Obtener plantilla de invitación
└── validate/route.ts           POST   - Validar código de invitación
```

**Ejemplos de uso:**
```bash
# Crear invitación
POST /api/invitations
Body: {
  "email": "estudiante@example.com",
  "rol": "estudiante"
}

# Validar código de invitación
POST /api/invitations/validate
Body: { "code": "ABC123XYZ" }

# Activar invitación
POST /api/invitations/activate
Body: {
  "code": "ABC123XYZ",
  "nombre": "María",
  "apellido": "García",
  "password": "password123"
}
```

---

### 📁 `/api/progress` - Progreso de Estudiantes
Endpoints para seguimiento de progreso.

```
app/api/progress/
└── route.ts                    GET/POST - Obtener/actualizar progreso
```

**Ejemplos de uso:**
```bash
# Obtener progreso del usuario actual
GET /api/progress

# Actualizar progreso
POST /api/progress
Body: {
  "activityId": "uuid",
  "score": 85,
  "completed": true
}
```

---

### 📁 `/api/user` - Perfil de Usuario
Endpoints para gestión del perfil del usuario actual.

```
app/api/user/
├── change-password/route.ts    POST   - Cambiar contraseña
└── update-profile/route.ts     PUT    - Actualizar perfil
```

**Ejemplos de uso:**
```bash
# Actualizar perfil
PUT /api/user/update-profile
Body: {
  "nombre": "Juan Carlos",
  "apellido": "Pérez López",
  "telefono": "+1234567890"
}

# Cambiar contraseña
POST /api/user/change-password
Body: {
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

---

### 📁 `/api/users` - Gestión de Usuarios (Admin)
Endpoints para administración de usuarios.

```
app/api/users/
├── route.ts                    GET/POST - Listar/crear usuarios
├── [id]/route.ts               GET/PUT/DELETE - Gestión usuario específico
├── stats/
│   ├── route.ts                GET    - Estadísticas generales
│   └── student/route.ts        GET    - Estadísticas de estudiantes
```

**Ejemplos de uso:**
```bash
# Listar todos los usuarios (Admin)
GET /api/users
Query: ?rol=estudiante&estado_cuenta=activo

# Obtener usuario específico
GET /api/users/[userId]

# Actualizar usuario
PUT /api/users/[userId]
Body: {
  "estado_cuenta": "activo",
  "rol": "docente"
}

# Eliminar usuario
DELETE /api/users/[userId]

# Obtener estadísticas
GET /api/users/stats
```

---

## 🔧 Convenciones de la API

### Estructura de Archivos

Cada endpoint sigue la convención de **Next.js App Router**:

```typescript
// app/api/[recurso]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Lógica para GET
}

export async function POST(request: Request) {
  // Lógica para POST
}

export async function PUT(request: Request) {
  // Lógica para PUT
}

export async function DELETE(request: Request) {
  // Lógica para DELETE
}
```

### Rutas Dinámicas

```typescript
// app/api/users/[id]/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  // Lógica...
}
```

---

## 📋 Métodos HTTP Utilizados

| Método | Uso |
|--------|-----|
| **GET** | Obtener recursos (lectura) |
| **POST** | Crear nuevos recursos |
| **PUT** | Actualizar recursos existentes |
| **DELETE** | Eliminar recursos |

---

## 🔐 Autenticación

Todos los endpoints (excepto `/api/auth/login` y `/api/auth/register`) requieren autenticación.

### Verificación de Autenticación

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  
  // Continuar con la lógica...
}
```

---

## 📊 Formato de Respuestas

### Respuesta Exitosa

```json
{
  "message": "Operación exitosa",
  "data": {
    // Datos del recurso
  }
}
```

### Respuesta de Error

```json
{
  "error": "Mensaje de error descriptivo",
  "details": "Detalles adicionales (opcional)"
}
```

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| **200** | OK - Operación exitosa |
| **201** | Created - Recurso creado exitosamente |
| **400** | Bad Request - Datos inválidos |
| **401** | Unauthorized - No autenticado |
| **403** | Forbidden - Sin permisos |
| **404** | Not Found - Recurso no encontrado |
| **500** | Internal Server Error - Error del servidor |

---

## 🛠️ Cómo Agregar un Nuevo Endpoint

### Paso 1: Crear el archivo de ruta

```bash
# Crear directorio y archivo
mkdir -p app/api/mi-recurso
touch app/api/mi-recurso/route.ts
```

### Paso 2: Implementar el endpoint

```typescript
// app/api/mi-recurso/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    // 2. Obtener datos
    const { data, error } = await supabase
      .from('mi_tabla')
      .select('*');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 3. Retornar respuesta
    return NextResponse.json({ data });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    // Validar datos
    if (!body.campo_requerido) {
      return NextResponse.json(
        { error: 'Campo requerido faltante' },
        { status: 400 }
      );
    }
    
    // Insertar datos
    const { data, error } = await supabase
      .from('mi_tabla')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data }, { status: 201 });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### Paso 3: Probar el endpoint

```bash
# GET
curl http://localhost:3000/api/mi-recurso

# POST
curl -X POST http://localhost:3000/api/mi-recurso \
  -H "Content-Type: application/json" \
  -d '{"campo": "valor"}'
```

---

## 📚 Recursos Adicionales

### Documentación Relacionada

- **API REST Estándar**: `docs/API_REST_ESTANDAR.md`
- **Database Schema**: `docs/DATABASE_SCHEMA_GAMIFICATION.md`
- **Ejemplos de Implementación**: `docs/EJEMPLOS_IMPLEMENTACION_CASOS_USO.md`

### Servicios (Frontend)

Los servicios que consumen la API están en:
```
src/services/
├── auth.service.ts           - Servicios de autenticación
├── user.service.ts           - Servicios de usuarios
├── activity.service.ts       - Servicios de actividades
├── gamification.service.ts   - Servicios de gamificación
├── progress.service.ts       - Servicios de progreso
└── invitation.service.ts     - Servicios de invitaciones
```

---

## 🔍 Endpoints por Caso de Uso

### Estudiante

| Caso de Uso | Endpoint | Método |
|-------------|----------|--------|
| Iniciar Sesión | `/api/auth/login` | POST |
| Ver Misiones | `/api/gamification/missions` | GET |
| Iniciar Misión | `/api/gamification/progress/missions/[id]/attempt` | POST |
| Completar Actividad | `/api/gamification/progress/activities/complete` | POST |
| Ver Progreso | `/api/gamification/progress/student/[id]` | GET |
| Ver Leaderboard | `/api/gamification/leaderboard` | GET |
| Ver Badges | `/api/gamification/achievements/user` | GET |

### Docente

| Caso de Uso | Endpoint | Método |
|-------------|----------|--------|
| Crear Misión | `/api/gamification/missions` | POST |
| Editar Misión | `/api/gamification/missions/[id]` | PUT |
| Crear Actividad | `/api/gamification/activities` | POST |
| Ver Estudiantes | `/api/users?rol=estudiante` | GET |
| Ver Progreso Estudiante | `/api/gamification/progress/student/[id]` | GET |

### Administrador

| Caso de Uso | Endpoint | Método |
|-------------|----------|--------|
| Ver Usuarios | `/api/users` | GET |
| Crear Usuario | `/api/users` | POST |
| Editar Usuario | `/api/users/[id]` | PUT |
| Aprobar Registro | `/api/users/[id]` | PUT |
| Ver Estadísticas | `/api/users/stats` | GET |
| Crear Badge | `/api/gamification/badges` | POST |

---

## 🎯 Resumen

Tu API RESTful está ubicada en:
```
📂 app/api/
```

Con **39 endpoints** organizados en **6 módulos principales**:
1. **auth** - Autenticación (7 endpoints)
2. **gamification** - Gamificación (21 endpoints)
3. **invitations** - Invitaciones (6 endpoints)
4. **progress** - Progreso (1 endpoint)
5. **user** - Perfil (2 endpoints)
6. **users** - Gestión usuarios (4 endpoints)

**Total: 41 archivos de ruta (route.ts)**

---

**Última actualización:** 2024-12-16  
**Versión:** 1.0  
**Estado:** ✅ Documentado
