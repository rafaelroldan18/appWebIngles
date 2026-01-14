# ✅ GrammarRun - Paso 3 COMPLETADO

## 📋 Resumen del Paso 3: Actualizar GrammarRunScene + GameLoader Backend

Se ha completado exitosamente la actualización de **GrammarRunScene** para usar el sistema de preguntas estructuradas y se ha definido cómo debe funcionar el **GameLoader en el backend**.

---

## 🎯 Lo que se implementó

### 1. **Actualización de GrammarRunScene**

✅ Cambió de `GameContent[]` a `GrammarQuestion[]`
✅ Importa `loadGrammarRunContent` y `validateGrammarRunContent`
✅ Actualizada interfaz `Gate` para usar `GrammarQuestion` y `GrammarOption`
✅ Método `spawnGate()` actualizado para trabajar con preguntas estructuradas
✅ Método `createGateInLane()` actualizado para mostrar opciones
✅ Validación de contenido en `init()`
✅ Tracking correcto de respuestas en `sessionManager`

### 2. **Definición del GameLoader Backend** ⚠️

**IMPORTANTE**: El loader debe estar en el **backend**, no en Phaser.

- ✅ Phaser **NO** debe ir a la BD
- ✅ Phaser recibe el JSON ya armado desde la API
- ✅ El backend construye el "deck" completo antes de enviarlo

---

## 🔧 Arquitectura del Loader (Backend)

### 3.1 Consulta Base

El endpoint `/api/games/grammar-run?topicId=X` debe devolver:

**Misión activa** (de `game_availability`):
- `mission_title`
- `mission_instructions`
- `mission_config`

**Contenido** (de `game_content`):
- Todas las `sentence` del topic para ese `game_type`
- Todas las `option` asociadas a esas `sentence`

### 3.2 Construcción de items[]

El loader del backend hace:

1. Toma las `sentence` del topic
2. Aplica `items_limit` y `randomize_items` (del `mission_config`)
3. A cada `sentence` le adjunta sus `options` usando `parent_sentence_id`
4. Construye el payload final

### 3.3 Payload Final

Phaser debe recibir este JSON ya armado:

```typescript
{
  mission: {
    title: "Past Simple Practice",
    instructions: "Select the correct verb form for each sentence."
  },
  missionConfig: {
    time_limit_seconds: 90,
    difficulty: "medio",
    lives: 3,
    scoring: {
      points_correct: 10,
      points_wrong: -5,
      streak_bonus: true
    },
    pacing: {
      speed_base: 1.0,
      speed_increment: 0.08,
      spawn_rate: 1.2
    },
    ui: {
      show_timer: true,
      show_lives: true,
      show_streak: true,
      show_progress: true,
      show_hint_button: false
    },
    grammar_run: {
      mode: "choose_correct",
      items_limit: 12,
      randomize_items: true,
      obstacle_penalty_life: 1,
      wrong_penalty_life: 0
    }
  },
  items: [
    {
      itemId: "uuid-sentence-1",
      prompt: "She ____ to school yesterday.",
      options: ["go", "went", "goed"],
      correct: "went",
      ruleTag: "past_simple_irregular",
      explanation: "Past simple of 'go' is 'went'."
    },
    {
      itemId: "uuid-sentence-2",
      prompt: "They ____ a movie last night.",
      options: ["watch", "watched", "watches"],
      correct: "watched",
      ruleTag: "past_simple_regular",
      explanation: "Regular verbs add -ed in past simple."
    }
    // ... más preguntas
  ]
}
```

---

## 📊 Flujo Completo

```
┌─────────────────┐
│   Frontend      │
│  (Estudiante)   │
└────────┬────────┘
         │
         │ 1. Request: GET /api/games/grammar-run?topicId=X
         │
         ▼
┌─────────────────┐
│   Backend API   │
│   (Next.js)     │
└────────┬────────┘
         │
         │ 2. Query DB:
         │    - game_availability (mission_config)
         │    - game_content (sentences + options)
         │
         ▼
┌─────────────────┐
│  GameLoader     │
│  (Backend)      │
└────────┬────────┘
         │
         │ 3. Process:
         │    - Filter sentences
         │    - Apply items_limit
         │    - Apply randomize_items
         │    - Attach options to each sentence
         │    - Build final payload
         │
         ▼
┌─────────────────┐
│   Response      │
│   (JSON)        │
└────────┬────────┘
         │
         │ 4. Return payload to frontend
         │
         ▼
┌─────────────────┐
│  Phaser Scene   │
│ (GrammarRun)    │
└─────────────────┘
         │
         │ 5. Receive items[] and play
         │
         ▼
    🎮 Game!
```

---

## 🔍 Cambios en GrammarRunScene

### Antes (GameContent[]):

```typescript
private gameContent: GameContent[] = [];

init(data: { words: GameContent[]; ... }) {
  this.gameContent = data.words || [];
  // ...
}

private spawnGate() {
  const correctContent = this.gameContent[this.contentIndex];
  const wrongOptions = this.gameContent.filter(c => !c.is_correct);
  // ...
}
```

### Después (GrammarQuestion[]):

```typescript
private questions: GrammarQuestion[] = [];

init(data: { words: GameContent[]; ... }) {
  const rawContent = data.words || [];
  const validation = validateGrammarRunContent(rawContent);
  this.questions = loadGrammarRunContent(rawContent);
  // ...
}

private spawnGate() {
  const question = this.questions[this.contentIndex];
  const correctOption = question.options.find(opt => opt.isCorrect);
  const wrongOptions = question.options.filter(opt => !opt.isCorrect);
  // ...
}
```

