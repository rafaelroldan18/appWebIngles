# Sentence Builder - Drag & Drop Educativo

## 🎮 Descripción General

**Sentence Builder** es un juego educativo de arrastrar y soltar donde los estudiantes construyen oraciones correctas ordenando palabras. El juego refuerza la comprensión de estructuras gramaticales y el orden correcto de las palabras en inglés.

## 🎯 Objetivos Pedagógicos

- Practicar el orden correcto de palabras en oraciones
- Reforzar estructuras gramaticales
- Desarrollar comprensión sintáctica
- Relacionar con actividades de "Unjumble/Reordenar"

## 🕹️ Mecánicas de Juego

### Controles
- **Mouse/Touch**: Arrastrar y soltar palabras
- **Botón "Check"**: Verificar respuesta
- **Botón "Hint"**: Obtener ayuda (máximo 2 por oración)
- **Botón "Next"**: Pasar a la siguiente oración

### Gameplay
1. Se muestra un conjunto de palabras desordenadas en la parte inferior
2. El jugador arrastra las palabras a los espacios en la parte superior
3. Las palabras deben colocarse en el orden correcto
4. Presionar "Check" para verificar la respuesta
5. Feedback inmediato (verde = correcto, rojo = incorrecto)
6. 8 oraciones por juego
7. 30 segundos por oración

### Sistema de Pistas
- **Pistas disponibles**: 2 por oración
- **Efecto**: Coloca automáticamente la siguiente palabra correcta
- **Penalización**: -3 puntos por pista usada

## 📊 Sistema de Puntuación

### Puntos
- **Oración perfecta**: +25 puntos
- **Bonus de tiempo**: +5 puntos por cada 5 segundos restantes
- **Uso de pista**: -3 puntos
- **Oración incorrecta**: 0 puntos

### Evaluación
Usa los mismos criterios estándar:
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
  gameDuration: 180, // 3 minutos total
  timePerSentence: 30, // 30 segundos por oración
  
  // Gameplay
  sentencesPerGame: 8,
  maxHintsPerSentence: 2,
  shuffleWords: true,
  
  // Puntuación
  perfectSentence: 25,
  timeBonus: 5, // Por cada 5 segundos
  hintPenalty: -3,
}
```

## 🎨 Diseño Visual

### Colores
- **Fondo**: Gris claro (#f8fafc)
- **Tarjeta de palabra**: Azul (#3b82f6)
- **Tarjeta hover**: Azul oscuro (#2563eb)
- **Espacio vacío**: Gris (#e2e8f0)
- **Espacio ocupado**: Verde (#10b981)
- **Correcto**: Verde (#10b981)
- **Incorrecto**: Rojo (#ef4444)

### Layout
- **Área de construcción**: Centro superior (y: 200)
- **Banco de palabras**: Centro inferior (y: 450)
- **Botones**: Parte inferior (y: 520)

### UI
- **Score**: Esquina superior izquierda
- **Timer total**: Esquina superior derecha
- **Timer de oración**: Centro superior (naranja)
- **Progreso**: Debajo del timer ("Sentence 1 of 8")
- **Instrucciones**: Centro
- **Feedback**: Centro (verde/rojo)

## 📝 Tipos de Contenido

Sentence Builder usa contenido de tipo `sentence`:

```typescript
interface GameContent {
  content_id: string;
  topic_id: string;
  content_type: 'sentence';
  content_text: string;  // Oración completa correcta
  is_correct: true;      // Siempre true para oraciones
}
```

### Ejemplos de Contenido

**Tema: Present Simple**
```json
[
  { "content_text": "I play football every day" },
  { "content_text": "She studies English at school" },
  { "content_text": "They watch TV in the evening" },
  { "content_text": "He works in a hospital" },
  { "content_text": "We eat breakfast at seven" }
]
```

**Tema: Past Tense**
```json
[
  { "content_text": "I went to the park yesterday" },
  { "content_text": "She ate pizza for dinner" },
  { "content_text": "They played soccer last week" },
  { "content_text": "He studied all night" }
]
```

**Tema: Questions**
```json
[
  { "content_text": "Where do you live" },
  { "content_text": "What is your name" },
  { "content_text": "How old are you" },
  { "content_text": "When does the class start" }
]
```

## 🔄 Flujo del Juego

```
1. Inicio
   ↓
2. Cargar oración 1
   ↓
3. Mostrar palabras desordenadas
   ↓
4. Jugador arrastra palabras a espacios
   ↓
5. Jugador presiona "Check"
   ↓
6. Sistema verifica:
   - ¿Todos los espacios llenos?
   - ¿Orden correcto?
   ↓
7. Feedback:
   - Correcto → +25 puntos + bonus tiempo
   - Incorrecto → 0 puntos, reintentar
   ↓
8. Botón "Next" aparece
   ↓
9. Cargar siguiente oración
   ↓
10. Repetir hasta:
    - 8 oraciones completadas
    - Tiempo agotado
    ↓
11. Game Over
    ↓
12. Evaluación pedagógica
    ↓
13. Actualización de progreso
```

## 🎓 Integración con Sistema de Misiones

### Validación Pre-Juego
```typescript
const validation = await MissionValidator.validateMission(
  studentId,
  topicId,
  'sentence-builder-id',
  parallelId
);

