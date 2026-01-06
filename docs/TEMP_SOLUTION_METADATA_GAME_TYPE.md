# Solución Correcta: Mapeo UUID de game_types

## 🎯 Problema Original

Error al crear contenido:
```
Error: invalid input syntax for type uuid: "word_catcher"
```

## 📊 Estructura de la Base de Datos

### Tabla `game_types`
```sql
CREATE TABLE public.game_types (
  game_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,  -- 'word_catcher', 'grammar_run', etc.
  description text NOT NULL
);
```

### Tabla `game_content`
```sql
CREATE TABLE public.game_content (
  content_id uuid PRIMARY KEY,
  topic_id uuid NOT NULL,
  target_game_type_id uuid,  -- FK a game_types.game_type_id
  content_type text NOT NULL,
  content_text text NOT NULL,
  ...
  CONSTRAINT game_content_target_game_type_id_fkey 
    FOREIGN KEY (target_game_type_id) 
    REFERENCES public.game_types(game_type_id)
);
```

## ✅ Solución Implementada

### 1. Poblar `game_types` (Una sola vez)

**Endpoint:** `POST /api/games/types/seed`

Crea los 5 tipos de juegos en la BD:

```javascript
// Llamar una vez para inicializar:
fetch('/api/games/types/seed', { method: 'POST' })
```

Esto crea:
```
| game_type_id (UUID)              | name              | description                    |
|----------------------------------|-------------------|--------------------------------|
| uuid-1                           | word_catcher      | Catch falling words...         |
| uuid-2                           | grammar_run       | Run and choose correct...      |
| uuid-3                           | sentence_builder  | Build sentences by...          |
| uuid-4                           | image_match       | Match images with...           |
| uuid-5                           | city_explorer     | Explore the city and...        |
```

### 2. Crear Contenido (POST)

**Flujo:**
1. Cliente envía `target_game_type_id: 'word_catcher'` (string)
2. API busca el UUID en `game_types` por nombre
3. API inserta con el UUID encontrado

```typescript
// Cliente envía:
{
    topic_id: "uuid-topic",
    target_game_type_id: "word_catcher",  // ← String
    content_type: "word",
    content_text: "cat"
}

// API hace lookup:
const { data: gameType } = await supabase
    .from('game_types')
    .select('game_type_id')
    .eq('name', 'word_catcher')  // ← Busca por nombre
    .single();

// API inserta:
{
    topic_id: "uuid-topic",
    target_game_type_id: "uuid-1",  // ← UUID del game_type
    content_type: "word",
    content_text: "cat"
}
```

### 3. Leer Contenido (GET)

**Flujo:**
1. Cliente pide `targetGameTypeId: 'word_catcher'` (string)
2. API busca el UUID del game_type
3. API filtra por UUID en la query
4. API hace join con `game_types` para obtener el nombre
5. API retorna con `target_game_type_id` como string (nombre)

```typescript
// Cliente pide:
GET /api/games/content?topicId=X&targetGameTypeId=word_catcher

// API busca UUID:
const { data: gameType } = await supabase
    .from('game_types')
    .select('game_type_id')
    .eq('name', 'word_catcher')
    .single();

// API filtra y hace join:
const { data } = await supabase
    .from('game_content')
    .select(`
        *,
        game_types!target_game_type_id (name)
    `)
    .eq('topic_id', topicId)
    .eq('target_game_type_id', gameType.game_type_id);  // ← Filtra por UUID

// API transforma respuesta:
const enrichedData = data.map(item => ({
    ...item,
    target_game_type_id: item.game_types?.name,  // ← Convierte UUID a nombre
    game_types: undefined
}));

// Cliente recibe:
[
    {
        content_id: "uuid-123",
        topic_id: "uuid-topic",
        target_game_type_id: "word_catcher",  // ← String (nombre)
        content_type: "word",
        content_text: "cat"
    }
]
```

### 4. Actualizar Contenido (PUT)

Similar al POST, busca el UUID antes de actualizar:

