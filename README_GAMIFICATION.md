# 🎓 Sistema Educativo Gamificado - English27

## 📖 Descripción General

Sistema educativo web que implementa **gamificación pedagógica** mediante misiones controladas y un sistema integral de reportes académicos. Los juegos educativos funcionan como **misiones pedagógicas** que se activan bajo planificación docente, no como entretenimiento libre.

### Características Principales

✅ **Módulo de Gamificación**
- Retos/Misiones controladas por disponibilidad
- Sistema de puntos con multiplicadores por rendimiento
- Control de intentos y fechas de acceso
- Evaluación pedagógica de resultados

✅ **Módulo de Reportes**
- Consolidación de datos históricos
- Reportes por estudiante, tema, juego, paralelo y período
- Análisis de desempeño y tendencias
- Soporte para toma de decisiones pedagógicas

✅ **Arquitectura en 3 Capas**
- **Capa de Juego**: Phaser 3 (mecánicas)
- **Capa Pedagógica**: Evaluación y feedback
- **Capa de Gamificación**: Misiones y recompensas

## 🏗️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: CSS Modules + Tailwind CSS
- **Game Engine**: Phaser 3
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes (REST)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

### DevOps
- **Hosting**: Vercel (recomendado)
- **Database**: Supabase Cloud
- **Version Control**: Git

## 📁 Estructura del Proyecto

```
appWebIngles/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── games/               # Endpoints de juegos
│   │   ├── missions/            # Endpoints de misiones
│   │   └── reports/             # Endpoints de reportes
│   ├── dashboard/               # Rutas protegidas
│   └── (auth)/                  # Rutas de autenticación
│
├── src/
│   ├── components/              # Componentes React
│   │   ├── features/           # Componentes por feature
│   │   │   ├── gamification/  # Juegos y misiones
│   │   │   ├── reports/       # Reportes
│   │   │   └── dashboard/     # Dashboards
│   │   ├── layout/            # Layouts y navegación
│   │   └── ui/                # Componentes UI reutilizables
│   │
│   ├── lib/                    # Lógica de negocio
│   │   ├── games/             # Lógica de juegos (Phaser)
│   │   └── gamification/      # Lógica de gamificación
│   │
│   ├── services/              # Servicios API (frontend)
│   ├── contexts/              # React Contexts
│   ├── hooks/                 # Custom Hooks
│   └── types/                 # TypeScript Types
│
├── docs/                       # Documentación
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── GAMIFICATION_ARCHITECTURE.md
│   ├── DEVELOPER_GUIDE.md
│   └── ...
│
└── supabase/                   # Scripts de BD
    └── sample_game_data.sql
```

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- npm o yarn
- Cuenta de Supabase

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd appWebIngles

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales:
# NEXT_PUBLIC_SUPABASE_URL=tu-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
# SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# 4. Ejecutar migraciones de BD
# (Ejecutar scripts SQL en Supabase Dashboard)

# 5. Insertar datos de prueba
# (Ejecutar supabase/sample_game_data.sql)

# 6. Iniciar servidor de desarrollo
npm run dev
```

### Acceder a la Aplicación

```
http://localhost:3000
```

## 🎮 Juegos Implementados

### Word Catcher
**Tipo**: Vocabulario y reconocimiento
**Mecánica**: Palabras caen desde arriba, el estudiante hace clic en las correctas
**Duración**: 2 minutos
**Criterios de éxito**: 
- Puntaje mínimo: 50
- Precisión mínima: 60%

**Multiplicadores de puntos**:
- Excelente (80%+): ×1.5
- Bueno (65-79%): ×1.2
- Aceptable (60-64%): ×1.0
- Bajo (<60%): ×0.5

## 📊 Flujo de Uso

### Para Docentes

1. **Planificar Misión**
   - Acceder a "Gamificación"
   - Seleccionar paralelo
   - Asignar juego a tema
   - Configurar fechas e intentos

2. **Monitorear Progreso**
   - Ver estudiantes activos
   - Revisar intentos usados
   - Analizar desempeño

3. **Generar Reportes**
   - Acceder a "Reportes"
   - Seleccionar tipo de reporte
   - Generar y visualizar
   - Exportar datos

### Para Estudiantes

1. **Ver Misiones Disponibles**
   - Acceder a "Mis Juegos"
   - Ver misiones activas
   - Verificar intentos restantes

2. **Jugar Misión**
   - Click "Jugar Ahora"
   - Sistema valida acceso
   - Jugar el juego
   - Ver resultados y feedback

3. **Revisar Progreso**
   - Ver puntos acumulados
   - Ver actividades completadas
   - Ver historial de sesiones

## 🔐 Seguridad

### Validaciones Backend
- ✅ Autenticación requerida en todas las rutas protegidas
- ✅ Validación de misiones en servidor
- ✅ Control de intentos en base de datos
- ✅ Contenido filtrado por tema exacto
- ✅ Autorización por rol (estudiante/docente)

### Validaciones Frontend
- ✅ Verificación de sesión activa
- ✅ Redirección si no autenticado
- ✅ UI condicional por rol
- ✅ Validación de formularios

## 📈 Métricas y KPIs

### Por Estudiante
- Actividades completadas
- Puntos totales acumulados
- Precisión promedio
- Tasa de éxito en misiones

### Por Paralelo
- Estudiantes activos
- Promedio de puntos
- Promedio de actividades
- Tasa de engagement

### Por Tema
- Estudiantes que jugaron
- Sesiones totales
- Puntaje promedio
- Tasa de éxito

## 🧪 Testing

### Crear Datos de Prueba

```sql
-- Ejecutar en Supabase SQL Editor
-- Ver: supabase/sample_game_data.sql

