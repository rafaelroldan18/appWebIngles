# Roadmap de Juegos Educativos

## 🎮 Estado de Implementación

### ✅ Completados

#### 1. Word Catcher
**Estado**: ✅ Implementado y funcional
**Mecánica**: Lluvia de palabras/objetos
**Objetivo**: Identificar vocabulario correcto y evitar el incorrecto
**Archivos**:
- `src/lib/games/WordCatcherScene.ts`
- `src/lib/games/wordCatcher.config.ts`

**Características**:
- Palabras caen desde arriba
- Click en palabras correctas: +10 puntos
- Click en palabras incorrectas: -5 puntos
- Duración: 2 minutos
- Integrado con sistema de misiones

#### 2. Grammar Run
**Estado**: ✅ Implementado
**Mecánica**: Endless Runner (Corredor infinito)
**Objetivo**: Seleccionar la estructura gramatical correcta mientras el personaje corre
**Archivos**:
- `src/lib/games/GrammarRunScene.ts`
- `src/lib/games/grammarRun.config.ts`

**Características**:
- Jugador corre automáticamente
- 3 carriles (izquierda, centro, derecha)
- Puertas con opciones gramaticales
- Usar ← → para cambiar de carril
- Pasar por puerta correcta: +15 puntos
- Pasar por puerta incorrecta: -10 puntos, -1 vida
- 3 vidas iniciales
- Velocidad aumenta progresivamente
- Duración: 90 segundos

### 🚧 En Planificación

#### 3. Sentence Builder
**Estado**: ✅ Implementado
**Mecánica**: Drag and Drop (Arrastrar y soltar)
**Objetivo**: Ordenar palabras para formar oraciones coherentes

**Archivos**:
- `src/lib/games/SentenceBuilderScene.ts`
- `src/lib/games/sentenceBuilder.config.ts`

**Características**:
- Arrastrar y soltar palabras
- 8 oraciones por juego
- 30 segundos por oración
- Sistema de pistas (2 por oración)
- Verificación de respuestas
- Feedback inmediato (verde/rojo)
- Bonus por tiempo restante
- Duración total: 3 minutos
- Integrado con sistema de misiones

**Diseño Propuesto**:
```typescript
// Configuración
{
  gameDuration: 120,
  sentencesPerGame: 10,
  timePerSentence: 30,
  scoring: {
    perfectOrder: 20,
    partialCorrect: 10,
    incorrect: 0,
    timeBonus: 5, // Por cada 5 segundos sobrantes
  }
}

// Mecánica
- Mostrar palabras desordenadas en la parte inferior
- Área de construcción en la parte superior
- Arrastrar palabras al área de construcción
- Botón "Check" para verificar
- Feedback inmediato (verde/rojo)
- Siguiente oración automáticamente
```

**Contenido Requerido**:
```typescript
interface SentenceContent extends GameContent {
  content_type: 'sentence';
  content_text: string;      // Oración completa correcta
  word_order: string[];      // Array de palabras en orden correcto
  difficulty: 'easy' | 'medium' | 'hard';
}
```

**Archivos a Crear**:
- `src/lib/games/SentenceBuilderScene.ts`
- `src/lib/games/sentenceBuilder.config.ts`

#### 4. Image Match
**Estado**: ✅ Implementado
**Mecánica**: Memoria / Tarjetas
**Objetivo**: Encontrar pares de imagen y palabra

**Archivos**:
- `src/lib/games/ImageMatchScene.ts`
- `src/lib/games/imageMatch.config.ts`

**Características**:
- Cuadrícula 4×4 (16 tarjetas)
- 8 pares imagen-palabra
- Sistema de emojis integrado
- Detección inteligente de pares
- Feedback visual (verde/rojo)
- Bonus por juego perfecto (+50)
- Bonus de tiempo
- Duración: 3 minutos
- Integrado con sistema de misiones

**Diseño Propuesto**:
```typescript
// Configuración
{
  gameDuration: 180,
  gridSize: { rows: 4, cols: 4 }, // 8 pares
  scoring: {
    matchFound: 15,
    wrongMatch: -3,
    timeBonus: 2, // Por cada 10 segundos sobrantes
  },
  visual: {
    cardBackColor: '#3b82f6',
    cardFrontColor: '#ffffff',
    matchColor: '#10b981',
  }
}

// Mecánica
- Cuadrícula de tarjetas boca abajo
- Click para voltear tarjeta
- Máximo 2 tarjetas volteadas a la vez
- Si coinciden: permanecen visibles (+puntos)
- Si no coinciden: se voltean de nuevo
- Juego termina cuando todos los pares están encontrados
```

