# Guía de Referencia Rápida - Sistema Gamificado

## 🎯 Conceptos Clave

### Misión ≠ Juego
- **Juego**: Mecánica de Phaser (WordCatcher, etc.)
- **Misión**: Planificación pedagógica que activa un juego para un tema/paralelo/período

### Control Backend-First
- ✅ Backend controla: disponibilidad, intentos, evaluación
- ❌ Frontend solo muestra: UI, validaciones visuales

### Separación de Capas
1. **Gamificación**: ¿Puede jugar? ¿Qué gana?
2. **Pedagogía**: ¿Cómo aprendió? ¿Pasó o falló?
3. **Juego**: ¿Qué pasó durante el juego?

## 📁 Estructura de Archivos

```
src/
├── lib/
│   ├── games/                    # Capa de Juego
│   │   ├── WordCatcherScene.ts
│   │   ├── GameLoader.ts
│   │   ├── GameSessionManager.ts
│   │   └── wordCatcher.config.ts
│   │
│   └── gamification/             # Capa de Gamificación
│       ├── MissionValidator.ts   ← Valida acceso
│       └── MissionEvaluator.ts   ← Evalúa resultados
│
├── components/features/
│   ├── gamification/
│   │   ├── PhaserGameCanvas.tsx  ← Wrapper de Phaser
│   │   ├── GamePlay.tsx          ← Validación + Juego + Resultados
│   │   ├── StudentGames.tsx      ← Lista de misiones
│   │   └── GameManager.tsx       ← Planificación docente
│   │
│   └── reports/
│       └── ReportDashboard.tsx   ← Generación de reportes
│
└── services/
    ├── game.service.ts           ← API de juegos
    └── report.service.ts         ← API de reportes

app/api/
├── games/
│   ├── types/route.ts
│   ├── availability/route.ts
│   ├── content/route.ts
│   └── sessions/
│       ├── route.ts
│       └── [sessionId]/route.ts
│
├── missions/
│   └── validate/route.ts         ← Validación de misiones
│
└── reports/
    ├── definitions/route.ts
    └── run/route.ts
```

## 🔄 Flujos Principales

### 1. Crear Misión (Docente)
```typescript
// Frontend: GameManager.tsx
const handleCreateMission = async () => {
    await fetch('/api/games/availability', {
        method: 'POST',
        body: JSON.stringify({
            game_type_id: 'word-catcher-id',
            topic_id: 'present-simple-id',
            parallel_id: 'parallel-id',
            available_from: '2026-01-10',
            available_until: '2026-01-17',
            max_attempts: 3
        })
    });
};
```

### 2. Validar Misión (Estudiante)
```typescript
// Frontend: GamePlay.tsx
const validation = await MissionValidator.validateMission(
    studentId,
    topicId,
    gameTypeId,
    parallelId
);

if (validation.canPlay) {
    // Cargar Phaser
} else {
    // Mostrar bloqueo
}
```

### 3. Evaluar Misión (Sistema)
```typescript
// Frontend: GamePlay.tsx
const handleGameEnd = (result: GameResult) => {
    const evaluation = MissionEvaluator.evaluateMission(
        result.score,
        result.accuracy,
        result.correctCount,
        result.wrongCount
    );
    
    // evaluation.success → ¿Pasó?
    // evaluation.pointsEarned → Puntos con multiplicador
    // evaluation.feedback → Mensaje pedagógico
};
```

### 4. Generar Reporte (Docente)
```typescript
// Frontend: ReportDashboard.tsx
const handleRunReport = async () => {
    await ReportService.runReport({
        report_id: 'parallel-report-id',
        parallel_id: 'parallel-id',
        requested_by: teacherId
    });
};
```

## 🗄️ Queries Útiles

### Verificar Misiones Activas
```sql
SELECT 
    t.title as tema,
    gt.name as juego,
    p.name as paralelo,
    ga.available_from,
    ga.available_until,
    ga.max_attempts
FROM game_availability ga
JOIN topics t ON ga.topic_id = t.topic_id
JOIN game_types gt ON ga.game_type_id = gt.game_type_id
JOIN parallels p ON ga.parallel_id = p.parallel_id
WHERE ga.available_from <= NOW() 
  AND (ga.available_until IS NULL OR ga.available_until >= NOW());
```

### Contar Intentos de Estudiante
```sql
SELECT 
    COUNT(*) as intentos_usados,
    ga.max_attempts,
    (ga.max_attempts - COUNT(*)) as intentos_restantes
FROM game_sessions gs
JOIN game_availability ga ON 
    gs.topic_id = ga.topic_id AND 
    gs.game_type_id = ga.game_type_id
WHERE gs.student_id = ?
  AND gs.topic_id = ?
  AND gs.game_type_id = ?
GROUP BY ga.max_attempts;
```

### Ver Progreso de Estudiante
```sql
SELECT 
    u.full_name,
    sp.activities_completed,
    sp.total_score,
    sp.last_updated_at,
    COUNT(gs.session_id) as total_sessions,
    AVG(gs.score) as avg_score
FROM users u
LEFT JOIN student_progress sp ON u.user_id = sp.student_id
LEFT JOIN game_sessions gs ON u.user_id = gs.student_id
WHERE u.user_id = ?
GROUP BY u.user_id, sp.progress_id;
```

## 🎓 Criterios de Evaluación

### Por Defecto
```typescript
{
    minScoreToPass: 50,        // Puntaje mínimo
    minAccuracyToPass: 60,     // Precisión mínima (%)
    excellentThreshold: 80,    // Excelente (%)
    goodThreshold: 65          // Bueno (%)
}
```

