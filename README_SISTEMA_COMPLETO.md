# English27 - Sistema de Aprendizaje de Inglés con Gamificación

## Descripción General

English27 es una plataforma web educativa avanzada diseñada para el aprendizaje de inglés mediante un sistema de gamificación completo. La plataforma permite a estudiantes aprender a través de misiones interactivas, mientras que docentes y administradores gestionan contenido y supervisan el progreso.

## Características Principales

### Sistema Multi-Rol
- **Administrador**: Gestión completa de usuarios, docentes, estudiantes e invitaciones
- **Docente**: Creación de misiones, gestión de actividades y seguimiento de progreso estudiantil
- **Estudiante**: Acceso a misiones, actividades interactivas y seguimiento de progreso personal

### Sistema de Gamificación
- Misiones organizadas por unidades temáticas (Units 13-16)
- Actividades interactivas (quiz, matching, fill-in-the-blank)
- Sistema de puntos y niveles
- Insignias y logros desbloqueables
- Seguimiento de progreso individual

### Sistema de Autenticación Robusto
- Registro mediante sistema de invitaciones
- Activación de cuentas con códigos únicos
- Estados de cuenta (pendiente, activo, inactivo)
- Cambio de contraseña y recuperación
- Protección de rutas por rol

## Arquitectura Técnica

### Stack Tecnológico

**Frontend:**
- Next.js 16.0.0 (React 19)
- TypeScript 5.9.3
- Tailwind CSS 3.4.18
- Lucide React (iconos)
- React Focus Lock

**Backend:**
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS) completo
- API Routes de Next.js

**Herramientas:**
- ESLint + Prettier
- TypeScript strict mode
- TSX para scripts

### Estructura del Proyecto