**Contenido Requerido**:
```typescript
interface ImageMatchContent extends GameContent {
  content_type: 'image-word-pair';
  content_text: string;      // Palabra
  image_url: string;         // URL de la imagen
  category?: string;         // Categoría (animales, colores, etc.)
}
```

**Archivos a Crear**:
- `src/lib/games/ImageMatchScene.ts`
- `src/lib/games/imageMatch.config.ts`

#### 5. City Explorer
**Estado**: ✅ Implementado
**Mecánica**: Mapa interactivo / Exploración
**Objetivo**: Navegar por una ciudad virtual para aprender lugares y preposiciones

**Archivos**:
- `src/lib/games/CityExplorerScene.ts`
- `src/lib/games/cityExplorer.config.ts`

**Características**:
- Mapa de ciudad 3×3
- 8 tipos de edificios con emojis
- Navegación con WASD/Flechas
- 6 ubicaciones por juego
- Preguntas de preposiciones dinámicas
- Detección de proximidad
- Bonus de velocidad
- Duración: 4 minutos
- Integrado con sistema de misiones

**Diseño Propuesto**:
```typescript
// Configuración
{
  gameDuration: 240, // 4 minutos
  mapSize: { width: 1200, height: 900 },
  scoring: {
    locationFound: 20,
    correctPreposition: 15,
    wrongAnswer: -5,
  },
  locations: [
    'bank', 'hospital', 'school', 'park', 
    'restaurant', 'library', 'museum', 'station'
  ]
}

// Mecánica
- Mapa de ciudad con edificios
- Personaje controlable (WASD o flechas)
- Misiones: "Find the hospital" / "Go to the park"
- Al llegar: pregunta sobre preposiciones
  "The bank is ___ the hospital" (next to/across from/behind)
- Minimapa en esquina
- Indicador de dirección
```

**Contenido Requerido**:
```typescript
interface CityExplorerContent extends GameContent {
  content_type: 'location-preposition';
  location_name: string;     // "hospital"
  preposition: string;       // "next to"
  reference_location: string; // "bank"
  question_text: string;     // "The hospital is ___ the bank"
  options: string[];         // ["next to", "across from", "behind"]
}
```

**Archivos a Crear**:
- `src/lib/games/CityExplorerScene.ts`
- `src/lib/games/cityExplorer.config.ts`

## 🏗️ Arquitectura Compartida

### Componentes Reutilizables

Todos los juegos comparten:

✅ **UniversalGameCanvas** - Wrapper React genérico
```typescript
<UniversalGameCanvas
  gameType="sentence-builder" // Detecta automáticamente
  topicId={topicId}
  gameTypeId={gameTypeId}
  studentId={studentId}
  onGameEnd={handleGameEnd}
/>
```

✅ **MissionValidator** - Validación de acceso
```typescript
const validation = await MissionValidator.validateMission(
  studentId, topicId, gameTypeId, parallelId
);
```

✅ **MissionEvaluator** - Evaluación pedagógica
```typescript
const result = MissionEvaluator.evaluateMission(
  score, accuracy, correct, wrong
);
```

✅ **GameLoader** - Carga de contenido
```typescript
const content = await GameLoader.loadGameContent(topicId, gameTypeId);
```

✅ **GameSessionManager** - Gestión de sesiones
```typescript
const session = new GameSessionManager(studentId, topicId, gameTypeId);
await session.startSession();
// ... juego ...
await session.endSession(details);
```

### Patrón de Implementación

Para cada nuevo juego:

1. **Crear configuración** (`gameType.config.ts`)
   - Dimensiones
   - Scoring
   - Gameplay
   - Visual
   - Physics

2. **Crear escena Phaser** (`GameTypeScene.ts`)
   - Extender `Phaser.Scene`
   - Implementar `init(data)`
   - Implementar `create()`
   - Implementar `update()`
   - Emitir evento `'gameOver'`

3. **Registrar en UniversalGameCanvas**
   ```typescript
   const GAME_CONFIGS = {
     'new-game': {
       scene: NewGameScene,
       config: NEW_GAME_CONFIG,
       name: 'New Game',
     }
   };
   ```

