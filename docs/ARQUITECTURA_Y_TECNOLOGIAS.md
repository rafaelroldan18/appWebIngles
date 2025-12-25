# 🏗️ Arquitectura y Stack Tecnológico - English27

## 📊 Tipo de Arquitectura

### **Arquitectura: Full-Stack Web Application (No SaaS)**

English27 es una **aplicación web full-stack** desarrollada con arquitectura moderna de **JAMstack** (JavaScript, APIs, Markup), utilizando **Next.js 16** como framework principal.

**No es SaaS** en el sentido tradicional (Software as a Service multi-tenant), sino una **aplicación web institucional** diseñada específicamente para la Unidad Educativa Delice.

---

## 🛠️ Stack Tecnológico Completo

### **Frontend**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 16.0.0 | Framework React con App Router, SSR, y API Routes |
| **React** | 19.0.0 | Librería UI para componentes interactivos |
| **TypeScript** | 5.9.3 | Type safety y mejor experiencia de desarrollo |
| **Tailwind CSS** | 3.4.18 | Framework CSS utility-first para estilos |
| **Lucide React** | 0.554.0 | Librería de iconos moderna y ligera |
| **React Focus Lock** | 2.13.6 | Gestión de accesibilidad y focus trapping |

### **Backend**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js API Routes** | 16.0.0 | Backend API RESTful serverless |
| **Supabase** | 2.84.0 | Backend as a Service (BaaS) |
| **Supabase SSR** | 0.7.0 | Server-Side Rendering con Supabase |
| **PostgreSQL** | - | Base de datos relacional (via Supabase) |

### **Herramientas de Desarrollo**

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| **ESLint** | 9.x | Linting y calidad de código |
| **PostCSS** | 8.5.6 | Procesamiento de CSS |
| **Autoprefixer** | 10.4.22 | Prefijos CSS automáticos |
| **tsx** | 4.7.0 | Ejecutar TypeScript directamente |
| **dotenv** | 16.3.1 | Gestión de variables de entorno |

---

## 🏛️ Arquitectura del Sistema