```
project/
├── app/                                    # App Router de Next.js
│   ├── (auth)/                            # Rutas de autenticación
│   │   ├── activate/                      # Activación de cuentas
│   │   ├── init-admin/                    # Inicialización de admin
│   │   └── login/                         # Login
│   ├── (dashboard)/                       # Rutas del dashboard
│   │   ├── administrador/                 # Panel de administrador
│   │   │   └── gamification/
│   │   │       └── badges/                # Gestión de insignias
│   │   ├── docente/                       # Panel de docente
│   │   │   └── gamification/
│   │   │       ├── badges/
│   │   │       ├── missions/              # CRUD de misiones
│   │   │       ├── settings/
│   │   │       └── student-progress/      # Seguimiento estudiantes
│   │   └── estudiante/                    # Panel de estudiante
│   │       └── gamification/
│   │           ├── achievements/          # Logros
│   │           ├── mission/[id]/          # Detalle y juego
│   │           ├── missions/              # Lista de misiones
│   │           └── progress/              # Dashboard de progreso
│   ├── api/                               # API Routes
│   │   ├── activities/                    # Endpoints de actividades
│   │   ├── auth/                          # Endpoints de autenticación
│   │   ├── gamification/                  # Endpoints de gamificación
│   │   ├── invitations/                   # Sistema de invitaciones
│   │   ├── progress/                      # Progreso de estudiantes
│   │   └── users/                         # Gestión de usuarios
│   ├── layout.tsx                         # Layout principal
│   └── page.tsx                           # Página de inicio
│
├── src/
│   ├── components/                        # Componentes React
│   │   ├── features/                      # Componentes por feature
│   │   │   ├── admin/                     # Componentes de admin
│   │   │   ├── auth/                      # Componentes de auth
│   │   │   ├── dashboard/                 # Dashboards por rol
│   │   │   ├── gamification/              # Sistema de gamificación
│   │   │   │   ├── activities/            # Tipos de actividades
│   │   │   │   ├── admin/                 # Admin de gamificación
│   │   │   │   ├── student/               # Vista estudiante
│   │   │   │   └── teacher/               # Vista docente
│   │   │   ├── profile/                   # Perfil de usuario
│   │   │   └── settings/                  # Configuración
│   │   ├── layout/                        # Componentes de layout
│   │   │   ├── DashboardNav.tsx           # Navegación principal
│   │   │   ├── LanguageSelector.tsx       # Selector de idioma
│   │   │   ├── ThemeToggle.tsx            # Toggle tema claro/oscuro
│   │   │   └── UserMenu.tsx               # Menú de usuario
│   │   └── ui/                            # Componentes UI reutilizables
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── Icon.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── LogoutModal.tsx
│   │
│   ├── config/                            # Configuración
│   │   ├── colors.ts                      # Sistema de colores
│   │   ├── constants.ts                   # Constantes globales
│   │   └── gamification-content-templates.ts  # Templates de contenido
│   │
│   ├── contexts/                          # React Contexts
│   │   ├── AuthContext.tsx                # Contexto de autenticación
│   │   ├── LanguageContext.tsx            # Contexto de idioma (es/en)
│   │   └── ThemeContext.tsx               # Contexto de tema
│   │
│   ├── hooks/                             # Custom Hooks
│   │   ├── useAchievements.ts             # Hook de logros
│   │   ├── useActivities.ts               # Hook de actividades
│   │   ├── useFormValidation.ts           # Hook de validación
│   │   ├── useGamification.ts             # Hook de gamificación
│   │   ├── useProgress.ts                 # Hook de progreso
│   │   ├── useTheme.ts                    # Hook de tema
│   │   └── useUsers.ts                    # Hook de usuarios
│   │
│   ├── i18n/                              # Internacionalización
│   │   ├── config.ts                      # Configuración i18n
│   │   └── translations/                  # Traducciones es/en
│   │
│   ├── lib/                               # Utilidades y helpers
│   │   ├── gamification/                  # Lógica de gamificación
│   │   │   ├── achievement-validator.ts   # Validación de logros
│   │   │   ├── badge-assignment.ts        # Asignación de insignias
│   │   │   ├── gamificationApi.ts         # API de gamificación
│   │   │   └── points-calculator.ts       # Calculador de puntos
│   │   ├── utils/                         # Utilidades generales
│   │   │   ├── cn.ts                      # Utilidad para classnames
│   │   │   └── formValidation.ts          # Validación de formularios
│   │   ├── get-current-user.ts            # Obtener usuario actual
│   │   ├── supabase-api.ts                # API wrapper de Supabase
│   │   ├── supabase-browser.ts            # Cliente Supabase browser
│   │   ├── supabase-route-handler.ts      # Cliente para route handlers
│   │   ├── supabase-server.ts             # Cliente Supabase server
│   │   └── supabase.ts                    # Cliente base
│   │
│   ├── services/                          # Servicios de negocio
│   │   ├── activity.service.ts            # Servicio de actividades
│   │   ├── auth.service.ts                # Servicio de autenticación
│   │   ├── gamification.service.ts        # Servicio de gamificación
│   │   ├── invitation.service.ts          # Servicio de invitaciones
│   │   ├── progress.service.ts            # Servicio de progreso
│   │   └── user.service.ts                # Servicio de usuarios
│   │
│   ├── types/                             # TypeScript types
│   │   ├── activity.types.ts
│   │   ├── auth.types.ts
│   │   ├── gamification.types.ts
│   │   ├── invitation.types.ts
│   │   ├── user.types.ts
│   │   └── index.ts
│   │
│   └── index.css                          # Estilos globales
│
├── supabase/
│   └── migrations/                        # Migraciones de base de datos
│       ├── 20251110093225_create_initial_schema.sql
│       ├── 20251111000000_set_default_estado_pendiente.sql
│       ├── 20251120234531_create_invitation_system.sql
│       ├── 20251121004512_fix_rls_and_trigger_for_init_admin_v2.sql
│       ├── 20251121012800_fix_invitations_rls_policies.sql
│       ├── 20251121015651_comprehensive_rls_fix_for_invitations.sql
│       ├── 20251121042541_create_gamification_module.sql
│       └── 20251121162040_seed_gamification_units_13_16.sql
│
├── scripts/                               # Scripts de utilidad
│   └── seedGamificationUnits13_16.ts     # Seed de unidades 13-16
│
├── docs/                                  # Documentación
│   ├── API_REST_ESTANDAR.md
│   ├── CAMBIOS_PALETA_COLORES.md
│   ├── COLOR_GUIDE.md
│   ├── DATABASE_SCHEMA_GAMIFICATION.md
│   ├── GAMIFICATION_MODULE.md
│   ├── SISTEMA_COLORES.md
│   └── SISTEMA_TIPOGRAFIA_ESTANDARIZADO.md
│
└── public/                                # Archivos públicos
    └── images/
        └── logo.jpg
```

