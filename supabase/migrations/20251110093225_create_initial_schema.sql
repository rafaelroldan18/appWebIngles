/*
  # Schema Inicial - Sistema Gamificado de Inglés

  ## Descripción General
  Este esquema define la estructura completa para un sistema educativo gamificado con tres roles:
  estudiante, docente y administrador.

  ## 1. Nuevas Tablas

  ### `usuarios`
  - `id_usuario` (uuid, PK) - Identificador único del usuario
  - `nombre` (text) - Nombre del usuario
  - `apellido` (text) - Apellido del usuario
  - `correo_electronico` (text, unique) - Email único vinculado con auth.users
  - `rol` (enum) - Rol: 'estudiante', 'docente', 'administrador'
  - `estado_cuenta` (text) - Estado: 'activo' o 'inactivo'
  - `fecha_registro` (timestamptz) - Fecha de registro
  - `auth_user_id` (uuid, FK) - Vinculación con auth.users de Supabase

  ### `actividades`
  - `id_actividad` (uuid, PK) - Identificador único
  - `titulo` (text) - Título de la actividad
  - `descripcion` (text) - Descripción detallada
  - `tipo` (text) - Tipo: 'parejas', 'quiz', 'anagrama', etc.
  - `nivel_dificultad` (text) - Nivel: 'bajo', 'medio', 'alto'
  - `fecha_creacion` (timestamptz) - Fecha de creación
  - `creado_por` (uuid, FK) - Docente que creó la actividad

  ### `asignaciones_actividad`
  - `id_asignacion` (uuid, PK) - Identificador único
  - `id_actividad` (uuid, FK) - Actividad asignada
  - `id_estudiante` (uuid, FK) - Estudiante asignado
  - `fecha_asignacion` (timestamptz) - Fecha de asignación
  - `fecha_limite` (timestamptz) - Fecha límite
  - `estado` (text) - Estado: 'pendiente', 'en_curso', 'completado'
  - `puntaje_obtenido` (integer) - Puntaje obtenido
  - `retroalimentacion_automatica` (text) - Retroalimentación

  ### `progreso_estudiantes`
  - `id_progreso` (uuid, PK) - Identificador único
  - `id_estudiante` (uuid, FK) - Estudiante
  - `actividades_completadas` (integer) - Número de actividades completadas
  - `puntaje_total` (integer) - Puntaje acumulado
  - `nivel_actual` (integer) - Nivel actual del estudiante
  - `fecha_ultima_actualizacion` (timestamptz) - Última actualización

  ### `recompensas`
  - `id_recompensa` (uuid, PK) - Identificador único
  - `descripcion` (text) - Descripción de la recompensa
  - `criterio_logro` (text) - Criterio para obtenerla
  - `tipo` (text) - Tipo: 'insignia', 'puntos', 'medalla'
  - `creado_por` (uuid, FK) - Docente/Admin que la creó

  ### `recompensas_estudiantes`
  - `id` (uuid, PK) - Identificador único
  - `id_estudiante` (uuid, FK) - Estudiante
  - `id_recompensa` (uuid, FK) - Recompensa obtenida
  - `fecha_entrega` (timestamptz) - Fecha de entrega

  ### `reportes`
  - `id_reporte` (uuid, PK) - Identificador único
  - `id_docente` (uuid, FK) - Docente que genera
  - `id_estudiante` (uuid, FK) - Estudiante del reporte
  - `fecha_generacion` (timestamptz) - Fecha de generación
  - `tipo_reporte` (text) - Tipo: 'actividad', 'general', 'por_grupo'
  - `formato` (text) - Formato: 'pdf', 'excel'

  ### `mensajes_docente`
  - `id_mensaje` (uuid, PK) - Identificador único
  - `id_docente` (uuid, FK) - Docente remitente
  - `id_estudiante` (uuid, FK) - Estudiante destinatario
  - `contenido` (text) - Contenido del mensaje
  - `fecha_envio` (timestamptz) - Fecha de envío

  ## 2. Seguridad (RLS)
  - Se habilita RLS en todas las tablas
  - Políticas restrictivas basadas en roles
  - Los usuarios solo acceden a sus propios datos según su rol

  ## 3. Índices
  - Índices en columnas de búsqueda frecuente
  - Índices en foreign keys para optimizar joins

  ## 4. Notas Importantes
  - La tabla usuarios se vincula con auth.users mediante auth_user_id
  - El campo rol se almacena también en auth.users.raw_app_meta_data para RLS
  - Todos los IDs usan gen_random_uuid() por defecto
  - Timestamps usan now() por defecto
*/

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  correo_electronico text UNIQUE NOT NULL,
  rol text NOT NULL CHECK (rol IN ('estudiante', 'docente', 'administrador')),
  estado_cuenta text DEFAULT 'activo' CHECK (estado_cuenta IN ('activo', 'inactivo')),
  fecha_registro timestamptz DEFAULT now(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Crear tabla actividades
CREATE TABLE IF NOT EXISTS actividades (
  id_actividad uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text DEFAULT '',
  tipo text NOT NULL CHECK (tipo IN ('parejas', 'quiz', 'anagrama', 'completar', 'ordenar')),
  nivel_dificultad text DEFAULT 'medio' CHECK (nivel_dificultad IN ('bajo', 'medio', 'alto')),
  fecha_creacion timestamptz DEFAULT now(),
  creado_por uuid REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Crear tabla asignaciones_actividad
CREATE TABLE IF NOT EXISTS asignaciones_actividad (
  id_asignacion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_actividad uuid REFERENCES actividades(id_actividad) ON DELETE CASCADE,
  id_estudiante uuid REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  fecha_asignacion timestamptz DEFAULT now(),
  fecha_limite timestamptz,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'completado')),
  puntaje_obtenido integer DEFAULT 0,
  retroalimentacion_automatica text DEFAULT ''
);