-- Reemplazar:
-- YOUR_TEACHER_USER_ID → ID de docente
-- YOUR_PARALLEL_ID → ID de paralelo
```

### Probar Flujo Completo

1. **Como Docente**:
   - Login con cuenta docente
   - Crear misión en GameManager
   - Verificar en BD: `SELECT * FROM game_availability`

2. **Como Estudiante**:
   - Login con cuenta estudiante del paralelo
   - Ver misión en "Mis Juegos"
   - Jugar y completar
   - Verificar progreso actualizado

3. **Generar Reporte**:
   - Como docente, ir a "Reportes"
   - Generar reporte de paralelo
   - Verificar datos consolidados

## 📚 Documentación

### Arquitectura
- [`SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) - Arquitectura integral del sistema
- [`GAMIFICATION_ARCHITECTURE.md`](docs/GAMIFICATION_ARCHITECTURE.md) - Detalles de gamificación
- [`GAMIFICATION_SUMMARY.md`](docs/GAMIFICATION_SUMMARY.md) - Resumen ejecutivo

### Desarrollo
- [`DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md) - Guía de referencia rápida
- [`WORD_CATCHER_GAME.md`](docs/WORD_CATCHER_GAME.md) - Documentación del juego
- [`GAME_DATA_FLOW.md`](docs/GAME_DATA_FLOW.md) - Flujo de datos del juego

### Implementación
- [`WORD_CATCHER_IMPLEMENTATION.md`](docs/WORD_CATCHER_IMPLEMENTATION.md) - Detalles técnicos
- [`QUICK_START_GAME.md`](docs/QUICK_START_GAME.md) - Inicio rápido

## 🎓 Fundamentos Teóricos

Este sistema se basa en:

1. **Gamificación Educativa** (Deterding et al., 2011)
   - Elementos de juego en contexto educativo
   - Motivación intrínseca y extrínseca

2. **Aprendizaje Basado en Competencias** (Bloom, 1956)
   - Objetivos claros y medibles
   - Evaluación formativa continua

3. **Teoría del Flujo** (Csikszentmihalyi, 1990)
   - Balance entre desafío y habilidad
   - Feedback inmediato

4. **Autodeterminación** (Deci & Ryan, 1985)
   - Autonomía, competencia y relación
   - Motivación intrínseca

## 🚀 Roadmap

### Versión Actual (v1.0)
- [x] Word Catcher implementado
- [x] Sistema de misiones
- [x] Validación de acceso
- [x] Evaluación pedagógica
- [x] Reportes básicos

### Próximas Versiones

#### v1.1 - Más Juegos
- [ ] Sentence Builder
- [ ] Vocabulary Match
- [ ] Pronunciation Practice

#### v1.2 - Reportes Avanzados
- [ ] Gráficos interactivos
- [ ] Exportación a PDF/Excel
- [ ] Reportes personalizados
- [ ] Comparativas temporales

#### v1.3 - Gamificación Avanzada
- [ ] Logros y badges
- [ ] Leaderboards por paralelo
- [ ] Desafíos semanales
- [ ] Recompensas especiales

#### v2.0 - Inteligencia Artificial
- [ ] Recomendaciones personalizadas
- [ ] Detección de dificultades
- [ ] Adaptación de dificultad
- [ ] Análisis predictivo

## 🤝 Contribuir

### Agregar Nuevo Juego

1. Crear escena Phaser en `src/lib/games/`
2. Crear wrapper React en `src/components/features/gamification/`
3. Registrar en `game_types` tabla
4. Reutilizar `MissionValidator` y `MissionEvaluator`
5. Documentar en `docs/`

### Agregar Nuevo Reporte

1. Crear query en `app/api/reports/run/route.ts`
2. Agregar tipo en `src/types/report.types.ts`
3. Actualizar UI en `ReportDashboard.tsx`
4. Documentar métricas

## 📝 Licencia

[Especificar licencia]

## 👥 Equipo

[Información del equipo]

## 📞 Soporte

Para preguntas o problemas:
- Documentación: `docs/`
- Issues: [GitHub Issues]
- Email: [email de soporte]

---

**Desarrollado con ❤️ para educación de calidad**

**Última actualización**: 2026-01-03