```typescript
// Cliente envía:
{
    target_game_type_id: "grammar_run"  // ← String
}

// API busca UUID y actualiza:
const { data: gameType } = await supabase
    .from('game_types')
    .select('game_type_id')
    .eq('name', 'grammar_run')
    .single();

updates.target_game_type_id = gameType.game_type_id;  // ← UUID
```

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INICIALIZACIÓN (Una sola vez)                           │
│    POST /api/games/types/seed                               │
│    → Crea los 5 game_types en BD                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CREAR CONTENIDO                                          │
│                                                             │
│    Cliente → API                                            │
│    { target_game_type_id: "word_catcher" }                  │
│                                                             │
│    API busca UUID:                                          │
│    SELECT game_type_id FROM game_types                      │
│    WHERE name = 'word_catcher'                              │
│    → uuid-1                                                 │
│                                                             │
│    API inserta:                                             │
│    INSERT INTO game_content                                 │
│    (target_game_type_id, ...)                               │
│    VALUES (uuid-1, ...)                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LEER CONTENIDO                                           │
│                                                             │
│    Cliente → API                                            │
│    GET ?targetGameTypeId=word_catcher                       │
│                                                             │
│    API busca UUID:                                          │
│    SELECT game_type_id FROM game_types                      │
│    WHERE name = 'word_catcher'                              │
│    → uuid-1                                                 │
│                                                             │
│    API filtra con join:                                     │
│    SELECT gc.*, gt.name                                     │
│    FROM game_content gc                                     │
│    JOIN game_types gt ON gc.target_game_type_id = gt.id    │
│    WHERE gc.target_game_type_id = uuid-1                    │
│                                                             │
│    API transforma:                                          │
│    target_game_type_id: uuid-1 → "word_catcher"             │
│                                                             │
│    Cliente recibe:                                          │
│    { target_game_type_id: "word_catcher" }                  │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Archivos Modificados

1. **`app/api/games/content/create/route.ts`**
   - Busca UUID por nombre antes de insertar

2. **`app/api/games/content/route.ts`**
   - Busca UUID por nombre para filtrar
   - Hace join con `game_types`
   - Transforma UUID a nombre en respuesta

3. **`app/api/games/content/[contentId]/route.ts`**
   - Busca UUID por nombre antes de actualizar

4. **`app/api/games/types/seed/route.ts`** (NUEVO)
   - Endpoint para poblar `game_types`

## 🚀 Pasos para Usar

### 1. Inicializar game_types (Una sola vez)

```bash
# Opción A: Desde el navegador
fetch('/api/games/types/seed', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)

# Opción B: Desde curl
curl -X POST http://localhost:3000/api/games/types/seed
```

### 2. Crear contenido normalmente

```typescript
// El código del cliente NO cambia
await fetch('/api/games/content/create', {
    method: 'POST',
    body: JSON.stringify({
        topic_id: topicId,
        target_game_type_id: 'word_catcher',  // ← String como siempre
        content_type: 'word',
        content_text: 'cat'
    })
});
```

### 3. Leer contenido normalmente

```typescript
// El código del cliente NO cambia
const content = await GameLoader.loadGameContent(topicId, 'word_catcher');
// content[0].target_game_type_id === 'word_catcher' ✅
```

## ✅ Ventajas de esta Solución

1. **Integridad Referencial** - FK garantiza que solo existan game_types válidos
2. **Performance** - Filtrado en SQL (no en cliente)
3. **Índices** - Se pueden crear índices en la columna UUID
4. **Normalización** - Datos de game_types centralizados
5. **Compatibilidad** - El cliente sigue usando strings

## 🎯 Resultado Final

- ✅ La BD usa UUIDs con FK (integridad referencial)
- ✅ El cliente usa strings (fácil de usar)
- ✅ La API hace la conversión automáticamente
- ✅ Filtrado eficiente en SQL
- ✅ Sin cambios en el código del cliente

---

**Estado:** ✅ Implementado y Funcionando  
**Fecha:** 2026-01-05  
**Requiere:** Ejecutar `/api/games/types/seed` una vez