## Base de Datos

### Esquema Principal

#### Tablas de Usuarios y Autenticación

**usuarios**
- Sistema de usuarios con roles (administrador, docente, estudiante)
- Estados: activo, pendiente, inactivo
- Información personal: nombre, apellido, email, grado, sección

**invitaciones**
- Sistema de invitación mediante códigos únicos
- Estados: pendiente, aceptada, expirada, cancelada
- Tipos: estudiante, docente
- Expiraciones automáticas

**progreso_estudiantes**
- Seguimiento de puntos totales por estudiante
- Nivel actual
- Misiones completadas
- Tiempo total invertido

#### Tablas de Gamificación

**gamification_missions**
- Misiones organizadas por unidad y tema
- Niveles de dificultad: fácil, medio, difícil
- Tipos: grammar, vocabulary, reading, listening, speaking, writing, mixed
- Puntos base y duración estimada

**gamification_activities**
- Actividades dentro de cada misión
- Tipos: quiz, matching, fill_in_blank, ordering, multiple_choice, true_false
- Contenido en JSON flexible
- Sistema de puntos por actividad

**gamification_mission_attempts**
- Intentos de misiones por estudiante
- Estados: not_started, in_progress, completed, failed, abandoned
- Scoring y tiempo invertido
- Tracking de progreso

**gamification_activity_attempts**
- Intentos individuales de actividades
- Respuestas del usuario en JSON
- Corrección automática
- Sistema de reintentos

**gamification_badges**
- Insignias desbloqueables
- Criterios: missions_completed, points_reached, streak_days, perfect_scores, speed_bonus
- Rareza: common, rare
- Recompensas en puntos

**gamification_user_badges**
- Insignias obtenidas por usuarios
- Fecha de obtención
- Snapshot de progreso al obtenerla

### Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) habilitado con políticas restrictivas:

- **Estudiantes**: Solo acceden a sus propios datos
- **Docentes**: Acceden a datos de sus estudiantes y contenido educativo
- **Administradores**: Acceso completo para gestión

## Módulos Principales

### 1. Sistema de Autenticación

**Características:**
- Login con email y contraseña
- Registro mediante invitaciones
- Activación de cuentas con código único
- Recuperación de contraseña
- Cambio de contraseña
- Verificación de estado de cuenta
- Protección de rutas por rol

**Flujo de Registro:**
1. Admin/docente envía invitación a email
2. Usuario recibe código de activación
3. Usuario se registra con código
4. Cuenta queda en estado "pendiente"
5. Admin/docente activa la cuenta
6. Usuario puede iniciar sesión

### 2. Panel de Administrador

**Funcionalidades:**
- Dashboard con estadísticas generales
- Gestión completa de usuarios (crear, editar, eliminar, cambiar rol)
- Sistema de invitaciones masivas
- Gestión de docentes (invitar, activar, desactivar)
- Gestión de estudiantes por grado y sección
- Gestión de insignias del sistema
- Visualización de estadísticas globales

### 3. Panel de Docente

**Funcionalidades:**
- Dashboard con resumen de actividades
- CRUD completo de misiones
- Gestión de actividades por misión
- Tipos de actividades:
  - Quiz (opción múltiple)
  - Matching (emparejar)
  - Fill in the blank (completar)
