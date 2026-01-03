# Plan de Implementación: Sistema de Paralelos Académicos

## 📋 Resumen de Cambios

Se ha eliminado el sistema de gamificación (niveles, puntos, badges) y se ha incorporado un sistema de **paralelos académicos** para organizar a los estudiantes por clases/cursos.

---

## ✅ Cambios Completados

### 1. **Tipos y Servicios**
- ✅ Creado `src/types/parallel.types.ts` - Tipos para paralelos
- ✅ Actualizado `src/types/user.types.ts` - Agregado `parallel_id` y `parallel_name`
- ✅ Creado `src/services/parallel.service.ts` - Servicio completo para paralelos

### 2. **Dashboard de Estudiante**
- ✅ Eliminadas métricas de gamificación (Nivel, Puntos, Recompensas)
- ✅ Agregadas métricas académicas:
  - **Paralelo**: Muestra el paralelo asignado al estudiante
  - **Actividades Completadas**: Cuenta de actividades terminadas
  - **Actividades Pendientes**: Cuenta de actividades por hacer

---

## 🔄 Cambios Pendientes

### 3. **API Routes para Paralelos** (ALTA PRIORIDAD)

Crear las siguientes rutas en `app/api/parallels/`:

#### `app/api/parallels/route.ts`
```typescript
// GET /api/parallels - Listar todos los paralelos
// POST /api/parallels - Crear nuevo paralelo
```

#### `app/api/parallels/[id]/route.ts`
```typescript
// GET /api/parallels/[id] - Obtener paralelo por ID
// PATCH /api/parallels/[id] - Actualizar paralelo
// DELETE /api/parallels/[id] - Eliminar paralelo
```

#### `app/api/parallels/[id]/students/route.ts`
```typescript
// GET /api/parallels/[id]/students - Obtener estudiantes de un paralelo
```

#### `app/api/parallels/teacher/[teacherId]/route.ts`
```typescript
// GET /api/parallels/teacher/[teacherId] - Obtener paralelos de un docente
```

#### `app/api/parallels/assign-teacher/route.ts`
```typescript
// POST /api/parallels/assign-teacher - Asignar docente a paralelo
```

#### `app/api/parallels/remove-teacher/route.ts`
```typescript
// DELETE /api/parallels/remove-teacher - Remover docente de paralelo
```

---

### 4. **Dashboard de Docente**

Actualizar `src/components/features/dashboard/DocenteDashboard.tsx`:

**Cambios necesarios:**
- Mostrar los paralelos asignados al docente
- Agregar tarjeta para gestionar paralelos
- Mostrar estadísticas por paralelo (número de estudiantes, actividades asignadas)
- Permitir ver estudiantes por paralelo

**Nuevas métricas sugeridas:**
- Total de Estudiantes (en todos sus paralelos)
- Paralelos Asignados
- Actividades Creadas
- Actividades Pendientes de Revisión

---

### 5. **Dashboard de Administrador**

Actualizar `src/components/features/dashboard/AdministradorDashboard.tsx`:

**Cambios necesarios:**
- Agregar sección de gestión de paralelos
- Mostrar estadísticas de paralelos
- Permitir crear/editar/eliminar paralelos
- Asignar docentes a paralelos
- Asignar estudiantes a paralelos

**Nuevas métricas sugeridas:**
- Total de Paralelos
- Total de Estudiantes
- Total de Docentes
- Estudiantes sin Paralelo Asignado

---

### 6. **Componentes de Gestión de Paralelos**

Crear nuevos componentes en `src/components/features/parallels/`:

#### `GestionarParalelos.tsx`
- Lista de todos los paralelos
- Crear nuevo paralelo
- Editar paralelo existente
- Eliminar paralelo
- Ver estudiantes y docentes asignados

#### `AsignarParaleloModal.tsx`
- Modal para asignar estudiante a un paralelo
- Selector de paralelo
- Confirmación

#### `ParaleloCard.tsx`
- Tarjeta para mostrar información de un paralelo
- Nombre, año académico
- Número de estudiantes y docentes
- Acciones rápidas

---

### 7. **Actualizar Sistema de Invitaciones**

Modificar `src/components/features/admin/InvitarEstudianteModal.tsx`:

**Cambios necesarios:**
- Agregar campo para seleccionar paralelo al invitar estudiante
- Hacer el paralelo opcional pero recomendado

---

### 8. **Actualizar Gestión de Estudiantes**

Modificar `src/components/features/admin/GestionarEstudiantes.tsx`:

**Cambios necesarios:**
- Mostrar paralelo asignado en la lista de estudiantes
- Permitir cambiar paralelo de un estudiante
- Filtrar estudiantes por paralelo
- Mostrar estudiantes sin paralelo asignado

---

### 9. **Actualizar API de Usuarios**

Modificar `app/api/users/[id]/route.ts`:

**Cambios necesarios:**
- Incluir información del paralelo al obtener usuario
- Permitir actualizar `parallel_id` al editar usuario
- Validar que el paralelo existe antes de asignar

---

### 10. **Hooks Personalizados**

Crear hooks en `src/hooks/`:

#### `useParallels.ts`
```typescript
// Hook para obtener lista de paralelos
// Hook para obtener paralelo por ID
// Hook para obtener paralelos del docente
```

#### `useParallelStudents.ts`
```typescript
// Hook para obtener estudiantes de un paralelo
```

---

## 📊 Esquema de Base de Datos (Referencia)

```sql
-- Tabla de paralelos
CREATE TABLE parallels (
  parallel_id uuid PRIMARY KEY,
  name text NOT NULL,
  academic_year text NOT NULL
);

-- Relación docente-paralelo (muchos a muchos)
CREATE TABLE teacher_parallels (
  id uuid PRIMARY KEY,
  teacher_id uuid REFERENCES users(user_id),
  parallel_id uuid REFERENCES parallels(parallel_id)
);

-- Estudiantes tienen parallel_id directo
ALTER TABLE users ADD COLUMN parallel_id uuid REFERENCES parallels(parallel_id);
```

---

## 🎯 Prioridades de Implementación

### Fase 1 (Inmediata)
1. ✅ Tipos y servicios base
2. ✅ Actualizar dashboard de estudiante
3. ⏳ Crear API routes para paralelos
4. ⏳ Actualizar API de usuarios para incluir paralelos

### Fase 2 (Corto plazo)
5. ⏳ Componentes de gestión de paralelos
6. ⏳ Actualizar dashboard de administrador
7. ⏳ Actualizar sistema de invitaciones

### Fase 3 (Mediano plazo)
8. ⏳ Actualizar dashboard de docente
9. ⏳ Hooks personalizados
10. ⏳ Actualizar gestión de estudiantes

---

## 📝 Notas Importantes

1. **Migración de Datos**: Los estudiantes existentes no tienen paralelo asignado (`parallel_id = NULL`). El administrador deberá asignarlos manualmente.

2. **Validaciones**: 
   - Un estudiante solo puede estar en un paralelo
   - Un docente puede estar en múltiples paralelos
   - No se puede eliminar un paralelo con estudiantes asignados

3. **Permisos**:
   - Administradores: CRUD completo de paralelos
   - Docentes: Solo lectura de sus paralelos asignados
   - Estudiantes: Solo lectura de su paralelo

4. **UI/UX**:
   - Usar iconos apropiados (Users para paralelos)
   - Colores consistentes con el tema actual
   - Responsive design en todos los componentes

---

## 🔄 Siguiente Paso Recomendado

**Crear las API routes para paralelos** para que los servicios puedan funcionar correctamente.

¿Quieres que continúe con la implementación de las API routes?
