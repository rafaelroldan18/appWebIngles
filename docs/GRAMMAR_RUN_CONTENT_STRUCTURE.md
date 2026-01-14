# GrammarRun - Estructura de game_content

## 📋 Paso 2: Cómo se guarda el contenido en game_content

GrammarRun usa una estructura simple y clara en `game_content`:

- **`content_type = 'sentence'`** para la pregunta
- **`content_type = 'option'`** para las opciones
- La relación se hace con **`metadata.parent_sentence_id`**

---

## 🎯 Estructura de Datos

### 2.1 Pregunta (fila `sentence`)

Cada pregunta es una fila con `content_type = 'sentence'`:

```typescript
{
  content_id: "uuid-sentence-1",
  topic_id: "uuid-topic",
  content_type: "sentence",
  content_text: "She ____ to school yesterday.",
  is_correct: null, // No aplica para sentences
  support_image_url: null, // Opcional
  metadata: {
    "item_kind": "grammar_question",
    "correct_option": "went",
    "rule_tag": "past_simple_irregular",
    "explanation": "Past simple of 'go' is 'went'.",
    "level": "medio",
    "order": 1
  },
  created_at: "2026-01-12T..."
}
```

#### Campos de metadata para `sentence`:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `item_kind` | string | ✅ | Siempre `"grammar_question"` |
| `correct_option` | string | ✅ | Texto de la opción correcta |
| `rule_tag` | string | ❌ | Tag de la regla gramatical (ej: "past_simple_irregular") |
| `explanation` | string | ❌ | Explicación de por qué es correcta |
| `level` | string | ❌ | Nivel de dificultad ("fácil", "medio", "difícil") |
| `order` | number | ❌ | Orden de aparición (si no se aleatoriza) |

---

### 2.2 Opciones (varias filas `option`)

Por cada opción se crea una fila con `content_type = 'option'`:

#### Opción CORRECTA:

```typescript
{
  content_id: "uuid-option-1",
  topic_id: "uuid-topic",
  content_type: "option",
  content_text: "went",
  is_correct: true, // ✅ CORRECTA
  support_image_url: null,
  metadata: {
    "parent_sentence_id": "uuid-sentence-1",
    "order": 1
  },
  created_at: "2026-01-12T..."
}
```

#### Opciones INCORRECTAS:

```typescript
{
  content_id: "uuid-option-2",
  topic_id: "uuid-topic",
  content_type: "option",
  content_text: "go",
  is_correct: false, // ❌ INCORRECTA
  support_image_url: null,
  metadata: {
    "parent_sentence_id": "uuid-sentence-1",
    "order": 2
  },
  created_at: "2026-01-12T..."
}
```

```typescript
{
  content_id: "uuid-option-3",
  topic_id: "uuid-topic",
  content_type: "option",
  content_text: "goed",
  is_correct: false, // ❌ INCORRECTA
  support_image_url: null,
  metadata: {
    "parent_sentence_id": "uuid-sentence-1",
    "order": 3
  },
  created_at: "2026-01-12T..."
}
```

#### Campos de metadata para `option`:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `parent_sentence_id` | string (UUID) | ✅ | ID de la sentence a la que pertenece |
| `order` | number | ❌ | Orden de la opción (1, 2, 3...) |

---

## 📊 Ejemplo Completo: Una Pregunta con 3 Opciones

### Pregunta (1 fila):

```sql
INSERT INTO game_content (
  content_id,
  topic_id,
  content_type,
  content_text,
  is_correct,
  metadata
) VALUES (
  'a1b2c3d4-sentence-1',
  'topic-uuid',
  'sentence',
  'She ____ to school yesterday.',
  NULL,
  '{
    "item_kind": "grammar_question",
    "correct_option": "went",
    "rule_tag": "past_simple_irregular",
    "explanation": "Past simple of ''go'' is ''went''.",
    "level": "medio",
    "order": 1
  }'::jsonb
);
```

### Opciones (3 filas):

