# 📁 Estructura del Proyecto - English27

## ✅ Arquitectura Correcta de Next.js

```
appWebIngles/
│
├── app/                                    # ROUTING (Solo páginas minimalistas)
│   │
│   ├── (auth)/                            # Grupo: Rutas de autenticación
│   │   └── login/
│   │       └── page.tsx                   → /login
│   │
│   ├── (dashboard)/                       # Grupo: Rutas protegidas
│   │   ├── estudiante/
│   │   │   └── page.tsx                   → /estudiante
│   │   ├── docente/
│   │   │   └── page.tsx                   → /docente
│   │   ├── administrador/
│   │   │   └── page.tsx                   → /administrador
│   │   ├── perfil/
│   │   │   └── page.tsx                   → /perfil
│   │   ├── ajustes/
│   │   │   └── page.tsx                   → /ajustes
│   │   ├── cuenta-pendiente/
│   │   │   └── page.tsx                   → /cuenta-pendiente
│   │   └── cuenta-deshabilitada/
│   │       └── page.tsx                   → /cuenta-deshabilitada
│   │
│   ├── api/                               # API Routes (Backend)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   ├── users/route.ts
│   │   ├── activities/route.ts
│   │   └── progress/route.ts
│   │
│   ├── layout.tsx                         # Layout raíz
│   └── page.tsx                           → / (Landing)
│
├── src/
│   ├── components/                        # COMPONENTES (Toda la lógica)
│   │   ├── features/                      # Componentes de funcionalidad
│   │   │   ├── landing/
│   │   │   │   └── LandingView.tsx       ← Lógica del landing
│   │   │   ├── auth/
│   │   │   │   ├── LoginView.tsx         ← Lógica del login
│   │   │   │   ├── Login.tsx             ← Componente UI
│   │   │   │   ├── Landing.tsx
│   │   │   │   ├── CuentaPendienteView.tsx
│   │   │   │   ├── CuentaPendiente.tsx
│   │   │   │   ├── CuentaDeshabilitadaView.tsx
│   │   │   │   └── CuentaDeshabilitada.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── EstudianteView.tsx    ← Lógica + protección
│   │   │   │   ├── EstudianteDashboard.tsx ← Componente UI
│   │   │   │   ├── DocenteView.tsx
│   │   │   │   ├── DocenteDashboard.tsx
│   │   │   │   ├── AdministradorView.tsx
│   │   │   │   └── AdministradorDashboard.tsx
│   │   │   ├── perfil/
│   │   │   │   └── PerfilView.tsx        ← Lógica del perfil
│   │   │   ├── ajustes/
│   │   │   │   └── AjustesView.tsx       ← Lógica de ajustes
│   │   │   ├── profile/
│   │   │   │   └── ProfilePage.tsx       ← Componente UI
│   │   │   ├── settings/
│   │   │   │   └── SettingsPage.tsx      ← Componente UI
│   │   │   └── admin/
│   │   │       ├── GestionarEstudiantes.tsx
│   │   │       ├── AgregarUsuarioModal.tsx
│   │   │       └── CambiarRolModal.tsx
│   │   │
│   │   ├── layout/                        # Componentes de layout
│   │   │   ├── DashboardNav.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── LanguageSelector.tsx
│   │   │
│   │   └── ui/                            # Componentes reutilizables
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Icon.tsx
│   │
│   ├── contexts/                          # React Contexts
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── services/                          # Lógica de negocio
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── activity.service.ts
│   │
│   ├── hooks/                             # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useProgress.ts
│   │   └── useActivities.ts
│   │
│   ├── lib/                               # Utilidades y configuración
│   │   ├── supabase.ts
│   │   └── supabase-api.ts
│   │
│   ├── types/                             # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   └── activity.types.ts
│   │
│   ├── config/                            # Configuración
│   │   └── colors.ts
│   │
│   └── index.css                          # Estilos globales
│
└── public/                                # Archivos estáticos
    └── images/
        └── logo.jpg
```

---

## 🎯 Principios de la Arquitectura

### 1. **Separación de Responsabilidades**

#### ❌ ANTES (Incorrecto):
```tsx
// app/perfil/page.tsx - TODO mezclado
export default function PerfilPage() {
  const { user } = useAuth()
  const [data, setData] = useState()
  
  useEffect(() => {
    // Lógica de protección
    // Lógica de carga
    // Lógica de validación
  }, [])
  
  return (
    <div>
      {/* Todo el HTML aquí */}
    </div>
  )
}
```

#### ✅ AHORA (Correcto):
```tsx
// app/(dashboard)/perfil/page.tsx - SOLO routing
import { PerfilView } from '@/components/features/perfil/PerfilView'

export default function PerfilPage() {
  return <PerfilView />
}

// src/components/features/perfil/PerfilView.tsx - TODA la lógica
export function PerfilView() {
  const { user } = useAuth()
  const [data, setData] = useState()
  
  useEffect(() => {
    // Toda la lógica aquí
  }, [])
  
  return <ProfilePage data={data} />
}
```

