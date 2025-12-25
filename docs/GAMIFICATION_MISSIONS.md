# 🎯 Sistema de Misiones - Gamificación

## 📖 Tabla de Contenidos

1. [Introducción](#introducción)
2. [¿Qué son las Misiones?](#qué-son-las-misiones)
3. [Estructura de Misiones](#estructura-de-misiones)
4. [Tipos de Misiones](#tipos-de-misiones)
5. [Arquitectura Técnica](#arquitectura-técnica)
6. [Flujo de Ejecución](#flujo-de-ejecución)
7. [API REST](#api-rest)
8. [Base de Datos](#base-de-datos)
9. [Componentes React](#componentes-react)
10. [Ejemplo de Implementación](#ejemplo-de-implementación)

---

## 📚 Introducción

El sistema de misiones es la **columna vertebral del módulo de gamificación** en English27. Las misiones son unidades de aprendizaje temáticas alineadas con el currículo de inglés que combinan múltiples actividades interactivas para crear una experiencia de aprendizaje motivadora y progresiva.

**Estado**: ✅ Completamente implementado y en producción

---

## ¿Qué son las Misiones?

### Definición

Una **misión** es un conjunto temático de actividades educativas enfocadas en enseñar un concepto específico de inglés. Cada misión:

- ✅ Está alineada con unidades del libro de texto de inglés (Units 13-16)
- ✅ Contiene múltiples actividades interactivas de diferentes tipos
- ✅ Otorga puntos al estudiante por completación
- ✅ Rastrea el progreso individual del estudiante
- ✅ Permite intentos múltiples con retroalimentación

### Características Clave

| Aspecto | Descripción |
|--------|------------|
| **Objetivo** | Enseñar conceptos de inglés de forma interactiva y gamificada |
| **Duración** | 15 minutos promedio (configurable) |
| **Puntos Base** | 100 puntos por completación |
| **Dificultad** | Fácil, Medio, Difícil |
| **Intentos** | Múltiples intentos permitidos |
| **Retroalimentación** | Inmediata por cada actividad |
| **Progreso** | Se rastrea automáticamente |

---

## 📋 Estructura de Misiones

### Jerarquía

```
UNIDAD (Unit 13-16)
    └── MISIÓN (Mission)
            └── ACTIVIDADES (Activities)
                    ├── Quiz
                    ├── Matching Pairs
                    ├── Flashcards
                    └── ... (12 tipos)
```

### Unidades del Currículo

El sistema actualmente implementa 4 unidades del libro de texto de inglés:

| Unit | Título | Tema | Misiones |
|------|--------|------|----------|
| **13** | Places | Lugares en la ciudad, preposiciones de lugar | 3 misiones |
| **14** | Out and about | Actividades, transporte, direcciones | 3 misiones |
| **15** | What shall I wear? | Ropa, descripción, estilos | 3 misiones |
| **16** | Buy it! | Tiendas, compras, números, dinero | 3 misiones |

### Estructura de Datos

```typescript
// Tipo base de misión
interface Mission {
  id: string;                          // UUID único
  unit_number: number;                 // 13, 14, 15, 16
  topic: string;                       // Tema específico
  title: string;                       // "Places in a Town"
  description: string;                 // Descripción de la misión
  difficulty_level: 'facil' | 'medio' | 'dificil';
  base_points: number;                 // Puntos por completación (ej: 100)
  mission_type: 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'speaking' | 'writing' | 'mixed';
  estimated_duration_minutes: number;  // Tiempo estimado
  is_active: boolean;                  // Si está disponible para estudiantes
  order_index: number;                 // Orden de presentación
  created_by: string;                  // ID del docente que la creó
  created_at: string;                  // Timestamp de creación
  updated_at: string;                  // Timestamp de actualización
}
```

---

## 🔄 Tipos de Misiones

### 1. Por Tipo Pedagógico (mission_type)

| Tipo | Descripción | Ejemplo |
|------|------------|---------|
| **vocabulary** | Enfocada en vocabulario | "Vocabulary: Shops" |
| **grammar** | Enfocada en estructura gramatical | "Questions with 'Is there?' and 'Are there any?'" |
| **reading** | Comprensión de lectura | "Reading comprehension: Town descriptions" |
| **listening** | Comprensión auditiva | "Listening to place descriptions" |
| **speaking** | Práctica de pronunciación/diálogo | "Dialogue practice: Asking for directions" |
| **writing** | Expresión escrita | "Writing descriptions of places" |
| **mixed** | Combinación de habilidades | "Complete mission with all skills" |

### 2. Por Dificultad (difficulty_level)

| Nivel | Descripción | Requisitos |
|-------|-----------|-----------|
| **facil** | Introductorio, vocabulario básico | Principiantes |
| **medio** | Consolidación, estructuras complejas | Nivel intermedio |
| **dificil** | Avanzado, contextos reales | Estudiantes avanzados |

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

```
Frontend (React/Next.js)
    ↓
REST API (Next.js API Routes)
    ↓
Supabase (PostgreSQL)
    ↓
Tablas de Gamificación
```

### Flujo de Datos

```
Student Browser
    ↓
React Component (MissionsListView)
    ↓
gamificationApi.ts (Client-side API wrapper)
    ↓
/api/gamification/missions (Route Handler)
    ↓
Supabase Client (Service Role)
    ↓
gamification_missions (PostgreSQL)
```

---

## 🎮 Flujo de Ejecución

### 1. Cargar Lista de Misiones (Estudiante)

```
┌─────────────────────────────────────┐
│ Estudiante abre "Misiones"          │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ MissionsListView.tsx carga          │
│ - Llama getMissionsWithProgress()   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ gamificationApi.ts                  │
│ - Petición GET a /api/gamification/ │
│   progress/missions                 │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Route Handler: /api/gamification/   │
│ progress/missions (GET)             │
│ - Obtiene misiones activas          │
│ - Obtiene intentos del usuario      │
│ - Mapea data con progreso           │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Supabase Service Role Client        │
│ - Consulta: gamification_missions   │
│ - Consulta: gamification_mission_   │
│   attempts                          │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Response JSON con:                  │
│ - Misiones agrupadas por unit       │
│ - Progreso de estudiante            │
│ - Puntos completados                │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Frontend renderiza tarjetas de      │
│ misiones con progreso visual        │
└─────────────────────────────────────┘
```

### 2. Iniciar una Misión

```
┌─────────────────────────────────────┐
│ Estudiante hace clic en "Iniciar"   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ MissionPlayView.tsx                 │
│ - Carga misión por ID               │
│ - Carga actividades de la misión    │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Endpoints necesarios:               │
│ 1. GET /api/gamification/missions   │
│    /[id]                            │
│ 2. GET /api/gamification/activities │
│    ?mission_id=[id]                 │
│ 3. POST /api/gamification/progress/ │
│    missions                         │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Supabase crea:                      │
│ - gamification_mission_attempts     │
│ - Status: 'in_progress'             │
│ - Timestamp de inicio               │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ ActivityRunner renderiza primera    │
│ actividad de la misión              │
└─────────────────────────────────────┘
```

### 3. Completar Actividad

```
┌─────────────────────────────────────┐
│ Estudiante completa actividad       │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ ActivityRunner evalúa respuesta     │
│ - Verifica corrección               │
│ - Calcula puntos                    │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ POST /api/gamification/activities/  │
│ [id]/attempt                        │
│ - Envía respuesta                   │
│ - Envía puntos ganados              │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Supabase:                           │
│ - Crea gamification_activity_       │
│   attempts                          │
│ - Actualiza gamification_mission_   │
│   attempts (progreso)               │
│ - Triggers: actualiza puntos        │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Response con:                       │
│ - Resultado (correcto/incorrecto)   │
│ - Puntos ganados                    │
│ - Feedback personalizado            │
└─────────────────────────────────────┘
```

### 4. Completar Misión Completa

```
┌─────────────────────────────────────┐
│ Estudiante completa última          │
│ actividad de la misión              │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ ActivityRunner detecta fin          │
├─ Calcula puntos totales de misión   │
├─ Detecta logros desbloqueados       │
├─ Calcula bonificadores (racha)      │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ PUT /api/gamification/progress/     │
│ missions/[id]                       │
│ - Status: 'completed'               │
│ - Puntos totales                    │
│ - Timestamp de fin                  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Supabase Triggers ejecutan:         │
│ - Actualiza tabla progreso_         │
│   estudiantes                       │
│ - Asigna badges si aplica           │
│ - Registra transacción de puntos    │
│ - Actualiza racha                   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Frontend muestra:                   │
│ - Pantalla de celebración           │
│ - Puntos totales ganados            │
│ - Badges desbloqueados              │
│ - Nuevo nivel/posición              │
└─────────────────────────────────────┘
```

---

## 🌐 API REST

### Endpoints Principales

#### 1. Listar Misiones

```http
GET /api/gamification/missions
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "missions": [
    {
      "id": "uuid-1",
      "unit_number": 13,
      "topic": "Places",
      "title": "Places in a Town",
      "description": "Learn vocabulary about places...",
      "difficulty_level": "facil",
      "base_points": 100,
      "mission_type": "vocabulary",
      "estimated_duration_minutes": 15,
      "is_active": true,
      "order_index": 1,
      "created_at": "2025-11-01T10:00:00Z"
    }
  ]
}
```

#### 2. Obtener Misión por ID

```http
GET /api/gamification/missions/[id]
```

**Parámetros:**
- `id` (path): UUID de la misión

**Respuesta:**
```json
{
  "success": true,
  "mission": {
    "id": "uuid-1",
    "unit_number": 13,
    "title": "Places in a Town",
    // ... todos los campos de Mission
  }
}
```

#### 3. Crear Misión (Docentes)

```http
POST /api/gamification/missions
Content-Type: application/json

{
  "unit_number": 13,
  "topic": "Places",
  "title": "Places in a Town",
  "description": "Learn vocabulary about places in a town",
  "difficulty_level": "facil",
  "base_points": 100,
  "mission_type": "vocabulary",
  "estimated_duration_minutes": 15,
  "order_index": 1
}
```

#### 4. Obtener Misiones con Progreso del Estudiante

```http
GET /api/gamification/progress/missions
```

**Respuesta:**
```json
{
  "success": true,
  "missions": [
    {
      "mission": {
        "id": "uuid-1",
        "title": "Places in a Town",
        // ... datos de misión
      },
      "user_attempt": {
        "id": "uuid-attempt",
        "status": "completed", // in_progress | completed | not_started
        "activities_completed": 4,
        "total_activities": 4,
        "points_earned": 95,
        "started_at": "2025-12-15T10:00:00Z",
        "completed_at": "2025-12-15T10:25:00Z"
      }
    }
  ]
}
```

#### 5. Iniciar Misión

```http
POST /api/gamification/progress/missions
Content-Type: application/json

{
  "mission_id": "uuid-1"
}
```

**Respuesta:**
```json
{
  "success": true,
  "attempt": {
    "id": "uuid-attempt",
    "mission_id": "uuid-1",
    "user_id": "uuid-user",
    "status": "in_progress",
    "started_at": "2025-12-15T10:00:00Z",
    "activities_completed": 0,
    "total_activities": 4,
    "points_earned": 0
  }
}
```

#### 6. Actualizar Progreso de Misión

```http
PUT /api/gamification/progress/missions/[id]
Content-Type: application/json

{
  "status": "completed",
  "points_earned": 95,
  "activities_completed": 4
}
```

---

## 🗄️ Base de Datos

### Tabla: gamification_missions

```sql
CREATE TABLE gamification_missions (
  id UUID PRIMARY KEY,
  unit_number INTEGER NOT NULL,           -- 13, 14, 15, 16
  topic TEXT NOT NULL,                    -- "Places", "Vocabulary: Shops"
  title TEXT NOT NULL,                    -- "Places in a Town"
  description TEXT NOT NULL,              -- Descripción de la misión
  difficulty_level TEXT NOT NULL,         -- facil, medio, dificil
  base_points INTEGER DEFAULT 100,        -- Puntos base
  mission_type TEXT NOT NULL,             -- grammar, vocabulary, reading, etc.
  estimated_duration_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,         -- Si está disponible
  order_index INTEGER,                    -- Orden de presentación
  created_by UUID REFERENCES usuarios(id_usuario),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_missions_active ON gamification_missions(is_active);
CREATE INDEX idx_missions_unit ON gamification_missions(unit_number);
CREATE INDEX idx_missions_order ON gamification_missions(order_index);
```

### Tabla: gamification_mission_attempts

```sql
CREATE TABLE gamification_mission_attempts (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES gamification_missions(id),
  user_id UUID NOT NULL REFERENCES usuarios(id_usuario),
  status TEXT DEFAULT 'in_progress',      -- in_progress, completed, abandoned
  activities_completed INTEGER DEFAULT 0, -- Actividades completadas
  total_activities INTEGER,               -- Total de actividades
  points_earned INTEGER DEFAULT 0,        -- Puntos ganados
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  UNIQUE(mission_id, user_id)             -- Un intento activo por usuario-misión
);
```

### Tabla: gamification_activities

```sql
CREATE TABLE gamification_activities (
  id UUID PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES gamification_missions(id),
  title TEXT NOT NULL,                    -- "Places Flashcards"
  activity_type TEXT NOT NULL,            -- quiz, match_up, flashcards, etc.
  prompt TEXT,                            -- Instrucción de la actividad
  content_data JSONB NOT NULL,            -- Datos específicos del tipo
  points_value INTEGER DEFAULT 10,        -- Puntos por completación
  time_limit_seconds INTEGER,             -- Tiempo límite (null = ilimitado)
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💻 Componentes React

### 1. MissionsListView

**Archivo:** `src/components/features/gamification/student/MissionsListView.tsx`

**Responsabilidades:**
- Mostrar todas las misiones disponibles agrupadas por unit
- Mostrar progreso del estudiante en cada misión
- Permitir filtrar por estado (todas, no iniciadas, en progreso, completadas)
- Navegar a misión específica

**Props:** Ninguno (usa contexto de autenticación)

**Estado:**
```typescript
const [missions, setMissions] = useState<MissionWithProgress[]>([]);
const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Flujo:**
1. Al montar, obtiene misiones con progreso del usuario
2. Agrupa por unit_number (13, 14, 15, 16)
3. Filtra según estado seleccionado
4. Renderiza tarjetas de misión con información de progreso

### 2. MissionCard

**Archivo:** `src/components/features/gamification/student/MissionCard.tsx`

**Responsabilidades:**
- Renderizar tarjeta individual de misión
- Mostrar información: título, descripción, dificultad, progreso
- Mostrar botón "Iniciar" o "Continuar" según estado

**Props:**
```typescript
interface MissionCardProps {
  mission: MissionWithProgress;
  onStartContinue: () => void;
}
```

**Información mostrada:**
- 🎯 Título de misión
- 📝 Descripción breve
- ⭐ Nivel de dificultad con color
- 📊 Barra de progreso (actividades completadas / total)
- 💯 Puntos ganados / puntos base
- ⏱️ Duración estimada
- 🔘 Botón de acción

### 3. MissionPlayView

**Archivo:** `src/components/features/gamification/student/MissionPlayView.tsx`

**Responsabilidades:**
- Cargar datos de misión (misión + actividades)
- Crear/resumir intento de misión
- Renderizar ActivityRunner con las actividades
- Manejar finalización de misión

**Props:**
```typescript
interface MissionPlayViewProps {
  missionId: string;
}
```

**Ciclo de vida:**
1. useEffect: Obtiene misión, actividades e intento
2. Si no hay intento en progreso → crear uno
3. Si hay intento → reanudar
4. Renderizar ActivityRunner
5. Al completar última actividad → actualizar estado de misión

### 4. ActivityRunner

**Archivo:** `src/components/features/gamification/ActivityRunner.tsx`

**Responsabilidades:**
- Ejecutar actividades secuencialmente
- Renderizar según tipo de actividad
- Manejar respuestas del usuario
- Calcular puntos
- Mostrar retroalimentación
- Pasar a siguiente actividad
- Detectar cuando se completa misión

**Props:**
```typescript
interface ActivityRunnerProps {
  mission: Mission;
  activities: Activity[];
  missionAttempt: MissionAttempt;
  userId: string;
  onComplete: (totalPoints: number) => void;
}
```

---

## 📝 Ejemplo de Implementación

### Caso: Unit 13 - Places (Lugares)

#### Misión 1: "Places in a Town" (Vocabulario)

```typescript
const mission13_1: Mission = {
  id: "m-13-1",
  unit_number: 13,
  topic: "Places",
  title: "Places in a Town",
  description: "Learn vocabulary about places in a town and basic adjectives.",
  difficulty_level: "facil",
  base_points: 100,
  mission_type: "vocabulary",
  estimated_duration_minutes: 15,
  is_active: true,
  order_index: 1,
  created_by: null,
  created_at: "2025-11-01T00:00:00Z",
  updated_at: "2025-11-01T00:00:00Z"
};

// Actividades de esta misión
const activities: Activity[] = [
  {
    id: "a-13-1-1",
    mission_id: "m-13-1",
    title: "Places flashcards",
    activity_type: "flashcards",
    prompt: "Learn the English names of places",
    content_data: {
      type: "flashcards",
      cards: [
        { front: "library", back: "biblioteca" },
        { front: "museum", back: "museo" },
        { front: "bakery", back: "panadería" },
        { front: "park", back: "parque" }
      ]
    },
    points_value: 25,
    time_limit_seconds: 300,
    order_index: 1,
    is_active: true,
    created_at: "2025-11-01T00:00:00Z"
  },
  {
    id: "a-13-1-2",
    mission_id: "m-13-1",
    title: "Places and functions",
    activity_type: "matching_pairs",
    prompt: "Match each place with its function",
    content_data: {
      type: "matching_pairs",
      pairs: [
        { id: "p1", match: "hospital - place for sick people" },
        { id: "p2", match: "park - place to relax outdoors" },
        { id: "p3", match: "cinema - place to watch films" }
      ]
    },
    points_value: 25,
    time_limit_seconds: 300,
    order_index: 2,
    is_active: true,
    created_at: "2025-11-01T00:00:00Z"
  },
  {
    id: "a-13-1-3",
    mission_id: "m-13-1",
    title: "Adjectives and places",
    activity_type: "match_up",
    prompt: "Match adjectives to appropriate places",
    content_data: {
      type: "match_up",
      pairs: [
        { term: "quiet", definition: "library" },
        { term: "crowded", definition: "shopping centre" },
        { term: "beautiful", definition: "park" }
      ]
    },
    points_value: 25,
    time_limit_seconds: 300,
    order_index: 3,
    is_active: true,
    created_at: "2025-11-01T00:00:00Z"
  },
  {
    id: "a-13-1-4",
    mission_id: "m-13-1",
    title: "Prepositions of place",
    activity_type: "complete_sentence",
    prompt: "Complete the sentences with prepositions",
    content_data: {
      type: "complete_sentence",
      sentence: "",
      blanks: [
        {
          position: 1,
          answer: "near"
        },
        {
          position: 2,
          answer: "next to"
        }
      ]
    },
    points_value: 25,
    time_limit_seconds: 300,
    order_index: 4,
    is_active: true,
    created_at: "2025-11-01T00:00:00Z"
  }
];
```

#### Progreso del Estudiante

```typescript
const studentProgress: MissionAttempt = {
  id: "attempt-1",
  mission_id: "m-13-1",
  user_id: "student-1",
  status: "in_progress",
  activities_completed: 2,    // Completó 2 de 4 actividades
  total_activities: 4,
  points_earned: 50,           // 25 + 25 puntos
  started_at: "2025-12-15T10:00:00Z",
  completed_at: null,
  last_activity_at: "2025-12-15T10:10:00Z"
};
```

#### Vista del Estudiante

```
┌─────────────────────────────────────────┐
│ 🎯 Misiones de Aprendizaje              │
│ Completa misiones para ganar puntos...  │
└─────────────────────────────────────────┘

📍 UNIT 13: Places
═══════════════════════════════════════════

[▓▓▓▓▓░░░░] 50% completado

┌─────────────────────────────────────────┐
│ 📚 Places in a Town                      │
│                                          │
│ Aprende vocabulario sobre lugares...     │
│ ⭐ Fácil | ⏱️ 15 min                    │
│                                          │
│ Actividades: [▓▓░░] 2/4 completadas     │
│ Puntos: 50 / 100                        │
│                                          │
│        [CONTINUAR MISIÓN →]              │
└─────────────────────────────────────────┘

[Más misiones...]
```

---

## 🔧 Integración con Sistema Existente

### Con Autenticación

Las misiones usan el contexto de autenticación para:
- Identificar al usuario actual
- Verificar rol (estudiante, docente, admin)
- Obtener ID de usuario para operaciones

```typescript
import { useAuth } from '@/contexts/AuthContext';

export function MissionsListView() {
  const { usuario } = useAuth();  // usuario.user_id, usuario.rol
  
  // Usar usuario.user_id para obtener su progreso
}
```

### Con Progreso del Estudiante

Los puntos ganados en misiones se sincronizar automáticamente con la tabla `progreso_estudiantes`:

```sql
-- Trigger en base de datos
TRIGGER gamification_mission_completed
AFTER UPDATE ON gamification_mission_attempts
WHEN status = 'completed'
THEN
  UPDATE progreso_estudiantes
  SET puntos_totales = puntos_totales + NEW.points_earned,
      nivel = calculate_level(puntos_totales)
  WHERE id_usuario = NEW.user_id
```

---

## 📊 Estadísticas y Reportes

### Para Estudiantes

- Total de misiones completadas
- Puntos totales ganados
- Progreso por unit
- Badges desbloqueados
- Racha de actividad

### Para Docentes

- Número de estudiantes que iniciaron cada misión
- Tasa de completación por misión
- Puntos promedio ganados
- Actividades con mayor dificultad
- Tiempo promedio de completación

---

## 🚀 Próximas Mejoras

- [ ] Misiones colaborativas (2+ estudiantes)
- [ ] Misiones personalizadas por docente
- [ ] Sistema de dificultad adaptativa
- [ ] Leaderboard de misiones
- [ ] Historial detallado de intentos
- [ ] Exportación de progreso (PDF)
- [ ] Análisis de patrones de aprendizaje

---

**Última actualización:** 15 de diciembre de 2025  
**Versión:** 1.0.0
