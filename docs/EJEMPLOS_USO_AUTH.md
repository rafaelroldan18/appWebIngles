# 📖 Ejemplos de Uso - Sistema de Autenticación

## 🎯 Casos de Uso Completos

---

## 1️⃣ Componente de Login (Ya implementado)

Tu componente `Login.tsx` ya está correctamente implementado. Solo asegúrate de que esté envuelto en el `AuthProvider`.

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 2️⃣ Dashboard con Protección de Ruta

```tsx
// app/dashboard/estudiante/page.tsx
'use client';

import ProtectedRoute from '@/components/features/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/features/auth/LogoutButton';

export default function EstudianteDashboard() {
  const { usuario } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['estudiante']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              Bienvenido, {usuario?.nombre}!
            </h1>
            <LogoutButton className="bg-red-500 hover:bg-red-600 text-white" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Nivel</h2>
              <p className="text-3xl font-bold text-blue-600">{usuario?.nivel}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Puntos</h2>
              <p className="text-3xl font-bold text-green-600">{usuario?.puntos}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Rol</h2>
              <p className="text-xl capitalize">{usuario?.rol}</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 3️⃣ Dashboard Docente

```tsx
// app/dashboard/docente/page.tsx
'use client';

import ProtectedRoute from '@/components/features/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/features/auth/LogoutButton';

