# 🏗️ Arquitectura API REST - English27

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura en Capas](#arquitectura-en-capas)
3. [Flujo de Datos](#flujo-de-datos)
4. [Endpoints API](#endpoints-api)
5. [Patrones Implementados](#patrones-implementados)

---

## 🎯 Visión General

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
│                    React Components + Hooks                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      SERVICE LAYER                               │
│  auth.service.ts │ user.service.ts │ game.service.ts │ etc.     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ fetch()
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    API ROUTES (Next.js)                          │
│              /app/api/[resource]/route.ts                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Supabase Client
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    SUPABASE (Backend)                            │
│         PostgreSQL + Auth + Storage + RLS                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Arquitectura en Capas

### Capa 1: Presentación (UI Layer)
```
┌─────────────────────────────────────────────────────────┐
│                   COMPONENTS                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Dashboard │  │  Forms   │  │  Tables  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                     │
│       └─────────────┴─────────────┘                     │
│                     │                                   │
│              ┌──────▼──────┐                            │
│              │ CUSTOM HOOKS │                           │
│              │ useUsers()   │                           │
│              │ useProgress()│                           │
│              └──────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### Capa 2: Lógica de Negocio (Business Layer)
```
┌─────────────────────────────────────────────────────────┐
│                  SERVICE LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │AuthService   │  │UserService   │  │GameService   │ │
│  │              │  │              │  │              │ │
│  │ - login()    │  │ - getAll()   │  │ - create()   │ │
│  │ - register() │  │ - update()   │  │ - getById()  │ │
│  │ - logout()   │  │ - delete()   │  │ - update()   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Capa 3: API Routes (Next.js)
```
┌─────────────────────────────────────────────────────────┐
│                    API ROUTES                            │
│                                                          │
│  /api/auth/                                              │
│    ├── login/route.ts          POST                     │
│    ├── register/route.ts       POST                     │
│    ├── logout/route.ts         POST                     │
│    └── me/route.ts             GET                      │
│                                                          │
│  /api/users/                                             │
│    ├── route.ts                GET, POST                │
│    ├── [id]/route.ts           GET, PUT, DELETE         │
│    └── stats/route.ts          GET                      │
│                                                          │
│  /api/games/                                             │
│    ├── route.ts                GET, POST                │
│    └── [id]/route.ts           GET, PUT, DELETE         │
│                                                          │
│  /api/missions/                                          │
│    ├── route.ts                GET, POST                │
│    ├── [id]/route.ts           GET, PUT, DELETE         │
│    └── assign/route.ts         POST                     │
│                                                          │
│  /api/progress/                                          │
│    ├── route.ts                GET, POST                │
│    └── [id]/route.ts           GET, PUT                 │
│                                                          │
│  /api/reports/                                           │
│    ├── student/[id]/route.ts   GET                      │
│    └── teacher/[id]/route.ts   GET                      │
└─────────────────────────────────────────────────────────┘
```

### Capa 4: Base de Datos (Supabase)
```
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE                               │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │           PostgreSQL Database                 │      │
│  │                                               │      │
│  │  Tables:                                      │      │
│  │  • usuarios                                   │      │
│  │  • missions                                   │      │
│  │  • mission_assignments                        │      │
│  │  • mission_progress                           │      │
│  │  • parallels                                  │      │
│  │  • game_types                                 │      │
│  │  • invitations                                │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │         Row Level Security (RLS)              │      │
│  │  • Políticas por rol                          │      │
│  │  • Restricciones de acceso                    │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │            Authentication                     │      │
│  │  • JWT Tokens                                 │      │
│  │  • Session Management                         │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### Flujo Completo: Login de Usuario
```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ UI Form  │─────▶│  Auth    │─────▶│   API    │─────▶│ Supabase │
│          │      │ Service  │      │  Route   │      │   Auth   │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
     │                  │                  │                  │
     │ 1. Submit        │                  │                  │
     │ credentials      │                  │                  │
     │─────────────────▶│                  │                  │
     │                  │                  │                  │
     │                  │ 2. POST          │                  │
     │                  │ /api/auth/login  │                  │
     │                  │─────────────────▶│                  │
     │                  │                  │                  │
     │                  │                  │ 3. Validate      │
     │                  │                  │ credentials      │
     │                  │                  │─────────────────▶│
     │                  │                  │                  │
     │                  │                  │ 4. JWT Token     │
     │                  │                  │◀─────────────────│
     │                  │                  │                  │
     │                  │ 5. Session +     │                  │
     │                  │ User data        │                  │
     │                  │◀─────────────────│                  │
     │                  │                  │                  │
     │ 6. Update state  │                  │                  │
     │◀─────────────────│                  │                  │
     │                  │                  │                  │
     │ 7. Redirect      │                  │                  │
     │ to dashboard     │                  │                  │
     │                  │                  │                  │
```

### Flujo: Obtener Lista de Usuarios (Admin)
```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│Dashboard │─────▶│  User    │─────▶│   API    │─────▶│ Supabase │
│Component │      │ Service  │      │  Route   │      │    DB    │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
     │                  │                  │                  │
     │ useEffect()      │                  │                  │
     │─────────────────▶│                  │                  │
     │                  │                  │                  │
     │                  │ GET /api/users   │                  │
     │                  │─────────────────▶│                  │
     │                  │                  │                  │
     │                  │                  │ Verify JWT       │
     │                  │                  │ Check role       │
     │                  │                  │                  │
     │                  │                  │ SELECT * FROM    │
     │                  │                  │ usuarios         │
     │                  │                  │─────────────────▶│
     │                  │                  │                  │
     │                  │                  │ Users[]          │
     │                  │                  │◀─────────────────│
     │                  │                  │                  │
     │                  │ Response         │                  │
     │                  │◀─────────────────│                  │
     │                  │                  │                  │
     │ setState()       │                  │                  │
     │◀─────────────────│                  │                  │
     │                  │                  │                  │
     │ Render table     │                  │                  │
     │                  │                  │                  │
```

### Flujo: Crear Misión (Docente)
```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Form    │─────▶│  Game    │─────▶│   API    │─────▶│ Supabase │
│Component │      │ Service  │      │  Route   │      │    DB    │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
     │                  │                  │                  │
     │ Submit form      │                  │                  │
     │─────────────────▶│                  │                  │
     │                  │                  │                  │
     │                  │ POST             │                  │
     │                  │ /api/missions    │                  │
     │                  │─────────────────▶│                  │
     │                  │                  │                  │
     │                  │                  │ Validate data    │
     │                  │                  │ Check auth       │
     │                  │                  │                  │
     │                  │                  │ INSERT INTO      │
     │                  │                  │ missions         │
     │                  │                  │─────────────────▶│
     │                  │                  │                  │
     │                  │                  │ Mission created  │
     │                  │                  │◀─────────────────│
     │                  │                  │                  │
     │                  │ Success          │                  │
     │                  │◀─────────────────│                  │
     │                  │                  │                  │
     │ Show toast       │                  │                  │
     │◀─────────────────│                  │                  │
     │                  │                  │                  │
```

---

## 📡 Endpoints API

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar nuevo usuario | ❌ |
| POST | `/api/auth/login` | Iniciar sesión | ❌ |
| POST | `/api/auth/logout` | Cerrar sesión | ✅ |
| GET | `/api/auth/me` | Obtener usuario actual | ✅ |

### 👥 Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/users` | Listar usuarios | Admin |
| GET | `/api/users?role=estudiante` | Filtrar por rol | Admin, Docente |
| GET | `/api/users/[id]` | Obtener usuario | Admin |
| PUT | `/api/users/[id]` | Actualizar usuario | Admin |
| DELETE | `/api/users/[id]` | Eliminar usuario | Admin |
| GET | `/api/users/stats` | Estadísticas | Admin |

### 🎮 Misiones (`/api/missions`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/missions` | Listar misiones | Todos |
| POST | `/api/missions` | Crear misión | Docente, Admin |
| GET | `/api/missions/[id]` | Obtener misión | Todos |
| PUT | `/api/missions/[id]` | Actualizar misión | Docente, Admin |
| DELETE | `/api/missions/[id]` | Eliminar misión | Docente, Admin |
| POST | `/api/missions/assign` | Asignar misión | Docente, Admin |

### 📊 Progreso (`/api/progress`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/progress` | Obtener progreso | Estudiante |
| POST | `/api/progress` | Registrar progreso | Estudiante |
| GET | `/api/progress/[id]` | Progreso específico | Todos |
| PUT | `/api/progress/[id]` | Actualizar progreso | Estudiante |

### 📈 Reportes (`/api/reports`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/reports/student/[id]` | Reporte estudiante | Docente, Admin |
| GET | `/api/reports/teacher/[id]` | Reporte docente | Admin |

### 🎯 Paralelos (`/api/parallels`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/parallels` | Listar paralelos | Todos |
| POST | `/api/parallels` | Crear paralelo | Admin |
| PUT | `/api/parallels/[id]` | Actualizar paralelo | Admin |
| DELETE | `/api/parallels/[id]` | Eliminar paralelo | Admin |

### 📧 Invitaciones (`/api/invitations`)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/invitations` | Listar invitaciones | Admin |
| POST | `/api/invitations` | Crear invitación | Admin |
| DELETE | `/api/invitations/[id]` | Eliminar invitación | Admin |

---

## 🎨 Patrones Implementados

### 1. Service Layer Pattern
```typescript
// Servicios encapsulan lógica de API
export class UserService {
  static async getAll(): Promise<Usuario[]> {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Error');
    return response.json();
  }
}
```

### 2. Repository Pattern
```typescript
// API Routes actúan como repositorios
export async function GET(request: Request) {
  const supabase = createClient();
  const { data } = await supabase
    .from('usuarios')
    .select('*');
  return Response.json(data);
}
```

### 3. Middleware Pattern
```typescript
// Verificación de autenticación
async function verifyAuth(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
```

### 4. Error Handling Pattern
```typescript
// Manejo consistente de errores
try {
  const data = await UserService.getAll();
} catch (error) {
  console.error(error);
  toast.error('Error al cargar usuarios');
}
```

### 5. Custom Hooks Pattern
```typescript
// Hooks reutilizan lógica de servicios
export function useUsers() {
  const [users, setUsers] = useState<Usuario[]>([]);
  
  useEffect(() => {
    UserService.getAll()
      .then(setUsers)
      .catch(console.error);
  }, []);
  
  return { users };
}
```

---

## 🔒 Seguridad

### Autenticación
```
┌─────────────────────────────────────────┐
│         JWT Token Flow                   │
│                                          │
│  1. Login → Supabase Auth               │
│  2. Receive JWT Token                   │
│  3. Store in HTTP-only Cookie           │
│  4. Send with every request             │
│  5. Verify in API Routes                │
└─────────────────────────────────────────┘
```

### Autorización (RLS)
```sql
-- Ejemplo: Estudiantes solo ven su progreso
CREATE POLICY "students_own_progress"
ON mission_progress
FOR SELECT
USING (auth.uid() = student_id);

-- Docentes ven progreso de sus estudiantes
CREATE POLICY "teachers_students_progress"
ON mission_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND role = 'docente'
  )
);
```

---

## 📦 Estructura de Respuestas

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Usuario"
  },
  "message": "Operación exitosa"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
```

---

## 🚀 Optimizaciones

### 1. Caching
- Session caching en cliente
- Query result caching

### 2. Lazy Loading
- Componentes cargados bajo demanda
- Datos paginados

### 3. Parallel Requests
```typescript
const [users, stats] = await Promise.all([
  UserService.getAll(),
  UserService.getStats()
]);
```

---

**Última actualización**: 2024
**Versión**: 2.0.0
