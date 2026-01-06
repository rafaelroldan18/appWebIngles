# Paso 4: API Routes y Consumo de Contenido por Juego

## 🎯 Objetivo

Garantizar que **ningún juego vuelva a pedir "todo el contenido del tema"**, sino que cada juego consuma únicamente el contenido que le corresponde pedagógicamente mediante el filtro `target_game_type_id`.

## ✅ Cambios Implementados

### 1. GameLoader Actualizado

**Archivo:** `src/lib/games/GameLoader.ts`

#### Antes:
```typescript
const response = await fetch(
    `/api/games/content?topicId=${topicId}`
);
```

#### Ahora:
```typescript
const response = await fetch(
    `/api/games/content?topicId=${topicId}&targetGameTypeId=${gameTypeId}`
);
```

**Beneficios:**
- ✅ Cada juego solo recibe su contenido específico
- ✅ Word Catcher nunca recibirá oraciones
- ✅ Grammar Run nunca recibirá palabras sueltas
- ✅ Validación automática de contenido correcto
- ✅ Logs detallados para debugging

### 2. Tipo GameContent Actualizado

**Archivo:** `src/types/game.types.ts`

```typescript
export interface GameContent {
    content_id: string;
    topic_id: string;
    target_game_type_id?: string; // ← NUEVO: ID del juego específico
    content_type: 'word' | 'sentence' | 'location' | 'image-word-pair' | 'option' | 'image';
    content_text: string;
    is_correct: boolean;
    image_url?: string | null;
    metadata?: any;
    created_at: string;
}
```

### 3. Mapeo de Tipos de Juego

**Archivo:** `src/lib/game-type-mapping.ts`

Creamos utilidades para mapear entre:
- **UI (kebab-case):** `'word-catcher'`, `'grammar-run'`, etc.
- **DB (snake_case):** `'word_catcher'`, `'grammar_run'`, etc.

```typescript
// Ejemplo de uso:
const dbGameTypeId = uiGameTypeToDb('word-catcher'); 
// → 'word_catcher'
```

**Por qué es necesario:**
- La UI usa kebab-case por convención de URLs y componentes React
- La base de datos usa snake_case por convención SQL
- El mapeo garantiza consistencia entre capas

### 4. UniversalGameCanvas Actualizado

**Archivo:** `src/components/features/gamification/UniversalGameCanvas.tsx`

```typescript
// Convertir gameType de UI a DB antes de cargar contenido
const dbGameTypeId = uiGameTypeToDb(gameType);
console.log(`Loading content for game: ${gameType} (DB: ${dbGameTypeId})`);

// Cargar contenido FILTRADO por juego específico
const gameContent = await GameLoader.loadGameContent(topicId, dbGameTypeId);
```

## 🔄 Flujo Completo de Carga de Contenido

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario selecciona juego "Word Catcher"                 │
│    gameType = 'word-catcher'                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. UniversalGameCanvas convierte tipo                       │
│    dbGameTypeId = uiGameTypeToDb('word-catcher')            │
│    → 'word_catcher'                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GameLoader hace request a API                            │
│    GET /api/games/content?topicId=X&targetGameTypeId=word_catcher │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. API filtra en Supabase                                   │
│    SELECT * FROM game_content                               │
│    WHERE topic_id = X                                       │
│    AND target_game_type_id = 'word_catcher'                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. GameLoader valida contenido recibido                     │
│    - Verifica que todos los items sean del juego correcto   │
│    - Valida que haya palabras correctas e incorrectas       │
│    - Logs de cantidad de items cargados                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Phaser Scene recibe SOLO palabras                        │
│    WordCatcherScene.init({ words: [...] })                  │
│    ✅ Solo palabras, nunca oraciones                        │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Ejemplos de Queries Generadas

### Word Catcher
```
GET /api/games/content?topicId=animals_123&targetGameTypeId=word_catcher

Resultado:
[
  { content_text: "cat", content_type: "word", target_game_type_id: "word_catcher" },
  { content_text: "dog", content_type: "word", target_game_type_id: "word_catcher" },
  { content_text: "bird", content_type: "word", target_game_type_id: "word_catcher" }
]
```