-- Crear tabla progreso_estudiantes
CREATE TABLE IF NOT EXISTS progreso_estudiantes (
  id_progreso uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante uuid UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  actividades_completadas integer DEFAULT 0,
  puntaje_total integer DEFAULT 0,
  nivel_actual integer DEFAULT 1,
  fecha_ultima_actualizacion timestamptz DEFAULT now()
);

-- Crear tabla recompensas
CREATE TABLE IF NOT EXISTS recompensas (
  id_recompensa uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  criterio_logro text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('insignia', 'puntos', 'medalla')),
  creado_por uuid REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Crear tabla recompensas_estudiantes
CREATE TABLE IF NOT EXISTS recompensas_estudiantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante uuid REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_recompensa uuid REFERENCES recompensas(id_recompensa) ON DELETE CASCADE,
  fecha_entrega timestamptz DEFAULT now()
);

-- Crear tabla reportes
CREATE TABLE IF NOT EXISTS reportes (
  id_reporte uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_docente uuid REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_estudiante uuid REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  fecha_generacion timestamptz DEFAULT now(),
  tipo_reporte text NOT NULL CHECK (tipo_reporte IN ('actividad', 'general', 'por_grupo')),
  formato text NOT NULL CHECK (formato IN ('pdf', 'excel'))
);

-- Crear tabla mensajes_docente
CREATE TABLE IF NOT EXISTS mensajes_docente (
  id_mensaje uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_docente uuid REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_estudiante uuid REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  contenido text NOT NULL,
  fecha_envio timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(correo_electronico);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_actividades_creador ON actividades(creado_por);
CREATE INDEX IF NOT EXISTS idx_asignaciones_estudiante ON asignaciones_actividad(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_asignaciones_actividad ON asignaciones_actividad(id_actividad);
CREATE INDEX IF NOT EXISTS idx_progreso_estudiante ON progreso_estudiantes(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_recompensas_est ON recompensas_estudiantes(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_mensajes_estudiante ON mensajes_docente(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_mensajes_docente ON mensajes_docente(id_docente);

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas_estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_docente ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabla usuarios
CREATE POLICY "Users can view own profile"
  ON usuarios FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users"
  ON usuarios FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

CREATE POLICY "Users can update own profile"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins can manage all users"
  ON usuarios FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

-- Políticas RLS para tabla actividades
CREATE POLICY "Docentes can manage their activities"
  ON actividades FOR ALL
  TO authenticated
  USING (
    creado_por IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    creado_por IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view assigned activities"
  ON actividades FOR SELECT
  TO authenticated
  USING (
    id_actividad IN (
      SELECT id_actividad FROM asignaciones_actividad 
      WHERE id_estudiante IN (
        SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all activities"
  ON actividades FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

-- Políticas RLS para asignaciones_actividad
CREATE POLICY "Students can view own assignments"
  ON asignaciones_actividad FOR SELECT
  TO authenticated
  USING (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own assignments"
  ON asignaciones_actividad FOR UPDATE
  TO authenticated
  USING (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Docentes can manage assignments for their activities"
  ON asignaciones_actividad FOR ALL
  TO authenticated
  USING (
    id_actividad IN (
      SELECT id_actividad FROM actividades 
      WHERE creado_por IN (
        SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    id_actividad IN (
      SELECT id_actividad FROM actividades 
      WHERE creado_por IN (
        SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Políticas RLS para progreso_estudiantes
CREATE POLICY "Students can view own progress"
  ON progreso_estudiantes FOR SELECT
  TO authenticated
  USING (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own progress"
  ON progreso_estudiantes FOR UPDATE
  TO authenticated
  USING (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Docentes can view student progress"
  ON progreso_estudiantes FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'docente');

CREATE POLICY "System can insert progress"
  ON progreso_estudiantes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas RLS para recompensas
CREATE POLICY "Everyone can view rewards"
  ON recompensas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Docentes and admins can manage rewards"
  ON recompensas FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' IN ('docente', 'administrador'))
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'rol' IN ('docente', 'administrador'));

-- Políticas RLS para recompensas_estudiantes
CREATE POLICY "Students can view own rewards"
  ON recompensas_estudiantes FOR SELECT
  TO authenticated
  USING (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Docentes can assign rewards"
  ON recompensas_estudiantes FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'rol' IN ('docente', 'administrador'));

-- Políticas RLS para reportes
CREATE POLICY "Docentes can view own reports"
  ON reportes FOR SELECT
  TO authenticated
  USING (
    id_docente IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Docentes can create reports"
  ON reportes FOR INSERT
  TO authenticated
  WITH CHECK (
    id_docente IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reports"
  ON reportes FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

-- Políticas RLS para mensajes_docente
CREATE POLICY "Students can view messages sent to them"
  ON mensajes_docente FOR SELECT
  TO authenticated
  USING (
    id_estudiante IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Docentes can view and send messages"
  ON mensajes_docente FOR ALL
  TO authenticated
  USING (
    id_docente IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    id_docente IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Función para crear usuario automáticamente tras registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (
    auth_user_id,
    nombre,
    apellido,
    correo_electronico,
    rol,
    estado_cuenta
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'rol', 'estudiante'),
    'activo'
  );
  
  -- Si es estudiante, crear su registro de progreso
  IF COALESCE(NEW.raw_app_meta_data->>'rol', 'estudiante') = 'estudiante' THEN
    INSERT INTO public.progreso_estudiantes (id_estudiante)
    VALUES ((SELECT id_usuario FROM public.usuarios WHERE auth_user_id = NEW.id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función al registrar nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();