4. **Agregar tipo de contenido** (si es necesario)
   ```typescript
   // En game.types.ts
   export interface NewGameContent extends GameContent {
     content_type: 'new-type';
     // campos específicos
   }
   ```

5. **Insertar en BD**
   ```sql
   INSERT INTO game_types (name, description)
   VALUES ('New Game', 'Description');
   ```

## 📊 Tipos de Contenido por Juego

| Juego | content_type | Campos Específicos |
|-------|--------------|-------------------|
| Word Catcher | `word` | `content_text`, `is_correct` |
| Grammar Run | `word` | `content_text`, `is_correct` |
| Sentence Builder | `sentence` | `content_text`, `word_order[]`, `difficulty` |
| Image Match | `image-word-pair` | `content_text`, `image_url`, `category` |
| City Explorer | `location-preposition` | `location_name`, `preposition`, `reference_location`, `question_text`, `options[]` |

## 🎯 Criterios de Evaluación por Juego

Todos los juegos usan los mismos criterios base:
```typescript
{
  minScoreToPass: 50,
  minAccuracyToPass: 60,
  excellentThreshold: 80,
  goodThreshold: 65
}
```

Pero pueden personalizarse:
```typescript
// En MissionEvaluator.ts
static getCriteriaForGame(gameTypeId: string) {
  const custom = {
    'sentence-builder-id': {
      minScoreToPass: 60,  // Más difícil
      minAccuracyToPass: 70
    },
    'image-match-id': {
      minScoreToPass: 40,  // Más fácil
      minAccuracyToPass: 55
    }
  };
  return custom[gameTypeId] || DEFAULT_CRITERIA;
}
```

## 📅 Cronograma de Implementación

### Fase 1: Completada ✅
- [x] Word Catcher
- [x] Grammar Run
- [x] UniversalGameCanvas
- [x] Sistema de misiones
- [x] Validación y evaluación

### Fase 2: Próxima (Semana 1-2)
- [ ] Sentence Builder
  - [ ] Configuración
  - [ ] Escena Phaser
  - [ ] Mecánica drag & drop
  - [ ] Integración con sistema
  - [ ] Testing

### Fase 3: Media (Semana 3-4)
- [ ] Image Match
  - [ ] Configuración
  - [ ] Escena Phaser
  - [ ] Mecánica de memoria
  - [ ] Sistema de imágenes
  - [ ] Integración
  - [ ] Testing

### Fase 4: Avanzada (Semana 5-6)
- [ ] City Explorer
  - [ ] Configuración
  - [ ] Escena Phaser
  - [ ] Mapa interactivo
  - [ ] Sistema de navegación
  - [ ] Integración
  - [ ] Testing

## 🧪 Testing por Juego

Para cada juego implementado:

1. **Crear contenido de prueba**
   ```sql
   INSERT INTO game_content (topic_id, content_type, ...)
   VALUES (...);
   ```

2. **Crear misión**
   ```sql
   INSERT INTO game_availability (...)
   VALUES (...);
   ```

3. **Probar flujo completo**
   - Validación de acceso
   - Carga del juego
   - Mecánicas
   - Scoring
   - Finalización
   - Actualización de progreso

4. **Verificar métricas**
   - Score correcto
   - Accuracy calculada
   - Progreso actualizado
   - Sesión guardada

## 📚 Documentación por Juego

Cada juego debe tener:

- [ ] Documento de diseño
- [ ] Configuración documentada
- [ ] Mecánicas explicadas
- [ ] Tipos de contenido definidos
- [ ] Criterios de evaluación
- [ ] Ejemplos de uso

## 🎮 Próximos Pasos Inmediatos

1. **Implementar Sentence Builder**
   - Crear `sentenceBuilder.config.ts`
   - Crear `SentenceBuilderScene.ts`
   - Implementar drag & drop con Phaser
   - Integrar con UniversalGameCanvas
   - Crear contenido de prueba

2. **Actualizar Base de Datos**
   ```sql
   INSERT INTO game_types (name, description)
   VALUES 
     ('Grammar Run', 'Endless runner for grammar practice'),
     ('Sentence Builder', 'Build sentences by ordering words'),
     ('Image Match', 'Match images with words'),
     ('City Explorer', 'Explore a city to learn locations');
   ```

3. **Documentar Grammar Run**
   - Crear `GRAMMAR_RUN_GAME.md`
   - Explicar mecánicas
   - Documentar controles
   - Ejemplos de contenido

---

**Última actualización**: 2026-01-03
