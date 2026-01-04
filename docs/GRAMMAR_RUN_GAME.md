# Grammar Run - Endless Runner Educativo

## 🎮 Descripción General

**Grammar Run** es un juego educativo tipo endless runner donde los estudiantes practican estructuras gramaticales mientras corren. El jugador debe seleccionar la opción correcta pasando por puertas mientras evita obstáculos.

## 🎯 Objetivos Pedagógicos

- Practicar estructuras gramaticales en contexto
- Reforzar la toma de decisiones rápidas
- Relacionar con actividades de completar frases
- Mejorar la fluidez en reconocimiento gramatical

## 🕹️ Mecánicas de Juego

### Controles
- **← (Flecha Izquierda) o A**: Cambiar al carril izquierdo
- **→ (Flecha Derecha) o D**: Cambiar al carril derecho

### Gameplay
1. El jugador corre automáticamente hacia adelante
2. Aparecen puertas con 2 opciones gramaticales
3. Una opción es correcta (verde), otra incorrecta (roja)
4. El jugador cambia de carril para pasar por la puerta correcta
5. La velocidad aumenta progresivamente cada 10 segundos

### Sistema de Vidas
- **Vidas iniciales**: 3
- **Perder vida**: Pasar por puerta incorrecta u obstáculo
- **Game Over**: Cuando se agotan las vidas o termina el tiempo

## 📊 Sistema de Puntuación

### Puntos
- **Puerta correcta**: +15 puntos
- **Puerta incorrecta**: -10 puntos, -1 vida
- **Obstáculo**: -5 puntos, -1 vida
- **Distancia**: +1 punto por unidad recorrida

### Evaluación
Usa los mismos criterios que Word Catcher:
- **Mínimo para aprobar**: 50 puntos, 60% precisión
- **Excelente**: 80%+ precisión → ×1.5 multiplicador
- **Bueno**: 65-79% precisión → ×1.2 multiplicador
- **Aceptable**: 60-64% precisión → ×1.0 multiplicador
- **Bajo**: <60% precisión → ×0.5 multiplicador

## ⚙️ Configuración del Juego

```typescript
{
  // Dimensiones
  width: 800,
  height: 600,
  
  // Duración
  gameDuration: 90, // segundos
  
  // Velocidad
  runnerSpeed: 200, // píxeles/segundo inicial
  speedIncreaseRate: 1.05, // multiplicador cada 10s
  
  // Spawn
  gateSpawnInterval: 3000, // ms entre puertas
  
  // Vidas
  maxLives: 3,
  
  // Carriles
  lanes: 3, // Izquierda, Centro, Derecha
}
```

## 🎨 Diseño Visual