if (validation.canPlay) {
  // Cargar Sentence Builder
} else {
  // Mostrar mensaje de bloqueo
}
```

### Evaluación Post-Juego
```typescript
const result = MissionEvaluator.evaluateMission(
  score,        // Puntaje final
  accuracy,     // % de oraciones correctas
  correctCount, // Oraciones correctas
  wrongCount    // Oraciones incorrectas
);

// result.success → ¿Aprobó la misión?
// result.pointsEarned → Puntos con multiplicador
// result.feedback → Mensaje pedagógico
```

## 🚀 Uso en la Aplicación

### Para Docentes

1. **Crear Contenido**
   ```sql
   INSERT INTO game_content (topic_id, content_type, content_text, is_correct)
   VALUES 
     ('present-simple-id', 'sentence', 'I play football every day', true),
     ('present-simple-id', 'sentence', 'She studies English at school', true);
   ```

2. **Crear Misión**
   ```typescript
   await createMission({
     game_type_id: 'sentence-builder-id',
     topic_id: 'present-simple-id',
     parallel_id: 'parallel-id',
     available_from: '2026-01-10',
     available_until: '2026-01-17',
     max_attempts: 3
   });
   ```

### Para Estudiantes

1. **Acceder al Juego**
   - Ir a "Mis Juegos"
   - Ver misión "Sentence Builder - Present Simple"
   - Click "Jugar Ahora"

2. **Jugar**
   - Arrastrar palabras a los espacios
   - Ordenar correctamente
   - Presionar "Check"
   - Usar "Hint" si es necesario
   - Completar 8 oraciones

3. **Ver Resultados**
   - Puntaje final
   - Oraciones correctas/incorrectas
   - Estado de misión
   - Puntos ganados

## 📊 Métricas Rastreadas

### Por Sesión
- `score`: Puntaje total
- `correct_count`: Oraciones correctas
- `wrong_count`: Oraciones incorrectas
- `duration_seconds`: Tiempo jugado
- `details.sentencesCompleted`: Oraciones completadas
- `details.hintsUsed`: Pistas utilizadas

### Por Estudiante
- Sesiones completadas
- Puntaje promedio
- Precisión promedio
- Mejor puntaje
- Progreso en el tema

## 🎯 Estrategias Pedagógicas

### Aprendizaje Activo
- Manipulación física de palabras
- Construcción activa de conocimiento
- Feedback inmediato

### Andamiaje
- Sistema de pistas disponible
- Penalización leve por usar ayuda
- Permite múltiples intentos

### Progresión
- 8 oraciones por sesión
- Tiempo limitado por oración
- Dificultad puede variar por tema

## 🔧 Personalización

### Ajustar Dificultad
```typescript
// En sentenceBuilder.config.ts
{
  gameplay: {
    sentencesPerGame: 10,      // Más oraciones
    timePerSentence: 45,       // Más tiempo
    maxHintsPerSentence: 3,    // Más ayuda
  },
  scoring: {
    perfectSentence: 30,       // Más puntos
    hintPenalty: -5,           // Mayor penalización
  }
}
```

### Criterios Personalizados
```typescript
// En MissionEvaluator.ts
static getCriteriaForTopic(topicId: string) {
  if (topicId === 'complex-sentences-id') {
    return {
      minScoreToPass: 80,
      minAccuracyToPass: 70
    };
  }
  return DEFAULT_CRITERIA;
}
```

## 🎮 Características Especiales

### Drag & Drop Intuitivo
- Arrastrar con mouse o touch
- Feedback visual al arrastrar
- Snap automático a espacios
- Retorno al banco si no se suelta en espacio

### Gestión de Espacios
- Espacios se llenan automáticamente
- Solo un espacio por palabra
- Liberación automática al arrastrar de nuevo

### Sistema de Pistas Inteligente
- Coloca la siguiente palabra correcta
- Actualiza contador de pistas
- Penalización inmediata en score

## 🐛 Troubleshooting

### Las palabras no se arrastran
- Verificar que el juego está cargado completamente
- Revisar consola del navegador
- Intentar recargar la página

### Espacios no aceptan palabras
- Verificar que el espacio no esté ocupado
- Soltar la palabra cerca del centro del espacio
- Intentar arrastrar de nuevo

### Pistas no funcionan
- Verificar que quedan pistas disponibles
- Verificar que hay espacios vacíos
- Revisar consola para errores

## 📚 Archivos del Juego

```
src/lib/games/
├── sentenceBuilder.config.ts    # Configuración
└── SentenceBuilderScene.ts      # Escena Phaser

src/components/features/gamification/
└── UniversalGameCanvas.tsx      # Wrapper (compartido)

docs/
└── SENTENCE_BUILDER_GAME.md     # Esta documentación
```

## ✅ Checklist de Implementación

- [x] Configuración creada
- [x] Escena Phaser implementada
- [x] Sistema de drag & drop
- [x] Detección de espacios
- [x] Verificación de respuestas
- [x] Sistema de pistas
- [x] Feedback visual
- [x] Sistema de puntuación
- [x] Temporizadores (total y por oración)
- [x] Game Over screen
- [x] Integración con UniversalGameCanvas
- [x] Integración con MissionValidator
- [x] Integración con MissionEvaluator
- [x] Documentación completa

## 🎉 Resultado

Sentence Builder está **completamente implementado** y listo para ser usado como misión pedagógica en el sistema educativo gamificado.

---

**Última actualización**: 2026-01-03
