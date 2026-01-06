# Panel del Docente con Pestañas por Juego (Opción A)

## 🎯 Objetivo

Implementar la arquitectura "Contenido por Juego" donde cada juego consume únicamente el tipo de contenido que le corresponde pedagógicamente, evitando confusiones y garantizando coherencia en la experiencia de aprendizaje.

## ✅ Cambios Implementados

### 1. Base de Datos
- ✅ Columna `target_game_type_id` agregada a la tabla `game_content`
- Cada registro ahora se identifica por: **tema + juego + tipo de contenido**

### 2. API Endpoints Actualizados

#### POST `/api/games/content/create`
- ✅ Ahora requiere `target_game_type_id` (obligatorio)
- ✅ Valida que sea uno de: `word_catcher`, `grammar_run`, `sentence_builder`, `image_match`, `city_explorer`
- ✅ Agregado tipo de contenido `option` para opciones múltiples

#### GET `/api/games/content`
- ✅ Filtro opcional por `targetGameTypeId`
- Permite obtener contenido específico de un juego: `/api/games/content?topicId=X&targetGameTypeId=word_catcher`

#### PUT `/api/games/content/[contentId]`
- ✅ Permite actualizar `target_game_type_id`

### 3. Contratos de Contenido por Juego

Archivo: `src/lib/game-content-contracts.ts`

Define el "contrato pedagógico" de cada juego:

| Juego | Tipos de Contenido | Propósito Pedagógico |
|-------|-------------------|---------------------|
| **Word Catcher** 🎯 | `word` | Reforzar vocabulario mediante reconocimiento rápido |
| **Grammar Run** 🏃 | `sentence` + `option` | Practicar estructuras gramaticales en contexto |
| **Sentence Builder** 🏗️ | `sentence` | Desarrollar comprensión de estructura sintáctica |
| **Image Match** 🖼️ | `image-word-pair` | Asociar vocabulario con representaciones visuales |
| **City Explorer** 🏙️ | `location` + `sentence` | Aprender vocabulario en contextos situacionales |

### 4. Nuevo Componente `GameContentManager`

Archivo: `src/components/features/gamification/GameContentManager.tsx`

#### Características principales:

1. **Pestañas por Juego**
   - 5 pestañas, una por cada juego
   - Cada pestaña muestra solo el contenido de ese juego
   - Indicador visual del propósito pedagógico

2. **Formularios Dinámicos**
   - Cada juego tiene su propio formulario específico
   - Los campos se adaptan según el contrato del juego
   - Validaciones automáticas según requisitos

3. **Ejemplos de Formularios**

   **Word Catcher:**
   - Palabra en inglés
   - Traducción (opcional)
   - ¿Es palabra correcta? (checkbox)
   - Imagen de apoyo (opcional)

   **Grammar Run:**
   - Oración con hueco (ej: "I ___ football")
   - Opción correcta
   - Opción incorrecta 1
   - Opción incorrecta 2

   **Image Match:**
   - Palabra o frase
   - Imagen (OBLIGATORIA)
   - Traducción (opcional)

4. **Visualización del Contenido**
   - Grid de tarjetas con el contenido creado
   - Filtrado automático por juego activo
   - Edición y eliminación inline

## 🎨 Experiencia del Docente

### Flujo de Trabajo

1. **Seleccionar Tema**
   - El docente elige el tema sobre el que trabajará

2. **Seleccionar Juego**
   - Ve 5 pestañas con los juegos disponibles
   - Cada pestaña muestra el ícono, nombre y descripción del juego
   - Al seleccionar, ve el propósito pedagógico del juego

3. **Crear Contenido**
   - Click en "Agregar a [Nombre del Juego]"
   - Formulario específico con campos relevantes
   - Ayudas contextuales (placeholders, help text)

4. **Gestionar Contenido**
   - Ve solo el contenido del juego activo
   - Puede editar o eliminar items
   - Contador de items por juego

## 🔒 Validaciones y Prevención de Errores

### A Nivel de API
- ✅ `target_game_type_id` es obligatorio
- ✅ Solo acepta valores válidos de juegos
- ✅ Valida tipos de contenido permitidos

### A Nivel de UI
- ✅ Formularios específicos por juego (imposible equivocarse de tipo)
- ✅ Campos requeridos marcados con asterisco
- ✅ Validación de imagen obligatoria para Image Match
- ✅ Mensajes de error claros

### A Nivel de Datos
- ✅ Cada juego solo consume su propio contenido
- ✅ Queries filtradas por `target_game_type_id`
- ✅ No hay mezcla de contenido entre juegos

## 📊 Beneficios de esta Arquitectura

### 1. Coherencia Pedagógica
- Word Catcher nunca recibirá oraciones largas
- Grammar Run siempre tendrá opciones múltiples
- Image Match garantiza tener imágenes

### 2. Claridad para el Docente
- Sabe exactamente qué crear para cada juego
- La interfaz lo guía paso a paso
- No hay ambigüedad en los formularios

### 3. Escalabilidad
- Fácil agregar nuevos juegos (solo agregar contrato)
- Fácil modificar formularios de juegos existentes
- Estructura clara y mantenible

### 4. Control de Calidad
- Detectas fácilmente si un juego está vacío
- Puedes ver cuánto contenido tiene cada juego
- Reportes más precisos por juego

### 5. Reportes y Analytics
- Sabes qué contenido se usó en qué juego
- Puedes medir efectividad por tipo de juego
- Datos estructurados para análisis

## 🚀 Próximos Pasos Sugeridos

1. **Actualizar los Juegos**
   - Modificar cada juego para que consuma solo su `target_game_type_id`
   - Ejemplo: `WordCatcherScene.ts` debe filtrar por `target_game_type_id = 'word_catcher'`

2. **Migración de Datos Existentes**
   - Si tienes contenido antiguo sin `target_game_type_id`, crear script de migración
   - Asignar juegos según el `content_type` actual

3. **Validaciones Adicionales**
   - Validar que Grammar Run tenga al menos 2 opciones incorrectas
   - Validar longitud de oraciones para Sentence Builder

4. **Reportes por Juego**
   - Dashboard que muestre cantidad de contenido por juego
   - Alertas si un juego tiene poco contenido

## 🎓 Ejemplo de Uso

```typescript
// El docente está en el tema "Animals"
// Selecciona la pestaña "Word Catcher"
// Ve el formulario:

Palabra en inglés: "cat"
Traducción: "gato"
¿Es palabra correcta?: ✓
Imagen: [sube imagen de un gato]

// Al guardar, se crea:
{
  topic_id: "animals_topic_id",
  target_game_type_id: "word_catcher",
  content_type: "word",
  content_text: "cat",
  is_correct: true,
  image_url: "https://...",
  metadata: { translation: "gato" }
}

// Ahora cambia a "Grammar Run"
// Ve un formulario diferente:

Oración con hueco: "The cat ___ on the mat"
Opción correcta: "sits"
Opción incorrecta 1: "sit"
Opción incorrecta 2: "sitting"

// Al guardar, se crea:
{
  topic_id: "animals_topic_id",
  target_game_type_id: "grammar_run",
  content_type: "sentence",
  content_text: "The cat ___ on the mat",
  is_correct: true,
  metadata: {
    correct_option: "sits",
    wrong_options: ["sit", "sitting"]
  }
}
```

## 📝 Notas Técnicas

- Los contratos están centralizados en `game-content-contracts.ts`
- Fácil modificar formularios sin tocar la lógica de negocio
- TypeScript garantiza type-safety en toda la cadena
- El componente es completamente reactivo y eficiente