### Colores
- **Fondo**: Azul cielo (#87CEEB)
- **Suelo**: Marrón (#8B7355)
- **Jugador**: Azul (#3b82f6)
- **Puerta correcta**: Verde (#10b981)
- **Puerta incorrecta**: Rojo (#ef4444)
- **Obstáculo**: Naranja (#f59e0b)

### UI
- **Score**: Esquina superior izquierda
- **Vidas**: Esquina superior derecha
- **Timer**: Centro superior
- **Distancia**: Esquina inferior izquierda
- **Instrucciones**: Centro superior (debajo del timer)

## 📝 Tipos de Contenido

Grammar Run usa el mismo tipo de contenido que Word Catcher:

```typescript
interface GameContent {
  content_id: string;
  topic_id: string;
  content_type: 'word';
  content_text: string;  // Estructura gramatical
  is_correct: boolean;   // true = opción correcta
}
```

### Ejemplos de Contenido

**Tema: Present Simple**
```json
[
  { "content_text": "He plays", "is_correct": true },
  { "content_text": "He play", "is_correct": false },
  { "content_text": "She works", "is_correct": true },
  { "content_text": "She work", "is_correct": false },
  { "content_text": "They study", "is_correct": true },
  { "content_text": "They studies", "is_correct": false }
]
```

**Tema: Past Tense**
```json
[
  { "content_text": "I went", "is_correct": true },
  { "content_text": "I goed", "is_correct": false },
  { "content_text": "She ate", "is_correct": true },
  { "content_text": "She eated", "is_correct": false }
]
```

## 🔄 Flujo del Juego

```
1. Inicio
   ↓
2. Jugador corre automáticamente
   ↓
3. Aparece puerta con 2 opciones
   ↓
4. Jugador cambia de carril
   ↓
5. Pasa por puerta
   ↓
6. Sistema evalúa:
   - Correcta → +15 puntos
   - Incorrecta → -10 puntos, -1 vida
   ↓
7. Velocidad aumenta cada 10s
   ↓
8. Repetir hasta:
   - Vidas = 0
   - Tiempo = 0
   ↓
9. Game Over
   ↓
10. Evaluación pedagógica
    ↓
11. Actualización de progreso
```

## 🎓 Integración con Sistema de Misiones

### Validación Pre-Juego
```typescript
const validation = await MissionValidator.validateMission(
  studentId,
  topicId,
  'grammar-run-id',
  parallelId
);

if (validation.canPlay) {
  // Cargar Grammar Run
} else {
  // Mostrar mensaje de bloqueo
}
```

### Evaluación Post-Juego
```typescript
const result = MissionEvaluator.evaluateMission(
  score,        // Puntaje final
  accuracy,     // % de aciertos
  correctCount, // Puertas correctas
  wrongCount    // Puertas incorrectas
);

// result.success → ¿Aprobó la misión?
// result.pointsEarned → Puntos con multiplicador
// result.feedback → Mensaje pedagógico
```

## 🚀 Uso en la Aplicación

### Para Docentes

1. **Crear Misión**
   ```typescript
   // En GameManager
   await createMission({
     game_type_id: 'grammar-run-id',
     topic_id: 'present-simple-id',
     parallel_id: 'parallel-id',
     available_from: '2026-01-10',
     available_until: '2026-01-17',
     max_attempts: 3
   });
   ```

2. **Monitorear Progreso**
   - Ver estudiantes que han jugado
   - Revisar puntajes promedio
   - Analizar precisión por tema

### Para Estudiantes

1. **Acceder al Juego**
   - Ir a "Mis Juegos"
   - Ver misión "Grammar Run - Present Simple"
   - Click "Jugar Ahora"

2. **Jugar**
   - Usar ← → para cambiar carriles
   - Pasar por puertas correctas
   - Evitar puertas incorrectas
   - Sobrevivir 90 segundos

3. **Ver Resultados**
   - Puntaje final
   - Precisión
   - Estado de misión (completada/no completada)
   - Puntos ganados con multiplicador

## 📊 Métricas Rastreadas

### Por Sesión
- `score`: Puntaje total
- `correct_count`: Puertas correctas
- `wrong_count`: Puertas incorrectas
- `duration_seconds`: Tiempo jugado
- `details.finalDistance`: Distancia recorrida
- `details.finalSpeed`: Velocidad final
- `details.gatesShown`: Total de puertas mostradas

### Por Estudiante
- Sesiones completadas
- Puntaje promedio
- Precisión promedio
- Mejor puntaje
- Progreso en el tema

## 🎯 Estrategias Pedagógicas

### Dificultad Progresiva
- Velocidad aumenta gradualmente
- Presión de tiempo
- Requiere decisiones rápidas

### Refuerzo Positivo
- Feedback visual inmediato (colores)
- Puntos por distancia (motivación continua)
- Mensajes de logro al finalizar

### Aprendizaje por Repetición
- Múltiples intentos permitidos
- Contenido aleatorizado
- Diferentes combinaciones cada vez

## 🔧 Personalización

### Ajustar Dificultad
```typescript
// En grammarRun.config.ts
{
  gameplay: {
    gameDuration: 120,      // Más tiempo
    runnerSpeed: 150,       // Más lento
    maxLives: 5,            // Más vidas
    speedIncreaseRate: 1.02 // Aumento más gradual
  }
}
```

### Criterios Personalizados
```typescript
// En MissionEvaluator.ts
static getCriteriaForTopic(topicId: string) {
  if (topicId === 'advanced-grammar-id') {
    return {
      minScoreToPass: 70,
      minAccuracyToPass: 75
    };
  }
  return DEFAULT_CRITERIA;
}
```

## 🐛 Troubleshooting

### El juego no carga
- Verificar que existe contenido para el tema
- Verificar que la misión está activa
- Revisar consola del navegador

### Puertas no aparecen
- Verificar que hay suficiente contenido (mínimo 10 items)
- Verificar que hay opciones correctas e incorrectas

### Velocidad muy rápida/lenta
- Ajustar `runnerSpeed` en configuración
- Ajustar `speedIncreaseRate`

## 📚 Archivos del Juego

```
src/lib/games/
├── grammarRun.config.ts      # Configuración
└── GrammarRunScene.ts        # Escena Phaser

src/components/features/gamification/
└── UniversalGameCanvas.tsx   # Wrapper (compartido)

docs/
└── GRAMMAR_RUN_GAME.md       # Esta documentación
```

## ✅ Checklist de Implementación

- [x] Configuración creada
- [x] Escena Phaser implementada
- [x] Integración con UniversalGameCanvas
- [x] Sistema de vidas
- [x] Sistema de carriles
- [x] Spawn de puertas
- [x] Detección de colisiones
- [x] Sistema de puntuación
- [x] Aumento de velocidad
- [x] Game Over screen
- [x] Integración con MissionValidator
- [x] Integración con MissionEvaluator
- [x] Documentación completa

## 🎉 Resultado

Grammar Run está **completamente implementado** y listo para ser usado como misión pedagógica en el sistema educativo gamificado.

---

**Última actualización**: 2026-01-03
