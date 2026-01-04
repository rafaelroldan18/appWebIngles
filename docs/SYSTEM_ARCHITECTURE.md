# Sistema Educativo Gamificado - Arquitectura Integral

## 📋 Contexto del Sistema

Este sistema educativo implementa un **Módulo de Gamificación** y un **Módulo de Reportes** como componentes centrales del proceso de aprendizaje.

La gamificación se basa explícitamente en dos estrategias:
1. **Retos/Misiones**
2. **Sistema de Puntos y Recompensas**

Cada juego funciona como una **misión pedagógica** que se activa únicamente cuando existe una planificación docente vigente para un tema, paralelo y período determinado.

## 🎯 Principios Fundamentales

### 1. Control Backend-First
- ✅ La disponibilidad de la misión se controla desde el backend
- ✅ El número máximo de intentos se valida en el servidor
- ✅ Las reglas de evaluación están en el backend
- ❌ El frontend NUNCA controla la lógica de negocio

### 2. Ejecución Condicional
El juego solo puede ejecutarse si:
- ✅ La misión está activa (fechas válidas)
- ✅ El estudiante tiene intentos disponibles
- ✅ El contenido corresponde exactamente al tema asignado
- ✅ El estudiante pertenece al paralelo correcto

### 3. Interpretación Pedagógica
Al finalizar el juego:
- ✅ El resultado se interpreta como misión completada o fallida
- ✅ Se actualiza el progreso académico del estudiante
- ✅ Se actualiza el sistema de puntos
- ✅ Se registra en el historial para reportes

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO DE GAMIFICACIÓN                       │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ Retos/Misiones   │         │ Puntos/Recompensas│            │
│  │                  │         │                   │            │
│  │ • Planificación  │◄────────┤ • Multiplicadores │            │
│  │ • Disponibilidad │         │ • Logros          │            │
│  │ • Intentos       │         │ • Progreso        │            │
│  └──────────────────┘         └──────────────────┘            │
│           │                            │                        │
│           └────────────┬───────────────┘                        │
│                        ↓                                        │
│              ┌──────────────────┐                              │
│              │  Validación      │                              │
│              │  MissionValidator│                              │
│              └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA PEDAGÓGICA                              │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ Evaluación       │         │ Feedback          │            │
│  │                  │         │                   │            │
│  │ • Criterios      │────────►│ • Contextual      │            │
│  │ • Rendimiento    │         │ • Motivador       │            │
│  │ • Éxito/Fracaso  │         │ • Formativo       │            │
│  └──────────────────┘         └──────────────────┘            │
│           │                            │                        │
│           └────────────┬───────────────┘                        │
│                        ↓                                        │
│              ┌──────────────────┐                              │
│              │  Evaluación      │                              │
│              │  MissionEvaluator│                              │
│              └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE JUEGO                                │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ Phaser 3         │         │ Mecánicas         │            │
│  │                  │         │                   │            │
│  │ • WordCatcher    │────────►│ • Scoring         │            │
│  │ • Scenes         │         │ • Gameplay        │            │
│  │ • Assets         │         │ • Interacción     │            │
│  └──────────────────┘         └──────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO DE REPORTES                           │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ Consolidación    │         │ Análisis          │            │
│  │                  │         │                   │            │
│  │ • Sesiones       │────────►│ • Desempeño       │            │
│  │ • Progreso       │         │ • Tendencias      │            │
│  │ • Histórico      │         │ • Decisiones      │            │
│  └──────────────────┘         └──────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo Completo del Sistema

### Fase 1: Planificación Docente
```
Docente → GameManager
    ↓
Crea game_availability:
    - topic_id (tema específico)
    - game_type_id (tipo de juego)
    - parallel_id (paralelo)
    - available_from (fecha inicio)
    - available_until (fecha fin)
    - max_attempts (intentos máximos)
    ↓
Misión activada en el sistema
```