export default function DocenteDashboard() {
  const { usuario } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['docente']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Panel de Docente</h1>
              <p className="text-gray-600">
                {usuario?.nombre} {usuario?.apellido}
              </p>
            </div>
            <LogoutButton className="bg-red-500 hover:bg-red-600 text-white" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Mis Actividades</h2>
            <p className="text-gray-600">Aquí puedes crear y gestionar actividades...</p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 4️⃣ Dashboard Administrador

```tsx
// app/dashboard/admin/page.tsx
'use client';

import ProtectedRoute from '@/components/features/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/features/auth/LogoutButton';

export default function AdminDashboard() {
  const { usuario } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="text-gray-600">Control total del sistema</p>
            </div>
            <LogoutButton className="bg-red-500 hover:bg-red-600 text-white" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Usuarios Totales
              </h3>
              <p className="text-3xl font-bold">150</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Pendientes Aprobación
              </h3>
              <p className="text-3xl font-bold text-yellow-600">12</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Actividades
              </h3>
              <p className="text-3xl font-bold text-blue-600">45</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Docentes
              </h3>
              <p className="text-3xl font-bold text-green-600">8</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 5️⃣ Navbar con Estado de Autenticación

```tsx
// src/components/layout/Navbar.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/features/auth/LogoutButton';
import Link from 'next/link';

export default function Navbar() {
  const { user, usuario, loading } = useAuth();

  if (loading) {
    return (
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="animate-pulse flex space-x-4">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            English27
          </Link>

          <div className="flex items-center gap-4">
            {user && usuario ? (
              <>
                <span className="text-sm text-gray-600">
                  {usuario.nombre} {usuario.apellido}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {usuario.rol}
                </span>
                <LogoutButton className="bg-red-500 hover:bg-red-600 text-white" />
              </>
            ) : (
              <Link
                href="/"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## 6️⃣ Hook Personalizado para Verificar Permisos

```tsx
// src/hooks/usePermissions.ts
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth.types';

export function usePermissions() {
  const { usuario } = useAuth();

  const hasRole = (roles: UserRole[]): boolean => {
    if (!usuario) return false;
    return roles.includes(usuario.rol);
  };

  const isAdmin = (): boolean => {
    return usuario?.rol === 'administrador';
  };

  const isDocente = (): boolean => {
    return usuario?.rol === 'docente';
  };

  const isEstudiante = (): boolean => {
    return usuario?.rol === 'estudiante';
  };

  const canCreateActivities = (): boolean => {
    return hasRole(['docente', 'administrador']);
  };

  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  const canViewAllStudents = (): boolean => {
    return hasRole(['docente', 'administrador']);
  };

  return {
    hasRole,
    isAdmin,
    isDocente,
    isEstudiante,
    canCreateActivities,
    canManageUsers,
    canViewAllStudents,
  };
}
```

**Uso:**

```tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function ActivityPage() {
  const { canCreateActivities } = usePermissions();

  return (
    <div>
      {canCreateActivities() && (
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Crear Actividad
        </button>
      )}
    </div>
  );
}
```

---

## 7️⃣ Página de Inicio con Redirección Automática

```tsx
// app/page.tsx
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
      // Redirigir según el rol
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

## 8️⃣ Componente de Perfil de Usuario

```tsx
// src/components/features/user/UserProfile.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';

export default function UserProfile() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {usuario.nombre[0]}{usuario.apellido[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold">
            {usuario.nombre} {usuario.apellido}
          </h2>
          <p className="text-gray-600">{usuario.email}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Icon name="shield-checkmark" className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Rol:</span>
          <span className="font-semibold capitalize">{usuario.rol}</span>
        </div>

        <div className="flex items-center gap-3">
          <Icon name="trophy" className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Nivel:</span>
          <span className="font-semibold">{usuario.nivel}</span>
        </div>

        <div className="flex items-center gap-3">
          <Icon name="star" className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Puntos:</span>
          <span className="font-semibold">{usuario.puntos}</span>
        </div>

        <div className="flex items-center gap-3">
          <Icon name="checkmark-circle" className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Estado:</span>
          <span className={`font-semibold ${usuario.activo ? 'text-green-600' : 'text-red-600'}`}>
            {usuario.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## 9️⃣ Fetch Protegido en Otros Servicios

```tsx
// src/services/activity.service.ts
class ActivityService {
  private baseUrl = '/api/activities';

  async getActivities() {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      credentials: 'include', // ← IMPORTANTE: Enviar cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Usuario no autenticado
        window.location.href = '/';
        return;
      }
      throw new Error('Error al obtener actividades');
    }

    return response.json();
  }

  async createActivity(data: any) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ← IMPORTANTE: Enviar cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al crear actividad');
    }

    return response.json();
  }
}

export const activityService = new ActivityService();
```

---

## 🔟 API Route Protegida

```tsx
// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/get-current-user';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await requireAuth();

    const supabase = createClient();

    // Obtener actividades según el rol
    let query = supabase.from('actividades').select('*');

    if (session.usuario.rol === 'estudiante') {
      // Estudiantes solo ven sus actividades asignadas
      query = query.eq('estudiante_id', session.usuario.id);
    } else if (session.usuario.rol === 'docente') {
      // Docentes ven actividades que crearon
      query = query.eq('docente_id', session.usuario.id);
    }
    // Administradores ven todo

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Solo docentes y admins pueden crear actividades
    const session = await requireRole(['docente', 'administrador']);

    const body = await request.json();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('actividades')
      .insert({
        ...body,
        docente_id: session.usuario.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 403 }
    );
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Instalar dependencias: `@supabase/ssr`, `@supabase/supabase-js`
- [ ] Crear variables de entorno en `.env.local`
- [ ] Copiar todos los archivos generados
- [ ] Envolver app en `AuthProvider` en `app/layout.tsx`
- [ ] Actualizar componente `Login.tsx` (ya está listo)
- [ ] Crear páginas de dashboard protegidas
- [ ] Probar flujo completo: registro → login → dashboard → logout
- [ ] Verificar cookies en DevTools (Application → Cookies)
- [ ] Probar redirecciones según roles
- [ ] Probar protección de rutas

---

## 🎓 Para tu Tesis

**Puntos clave a mencionar:**

1. **Arquitectura REST API propia** en lugar de cliente directo
2. **Cookies httpOnly** para máxima seguridad
3. **Separación de responsabilidades** (Frontend/Backend)
4. **Validación en múltiples capas** (Frontend + Backend + DB)
5. **Escalabilidad** mediante API Routes independientes
6. **Mantenibilidad** con código limpio y documentado

---

**¡Sistema listo para producción!** 🚀
