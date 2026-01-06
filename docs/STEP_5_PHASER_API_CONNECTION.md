# Paso 5: Conexión Phaser ↔ API - Arquitectura Completa

## 🎯 Objetivo

Verificar y documentar que Phaser está correctamente conectado con la API, garantizando que:
1. **React orquesta** el flujo completo
2. **API entrega** el dataset correcto (filtrado por juego)
3. **Phaser ejecuta** el juego con el contenido recibido
4. **GameSessionManager guarda** los resultados en `game_sessions`

## ✅ Flujo Completo Implementado

```
┌─────────────────────────────────────────────────────────────────────┐
│                    1. REACT ORQUESTA                                │
│                  (UniversalGameCanvas)                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. CARGA DE CONTENIDO FILTRADO                                    │
│                                                                     │
│  const dbGameTypeId = uiGameTypeToDb('word-catcher')                │
│  → 'word_catcher'                                                   │
│                                                                     │
│  const gameContent = await GameLoader.loadGameContent(              │
│      topicId,                                                       │
│      dbGameTypeId  // ← FILTRO POR JUEGO                           │
│  )                                                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. API ENTREGA DATASET CORRECTO                                   │
│                                                                     │
│  GET /api/games/content?topicId=X&targetGameTypeId=word_catcher     │
│                                                                     │
│  SELECT * FROM game_content                                         │
│  WHERE topic_id = X                                                 │
│  AND target_game_type_id = 'word_catcher'                           │
│                                                                     │
│  → Solo palabras, nunca oraciones ✅                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. VALIDACIÓN Y PREPARACIÓN                                       │
│                                                                     │
│  GameLoader.validateGameData(gameContent)                           │
│  - Verifica que haya items correctos                               │
│  - Verifica que haya items incorrectos                             │
│  - Detecta contenido del juego incorrecto                          │
│                                                                     │
│  const shuffledWords = GameLoader.shuffleArray(gameContent)         │
│  - Aleatoriza el orden para variedad                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. INICIALIZACIÓN DE SESIÓN                                       │
│                                                                     │
│  const sessionManager = new GameSessionManager(                     │
│      studentId,                                                     │
│      topicId,                                                       │
│      gameTypeId                                                     │
│  )                                                                  │
│                                                                     │
│  await sessionManager.startSession()                                │
│  → POST /api/games/sessions                                         │
│  → Crea registro en tabla game_sessions                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. PHASER RECIBE DATOS Y EJECUTA                                  │
│                                                                     │
│  game.scene.start('WordCatcherScene', {                             │
│      words: shuffledWords,        // ← Dataset filtrado            │
│      sessionManager: sessionManager // ← Tracking de sesión        │
│  })                                                                 │
│                                                                     │
│  WordCatcherScene.init(data) {                                      │
│      this.words = data.words                                        │
│      this.sessionManager = data.sessionManager                      │
│  }                                                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. JUEGO EN EJECUCIÓN                                             │
│                                                                     │
│  Durante el juego:                                                  │
│  - Phaser usa SOLO el contenido recibido (no inventa nada)         │
│  - Cada acción actualiza el sessionManager:                        │
│                                                                     │
│    handleCorrectCatch(sprite) {                                     │
│        this.score += points                                         │
│        this.sessionManager?.updateScore(points, true) // ← Tracking │
│    }                                                                │
│                                                                     │
│    handleWrongCatch(sprite) {                                       │
│        this.score += points                                         │
│        this.sessionManager?.updateScore(points, false) // ← Tracking│
│    }                                                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  8. FIN DEL JUEGO                                                  │
│                                                                     │
│  async endGame() {                                                  │
│      this.isGameOver = true                                         │
│                                                                     │
│      // Guardar sesión en BD                                       │
│      await this.sessionManager.endSession({                         │
│          wordsShown: this.wordIndex,                                │
│          finalTime: duration                                        │
│      })                                                             │
│      → PUT /api/games/sessions/{sessionId}                          │
│      → Actualiza registro con resultados finales                   │
│                                                                     │
│      // Emitir evento a React                                      │
│      this.events.emit('gameOver', {                                 │
│          score: this.score,                                         │
│          sessionData: this.sessionManager.getSessionData()          │
│      })                                                             │
│  }                                                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  9. REACT RECIBE RESULTADO                                         │
│                                                                     │
│  sceneInstance.events.on('gameOver', (data) => {                    │
│      handleGameOver(data)                                           │
│  })                                                                 │
│                                                                     │
│  const handleGameOver = (data) => {                                 │
│      const result = {                                               │
│          score: data.score,                                         │
│          correctCount: sessionData.correctCount,                    │
│          wrongCount: sessionData.wrongCount,                        │
│          duration: duration,                                        │
│          accuracy: percentage                                       │
│      }                                                              │
│      onGameEnd(result) // ← Callback al componente padre           │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 📋 Responsabilidades por Capa

### 1. **React (UniversalGameCanvas)**
**Responsabilidad:** Orquestación del flujo completo

✅ **Lo que hace:**
- Convierte tipos de juego (UI → DB)
- Carga contenido filtrado desde la API
- Valida el contenido recibido
- Inicializa GameSessionManager
- Crea instancia de Phaser
- Pasa datos a la escena de Phaser
- Escucha evento `gameOver`
- Procesa resultados finales

❌ **Lo que NO hace:**
- No inventa contenido
- No filtra contenido (eso lo hace la API)
- No calcula puntajes (eso lo hace Phaser)
- No guarda sesiones directamente (usa GameSessionManager)

### 2. **API (Next.js Routes)**
**Responsabilidad:** Entregar dataset correcto

✅ **Lo que hace:**
- Filtra contenido por `topic_id` + `target_game_type_id`
- Valida parámetros de entrada
- Retorna solo contenido del juego solicitado
- Crea/actualiza registros de sesión

❌ **Lo que NO hace:**
- No mezcla contenido de diferentes juegos
- No inventa contenido
- No calcula puntajes (eso lo hace el cliente)

### 3. **GameLoader**
**Responsabilidad:** Interfaz con la API

✅ **Lo que hace:**
- Construye URLs con filtros correctos
- Valida respuestas de la API
- Valida estructura del contenido
- Detecta contenido incorrecto
- Aleatoriza contenido
- Logs de debugging

❌ **Lo que NO hace:**
- No inventa contenido
- No filtra contenido (solo valida)
- No guarda sesiones

### 4. **Phaser Scene (WordCatcherScene, etc.)**
**Responsabilidad:** Ejecutar el juego

✅ **Lo que hace:**
- Recibe contenido desde React
- Usa SOLO el contenido recibido
- Actualiza sessionManager en cada acción
- Emite evento `gameOver` al finalizar
- Renderiza UI del juego

❌ **Lo que NO hace:**
- No carga contenido desde la API directamente
- No inventa contenido
- No guarda sesiones directamente (usa sessionManager)

### 5. **GameSessionManager**
**Responsabilidad:** Tracking de sesión

✅ **Lo que hace:**
- Crea sesión en BD al inicio
- Trackea score, correctos, incorrectos
- Calcula duración
- Calcula accuracy
- Actualiza sesión en BD al finalizar

❌ **Lo que NO hace:**
- No carga contenido
- No ejecuta lógica del juego
- No renderiza UI

## 🔍 Puntos Críticos Verificados

### ✅ 1. Phaser NO inventa contenido
```typescript
// WordCatcherScene.ts
init(data: { words: GameContent[]; sessionManager: GameSessionManager }) {
    this.words = data.words || [];  // ← Recibe desde React
    // NO hace fetch() aquí
}