### **Patrón Arquitectónico: Clean Architecture + MVC**

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTACIÓN                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Components │  │   Pages     │  │   Layouts   │         │
│  │   (UI)      │  │  (Routes)   │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   LÓGICA DE NEGOCIO                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Hooks     │  │  Contexts   │  │   Utils     │         │
│  │  (Custom)   │  │  (State)    │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE SERVICIOS                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Auth     │  │Gamification │  │    User     │         │
│  │  Service    │  │   Service   │  │  Service    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  /api/auth  │  │/api/gamif.  │  │ /api/users  │         │
│  │   Routes    │  │   Routes    │  │   Routes    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE DATOS                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Supabase Client                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │   Auth   │  │ Database │  │ Real-time│          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS                               │
│              PostgreSQL (Supabase)                           │
│  • Tablas de usuarios                                        │
│  • Tablas de gamificación                                    │
│  • Row Level Security (RLS)                                  │
│  • Triggers y Functions                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
appWebIngles/
│
├── 📂 app/                          # Next.js App Router
│   ├── 📂 (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   │
│   ├── 📂 (dashboard)/              # Grupo de rutas del dashboard
│   │   ├── admin/                   # Dashboard administrador
│   │   ├── student/                 # Dashboard estudiante
│   │   ├── teacher/                 # Dashboard docente
│   │   └── layout.tsx
│   │
│   ├── 📂 api/                      # API Routes (Backend)
│   │   ├── auth/                    # Endpoints autenticación
│   │   ├── gamification/            # Endpoints gamificación
│   │   ├── users/                   # Endpoints usuarios
│   │   ├── invitations/             # Endpoints invitaciones
│   │   ├── progress/                # Endpoints progreso
│   │   └── user/                    # Endpoints perfil
│   │
│   ├── layout.tsx                   # Layout raíz
│   └── page.tsx                     # Página principal
│
├── 📂 src/                          # Código fuente
│   ├── 📂 components/               # Componentes React
│   │   ├── ui/                      # Componentes UI base
│   │   ├── layout/                  # Componentes de layout
│   │   └── features/                # Componentes por feature
│   │
│   ├── 📂 services/                 # Capa de servicios
│   │   ├── auth.service.ts
│   │   ├── gamification.service.ts
│   │   ├── user.service.ts
│   │   ├── activity.service.ts
│   │   ├── progress.service.ts
│   │   └── invitation.service.ts
│   │
│   ├── 📂 hooks/                    # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useActivities.ts
│   │   ├── useProgress.ts
│   │   └── useUsers.ts
│   │
│   ├── 📂 contexts/                 # React Contexts
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   │
│   ├── 📂 types/                    # TypeScript Types
│   │   ├── user.types.ts
│   │   ├── activity.types.ts
│   │   ├── gamification.types.ts
│   │   └── index.ts
│   │
│   ├── 📂 lib/                      # Librerías y utilidades
│   │   ├── supabase/
│   │   │   ├── client.ts            # Cliente Supabase browser
│   │   │   ├── server.ts            # Cliente Supabase server
│   │   │   └── middleware.ts        # Middleware Supabase
│   │   └── utils/
│   │
│   ├── 📂 config/                   # Configuración
│   │   ├── constants.ts
│   │   └── routes.ts
│   │
│   ├── 📂 i18n/                     # Internacionalización
│   │   └── translations.ts
│   │
│   └── index.css                    # Estilos globales
│
├── 📂 public/                       # Archivos estáticos
│   ├── images/
│   └── icons/
│
├── 📂 supabase/                     # Configuración Supabase
│   └── migrations/                  # Migraciones de BD
│
├── 📂 docs/                         # Documentación
│   ├── DATABASE_SCHEMA_GAMIFICATION.md
│   ├── API_REST_ESTANDAR.md
│   ├── DIAGRAMA_CASOS_DE_USO.md
│   └── ...
│
├── 📂 scripts/                      # Scripts de utilidad
│   └── seedGamificationUnits13_16.ts
│
├── .env.local                       # Variables de entorno
├── next.config.js                   # Configuración Next.js
├── tailwind.config.js               # Configuración Tailwind
├── tsconfig.json                    # Configuración TypeScript
├── package.json                     # Dependencias
└── README.md                        # Documentación principal
```

---

## 🔧 Configuración Técnica

### **Next.js Configuration**

```javascript
// next.config.js
{
  reactStrictMode: true,           // Modo estricto de React
  images: {
    domains: [],                    // Dominios permitidos para imágenes
  },
  experimental: {
    serverSourceMaps: false,        // Source maps deshabilitados
  }
}
```

### **TypeScript Configuration**

```json
{
  "target": "ES2017",
  "lib": ["dom", "dom.iterable", "esnext"],
  "jsx": "react-jsx",
  "module": "esnext",
  "moduleResolution": "bundler",
  "paths": {
    "@/*": ["./src/*"]              // Path alias para imports
  }
}
```

### **Tailwind CSS Configuration**

```javascript
{
  darkMode: 'class',                // Dark mode basado en clase
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif']
      },
      colors: {
        primary: { ... },           // Paleta de colores personalizada
        secondary: { ... },
        success: '#37C86F',
        danger: '#E84855',
        info: '#1BC6F2'
      }
    }
  }
}
```

---

## 🔐 Supabase como Backend (BaaS)

### **¿Qué es Supabase?**

Supabase es un **Backend as a Service (BaaS)** open-source, alternativa a Firebase, que proporciona:

1. **PostgreSQL Database** - Base de datos relacional completa
2. **Authentication** - Sistema de autenticación integrado
3. **Row Level Security (RLS)** - Seguridad a nivel de fila
4. **Real-time** - Actualizaciones en tiempo real
5. **Storage** - Almacenamiento de archivos
6. **Edge Functions** - Funciones serverless

### **Servicios de Supabase Utilizados**

```typescript
// Cliente Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Servicios utilizados:
// ✅ Authentication - Login, registro, sesiones
// ✅ Database - PostgreSQL con RLS
// ✅ Real-time - Leaderboard en tiempo real
// ❌ Storage - No utilizado actualmente
// ❌ Edge Functions - No utilizado (se usa Next.js API Routes)
```

### **Ventajas de Supabase**

✅ **PostgreSQL completo** - Base de datos relacional potente  
✅ **RLS integrado** - Seguridad a nivel de base de datos  
✅ **Autenticación lista** - No necesitas implementar auth desde cero  
✅ **Real-time** - Actualizaciones automáticas  
✅ **Open source** - Puedes self-hostear si lo necesitas  
✅ **Escalable** - Crece con tu aplicación  

---

## 🎨 Patrones de Diseño Implementados

### **1. Service Layer Pattern**

Toda la lógica de acceso a datos está encapsulada en servicios:

```typescript
// src/services/gamification.service.ts
export async function getMissions() {
  const response = await fetch('/api/gamification/missions');
  return response.json();
}

