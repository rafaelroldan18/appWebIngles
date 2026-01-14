# ✅ GrammarRun - Paso 2 COMPLETADO

## 📋 Resumen del Paso 2: Estructura de game_content

Se ha completado exitosamente la definición de cómo se guarda el contenido en `game_content` para **GrammarRun**, sin inventos raros.

---

## 🎯 Lo que se implementó

### 1. **Estructura de Datos Clara**

✅ **`content_type = 'sentence'`** para las preguntas
✅ **`content_type = 'option'`** para las opciones
✅ **Relación mediante `metadata.parent_sentence_id`**
✅ **Sin inventos raros**: Solo sentence + option, nada más

### 2. **Tipos TypeScript Completos**

✅ `GrammarQuestion` - Representa una pregunta con sus opciones
✅ `GrammarOption` - Representa una opción individual
✅ `GrammarSentenceMetadata` - Metadata para sentences
✅ `GrammarOptionMetadata` - Metadata para options
✅ Actualización de `MissionConfig` con campos de GrammarRun

### 3. **Loader Robusto**

✅ `loadGrammarRunContent()` - Carga y arma las preguntas desde game_content
✅ `validateGrammarRunContent()` - Valida que el contenido sea correcto
✅ **Validaciones exhaustivas**:
  - Al menos 2 opciones por pregunta
  - Exactamente 1 opción correcta por pregunta
  - Metadata válida en sentences y options
  - Coincidencia entre `metadata.correct_option` y la opción marcada como correcta

### 4. **Documentación Completa**

✅ `GRAMMAR_RUN_CONTENT_STRUCTURE.md` - Documentación detallada
✅ Ejemplos SQL para insertar datos
✅ Explicación del flujo del loader

---

## 📊 Estructura de Datos

### Pregunta (Sentence)

```typescript
{
  content_id: "uuid-sentence-1",
  topic_id: "uuid-topic",
  content_type: "sentence",
  content_text: "She ____ to school yesterday.",
  is_correct: null, // No aplica para sentences
  metadata: {
    "item_kind": "grammar_question",
    "correct_option": "went",
    "rule_tag": "past_simple_irregular",
    "explanation": "Past simple of 'go' is 'went'.",
    "level": "medio",
    "order": 1
  }
}
```

### Opciones (Options)

```typescript
// Opción CORRECTA
{
  content_id: "uuid-option-1",
  topic_id: "uuid-topic",
  content_type: "option",
  content_text: "went",
  is_correct: true, // ✅ CORRECTA
  metadata: {
    "parent_sentence_id": "uuid-sentence-1",
    "order": 1
  }
}

// Opción INCORRECTA
{
  content_id: "uuid-option-2",
  topic_id: "uuid-topic",
  content_type: "option",
  content_text: "go",
  is_correct: false, // ❌ INCORRECTA
  metadata: {
    "parent_sentence_id": "uuid-sentence-1",
    "order": 2
  }
}
```

---

## 🔧 Cómo Funciona el Loader

1. **Filtra** todas las filas con `content_type = 'sentence'`
2. Para cada `sentence`, **busca** sus opciones usando `metadata.parent_sentence_id`
3. **Valida** que:
   - Haya al menos 2 opciones
   - Haya exactamente 1 opción correcta
   - La opción correcta coincida con `metadata.correct_option`
4. **Arma** un objeto `GrammarQuestion` con la pregunta y sus opciones
5. **Ordena** las preguntas y opciones por `metadata.order` si existe
6. **Retorna** un array de `GrammarQuestion[]` listo para el juego

---

## 📝 Ejemplo SQL Completo

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

## ✅ Validaciones Implementadas

### En el Loader:

1. ✅ **Sentences válidas**: Deben tener `metadata.item_kind = "grammar_question"`
2. ✅ **Correct option**: Debe existir `metadata.correct_option`
3. ✅ **Mínimo 2 opciones**: Cada pregunta debe tener al menos 2 opciones
4. ✅ **Exactamente 1 correcta**: Solo una opción puede ser correcta
5. ✅ **Coincidencia**: `metadata.correct_option` debe coincidir con la opción marcada como correcta
6. ✅ **Parent ID válido**: Todas las opciones deben tener `metadata.parent_sentence_id`

### En la Validación:

```typescript
validateGrammarRunContent(content: GameContent[]): { valid: boolean; error?: string }
```

- ✅ Verifica que haya al menos 1 sentence
- ✅ Verifica que haya al menos 1 option
- ✅ Verifica que cada sentence tenga al menos 2 opciones
- ✅ Verifica que cada sentence tenga al menos 1 opción correcta

---

## 📁 Archivos Modificados/Creados

1. ✅ `src/types/game.types.ts` - Tipos TypeScript
   - `GrammarQuestion`
   - `GrammarOption`
   - `GrammarSentenceMetadata`
   - `GrammarOptionMetadata`
   - Actualización de `MissionConfig`

2. ✅ `src/lib/games/gameLoader.utils.ts` - Loader
   - `loadGrammarRunContent()`
   - `validateGrammarRunContent()`

3. ✅ `docs/GRAMMAR_RUN_CONTENT_STRUCTURE.md` - Documentación

4. ✅ `docs/GRAMMAR_RUN_PASO_2_COMPLETADO.md` - Este archivo

---

## ✅ Build Exitoso

```
✓ Compiled successfully in 20.9s
✓ Finished TypeScript in 19.3s
✓ Collecting page data using 7 workers in 2.0s
✓ Generating static pages using 7 workers (50/50) in 2.4s
✓ Finalizing page optimization in 24.6ms
```

---

## 🚀 Próximos Pasos

- ✅ **Paso 1**: mission_config definido (COMPLETADO)
- ✅ **Paso 2**: Estructura de game_content definida (COMPLETADO)
- ⏳ **Paso 3**: Actualizar GrammarRunScene para usar el loader
- ⏳ **Paso 4**: Implementar sistema de details estándar
- ⏳ **Paso 5**: Testing completo con datos reales
- ⏳ **Paso 6**: Documentación de uso para docentes

---

## 💡 Notas Importantes

1. **Sin inventos raros**: Solo usamos `sentence` y `option`, nada más. Simple y claro.

2. **Relación clara**: `metadata.parent_sentence_id` conecta las opciones con su pregunta.

3. **Validación robusta**: El loader valida exhaustivamente que todo esté correcto antes de cargar.

4. **Flexible**: Puedes tener 2, 3, 4 o más opciones por pregunta.

5. **Ordenable**: Usa `metadata.order` si quieres controlar el orden de las preguntas y opciones.

6. **Metadata opcional**: `explanation`, `rule_tag`, `level` son opcionales pero recomendados.

7. **Consistencia**: Sigue el mismo patrón que ImageMatch para facilitar el mantenimiento.

---

## 🎮 Flujo en el Juego

1. **API**: Trae todas las filas de `game_content` para el topic
2. **Loader**: `loadGrammarRunContent()` arma las preguntas
3. **Validación**: `validateGrammarRunContent()` verifica que todo esté bien
4. **Scene**: `GrammarRunScene` recibe el array de `GrammarQuestion[]`
5. **Aleatorización**: Si `randomize_items = true`, se mezclan las preguntas
6. **Límite**: Se toman solo `items_limit` preguntas
7. **Spawn**: Cada pregunta aparece como puertas en el juego
8. **Validación**: El jugador selecciona una opción y se valida contra `is_correct`

---

**Fecha de Completación**: 2026-01-12
**Estado**: ✅ COMPLETADO Y VERIFICADO