---

### 2. **Grupos de Rutas con ()**

Los paréntesis `()` crean grupos sin afectar la URL:

```
app/
├── (auth)/
│   └── login/page.tsx        → /login (no /auth/login)
│
└── (dashboard)/
    ├── perfil/page.tsx       → /perfil (no /dashboard/perfil)
    └── ajustes/page.tsx      → /ajustes
```

**Ventajas:**
- Organización lógica
- Layouts compartidos
- URLs limpias

---

### 3. **Páginas Minimalistas**

Cada `page.tsx` debe ser **extremadamente simple**:

```tsx
// ✅ CORRECTO - 3 líneas
import { EstudianteView } from '@/components/features/dashboard/EstudianteView'

export default function EstudiantePage() {
  return <EstudianteView />
}
```

```tsx
// ❌ INCORRECTO - Lógica en page.tsx
export default function EstudiantePage() {
  const { user } = useAuth()
  const [data, setData] = useState()
  
  useEffect(() => {
    // NO hacer esto aquí
  }, [])
  
  return <div>...</div>
}
```

---

### 4. **Componentes View = Lógica + Protección**

Los componentes `*View.tsx` manejan:
- ✅ Autenticación
- ✅ Protección de rutas
- ✅ Redirecciones
- ✅ Carga de datos
- ✅ Estados

```tsx
// src/components/features/dashboard/EstudianteView.tsx
export function EstudianteView() {
  const { user, usuario, loading } = useAuth()
  const router = useRouter()

  // Protección
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Loading
  if (loading) return <LoadingSpinner />

  // Renderizar componente UI
  return <EstudianteDashboard />
}
```

---

## 🔄 Flujo de Navegación

### Usuario hace click en "Perfil":

```
1. UserMenu.tsx
   └─> router.push('/perfil')

2. Next.js busca:
   └─> app/(dashboard)/perfil/page.tsx

3. page.tsx renderiza:
   └─> <PerfilView />

4. PerfilView.tsx:
   ├─> Verifica autenticación
   ├─> Carga datos
   └─> Renderiza <ProfilePage />

5. Usuario ve su perfil
```

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | ❌ Antes | ✅ Ahora |
|---------|---------|----------|
| **Estructura** | Todo mezclado | Separación clara |
| **Páginas** | Lógica + UI | Solo routing |
| **Componentes** | Duplicados | Reutilizables |
| **Organización** | Confusa | Intuitiva |
| **Mantenimiento** | Difícil | Fácil |
| **Escalabilidad** | Limitada | Excelente |

---

## 🚀 URLs del Proyecto

| Ruta | URL | Tipo |
|------|-----|------|
| Landing | `/` | Público |
| Login | `/login` | Público |
| Dashboard Estudiante | `/estudiante` | Protegido |
| Dashboard Docente | `/docente` | Protegido |
| Dashboard Admin | `/administrador` | Protegido |
| Perfil | `/perfil` | Protegido |
| Ajustes | `/ajustes` | Protegido |
| Cuenta Pendiente | `/cuenta-pendiente` | Protegido |
| Cuenta Deshabilitada | `/cuenta-deshabilitada` | Protegido |

---

## ✨ Ventajas de Esta Arquitectura

### 1. **Claridad**
- Cada archivo tiene un propósito único
- Fácil encontrar código

### 2. **Mantenibilidad**
- Cambios localizados
- Sin efectos secundarios

### 3. **Escalabilidad**
- Agregar rutas es simple
- Componentes reutilizables

### 4. **Testing**
- Componentes aislados
- Fácil de probar

### 5. **Performance**
- Code splitting automático
- Carga optimizada

---

## 📝 Cómo Agregar Nueva Ruta

### Ejemplo: Agregar página de "Estadísticas"

#### 1. Crear componente View:
```tsx
// src/components/features/estadisticas/EstadisticasView.tsx
export function EstadisticasView() {
  // Toda la lógica aquí
  return <EstadisticasPage />
}
```

#### 2. Crear página:
```tsx
// app/(dashboard)/estadisticas/page.tsx
import { EstadisticasView } from '@/components/features/estadisticas/EstadisticasView'

export default function EstadisticasPage() {
  return <EstadisticasView />
}
```

#### 3. ¡Listo!
- URL: `localhost:3000/estadisticas`
- Protegida automáticamente
- Código organizado

---

## 🎉 Resultado Final

**Proyecto profesional, organizado y escalable siguiendo las mejores prácticas de Next.js 15** ✅

- ✅ Estructura clara
- ✅ Código mantenible
- ✅ Fácil de escalar
- ✅ Siguiendo estándares
- ✅ Listo para producción
