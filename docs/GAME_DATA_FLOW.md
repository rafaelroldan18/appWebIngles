# Flujo de Datos - Botón "Jugar" → Phaser Game

## 🎮 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                     StudentGames.tsx                            │
│                                                                 │
│  1. Usuario ve lista de juegos disponibles                     │
│  2. Cada juego tiene datos de GameAvailability:                │
│     - topic_id                                                  │
│     - game_type_id                                              │
│     - topics (título, descripción)                             │
│     - game_types (nombre del juego)                            │
│                                                                 │
│  3. Usuario hace clic en "Jugar Ahora"                         │
│     ↓                                                           │
│     onClick={() => setSelectedGame(game)}                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                            ↓ selectedGame contiene:
                            ↓ - topic_id
                            ↓ - game_type_id
                            ↓ - topics.title
                            ↓ - game_types.name
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                        GamePlay.tsx                             │
│                                                                 │
│  Recibe props:                                                  │
│  ✓ topicId={selectedGame.topic_id}                            │
│  ✓ gameTypeId={selectedGame.game_type_id}                     │
│  ✓ topicTitle={(selectedGame as any).topics?.title}           │
│  ✓ gameTypeName={(selectedGame as any).game_types?.name}      │
│  ✓ studentId={studentId}                                       │
│                                                                 │
│  Renderiza:                                                     │
│  - Header con título del tema                                  │
│  - PhaserGameCanvas (con dynamic import)                       │
│  - Instrucciones del juego                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                            ↓ Pasa props a PhaserGameCanvas:
                            ↓ - topicId
                            ↓ - gameTypeId
                            ↓ - studentId
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PhaserGameCanvas.tsx                          │
│                                                                 │
│  useEffect(() => {                                              │
│    1. GameLoader.loadGameContent(topicId, gameTypeId)          │
│       ↓                                                         │
│       GET /api/games/content?topicId=X&gameTypeId=Y            │
│       ↓                                                         │
│       Retorna: GameContent[] (palabras correctas/incorrectas)  │
│                                                                 │
│    2. GameSessionManager.startSession(studentId, topicId, ...)  │
│       ↓                                                         │
│       POST /api/games/sessions                                 │
│       ↓                                                         │
│       Retorna: session_id                                      │
│                                                                 │
│    3. Inicializa Phaser Game                                   │
│       ↓                                                         │
│       WordCatcherScene.init({                                  │
│         words: shuffledWords,                                  │
│         sessionManager: sessionManager                         │
│       })                                                        │
│  })                                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                            ↓ Juego cargado con:
                            ↓ - Palabras del tema específico
                            ↓ - Sesión activa rastreando progreso
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   WordCatcherScene.ts                           │
│                                                                 │
│  - Palabras caen desde arriba                                  │
│  - Usuario hace clic en palabras                               │
│  - SessionManager actualiza score/stats                        │
│  - Timer cuenta regresiva                                      │
│                                                                 │
│  Al terminar:                                                   │
│    SessionManager.endSession()                                 │
│    ↓                                                            │
│    PUT /api/games/sessions/{sessionId}                         │
│    ↓                                                            │
│    Backend actualiza student_progress                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Código Específico de la Conexión

### 1. **StudentGames.tsx** - Líneas 143-148

```typescript
<button 
    onClick={() => setSelectedGame(game)}  // ← AQUÍ SE CAPTURA EL JUEGO
    className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all"
>
    Jugar Ahora
</button>
```

### 2. **StudentGames.tsx** - Líneas 54-67

```typescript
// Show game play screen if a game is selected
if (selectedGame) {
    return (
        <GamePlay
            topicId={selectedGame.topic_id}              // ← PASA topicId
            topicTitle={(selectedGame as any).topics?.title || 'Juego'}
            gameTypeId={selectedGame.game_type_id}       // ← PASA gameTypeId
            gameTypeName={(selectedGame as any).game_types?.name || 'Word Catcher'}
            studentId={studentId}
            onBack={() => {
                setSelectedGame(null);
                loadData(); // Reload data to show updated progress
            }}
        />
    );
}
```

### 3. **GamePlay.tsx** - Líneas 158-168

```typescript
{showGame && (
    <PhaserGameCanvas
        topicId={topicId}           // ← RECIBE topicId
        gameTypeId={gameTypeId}     // ← RECIBE gameTypeId
        studentId={studentId}
        onGameEnd={handleGameEnd}
        onError={(error) => {
            console.error('Game error:', error);
            alert('Error al cargar el juego. Por favor, intenta de nuevo.');
            onBack();
        }}
    />
)}
```

### 4. **PhaserGameCanvas.tsx** - Líneas 54-55

```typescript
// Load game content
const gameContent = await GameLoader.loadGameContent(topicId, gameTypeId);
```

## ✅ Verificación de la Implementación

La conexión está **100% completa** y funcional:

1. ✅ Botón "Jugar Ahora" tiene `onClick` handler
2. ✅ `setSelectedGame(game)` guarda el juego seleccionado
3. ✅ `selectedGame` contiene `topic_id` y `game_type_id`
4. ✅ GamePlay recibe ambos IDs como props
5. ✅ PhaserGameCanvas recibe ambos IDs
6. ✅ GameLoader usa los IDs para cargar contenido correcto
7. ✅ SessionManager usa los IDs para crear sesión

## 🎯 Datos que Fluyen

```typescript
GameAvailability {
  availability_id: "uuid",
  topic_id: "uuid",           // ← ESTE SE PASA
  game_type_id: "uuid",       // ← ESTE SE PASA
  parallel_id: "uuid",
  available_from: "timestamp",
  available_until: "timestamp",
  max_attempts: 3,
  topics: {                   // ← Joined data
    title: "Present Simple Verbs",
    description: "..."
  },
  game_types: {               // ← Joined data
    name: "Word Catcher",
    description: "..."
  }
}
```

## 🚀 Para Probar

1. Login como estudiante
2. Ve a "Mis Juegos"
3. Haz clic en "Jugar Ahora"
4. El juego cargará automáticamente con:
   - Las palabras del tema correcto
   - El tipo de juego correcto
   - Una sesión activa rastreando tu progreso

¡Todo está conectado y funcionando! 🎉