private spawnWord() {
    const wordData = this.words[this.wordIndex % this.words.length];
    // ← Usa SOLO lo que recibió
}
```

### ✅ 2. API filtra correctamente
```typescript
// app/api/games/content/route.ts
let query = supabase
    .from('game_content')
    .select('*')
    .eq('topic_id', topicId);

if (targetGameTypeId) {
    query = query.eq('target_game_type_id', targetGameTypeId);
    // ← FILTRO CRÍTICO
}
```

### ✅ 3. React orquesta todo
```typescript
// UniversalGameCanvas.tsx
const gameContent = await GameLoader.loadGameContent(topicId, dbGameTypeId);
const sessionManager = new GameSessionManager(studentId, topicId, gameTypeId);
await sessionManager.startSession();

game.scene.start(sceneKey, {
    words: shuffledWords,        // ← Pasa contenido filtrado
    sessionManager: sessionManager // ← Pasa manager de sesión
});
```

### ✅ 4. GameSessionManager guarda resultados
```typescript
// GameSessionManager.ts
async endSession(additionalDetails?: any): Promise<void> {
    const response = await fetch(`/api/games/sessions/${this.sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({
            score: this.sessionData.score,
            completed: true,
            correct_count: this.sessionData.correctCount,
            wrong_count: this.sessionData.wrongCount,
            // ← Guarda en tabla game_sessions
        })
    });
}
```

## 📊 Ejemplo de Flujo Completo: Word Catcher

### Paso 1: Usuario inicia juego
```typescript
<UniversalGameCanvas
    gameType="word-catcher"
    topicId="animals_123"
    gameTypeId="word_catcher"
    studentId="student_456"
/>
```

### Paso 2: React carga contenido
```
[UniversalGameCanvas] Loading content for game: word-catcher (DB: word_catcher)
[GameLoader] Loading content for topic: animals_123, game: word_catcher
```

### Paso 3: API responde
```
GET /api/games/content?topicId=animals_123&targetGameTypeId=word_catcher

Response:
[
  { content_text: "cat", is_correct: true, target_game_type_id: "word_catcher" },
  { content_text: "dog", is_correct: true, target_game_type_id: "word_catcher" },
  { content_text: "xyz", is_correct: false, target_game_type_id: "word_catcher" }
]
```

### Paso 4: Validación
```
[GameLoader] Loaded 3 items for word_catcher
[GameLoader] Validation successful: 2 correct, 1 incorrect items.
```

### Paso 5: Sesión iniciada
```
POST /api/games/sessions
{
  student_id: "student_456",
  topic_id: "animals_123",
  game_type_id: "word_catcher",
  score: 0,
  completed: false
}

Response: { session_id: "session_789" }
```

### Paso 6: Phaser inicia
```
[UniversalGameCanvas] 🚀 Game Engine Ready. Starting scene: WordCatcherScene
[UniversalGameCanvas] Calling game.scene.start(WordCatcherScene)
```

### Paso 7: Juego en ejecución
```typescript
// Usuario hace click en "cat" (correcto)
handleCorrectCatch(sprite) {
    this.score += 10;
    this.sessionManager?.updateScore(10, true);
    // sessionData.correctCount = 1
}

// Usuario hace click en "xyz" (incorrecto)
handleWrongCatch(sprite) {
    this.score += -5;
    this.sessionManager?.updateScore(-5, false);
    // sessionData.wrongCount = 1
}
```

### Paso 8: Juego termina
```typescript
async endGame() {
    await this.sessionManager.endSession({
        wordsShown: 3,
        finalTime: 45
    });
    
    this.events.emit('gameOver', {
        score: 5,
        sessionData: { correctCount: 1, wrongCount: 1 }
    });
}
```

### Paso 9: Sesión guardada
```
PUT /api/games/sessions/session_789
{
  score: 5,
  completed: true,
  duration_seconds: 45,
  correct_count: 1,
  wrong_count: 1,
  details: {
    wordsShown: 3,
    finalTime: 45,
    accuracy: 50
  }
}
```

### Paso 10: React recibe resultado
```typescript
handleGameOver(data) {
    const result = {
        score: 5,
        correctCount: 1,
        wrongCount: 1,
        duration: 45,
        accuracy: 50
    };
    onGameEnd(result); // ← Callback al padre
}
```

## 🎯 Principios de Arquitectura

### 1. **Separación de Responsabilidades**
- React = Orquestación
- API = Datos
- Phaser = Ejecución
- GameSessionManager = Persistencia

### 2. **Flujo Unidireccional**
```
React → API → React → Phaser → GameSessionManager → API → React
```

### 3. **Single Source of Truth**
- Contenido viene SOLO de la API
- Sesión se guarda SOLO en BD
- Estado del juego vive SOLO en Phaser

### 4. **No Duplicación de Lógica**
- Filtrado: API
- Validación: GameLoader
- Ejecución: Phaser
- Persistencia: GameSessionManager

## ✅ Checklist de Verificación

- [x] Phaser recibe contenido desde React (no carga directamente)
- [x] API filtra por `target_game_type_id`
- [x] GameLoader valida contenido recibido
- [x] GameSessionManager crea sesión al inicio
- [x] Phaser actualiza sessionManager durante el juego
- [x] Phaser emite `gameOver` al finalizar
- [x] GameSessionManager guarda resultados en BD
- [x] React recibe resultado y lo procesa
- [x] No hay inventado de contenido en ninguna capa
- [x] Logs de debugging en toda la cadena

## 🚀 Resultado Final

**Arquitectura limpia y bien separada:**

1. ✅ React orquesta el flujo completo
2. ✅ API entrega dataset correcto (filtrado por juego)
3. ✅ Phaser ejecuta con el contenido recibido (no inventa nada)
4. ✅ GameSessionManager guarda resultados en `game_sessions`

**Cada capa hace lo que le corresponde, sin duplicación ni confusión.**

---

**Estado:** ✅ Completado y Verificado  
**Fecha:** 2026-01-05