### Fase 2: Validación de Acceso
```
Estudiante → Click "Jugar Ahora"
    ↓
Frontend → MissionValidator.validateMission()
    ↓
Backend → GET /api/missions/validate
    ↓
Verificaciones:
    1. ¿Existe game_availability para este tema + juego + paralelo?
    2. ¿Está dentro del rango de fechas?
    3. ¿Cuántas sesiones previas tiene el estudiante?
    4. ¿attemptsUsed < maxAttempts?
    ↓
Response: { isValid, canPlay, attemptsRemaining, reason }
    ↓
Frontend:
    - Si canPlay = true → Cargar Phaser
    - Si canPlay = false → Mostrar pantalla de bloqueo
```

### Fase 3: Ejecución del Juego
```
PhaserGameCanvas carga
    ↓
GameLoader.loadGameContent(topicId, gameTypeId)
    ↓
Backend → GET /api/games/content?topicId=X&gameTypeId=Y
    ↓
Retorna: GameContent[] (palabras del tema específico)
    ↓
GameSessionManager.startSession()
    ↓
Backend → POST /api/games/sessions
    ↓
Crea registro en game_sessions:
    - session_id
    - student_id
    - topic_id
    - game_type_id
    - completed = false
    - played_at = NOW()
    ↓
Phaser WordCatcherScene inicia
    ↓
Estudiante juega (clicks, score, tiempo)
    ↓
Game Over (timer = 0 o palabras terminadas)
```

### Fase 4: Evaluación Pedagógica
```
WordCatcherScene → events.emit('gameOver', data)
    ↓
PhaserGameCanvas → handleGameEnd(result)
    ↓
MissionEvaluator.evaluateMission(score, accuracy, correct, wrong)
    ↓
Aplica criterios pedagógicos:
    - minScoreToPass: 50
    - minAccuracyToPass: 60%
    - excellentThreshold: 80%
    - goodThreshold: 65%
    ↓
Calcula:
    - success: boolean (¿pasó los criterios?)
    - performance: 'excellent' | 'good' | 'fair' | 'poor'
    - pointsEarned: score × multiplicador
    - feedback: mensaje contextual
    ↓
Retorna: MissionResult
```

### Fase 5: Actualización de Progreso
```
GameSessionManager.endSession(details)
    ↓
Backend → PUT /api/games/sessions/{sessionId}
    ↓
Actualiza game_sessions:
    - completed = true
    - score = finalScore
    - duration_seconds = duration
    - correct_count = correct
    - wrong_count = wrong
    - details = { accuracy, performance, pointsEarned, ... }
    ↓
Backend → Actualiza student_progress:
    - activities_completed += 1
    - total_score += pointsEarned
    - last_updated_at = NOW()
    ↓
Datos disponibles para reportes
```

### Fase 6: Generación de Reportes
```
Docente → ReportDashboard
    ↓
Selecciona tipo de reporte:
    - Por estudiante
    - Por tema
    - Por juego
    - Por paralelo
    - Por período
    ↓
Frontend → ReportService.runReport(params)
    ↓
Backend → POST /api/reports/run
    ↓
Consulta datos históricos:
    - game_sessions (sesiones completadas)
    - student_progress (progreso global)
    - game_availability (misiones activas)
    - topics (temas)
    - users (estudiantes)
    ↓
Genera report_snapshots:
    - snapshot_data (JSON con métricas)
    - generated_at (timestamp)
    ↓
Retorna reporte consolidado
```

## 📊 Separación de Responsabilidades

### Lógica de Juego (Phaser)
**Responsabilidad**: Ejecutar la mecánica del juego
**Pregunta**: "¿QUÉ pasó durante el juego?"
**Componentes**:
- `WordCatcherScene.ts` - Escena principal
- `wordCatcher.config.ts` - Configuración del juego
- Phaser 3 engine

**Datos que provee**:
```typescript
{
    score: number,           // Puntaje bruto del juego
    correctCount: number,    // Respuestas correctas
    wrongCount: number,      // Respuestas incorrectas
    duration: number         // Tiempo jugado (segundos)
}
```