- Seguimiento de progreso estudiantil individual
- Estadísticas por misión
- Gestión de insignias
- Configuración del módulo de gamificación

### 4. Panel de Estudiante

**Funcionalidades:**

**Misiones:**
- Visualización de misiones disponibles
- Filtrado por unidad y dificultad
- Detalle de misión con actividades
- Modo de juego interactivo
- Feedback inmediato
- Tracking de progreso en tiempo real

**Logros y Progreso:**
- Dashboard de progreso personal
- Visualización de puntos y nivel
- Insignias obtenidas y por desbloquear
- Historial de misiones completadas
- Estadísticas personales

### 5. Sistema de Actividades Interactivas

**Quiz Activity:**
- Preguntas de opción múltiple
- 4 opciones por pregunta
- Feedback inmediato
- Puntuación automática

**Matching Activity:**
- Emparejar términos
- Validación de pares correctos
- Sistema de drag & drop o selección
- Feedback visual

**Fill in the Blank Activity:**
- Completar espacios en blanco
- Validación de respuestas
- Soporte para múltiples blancos
- Feedback contextual

### 6. Sistema de Puntos y Niveles

**Cálculo de Puntos:**
- Puntos base por misión
- Puntos por actividad individual
- Bonificación por velocidad
- Bonificación por perfectos
- Penalización por reintentos

**Sistema de Niveles:**
- Progresión automática
- Niveles basados en puntos totales
- Desbloqueo de contenido por nivel

### 7. Sistema de Insignias

**Tipos de Criterios:**
- Misiones completadas
- Puntos alcanzados
- Días consecutivos (streaks)
- Puntuaciones perfectas
- Bonificaciones de velocidad

**Rareza y Recompensas:**
- Common: 100 puntos
- Rare: 250 puntos

## Sistema de Diseño

### Paleta de Colores

**Modo Claro:**
- Background: Gradientes de neutral-100 a white
- Cards: White con borders gray-200
- Texto: gray-900 (títulos), gray-600 (secundario)
- Acentos: blue-600, green-600, purple-600

**Modo Oscuro:**
- Background: Gradientes de #0F172A a #1E293B
- Cards: #1E293B con borders #334155
- Texto: white (títulos), gray-400 (secundario)
- Acentos: blue-400, green-400, purple-400

### Tipografía

- Font stack: System fonts (San Francisco, Segoe UI, Roboto)
- Tamaños: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl
- Pesos: font-normal (400), font-semibold (600), font-bold (700)
- Line height: 120% (headings), 150% (body)

### Componentes UI

- Botones con estados hover y disabled
- Cards con sombras y borders
- Badges con colores semánticos
- Loading spinners
- Modales y overlays
- Navegación responsive
- Animaciones y transiciones suaves

## Características Técnicas Avanzadas

### Internacionalización (i18n)
- Soporte para español e inglés
- Context API para gestión de idioma
- Traducciones centralizadas
- Cambio de idioma en tiempo real

### Tema Claro/Oscuro
- Toggle persistente en localStorage
- Transiciones suaves entre temas
- Soporte completo en todos los componentes
- Respeto a preferencias del sistema

### Optimizaciones de Rendimiento
- Server Components de Next.js
- Static Generation donde es posible
- Lazy loading de componentes pesados
- Optimización de queries a Supabase
- Caching de datos frecuentes

### Accesibilidad
- Navegación por teclado
- ARIA labels
- Contraste de colores WCAG AA
- Focus management con react-focus-lock
- Semantic HTML

## Configuración e Instalación

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase

### Variables de Entorno

Crear archivo `.env` con:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Instalación

```bash
# Instalar dependencias
npm install

# Aplicar migraciones (desde Supabase Dashboard o CLI)
# Las migraciones están en supabase/migrations/

# Desarrollo
npm run dev

# Producción
npm run build
npm run start
```

### Inicialización del Sistema

1. Acceder a `/init-admin` para crear el primer administrador
2. El admin puede invitar docentes
3. Los docentes pueden invitar estudiantes
4. Cargar contenido de misiones (ya incluye Units 13-16)

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm run start