### Grammar Run
```
GET /api/games/content?topicId=animals_123&targetGameTypeId=grammar_run

Resultado:
[
  { 
    content_text: "The cat ___ on the mat", 
    content_type: "sentence", 
    target_game_type_id: "grammar_run",
    metadata: {
      correct_option: "sits",
      wrong_options: ["sit", "sitting"]
    }
  }
]
```

### Image Match
```
GET /api/games/content?topicId=animals_123&targetGameTypeId=image_match

Resultado:
[
  { 
    content_text: "elephant", 
    content_type: "image-word-pair", 
    target_game_type_id: "image_match",
    image_url: "https://..."
  }
]
```

## 🛡️ Validaciones Implementadas

### En GameLoader:
1. ✅ Verifica que la respuesta sea exitosa
2. ✅ Valida que haya al menos un item correcto
3. ✅ Detecta si hay items del juego incorrecto
4. ✅ Logs detallados de cantidad de items

### En la API:
1. ✅ Valida que `topicId` esté presente
2. ✅ Filtra por `target_game_type_id` si se proporciona
3. ✅ Retorna solo contenido del juego solicitado

## 🎮 Impacto en Cada Juego

| Juego | Antes | Ahora |
|-------|-------|-------|
| **Word Catcher** | Recibía palabras + oraciones + ubicaciones | ✅ Solo palabras |
| **Grammar Run** | Recibía todo mezclado | ✅ Solo oraciones con opciones |
| **Sentence Builder** | Recibía todo mezclado | ✅ Solo oraciones para construir |
| **Image Match** | Recibía contenido sin imágenes | ✅ Solo pares imagen-palabra |
| **City Explorer** | Recibía contenido sin contexto | ✅ Solo ubicaciones con diálogos |

## 🔍 Debugging y Logs

Ahora puedes ver en la consola del navegador:

```
[GameLoader] Loading content for topic: animals_123, game: word_catcher
[GameLoader] Loaded 15 items for word_catcher
[GameLoader] Validation successful: 10 correct, 5 incorrect items.
[UniversalGameCanvas] Loading content for game: word-catcher (DB: word_catcher)
```

Si hay un problema:
```
[GameLoader] WARNING: Received 3 items for wrong game type!
```

## ✅ Checklist de Verificación

- [x] API filtra por `target_game_type_id`
- [x] GameLoader usa el filtro en todas las llamadas
- [x] Tipo `GameContent` incluye `target_game_type_id`
- [x] Mapeo entre UI y DB implementado
- [x] UniversalGameCanvas usa el mapeo correcto
- [x] Validaciones de contenido implementadas
- [x] Logs de debugging agregados

## 🚀 Próximos Pasos

1. **Migración de datos existentes** (si hay contenido antiguo sin `target_game_type_id`)
2. **Actualizar otros componentes** que puedan estar cargando contenido
3. **Crear tests** para validar el filtrado
4. **Dashboard de contenido** para ver distribución por juego

## 📝 Notas Técnicas

- El filtro es **opcional** en la API (para mantener compatibilidad)
- Si no se proporciona `targetGameTypeId`, retorna todo el contenido del tema
- Los juegos **siempre** deben proporcionar el `gameTypeId` para evitar mezclas
- El mapeo UI↔DB es **bidireccional** para flexibilidad

## 🎓 Ejemplo de Uso Completo

```typescript
// En un componente React:
<UniversalGameCanvas
  gameType="word-catcher"  // UI type (kebab-case)
  topicId="animals_123"
  gameTypeId="word_catcher" // DB type (snake_case) - DEPRECATED, ahora se mapea automáticamente
  studentId="student_456"
/>

// Internamente:
// 1. Convierte 'word-catcher' → 'word_catcher'
// 2. Llama a API: /api/games/content?topicId=animals_123&targetGameTypeId=word_catcher
// 3. Recibe solo palabras
// 4. Pasa a WordCatcherScene
```

---

**Resultado Final:** Arquitectura "Contenido por Juego" completamente implementada. Cada juego consume únicamente el contenido que le corresponde pedagógicamente, eliminando confusiones y garantizando coherencia en la experiencia de aprendizaje. 🎉