### Lógica Pedagógica (Evaluación)
**Responsabilidad**: Evaluar el aprendizaje
**Pregunta**: "¿CÓMO aprendió el estudiante?"
**Componentes**:
- `MissionEvaluator.ts` - Evaluación pedagógica
- Criterios de éxito/fracaso
- Feedback formativo

**Datos que provee**:
```typescript
{
    success: boolean,                    // ¿Aprobó?
    performance: 'excellent' | ...,      // Nivel de rendimiento
    pointsEarned: number,                // Puntos con multiplicador
    feedback: string,                    // Mensaje pedagógico
    achievements: string[]               // Logros obtenidos
}
```

### Lógica de Gamificación (Misiones)
**Responsabilidad**: Controlar acceso y recompensas
**Pregunta**: "¿PUEDE jugar? ¿QUÉ gana?"
**Componentes**:
- `MissionValidator.ts` - Validación de acceso
- `/api/missions/validate` - Endpoint de validación
- Sistema de puntos y recompensas

**Datos que provee**:
```typescript
{
    isValid: boolean,            // ¿Existe la misión?
    canPlay: boolean,            // ¿Puede jugar ahora?
    attemptsRemaining: number,   // Intentos disponibles
    reason: string               // Razón si está bloqueado
}
```

## 🗄️ Modelo de Datos

### Tablas Principales

#### game_availability (Planificación Docente)
```sql
CREATE TABLE game_availability (
    availability_id UUID PRIMARY KEY,
    game_type_id UUID REFERENCES game_types,
    topic_id UUID REFERENCES topics,
    parallel_id UUID REFERENCES parallels,
    available_from TIMESTAMP NOT NULL,
    available_until TIMESTAMP,
    max_attempts INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```
**Propósito**: Define qué juegos están disponibles para qué paralelos y cuándo.

#### game_sessions (Historial de Juego)
```sql
CREATE TABLE game_sessions (
    session_id UUID PRIMARY KEY,
    student_id UUID REFERENCES users,
    topic_id UUID REFERENCES topics,
    game_type_id UUID REFERENCES game_types,
    score INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    duration_seconds INTEGER,
    correct_count INTEGER,
    wrong_count INTEGER,
    details JSONB,
    played_at TIMESTAMP DEFAULT NOW()
);
```
**Propósito**: Registra cada intento de juego con todos sus detalles.

#### student_progress (Progreso Global)
```sql
CREATE TABLE student_progress (
    progress_id UUID PRIMARY KEY,
    student_id UUID UNIQUE REFERENCES users,
    activities_completed INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    last_updated_at TIMESTAMP DEFAULT NOW()
);
```
**Propósito**: Consolida el progreso acumulado del estudiante.

#### report_snapshots (Reportes Generados)
```sql
CREATE TABLE report_snapshots (
    snapshot_id UUID PRIMARY KEY,
    report_id UUID REFERENCES report_definitions,
    parallel_id UUID REFERENCES parallels,
    snapshot_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    generated_by UUID REFERENCES users
);
```
**Propósito**: Almacena reportes generados para análisis histórico.

## 📈 Flujo de Datos para Reportes

### Reporte por Estudiante
```sql
SELECT 
    u.full_name,
    sp.activities_completed,
    sp.total_score,
    COUNT(gs.session_id) as total_sessions,
    AVG(gs.score) as avg_score,
    AVG((gs.details->>'accuracy')::numeric) as avg_accuracy
FROM users u
LEFT JOIN student_progress sp ON u.user_id = sp.student_id
LEFT JOIN game_sessions gs ON u.user_id = gs.student_id
WHERE u.user_id = ?
GROUP BY u.user_id, sp.progress_id;
```

### Reporte por Tema
```sql
SELECT 
    t.title,
    COUNT(DISTINCT gs.student_id) as students_played,
    COUNT(gs.session_id) as total_sessions,
    AVG(gs.score) as avg_score,
    SUM(CASE WHEN (gs.details->>'success')::boolean THEN 1 ELSE 0 END) as successful_sessions
FROM topics t
LEFT JOIN game_sessions gs ON t.topic_id = gs.topic_id
WHERE t.topic_id = ?
GROUP BY t.topic_id;
```

