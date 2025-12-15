# Prompt para Supabase AI Assistant

## Contexto de mi base de datos

Acabo de migrar mi base de datos de español a inglés. Todas las tablas y columnas ahora usan nombres en inglés.

## Tablas principales y sus columnas:

### Tabla: `users`
- `user_id` (UUID, PK)
- `first_name` (text)
- `last_name` (text)
- `email` (text, unique)
- `id_card` (text)
- `role` (text: 'estudiante', 'docente', 'administrador')
- `account_status` (text: 'activo', 'inactivo', 'pendiente')
- `registration_date` (timestamptz)
- `auth_user_id` (UUID, FK a auth.users)

### Tabla: `invitations`
- `invitation_id` (UUID, PK)
- `invitation_code` (text, unique)
- `email` (text)
- `first_name` (text)
- `last_name` (text)
- `id_card` (text)
- `role` (text)
- `status` (text: 'pendiente', 'activada', 'expirada')
- `created_by_user_id` (UUID, FK a users.user_id)
- `created_date` (timestamptz)
- `expiration_date` (timestamptz)
- `activation_date` (timestamptz)
- `user_id` (UUID, FK a users.user_id)

### Tabla: `student_progress`
- `progress_id` (UUID, PK)
- `student_id` (UUID, FK a users.user_id, unique)
- `activities_completed` (integer)
- `total_score` (integer)
- `current_level` (integer)
- `last_updated_at` (timestamptz)

## Problema actual

Las políticas RLS (Row Level Security) todavía usan los nombres antiguos en español. Necesito que me ayudes a:

1. **Actualizar TODAS las políticas RLS** para usar los nuevos nombres de columnas en inglés
2. **Verificar que las políticas funcionen correctamente** con el nuevo esquema
3. **Asegurar que los usuarios puedan**:
   - Autenticarse y acceder a sus datos
   - Los estudiantes solo vean sus propios datos
   - Los docentes vean datos de sus estudiantes
   - Los administradores vean todo

## Nombres antiguos → Nombres nuevos

**Tablas:**
- `usuarios` → `users`
- `invitaciones` → `invitations`
- `progreso_estudiantes` → `student_progress`

**Columnas comunes:**
- `id_usuario` → `user_id`
- `nombre` → `first_name`
- `apellido` → `last_name`
- `correo_electronico` → `email`
- `cedula` → `id_card`
- `rol` → `role`
- `estado_cuenta` → `account_status`
- `fecha_registro` → `registration_date`
- `creado_por` → `created_by_user_id`
- `id_estudiante` → `student_id`
- `actividades_completadas` → `activities_completed`
- `puntaje_total` → `total_score`
- `nivel_actual` → `current_level`

## Lo que necesito

Por favor, genera:

1. **Script SQL completo** para ELIMINAR todas las políticas RLS antiguas
2. **Script SQL completo** para CREAR nuevas políticas RLS usando los nombres en inglés
3. Las políticas deben incluir:
   - Políticas para la tabla `users`
   - Políticas para la tabla `invitations`
   - Políticas para la tabla `student_progress`
   - Políticas para todas las tablas de gamificación

## Reglas de negocio para RLS

### Tabla `users`:
- **SELECT**: Los usuarios pueden ver su propio registro y los administradores/docentes pueden ver todos
- **INSERT**: Solo administradores pueden crear usuarios directamente
- **UPDATE**: Los usuarios pueden actualizar su propio registro, administradores pueden actualizar cualquiera
- **DELETE**: Solo administradores pueden eliminar usuarios

### Tabla `invitations`:
- **SELECT**: Los usuarios pueden ver invitaciones que crearon o que son para ellos
- **INSERT**: Solo docentes y administradores pueden crear invitaciones
- **UPDATE**: Solo quien creó la invitación o administradores pueden actualizarla
- **DELETE**: Solo quien creó la invitación o administradores pueden eliminarla

### Tabla `student_progress`:
- **SELECT**: Los estudiantes ven su propio progreso, docentes y administradores ven todo
- **INSERT**: Sistema puede insertar, docentes y administradores también
- **UPDATE**: Sistema puede actualizar, docentes y administradores también
- **DELETE**: Solo administradores

## Formato de respuesta esperado

```sql
-- 1. ELIMINAR POLÍTICAS ANTIGUAS
DROP POLICY IF EXISTS "nombre_politica_antigua" ON users;
-- ... más drops

-- 2. CREAR NUEVAS POLÍTICAS
CREATE POLICY "users_select_own_or_admin"
ON users FOR SELECT
USING (
  auth.uid() = auth_user_id
  OR 
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role IN ('administrador', 'docente')
  )
);
-- ... más políticas
```

## Información adicional

- Uso Supabase Auth para autenticación
- El campo `auth_user_id` en la tabla `users` vincula con `auth.users.id`
- Los roles son: 'estudiante', 'docente', 'administrador'
- Los estados de cuenta son: 'activo', 'inactivo', 'pendiente'

---

**Por favor, genera el script SQL completo para actualizar todas las políticas RLS.**
