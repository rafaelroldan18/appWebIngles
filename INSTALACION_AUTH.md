# 🚀 Guía de Instalación - Sistema de Autenticación

## 📦 Paso 1: Instalar Dependencias

```bash
npm install @supabase/ssr @supabase/supabase-js
```

O si usas yarn:

```bash
yarn add @supabase/ssr @supabase/supabase-js
```

---

## 🔧 Paso 2: Configurar Variables de Entorno

Crea o actualiza el archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**¿Dónde encontrar estas variables?**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Settings → API
3. Copia `Project URL` y `anon public` key

---

## 📁 Paso 3: Verificar Estructura de Archivos

Asegúrate de tener todos estos archivos creados:

```
✅ src/types/auth.types.ts
✅ src/lib/supabase-server.ts
✅ src/lib/supabase-browser.ts
✅ src/lib/get-current-user.ts
✅ src/services/auth.service.ts
✅ src/contexts/AuthContext.tsx
✅ src/components/features/auth/LogoutButton.tsx
✅ src/components/features/auth/ProtectedRoute.tsx
✅ app/api/auth/register/route.ts
✅ app/api/auth/login/route.ts
✅ app/api/auth/logout/route.ts
✅ app/api/auth/me/route.ts
```

---

## 🗄️ Paso 4: Configurar Base de Datos

### Tabla `usuarios`

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('estudiante', 'docente', 'administrador')),
  activo BOOLEAN DEFAULT true,
  aprobado BOOLEAN DEFAULT false,
  nivel INTEGER DEFAULT 1,
  puntos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear usuario automáticamente después del registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, email, nombre, apellido, rol, activo, aprobado)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'estudiante'),
    true,
    false
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON usuarios
  FOR SELECT
  USING (auth.uid() = auth_id);

-- Política: Los docentes pueden ver estudiantes
CREATE POLICY "Teachers can view students"
  ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND rol IN ('docente', 'administrador')
    )
  );

-- Política: Los administradores pueden hacer todo
CREATE POLICY "Admins can do everything"
  ON usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND rol = 'administrador'
    )
  );

-- Política: Los usuarios pueden actualizar su propio perfil (campos limitados)
CREATE POLICY "Users can update own profile"
  ON usuarios
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);
```

---

## 🎨 Paso 5: Actualizar Layout Principal

Actualiza `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'English27 - Aprende Inglés',
  description: 'Plataforma educativa gamificada para aprender inglés',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 🏠 Paso 6: Actualizar Página Principal

Actualiza `app/page.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/features/auth/Login';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && usuario) {
      if (usuario.rol === 'administrador') {
        router.push('/dashboard/admin');
      } else if (usuario.rol === 'docente') {
        router.push('/dashboard/docente');
      } else {
        router.push('/dashboard/estudiante');
      }
    }
  }, [user, usuario, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user && usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <Login />;
}
```

---

## 👤 Paso 7: Crear Usuario Administrador Inicial

Ejecuta en Supabase SQL Editor:

```sql
-- Primero, registra un usuario desde la app
-- Luego, actualiza su rol a administrador:

UPDATE usuarios
SET rol = 'administrador', aprobado = true
WHERE email = 'tu-email@example.com';
```

O hazlo desde el código:

1. Regístrate normalmente desde la app
2. Ve a Supabase Dashboard → Table Editor → usuarios
3. Encuentra tu usuario y cambia:
   - `rol` → `administrador`
   - `aprobado` → `true`

---

## ✅ Paso 8: Probar el Sistema

### 1. Iniciar servidor de desarrollo

```bash
npm run dev
```

### 2. Probar Registro

1. Ve a `http://localhost:3000`
2. Click en "Registrarse"
3. Completa el formulario
4. Deberías ver: "Cuenta creada exitosamente. Espera la aprobación..."

### 3. Aprobar Usuario

1. Ve a Supabase Dashboard
2. Table Editor → usuarios
3. Encuentra el usuario recién creado
4. Cambia `aprobado` a `true`

### 4. Probar Login

1. Vuelve a `http://localhost:3000`
2. Click en "Iniciar Sesión"
3. Ingresa email y contraseña
4. Deberías ser redirigido al dashboard correspondiente

### 5. Verificar Cookies

1. Abre DevTools (F12)
2. Application → Cookies → `http://localhost:3000`
3. Deberías ver cookies que empiezan con `sb-`

### 6. Probar Logout

1. Click en "Cerrar Sesión"
2. Deberías volver a la página de login
3. Las cookies deberían eliminarse

---

## 🐛 Solución de Problemas

### Error: "Cannot find module '@supabase/ssr'"

```bash
npm install @supabase/ssr
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

Verifica que `.env.local` existe y tiene las variables correctas.

### Error: "No autenticado" al hacer login

1. Verifica que el usuario existe en la tabla `usuarios`
2. Verifica que `aprobado = true` y `activo = true`
3. Revisa los logs en la consola del navegador

### Las cookies no se guardan

1. Verifica que estás usando `credentials: 'include'` en los fetch
2. En producción, asegúrate de usar HTTPS
3. Verifica la configuración de SameSite en las cookies

### Error: "User not found in database"

El trigger no se ejecutó. Crea el usuario manualmente:

```sql
INSERT INTO usuarios (auth_id, email, nombre, apellido, rol, activo, aprobado)
VALUES (
  'auth_id_del_usuario',
  'email@example.com',
  'Nombre',
  'Apellido',
  'estudiante',
  true,
  true
);
```

---

## 📊 Verificar que Todo Funciona

### Checklist Final

- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Tabla `usuarios` creada
- [ ] RLS configurado
- [ ] Triggers creados
- [ ] AuthProvider en layout.tsx
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Cookies se crean correctamente
- [ ] Redirecciones según rol funcionan
- [ ] Rutas protegidas funcionan

---

## 🎉 ¡Listo!

Tu sistema de autenticación está completamente configurado y listo para usar.

### Próximos Pasos

1. Crear dashboards específicos para cada rol
2. Implementar funcionalidades según permisos
3. Agregar más validaciones según necesites
4. Implementar recuperación de contraseña
5. Agregar tests

---

## 📚 Recursos Adicionales

- [Documentación Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**¿Necesitas ayuda?** Revisa los archivos de documentación en `/docs/`