### Reporte por Paralelo
```sql
SELECT 
    p.name,
    COUNT(DISTINCT u.user_id) as total_students,
    AVG(sp.total_score) as avg_total_score,
    AVG(sp.activities_completed) as avg_activities
FROM parallels p
LEFT JOIN users u ON u.parallel_id = p.parallel_id
LEFT JOIN student_progress sp ON u.user_id = sp.student_id
WHERE p.parallel_id = ?
GROUP BY p.parallel_id;
```

## 🎓 Criterios Pedagógicos Aplicados

### Evaluación de Misiones

#### Criterios de Éxito
```typescript
interface EvaluationCriteria {
    minScoreToPass: 50,        // Puntaje mínimo para aprobar
    minAccuracyToPass: 60,     // Precisión mínima (%)
    excellentThreshold: 80,    // Umbral de excelencia (%)
    goodThreshold: 65          // Umbral de buen desempeño (%)
}
```

#### Sistema de Multiplicadores
```typescript
const multipliers = {
    excellent: 1.5,  // 80%+ precisión → score × 1.5
    good: 1.2,       // 65-79% precisión → score × 1.2
    fair: 1.0,       // 60-64% precisión → score × 1.0
    poor: 0.5        // <60% precisión → score × 0.5
}
```

#### Feedback Formativo
```typescript
const feedback = {
    excellent: "¡Excelente trabajo! Has dominado este tema. 🌟",
    good: "¡Buen trabajo! Estás progresando muy bien. 💪",
    fair: "Misión completada. Sigue practicando para mejorar. 📚",
    poor: "Misión no completada. Necesitas al menos 60% de precisión. 🔄"
}
```

### Interpretación de Resultados

```typescript
function interpretMissionResult(result: GameResult): MissionResult {
    const accuracy = calculateAccuracy(result.correctCount, result.wrongCount);
    
    // 1. Determinar éxito
    const success = result.score >= 50 && accuracy >= 60;
    
    // 2. Calcular rendimiento
    const performance = 
        accuracy >= 80 ? 'excellent' :
        accuracy >= 65 ? 'good' :
        accuracy >= 60 ? 'fair' : 'poor';
    
    // 3. Aplicar multiplicador
    const pointsEarned = result.score * multipliers[performance];
    
    // 4. Generar feedback
    const feedback = getFeedback(performance, success);
    
    return {
        completed: true,
        success,
        performance,
        pointsEarned,
        feedback
    };
}
```

## 🔐 Seguridad y Control

### Validaciones Backend

#### 1. Validación de Misión
```typescript
// /api/missions/validate
async function validateMission(studentId, topicId, gameTypeId, parallelId) {
    // 1. Verificar que existe game_availability
    const availability = await db.query(`
        SELECT * FROM game_availability
        WHERE topic_id = ? AND game_type_id = ? AND parallel_id = ?
    `);
    
    if (!availability) {
        return { canPlay: false, reason: "No existe misión activa" };
    }
    
    // 2. Verificar fechas
    const now = new Date();
    if (now < availability.available_from || 
        (availability.available_until && now > availability.available_until)) {
        return { canPlay: false, reason: "Misión fuera de fechas" };
    }
    
    // 3. Contar intentos
    const sessions = await db.query(`
        SELECT COUNT(*) FROM game_sessions
        WHERE student_id = ? AND topic_id = ? AND game_type_id = ?
    `);
    
    if (sessions.count >= availability.max_attempts) {
        return { canPlay: false, reason: "Intentos agotados" };
    }
    
    return { 
        canPlay: true, 
        attemptsRemaining: availability.max_attempts - sessions.count 
    };
}
```