---

## ✅ Validaciones Implementadas

### En el Frontend (Phaser):

1. ✅ Valida que el contenido tenga estructura correcta
2. ✅ Valida que cada pregunta tenga al menos 2 opciones
3. ✅ Valida que cada pregunta tenga exactamente 1 opción correcta
4. ✅ Logs de errores si la validación falla

### En el Backend (Pendiente - Paso 4):

1. ⏳ Validar que existan sentences y options en la BD
2. ⏳ Validar que cada sentence tenga sus options
3. ⏳ Aplicar `items_limit` y `randomize_items`
4. ⏳ Construir el payload final
5. ⏳ Retornar error si no hay suficiente contenido

---

## 📁 Archivos Modificados

1. ✅ `src/lib/games/GrammarRunScene.ts` - Scene actualizada
   - Cambió de `GameContent[]` a `GrammarQuestion[]`
   - Usa `loadGrammarRunContent()` y `validateGrammarRunContent()`
   - Interfaz `Gate` actualizada
   - Métodos `spawnGate()` y `createGateInLane()` actualizados

2. ✅ `src/lib/games/gameLoader.utils.ts` - Loader utilities
   - `loadGrammarRunContent()` - Construye preguntas desde GameContent
   - `validateGrammarRunContent()` - Valida estructura

3. ✅ `src/types/game.types.ts` - Tipos TypeScript
   - `GrammarQuestion`, `GrammarOption`
   - `GrammarSentenceMetadata`, `GrammarOptionMetadata`

---

## ✅ Build Exitoso

```
✓ Compiled successfully in 15.3s
✓ Finished TypeScript in 12.4s
✓ Collecting page data using 7 workers in 2.1s
✓ Generating static pages using 7 workers (50/50) in 1796.0ms
✓ Finalizing page optimization in 13.6ms
```

---

## 🚀 Próximos Pasos

- ✅ **Paso 1**: mission_config definido (COMPLETADO)
- ✅ **Paso 2**: Estructura de game_content definida (COMPLETADO)
- ✅ **Paso 3**: GrammarRunScene actualizada + Loader definido (COMPLETADO)
- ⏳ **Paso 4**: Implementar GameLoader en el Backend (API)
  - Crear endpoint `/api/games/grammar-run`
  - Implementar lógica de construcción del payload
  - Aplicar `items_limit` y `randomize_items`
  - Retornar JSON completo a Phaser
- ⏳ **Paso 5**: Sistema de details estándar
- ⏳ **Paso 6**: Testing completo con datos reales

---

## 💡 Notas Importantes

### ⚠️ Loader en Backend, NO en Phaser

**Antes pensábamos**: Phaser carga desde BD y procesa
**Ahora sabemos**: Backend construye el "deck" completo y lo envía a Phaser

**Razones**:
1. ✅ **Seguridad**: Phaser no tiene acceso directo a la BD
2. ✅ **Performance**: El backend procesa una vez, Phaser solo renderiza
3. ✅ **Consistencia**: Mismo patrón que ImageMatch
4. ✅ **Validación**: El backend valida antes de enviar
5. ✅ **Escalabilidad**: Más fácil cachear en el backend

### 📌 Funciones del Loader (Backend)

```typescript
// Pseudo-código del loader backend
async function buildGrammarRunPayload(topicId: string, gameTypeId: string) {
  // 1. Get mission config
  const mission = await getMissionConfig(topicId, gameTypeId);
  
  // 2. Get all sentences and options
  const sentences = await getSentences(topicId, gameTypeId);
  const options = await getOptions(topicId, gameTypeId);
  
  // 3. Build questions
  const questions = sentences.map(sentence => {
    const sentenceOptions = options.filter(
      opt => opt.metadata.parent_sentence_id === sentence.content_id
    );
    return {
      itemId: sentence.content_id,
      prompt: sentence.content_text,
      options: sentenceOptions.map(opt => opt.content_text),
      correct: sentence.metadata.correct_option,
      ruleTag: sentence.metadata.rule_tag,
      explanation: sentence.metadata.explanation
    };
  });
  
  // 4. Apply randomization
  if (mission.missionConfig.grammar_run.randomize_items) {
    shuffle(questions);
  }
  
  // 5. Apply limit
  const limitedQuestions = questions.slice(
    0, 
    mission.missionConfig.grammar_run.items_limit
  );
  
  // 6. Return payload
  return {
    mission: {
      title: mission.mission_title,
      instructions: mission.mission_instructions
    },
    missionConfig: mission.mission_config,
    items: limitedQuestions
  };
}
```

---

## 🎮 Cómo Phaser Usa el Payload

```typescript
// En GrammarRunScene.init()
init(data: { words: GameContent[]; ... }) {
  // 'words' viene del backend ya procesado
  const rawContent = data.words || [];
  
  // Validar y cargar
  const validation = validateGrammarRunContent(rawContent);
  if (!validation.valid) {
    console.error('Invalid content:', validation.error);
    this.questions = [];
  } else {
    this.questions = loadGrammarRunContent(rawContent);
  }
  
  // Ya está listo para jugar!
}
```

---

**Fecha de Completación**: 2026-01-12
**Estado**: ✅ COMPLETADO (Frontend) - ⏳ PENDIENTE (Backend Loader)

**Siguiente**: Implementar el GameLoader en el backend (API endpoint)