### Multiplicadores
```typescript
{
    excellent: 1.5,  // 80%+ → score × 1.5
    good: 1.2,       // 65-79% → score × 1.2
    fair: 1.0,       // 60-64% → score × 1.0
    poor: 0.5        // <60% → score × 0.5
}
```

### Personalizar por Tema
```typescript
// En MissionEvaluator.ts
static getCriteriaForTopic(topicId: string) {
    const custom = {
        'basic-topic-id': { minAccuracyToPass: 55 },
        'advanced-topic-id': { minAccuracyToPass: 75 }
    };
    return custom[topicId] || DEFAULT_CRITERIA;
}
```

## 🔒 Validaciones Críticas

### Backend SIEMPRE valida
```typescript
// /api/missions/validate
✓ Misión existe
✓ Fechas válidas
✓ Intentos disponibles
✓ Paralelo correcto

// /api/games/content
✓ topicId exacto (nunca genérico)

// /api/games/sessions
✓ Autorización para jugar
```

### Frontend NUNCA decide
```typescript
❌ if (canPlay) { /* frontend decide */ }
✅ if (validation.canPlay) { /* backend decidió */ }
```

## 🚀 Agregar Nuevo Juego

### 1. Crear Escena Phaser
```typescript
// src/lib/games/NewGameScene.ts
export class NewGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NewGameScene' });
    }
    
    init(data: { words, sessionManager }) {
        this.words = data.words;
        this.sessionManager = data.sessionManager;
    }
    
    create() {
        // Implementar mecánicas
    }
}
```

### 2. Crear Wrapper React
```typescript
// src/components/features/gamification/NewGameCanvas.tsx
const NewGameCanvas = ({ topicId, gameTypeId, studentId, parallelId }) => {
    // Mismo patrón que PhaserGameCanvas
    // 1. Validar misión
    // 2. Cargar contenido
    // 3. Crear sesión
    // 4. Iniciar Phaser
    // 5. Evaluar resultado
};
```

### 3. Registrar en BD
```sql
INSERT INTO game_types (name, description)
VALUES ('New Game', 'Description');
```

### 4. Reutilizar Validación y Evaluación
```typescript
// ✅ Sin cambios necesarios
MissionValidator.validateMission(...)
MissionEvaluator.evaluateMission(...)
```

## 📊 Tipos TypeScript Importantes

### MissionValidation
```typescript
interface MissionValidation {
    isValid: boolean;
    canPlay: boolean;
    reason?: string;
    attemptsRemaining?: number;
    availabilityData?: any;
}
```

### MissionResult
```typescript
interface MissionResult {
    completed: boolean;
    success: boolean;
    score: number;
    accuracy: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    pointsEarned: number;
    feedback: string;
    achievements?: string[];
}
```

### GameResult
```typescript
interface GameResult {
    score: number;
    correctCount: number;
    wrongCount: number;
    duration: number;
    accuracy: number;
}
```

## 🐛 Debugging

### Verificar Validación
```typescript
// En consola del navegador
const validation = await fetch('/api/missions/validate?studentId=X&topicId=Y&gameTypeId=Z&parallelId=W');
console.log(await validation.json());
```

### Ver Sesiones de Estudiante
```sql
SELECT * FROM game_sessions 
WHERE student_id = 'student-id' 
ORDER BY played_at DESC 
LIMIT 10;
```

### Verificar Progreso
```sql
SELECT * FROM student_progress 
WHERE student_id = 'student-id';
```

## ⚠️ Errores Comunes

### ❌ Validar en Frontend
```typescript
// MAL
if (attemptsUsed < maxAttempts) {
    loadGame();
}
```

### ✅ Validar en Backend
```typescript
// BIEN
const validation = await MissionValidator.validateMission(...);
if (validation.canPlay) {
    loadGame();
}
```

### ❌ Contenido Genérico
```typescript
// MAL
const content = await fetch('/api/games/content?gameTypeId=word-catcher');
```

### ✅ Contenido por Tema
```typescript
// BIEN
const content = await fetch('/api/games/content?topicId=X&gameTypeId=Y');
```

### ❌ Puntos sin Multiplicador
```typescript
// MAL
pointsEarned = score;
```

### ✅ Puntos con Multiplicador
```typescript
// BIEN
const evaluation = MissionEvaluator.evaluateMission(...);
pointsEarned = evaluation.pointsEarned; // score × multiplicador
```

## 📚 Documentación Completa

- `SYSTEM_ARCHITECTURE.md` - Arquitectura integral
- `GAMIFICATION_ARCHITECTURE.md` - Detalles de gamificación
- `GAMIFICATION_SUMMARY.md` - Resumen ejecutivo
- `WORD_CATCHER_GAME.md` - Documentación del juego
- `GAME_DATA_FLOW.md` - Flujo de datos

## 🎯 Checklist de Desarrollo

### Antes de Implementar
- [ ] ¿Es un juego nuevo o modificación?
- [ ] ¿Necesita criterios personalizados?
- [ ] ¿Qué datos del tema necesita?

### Durante Implementación
- [ ] Crear escena Phaser
- [ ] Crear wrapper React
- [ ] Reutilizar MissionValidator
- [ ] Reutilizar MissionEvaluator
- [ ] Registrar en game_types

### Después de Implementar
- [ ] Probar validación de misión
- [ ] Probar con intentos agotados
- [ ] Probar con fechas expiradas
- [ ] Verificar actualización de progreso
- [ ] Generar reporte de prueba

## 🚀 Deploy Checklist

- [ ] Variables de entorno configuradas
- [ ] Migraciones de BD ejecutadas
- [ ] Datos de prueba insertados
- [ ] TypeScript sin errores
- [ ] Tests pasando
- [ ] Documentación actualizada

---

**Última actualización**: 2026-01-03