#### 2. Validación de Contenido
```typescript
// /api/games/content
async function getGameContent(topicId, gameTypeId) {
    // SIEMPRE filtrar por topicId exacto
    const content = await db.query(`
        SELECT * FROM game_content
        WHERE topic_id = ? AND content_type = 'word'
    `, [topicId]);
    
    // NUNCA retornar contenido genérico
    if (content.length === 0) {
        throw new Error("No hay contenido para este tema");
    }
    
    return content;
}
```

#### 3. Validación de Sesión
```typescript
// /api/games/sessions
async function createSession(data) {
    // Verificar que el estudiante puede jugar
    const validation = await validateMission(
        data.student_id, 
        data.topic_id, 
        data.game_type_id,
        data.parallel_id
    );
    
    if (!validation.canPlay) {
        throw new Error("No autorizado para jugar");
    }
    
    // Crear sesión
    return await db.insert('game_sessions', data);
}
```

## 📊 Métricas y KPIs

### Métricas por Estudiante
- `activities_completed` - Total de misiones completadas
- `total_score` - Puntos acumulados
- `avg_accuracy` - Precisión promedio
- `success_rate` - % de misiones exitosas

### Métricas por Tema
- `students_played` - Estudiantes que jugaron
- `total_sessions` - Total de sesiones
- `avg_score` - Puntaje promedio
- `success_rate` - % de éxito

### Métricas por Paralelo
- `total_students` - Total de estudiantes
- `avg_total_score` - Puntaje promedio del paralelo
- `avg_activities` - Actividades promedio por estudiante
- `engagement_rate` - % de estudiantes activos

## 🎯 Casos de Uso

### Caso 1: Docente Planifica Misión
```
1. Docente accede a GameManager
2. Selecciona paralelo
3. Click "Asignar Nuevo Juego"
4. Selecciona:
   - Tema: "Present Simple Verbs"
   - Juego: "Word Catcher"
   - Fecha inicio: 2026-01-10
   - Fecha fin: 2026-01-17
   - Intentos máximos: 3
5. Sistema crea game_availability
6. Misión activa para todos los estudiantes del paralelo
```

### Caso 2: Estudiante Intenta Jugar
```
1. Estudiante ve "Mis Juegos"
2. Ve misión "Present Simple Verbs" con badge "🎯 Misión Activa"
3. Click "Jugar Ahora"
4. Sistema valida:
   ✓ Misión existe
   ✓ Fecha válida (hoy está entre 10 y 17 de enero)
   ✓ Tiene 2 intentos restantes (jugó 1 vez de 3)
5. Validación exitosa → Carga Phaser
6. Estudiante juega
7. Termina con: score=85, accuracy=75%
8. Sistema evalúa:
   - success = true (85 >= 50 y 75% >= 60%)
   - performance = 'good' (75% está entre 65-79%)
   - pointsEarned = 85 × 1.2 = 102 puntos
9. Actualiza student_progress:
   - activities_completed: 5 → 6
   - total_score: 450 → 552
10. Muestra resultados con feedback
```

### Caso 3: Estudiante Agota Intentos
```
1. Estudiante intenta jugar por 4ta vez
2. Sistema valida:
   ✓ Misión existe
   ✓ Fecha válida
   ✗ Intentos: 3/3 (agotados)
3. Validación falla → Muestra pantalla de bloqueo
4. Mensaje: "Has agotado todos tus intentos para esta misión"
5. Botón: "Volver a Misiones"
```

### Caso 4: Docente Genera Reporte
```
1. Docente accede a ReportDashboard
2. Selecciona "Reporte de Paralelo"
3. Selecciona paralelo "3ro BGU A"
4. Click "Generar Reporte"
5. Sistema consulta:
   - game_sessions del paralelo
   - student_progress de todos los estudiantes
   - game_availability activas
6. Genera snapshot con:
   - Total estudiantes: 25
   - Estudiantes activos: 20 (80%)
   - Promedio de puntos: 485
   - Promedio de actividades: 6.2
   - Temas más jugados
   - Estudiantes destacados
7. Guarda en report_snapshots
8. Muestra reporte en pantalla
```

## 🚀 Escalabilidad del Sistema

