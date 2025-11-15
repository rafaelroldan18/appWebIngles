# 🏗️ Arquitectura API REST - English27

## 📋 Descripción

El sistema utiliza **arquitectura API REST** con Next.js API Routes como capa intermedia entre el frontend y Supabase.

**Nota:** La autenticación (login/logout) usa el cliente directo de Supabase para mantener las sesiones. Los demás endpoints usan API REST.

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│              (React Components)                     │
└────────────────────┬────────────────────────────────┘
                     │ HTTP + JSON
                     ↓
┌─────────────────────────────────────────────────────┐
│                 SERVICE LAYER                       │
│        (auth.service.ts, user.service.ts)           │
│              fetch() con métodos HTTP               │
└────────────────────┬────────────────────────────────┘
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────┐
│              API REST (Next.js)                     │
│                  /app/api/*                         │
│         GET, POST, PUT, DELETE                      │
└────────────────────┬────────────────────────────────┘
                     │ Supabase Client
                     ↓
┌─────────────────────────────────────────────────────┐
│                  SUPABASE                           │
│            (PostgreSQL Database)                    │
└─────────────────────────────────────────────────────┘
```

## 📡 Endpoints Disponibles

### 🔐 Autenticación

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Iniciar sesión | `{ email, password }` |
| POST | `/api/auth/register` | Registrar usuario | `{ email, password, nombre, apellido, rol }` |
| POST | `/api/auth/logout` | Cerrar sesión | - |
| GET | `/api/auth/me` | Usuario actual | - |

### 👥 Usuarios

| Método | Endpoint | Descripción | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/users` | Listar usuarios | `?rol=estudiante` |
| GET | `/api/users/stats` | Estadísticas | - |
| PUT | `/api/users/[id]` | Actualizar usuario | - |
| DELETE | `/api/users/[id]` | Eliminar usuario | - |

### 📚 Actividades

| Método | Endpoint | Descripción | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/activities` | Listar actividades | `?creatorId=xxx&limit=10` |
| GET | `/api/activities/assignments` | Asignaciones | `?studentId=xxx&limit=5` |
| GET | `/api/activities/stats` | Estadísticas | `?creatorId=xxx` |

## 💻 Ejemplos de Uso

### Frontend (Service Layer)

```typescript
// src/services/user.service.ts
export class UserService {
  static async getAll(): Promise<Usuario[]> {
    const response = await fetch('/api/users');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
}
```

### Backend (API Route)

```typescript
// app/api/users/route.ts
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*');
  
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  
  return Response.json(data);
}
```

## ✅ Cumplimiento de Requisitos

### ✓ API REST
- Endpoints HTTP bien definidos
- Separación cliente-servidor
- Stateless (sin estado)

### ✓ Métodos HTTP
- **GET** - Obtener recursos
- **POST** - Crear recursos
- **PUT** - Actualizar recursos
- **DELETE** - Eliminar recursos

### ✓ Formato JSON
- Request body en JSON
- Response en JSON
- Headers: `Content-Type: application/json`

### ✓ Códigos de Estado HTTP
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 🔒 Seguridad

- Supabase maneja autenticación
- RLS (Row Level Security) en base de datos
- Validación en API Routes
- Manejo de errores centralizado

## 📁 Estructura de Archivos

```
app/api/
├── auth/
│   ├── login/route.ts       # POST /api/auth/login
│   ├── register/route.ts    # POST /api/auth/register
│   ├── logout/route.ts      # POST /api/auth/logout
│   └── me/route.ts          # GET /api/auth/me
├── users/
│   ├── route.ts             # GET /api/users
│   ├── [id]/route.ts        # PUT, DELETE /api/users/[id]
│   └── stats/route.ts       # GET /api/users/stats
└── activities/
    ├── route.ts             # GET /api/activities
    ├── assignments/route.ts # GET /api/activities/assignments
    └── stats/route.ts       # GET /api/activities/stats
```

## 🎯 Ventajas de esta Arquitectura

1. **Separación de responsabilidades**
   - Frontend: UI y presentación
   - API: Lógica de negocio
   - Supabase: Persistencia de datos

2. **Escalabilidad**
   - Fácil agregar nuevos endpoints
   - Posibilidad de migrar a microservicios

3. **Mantenibilidad**
   - Código organizado y modular
   - Fácil de testear

4. **Seguridad**
   - Credenciales en servidor
   - Validación centralizada

## 📚 Documentación Adicional

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [REST API Best Practices](https://restfulapi.net/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