export async function createMission(data: MissionData) {
  const response = await fetch('/api/gamification/missions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### **2. Custom Hooks Pattern**

Lógica reutilizable encapsulada en hooks:

```typescript
// src/hooks/useActivities.ts
export function useActivities(missionId: string) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch activities
  }, [missionId]);
  
  return { activities, loading };
}
```

### **3. Context Provider Pattern**

Estado global con React Context:

```typescript
// src/contexts/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **4. Repository Pattern**

Abstracción de acceso a datos:

```typescript
// Supabase actúa como repository
const { data, error } = await supabase
  .from('gamification_missions')
  .select('*')
  .eq('is_active', true);
```

### **5. Component Composition**

Componentes pequeños y reutilizables:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Contenido
  </CardContent>
</Card>
```

---

## 🚀 Flujo de Datos

### **Flujo de Lectura (GET)**

```
1. Usuario interactúa con UI
   ↓
2. Componente llama a Custom Hook
   ↓
3. Hook llama a Service
   ↓
4. Service hace fetch a API Route
   ↓
5. API Route consulta Supabase
   ↓
6. Supabase ejecuta query en PostgreSQL
   ↓
7. Datos regresan por el mismo camino
   ↓
8. UI se actualiza con los datos
```

### **Flujo de Escritura (POST/PUT)**

```
1. Usuario envía formulario
   ↓
2. Componente valida datos
   ↓
3. Service envía datos a API Route
   ↓
4. API Route valida y autentica
   ↓
5. API Route inserta/actualiza en Supabase
   ↓
6. Supabase ejecuta triggers (si aplica)
   ↓
7. Respuesta regresa al cliente
   ↓
8. UI muestra confirmación
```

---

## 🔒 Seguridad

### **Capas de Seguridad**

1. **Autenticación** - Supabase Auth con JWT
2. **Autorización** - Row Level Security (RLS) en PostgreSQL
3. **Validación** - Validación en cliente y servidor
4. **HTTPS** - Comunicación encriptada
5. **Environment Variables** - Credenciales en variables de entorno

### **Row Level Security (RLS)**

```sql
-- Ejemplo: Estudiantes solo ven sus propios datos
CREATE POLICY "Students can view own progress"
ON progreso_estudiantes
FOR SELECT
USING (auth.uid() = id_estudiante);

-- Docentes pueden ver datos de sus estudiantes
CREATE POLICY "Teachers can view student progress"
ON progreso_estudiantes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id_usuario = auth.uid()
    AND rol = 'docente'
  )
);
```

---

## 📊 Base de Datos

### **PostgreSQL (via Supabase)**

**Tablas Principales:**

```
usuarios                          - Usuarios del sistema
progreso_estudiantes              - Progreso de estudiantes
gamification_missions             - Misiones educativas
gamification_activities           - Actividades de misiones
gamification_mission_attempts     - Intentos de misiones
gamification_activity_attempts    - Intentos de actividades
gamification_badges               - Badges/logros
gamification_user_badges          - Badges ganados por usuarios
gamification_streaks              - Rachas de actividad
gamification_points_transactions  - Historial de puntos
gamification_settings             - Configuración del sistema
```

**Características:**

- ✅ **Relaciones** - Foreign keys y constraints
- ✅ **Índices** - Para optimización de queries
- ✅ **Triggers** - Automatización de procesos
- ✅ **Functions** - Lógica de negocio en BD
- ✅ **RLS** - Seguridad a nivel de fila
- ✅ **Migrations** - Control de versiones de BD

---

## 🌐 Internacionalización (i18n)

### **Soporte Multi-idioma**

```typescript
// src/i18n/translations.ts
export const translations = {
  es: {
    welcome: 'Bienvenido',
    login: 'Iniciar Sesión',
    // ...
  },
  en: {
    welcome: 'Welcome',
    login: 'Login',
    // ...
  }
};
```

**Idiomas soportados:**
- 🇪🇸 Español (por defecto)
- 🇬🇧 Inglés

---

## 📦 Deployment

### **Opciones de Despliegue**

#### **1. Vercel (Recomendado)**
- ✅ Optimizado para Next.js
- ✅ Deploy automático desde Git
- ✅ Edge Functions globales
- ✅ SSL automático
- ✅ Preview deployments

```bash
# Deploy a Vercel
vercel deploy
```

#### **2. Self-Hosted**
- ✅ Control total
- ✅ Menor costo a largo plazo
- ❌ Requiere configuración manual

```bash
# Build
npm run build

# Start
npm run start
```

#### **3. Docker**
- ✅ Portable
- ✅ Consistente entre entornos

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 🔄 CI/CD

### **Scripts Disponibles**

```json
{
  "dev": "next dev",              // Desarrollo local
  "build": "next build",          // Build de producción
  "start": "next start",          // Servidor de producción
  "lint": "next lint",            // Linting
  "seed:gamification": "tsx scripts/seedGamificationUnits13_16.ts"
}
```

---

## 📈 Escalabilidad

### **Arquitectura Escalable**

1. **Frontend** - Next.js con SSR/SSG puede escalar horizontalmente
2. **API** - Serverless functions escalan automáticamente
3. **Database** - Supabase maneja escalado de PostgreSQL
4. **CDN** - Assets estáticos servidos desde CDN

### **Límites Actuales**

- **Supabase Free Tier**:
  - 500 MB de base de datos
  - 1 GB de almacenamiento
  - 2 GB de transferencia
  - 50,000 usuarios activos mensuales

### **Escalado Futuro**

Para escalar más allá del free tier:
1. Upgrade a Supabase Pro ($25/mes)
2. Implementar caching (Redis)
3. Optimizar queries con índices
4. Implementar pagination en listados
5. Lazy loading de componentes

---

## 🎯 Resumen Ejecutivo

### **¿Qué tipo de aplicación es?**

**English27 es una aplicación web full-stack moderna** con:
- ✅ Frontend: React/Next.js con TypeScript
- ✅ Backend: Next.js API Routes (serverless)
- ✅ Base de datos: PostgreSQL (Supabase)
- ✅ Autenticación: Supabase Auth
- ✅ Arquitectura: Clean Architecture + MVC
- ✅ Patrón: JAMstack

### **¿Es SaaS?**

**No es SaaS multi-tenant**, es una **aplicación institucional** para una sola organización (Unidad Educativa Delice).

Sin embargo, **podría convertirse en SaaS** con modificaciones:
- Agregar multi-tenancy (múltiples instituciones)
- Sistema de suscripciones
- Aislamiento de datos por tenant
- Personalización por institución

### **Stack Tecnológico Principal**

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16 + React 19 + TypeScript |
| **Styling** | Tailwind CSS 3.4 |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **Hosting** | Vercel (recomendado) |

### **Características Clave**

✅ **Moderna** - Stack tecnológico actualizado  
✅ **Type-safe** - TypeScript en todo el proyecto  
✅ **Escalable** - Arquitectura preparada para crecer  
✅ **Segura** - RLS, autenticación, validación  
✅ **Mantenible** - Clean Architecture, patrones claros  
✅ **Performante** - SSR, optimizaciones de Next.js  

---

**Última actualización:** 2024-12-16  
**Versión:** 2.0.0  
**Estado:** ✅ En producción