### Agregar Nuevo Tipo de Juego

```typescript
// 1. Crear escena Phaser
class SentenceBuilderScene extends Phaser.Scene {
    // Implementar mecánicas específicas
}

// 2. Reutilizar validación (sin cambios)
const validation = await MissionValidator.validateMission(
    studentId, topicId, gameTypeId, parallelId
);

// 3. Reutilizar evaluación (sin cambios)
const result = MissionEvaluator.evaluateMission(
    score, accuracy, correct, wrong
);

// 4. Insertar en BD
INSERT INTO game_types (name, description)
VALUES ('Sentence Builder', 'Build sentences from words');

// ✅ Sistema funciona automáticamente
```

### Personalizar Criterios por Tema

```typescript
// En MissionEvaluator.ts
static getCriteriaForTopic(topicId: string): EvaluationCriteria {
    const customCriteria = {
        'basic-verbs': {
            minScoreToPass: 40,
            minAccuracyToPass: 55
        },
        'advanced-grammar': {
            minScoreToPass: 60,
            minAccuracyToPass: 70
        }
    };
    
    return customCriteria[topicId] || DEFAULT_CRITERIA;
}
```

### Agregar Nuevo Tipo de Reporte

```typescript
// En /api/reports/run/route.ts
if (reportType === 'custom-report') {
    const payload = await generateCustomReport(params);
    // Guardar snapshot
    // Retornar datos
}
```

## 📚 Fundamentos Teóricos

### Gamificación Educativa (Deterding et al., 2011)
- **Elementos de juego**: Puntos, niveles, logros
- **Contexto no-juego**: Educación formal
- **Objetivo**: Motivación y engagement

### Aprendizaje Basado en Competencias (Bloom, 1956)
- **Objetivos claros**: Criterios de éxito definidos
- **Evaluación formativa**: Feedback continuo
- **Dominio progresivo**: Niveles de rendimiento

### Teoría del Flujo (Csikszentmihalyi, 1990)
- **Balance desafío-habilidad**: Intentos limitados
- **Feedback inmediato**: Resultados al instante
- **Objetivos claros**: Misiones específicas

### Motivación Intrínseca (Deci & Ryan, 1985)
- **Autonomía**: Elegir cuándo jugar
- **Competencia**: Niveles de rendimiento
- **Relación**: Progreso compartido con el paralelo

## ✅ Checklist de Implementación

### Módulo de Gamificación
- [x] MissionValidator (validación de acceso)
- [x] MissionEvaluator (evaluación pedagógica)
- [x] API /api/missions/validate
- [x] GameManager (planificación docente)
- [x] StudentGames (vista de misiones)
- [x] Sistema de puntos con multiplicadores
- [x] Feedback contextual

### Módulo de Reportes
- [x] ReportDashboard (vista de reportes)
- [x] API /api/reports/definitions
- [x] API /api/reports/run
- [x] ReportService (servicio frontend)
- [x] Consolidación de datos históricos

### Integración
- [x] game_availability (planificación)
- [x] game_sessions (historial)
- [x] student_progress (progreso global)
- [x] report_snapshots (reportes generados)

### Documentación
- [x] Arquitectura completa
- [x] Flujos de datos
- [x] Casos de uso
- [x] Fundamentos teóricos

## 🎯 Conclusión

Este sistema implementa una arquitectura robusta que:

✅ **Separa claramente** tres capas: Juego, Pedagogía y Gamificación
✅ **Controla desde el backend** toda la lógica de negocio
✅ **Valida condicionalmente** el acceso a misiones
✅ **Evalúa pedagógicamente** los resultados
✅ **Consolida datos** para reportes académicos
✅ **Escala fácilmente** para nuevos juegos y reportes
✅ **Se fundamenta** en teorías educativas reconocidas

El resultado es un **sistema educativo gamificado** que usa los juegos como **misiones pedagógicas controladas**, no como entretenimiento libre, manteniendo el rigor académico mientras aprovecha la motivación que provee la gamificación.
