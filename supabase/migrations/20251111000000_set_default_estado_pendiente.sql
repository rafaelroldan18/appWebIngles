-- Cambiar el valor por defecto de estado_cuenta a 'pendiente'
ALTER TABLE usuarios ALTER COLUMN estado_cuenta SET DEFAULT 'pendiente';

-- Actualizar la función handle_new_user para usar 'pendiente' por defecto
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
    'pendiente'
  );
  
  -- Si es estudiante, crear su registro de progreso
  IF COALESCE(NEW.raw_app_meta_data->>'rol', 'estudiante') = 'estudiante' THEN
    INSERT INTO public.progreso_estudiantes (id_estudiante)
    VALUES ((SELECT id_usuario FROM public.usuarios WHERE auth_user_id = NEW.id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