# Linting
npm run lint

# Seed de unidades 13-16
npm run seed:gamification
```

## Datos Precargados

### Unidades de Aprendizaje (13-16)

**Unit 13: Talking about the Future**
- Grammar: Future tenses (will, going to)
- Vocabulary: Plans and predictions
- 12 actividades interactivas

**Unit 14: Making Comparisons**
- Grammar: Comparatives and superlatives
- Vocabulary: Adjectives for comparisons
- 12 actividades interactivas

**Unit 15: Conditional Sentences**
- Grammar: Zero, first, second conditionals
- Vocabulary: Hypothetical situations
- 12 actividades interactivas

**Unit 16: Talking about Experiences**
- Grammar: Present perfect
- Vocabulary: Life experiences
- 12 actividades interactivas

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro con código
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/reset-password` - Recuperar contraseña
- `POST /api/auth/update-password` - Cambiar contraseña
- `POST /api/auth/init-admin` - Crear primer admin

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/[id]` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PUT /api/users/[id]` - Actualizar usuario
- `DELETE /api/users/[id]` - Eliminar usuario
- `GET /api/users/stats` - Estadísticas

### Invitaciones
- `GET /api/invitations` - Listar invitaciones
- `POST /api/invitations` - Crear invitación
- `POST /api/invitations/bulk` - Invitaciones masivas
- `PUT /api/invitations/[id]` - Actualizar invitación
- `POST /api/invitations/validate` - Validar código
- `POST /api/invitations/activate` - Activar cuenta

### Gamificación
- `GET /api/gamification` - Datos de gamificación
- `GET /api/gamification/achievements` - Logros
- `GET /api/gamification/challenges` - Desafíos
- `GET /api/gamification/student-progress` - Progreso
- `GET /api/gamification/student-progress/[id]` - Progreso individual

### Actividades
- `GET /api/activities` - Listar actividades
- `POST /api/activities` - Crear actividad
- `GET /api/activities/assignments` - Asignaciones
- `GET /api/activities/stats` - Estadísticas

### Progreso
- `GET /api/progress` - Obtener progreso
- `POST /api/progress` - Actualizar progreso

## Seguridad

### Medidas Implementadas

1. **Autenticación y Autorización:**
   - JWT tokens con Supabase Auth
   - Verificación de rol en cada endpoint
   - Protección de rutas en frontend y backend

2. **Row Level Security (RLS):**
   - Políticas restrictivas en todas las tablas
   - Acceso basado en `auth.uid()`
   - Verificación de pertenencia y propiedad

3. **Validación de Datos:**
   - Validación en frontend y backend
   - Sanitización de inputs
   - Constraints en base de datos

4. **Prevención de Exploits:**
   - Transacciones atómicas para operaciones críticas
   - Validaciones de integridad de datos
   - Prevención de race conditions

5. **Seguridad de Sesión:**
   - Tokens con expiración
   - Refresh tokens automático
   - Logout seguro

## Testing y Calidad

### Validaciones Implementadas
- TypeScript strict mode
- ESLint para código limpio
- Prettier para formato consistente
- Validación de formularios en tiempo real
- Error boundaries

### Próximos Pasos de Testing
- Unit tests con Jest
- Integration tests con React Testing Library
- E2E tests con Playwright
- Performance testing

## Roadmap Futuro

### Características Planeadas
- Reportes avanzados con gráficos
- Exportación de datos en PDF/Excel
- Sistema de tareas y deberes
- Biblioteca de recursos multimedia

### Mejoras Técnicas
- PWA (Progressive Web App)
- Optimizaciones de rendimiento
- Análisis detallado de aprendizaje

## Soporte y Documentación

Para más información, consultar:
- `docs/` - Documentación técnica detallada
- Comentarios en código fuente
- Migraciones de base de datos con documentación completa

## Licencia

Proyecto educativo English27.

---

**Versión:** 2.0.0
**Última actualización:** Diciembre 2024
**Estado:** Producción