```sql
-- Opción CORRECTA
INSERT INTO game_content (
  content_id,
  topic_id,
  content_type,
  content_text,
  is_correct,
  metadata
) VALUES (
  'a1b2c3d4-option-1',
  'topic-uuid',
  'option',
  'went',
  TRUE,
  '{
    "parent_sentence_id": "a1b2c3d4-sentence-1",
    "order": 1
  }'::jsonb
);

-- Opción INCORRECTA 1
INSERT INTO game_content (
  content_id,
  topic_id,
  content_type,
  content_text,
  is_correct,
  metadata
) VALUES (
  'a1b2c3d4-option-2',
  'topic-uuid',
  'option',
  'go',
  FALSE,
  '{
    "parent_sentence_id": "a1b2c3d4-sentence-1",
    "order": 2
  }'::jsonb
);

-- Opción INCORRECTA 2
INSERT INTO game_content (
  content_id,
  topic_id,
  content_type,
  content_text,
  is_correct,
  metadata
) VALUES (
  'a1b2c3d4-option-3',
  'topic-uuid',
  'option',
  'goed',
  FALSE,
  '{
    "parent_sentence_id": "a1b2c3d4-sentence-1",
    "order": 3
  }'::jsonb
);
```

---

## 🔧 Cómo el Loader Arma las Preguntas

El loader (`loadGrammarRunContent()`) hace lo siguiente:

1. **Filtra** todas las filas con `content_type = 'sentence'`
2. Para cada `sentence`, **busca** sus opciones usando `metadata.parent_sentence_id`
3. **Arma** un objeto `GrammarQuestion` con la pregunta y sus opciones
4. **Retorna** un array de `GrammarQuestion[]` listo para el juego

### Tipo de Datos en el Loader:

```typescript
interface GrammarQuestion {
  questionId: string;           // content_id de la sentence
  questionText: string;         // content_text de la sentence
  correctOption: string;        // metadata.correct_option
  options: GrammarOption[];     // Array de opciones
  explanation?: string;         // metadata.explanation
  ruleTag?: string;            // metadata.rule_tag
  level?: string;              // metadata.level
}

interface GrammarOption {
  optionId: string;            // content_id de la option
  optionText: string;          // content_text de la option
  isCorrect: boolean;          // is_correct de la option
  order?: number;              // metadata.order
}
```

---

## ✅ Validaciones Importantes

### En la Sentence:
- ✅ `content_type` debe ser `"sentence"`
- ✅ `content_text` no debe estar vacío
- ✅ `metadata.item_kind` debe ser `"grammar_question"`
- ✅ `metadata.correct_option` debe existir

### En las Options:
- ✅ `content_type` debe ser `"option"`
- ✅ `content_text` no debe estar vacío
- ✅ `metadata.parent_sentence_id` debe existir y ser válido
- ✅ Debe haber **al menos 2 opciones** por pregunta
- ✅ Debe haber **exactamente 1 opción correcta** (`is_correct = true`)
- ✅ La opción correcta debe coincidir con `sentence.metadata.correct_option`

---

## 🎮 Flujo en el Juego

1. **Carga**: El loader arma las preguntas desde `game_content`
2. **Aleatorización**: Si `randomize_items = true`, se mezclan las preguntas
3. **Límite**: Se toman solo `items_limit` preguntas
4. **Spawn**: Cada pregunta aparece como puertas en el juego
5. **Validación**: El jugador selecciona una opción y se valida contra `is_correct`

---

## 📝 Notas Importantes

1. **Sin inventos raros**: Solo usamos `sentence` y `option`, nada más.
2. **Relación clara**: `parent_sentence_id` conecta las opciones con su pregunta.
3. **Validación robusta**: El loader valida que todo esté correcto antes de cargar.
4. **Flexible**: Puedes tener 2, 3, 4 o más opciones por pregunta.
5. **Ordenable**: Usa `metadata.order` si quieres controlar el orden de las opciones.

---

## 🔗 Archivos Relacionados

- **Tipos**: `src/types/game.types.ts`
- **Loader**: `src/lib/games/gameLoader.utils.ts`
- **Scene**: `src/lib/games/GrammarRunScene.ts`
- **Config**: `src/lib/games/grammarRun.config.ts`

---

**Fecha**: 2026-01-12
**Estado**: ✅ DEFINIDO
