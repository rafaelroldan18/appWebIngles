# 🔄 Estándar API REST - English27

## ✅ Implementación 100% Consistente

### 📋 Principios

1. **Cliente Supabase Único**: Todas las API routes usan `createSupabaseClient()`
2. **Servicios Estáticos**: Todos los servicios son clases estáticas
3. **Manejo de Errores Uniforme**: Estructura consistente de respuestas
4. **Validación de Parámetros**: Validación explícita cuando es requerido

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│      Components / Pages             │
│                                     │
│      useActivities, useUsers        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Services Layer              │
│                                     │
│  ActivityService, UserService       │
│  ProgressService, AuthService       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         API Routes                  │
│                                     │
│  /api/activities, /api/users        │
│  /api/progress, /api/auth           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      createSupabaseClient()         │
│                                     │
│      Supabase Database              │
└─────────────────────────────────────┘
```

---

## 📦 Cliente Supabase Estandarizado

### Ubicación
`src/lib/supabase-api.ts`

### Uso en API Routes
```typescript
import { createSupabaseClient } from '@/lib/supabase-api';

export async function GET() {
  const supabase = await createSupabaseClient();
  // usar supabase...
}
```

### ✅ Ventajas
- Manejo consistente de cookies
- Server-side rendering compatible
- Autenticación automática
- Un solo punto de configuración

---

## 🎯 Servicios Estandarizados

### Patrón
Todos los servicios son **clases estáticas**:

```typescript
export class ServiceName {
  private static baseUrl = '/api/endpoint';

  static async method(params: Type): Promise<ReturnType> {
    const response = await fetch(`${this.baseUrl}/path`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
}
```

### Servicios Disponibles

#### 1. AuthService
```typescript
AuthService.login(data)
AuthService.register(data)
AuthService.logout()
AuthService.getCurrentUser()
```

#### 2. UserService
```typescript
UserService.getAll()
UserService.getByRole(rol)
UserService.updateStatus(userId, status)
UserService.updateRole(userId, role)
UserService.delete(userId)
UserService.getStats()
```

#### 3. ActivityService
```typescript
ActivityService.getByCreator(creatorId, limit?)
ActivityService.getAssignmentsByStudent(studentId, limit?)
ActivityService.getCreatorStats(creatorId)
```

#### 4. ProgressService
```typescript
ProgressService.getByStudent(studentId)
```

---

## 🛣️ API Routes Estandarizadas

### Estructura de Respuestas

#### ✅ Éxito
```typescript
// Datos
return Response.json(data);

// Con success flag
return Response.json({ success: true, data });
```

#### ❌ Error
```typescript
// Error de validación (400)
return Response.json({ error: 'Mensaje de error' }, { status: 400 });

// Error de autenticación (401)
return Response.json({ error: 'No autenticado' }, { status: 401 });

// Error de permisos (403)
return Response.json({ error: 'Sin permisos' }, { status: 403 });

// Error del servidor (500)
return Response.json({ error: 'Error en el servidor' }, { status: 500 });
```

### Endpoints Disponibles

#### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual

#### Users
- `GET /api/users` - Listar usuarios
- `GET /api/users?rol=estudiante` - Filtrar por rol
- `PUT /api/users/[id]` - Actualizar usuario
- `DELETE /api/users/[id]` - Eliminar usuario
- `GET /api/users/stats` - Estadísticas

#### Activities
- `GET /api/activities?creatorId=xxx` - Actividades por creador
- `GET /api/activities/assignments?studentId=xxx` - Asignaciones
- `GET /api/activities/stats?creatorId=xxx` - Estadísticas

#### Progress
- `GET /api/progress?studentId=xxx` - Progreso de estudiante

---

## 🔒 Validación

### Parámetros Requeridos
```typescript
const param = searchParams.get('param');

if (!param) {
  return Response.json({ error: 'param requerido' }, { status: 400 });
}
```

### Try-Catch Global
```typescript
export async function GET() {
  try {
    // lógica...
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
```

---

## 📝 Convenciones

### Nombres de Archivos
- API Routes: `route.ts`
- Servicios: `nombre.service.ts`
- Tipos: `nombre.types.ts`

### Imports
```typescript
// API Routes
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

// Servicios
import type { Type } from '@/types';
```

### Response
```typescript
// Usar Response.json (NO NextResponse.json)
✅ return Response.json({ data });
❌ return NextResponse.json({ data });
```

### Exports
```typescript
// Servicios - Clase estática
export class ServiceName { }

// NO usar instancias
// ❌ export const service = new Service();
// ✅ export class Service { }
```

---

## 🧪 Uso en Componentes

### Con Custom Hooks
```typescript
import { useActivities } from '@/hooks/useActivities';

function Component() {
  const { activities, loading } = useActivities(userId);
  // ...
}
```

### Directo (no recomendado)
```typescript
import { ActivityService } from '@/services/activity.service';

async function handleAction() {
  const data = await ActivityService.getByCreator(userId);
}
```

---

## ✅ Checklist de Consistencia

- [x] Todas las API routes usan `createSupabaseClient()`
- [x] Todos los servicios son clases estáticas
- [x] Manejo de errores uniforme con `{ error: string }`
- [x] Validación de parámetros requeridos
- [x] Estructura de respuestas consistente
- [x] Try-catch en todas las routes
- [x] Tipos TypeScript en servicios
- [x] Imports estandarizados
- [x] Uso de `Response.json` (no `NextResponse.json`)
- [x] Códigos HTTP estándar (400, 401, 403, 500)

---

## 🚀 Próximos Pasos

### Mejoras Futuras
- [ ] Middleware de autenticación
- [ ] Rate limiting
- [ ] Logging centralizado
- [ ] Validación con Zod
- [ ] Cache con React Query
- [ ] Tests unitarios

---

**Última actualización**: 2024
**Estado**: ✅ 100% Consistente
