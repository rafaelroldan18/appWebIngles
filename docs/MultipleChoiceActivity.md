# Componente MultipleChoiceActivity

## Descripción

`MultipleChoiceActivity` es un componente base reutilizable para actividades de opción múltiple que soporta los tipos "quiz" y "complete_sentence". Este componente unifica la lógica común de ambos tipos de actividades, proporcionando una interfaz consistente y moderna.

## Características

### ✅ Funcionalidades Principales

- **Soporte para múltiples tipos**: Funciona con actividades tipo "quiz" y "complete_sentence"
- **Selección de respuestas**: Permite seleccionar UNA opción por pregunta
- **Validación automática**: Verifica las respuestas y calcula la puntuación
- **Feedback visual**: Marca visualmente las respuestas correctas e incorrectas
- **Cálculo de resultados**: Determina si la actividad fue completada perfectamente
- **Interfaz moderna**: UI con animaciones, gradientes y efectos hover

### 🎨 Características de UI

- **Diseño responsive**: Se adapta a diferentes tamaños de pantalla
- **Modo oscuro**: Soporte completo para tema oscuro
- **Animaciones suaves**: Transiciones y efectos hover
- **Feedback visual claro**: Colores distintivos para correcto/incorrecto
- **Badges informativos**: Muestra puntos, tiempo límite y número de preguntas
- **Resumen de resultados**: Pantalla final con puntuación y emojis

## Uso

```tsx
import { MultipleChoiceActivity } from '@/components/features/gamification/activities/MultipleChoiceActivity';

<MultipleChoiceActivity
  activity={activity}
  content={content}
  onComplete={(result) => {
    console.log('Actividad completada:', result);
    // result.isCompleted: true si se completó
    // result.isPerfect: true si todas las respuestas son correctas
    // result.scorePercentage: porcentaje de aciertos (0-100)
    // result.userAnswers: respuestas del usuario
  }}
/>
```

## Props

### `activity: Activity`
Objeto de actividad que contiene:
- `title`: Título de la actividad
- `prompt`: Instrucciones para el usuario
- `points_value`: Puntos que vale la actividad
- `time_limit_seconds`: Límite de tiempo (opcional)

### `content: QuizContent | CompleteSentenceContent`
Contenido de la actividad que puede ser:

**Para Quiz:**
```typescript
{
  type: 'quiz',
  questions: [
    {
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correct: 1, // índice de la respuesta correcta
      feedback: "Paris is the capital and largest city of France."
    }
  ]
}
```

**Para Complete Sentence:**
```typescript
{
  type: 'complete_sentence',
  sentence: "The cat is on the table",
  blanks: [
    {
      position: 11, // posición en la oración
      answer: "on",
      alternatives: ["in", "at"] // respuestas alternativas válidas
    }
  ],
  feedback: "Great job!"
}
```

### `onComplete: (result) => void`
Callback que se ejecuta cuando el usuario envía las respuestas:

```typescript
{
  isCompleted: boolean;    // Siempre true cuando se llama
  isPerfect: boolean;      // true si todas las respuestas son correctas
  scorePercentage: number; // Porcentaje de aciertos (0-100)
  userAnswers: Record<string, any>; // Respuestas del usuario
}
```

## Comportamiento

### 1. Antes de enviar
- El usuario puede seleccionar una opción por pregunta
- Las preguntas sin responder se muestran en gris
- El botón "Enviar" está deshabilitado hasta que todas las preguntas tengan respuesta
- Se muestra un contador de preguntas respondidas

### 2. Al enviar
- Se validan todas las respuestas
- Se calculan los resultados
- Se marca visualmente cada pregunta como correcta (verde) o incorrecta (roja)
- Se muestra el feedback de cada pregunta (si existe)
- Se calcula el porcentaje de aciertos
- Se llama al callback `onComplete` con los resultados

### 3. Después de enviar
- Las respuestas quedan bloqueadas (no se pueden cambiar)
- Se muestra un resumen con:
  - Emoji según el resultado (🎉 perfecto, 👏 bueno, 💪 necesita práctica)
  - Número de respuestas correctas
  - Porcentaje final
- El sistema guarda automáticamente los puntos y avanza a la siguiente actividad

## Integración con ActivityRunner

El componente está integrado en `ActivityRunner.tsx` y se renderiza automáticamente cuando el tipo de actividad es "quiz" o "complete_sentence":

```tsx
{(currentActivity.activity_type === 'quiz' ||
  currentActivity.activity_type === 'complete_sentence') && (
  <MultipleChoiceActivity
    activity={currentActivity}
    content={currentActivity.content_data as QuizContent | CompleteSentenceContent}
    onComplete={handleMultipleChoiceComplete}
  />
)}
```

El handler `handleMultipleChoiceComplete`:
1. Calcula el tiempo transcurrido
2. Guarda el intento en la base de datos
3. Actualiza el progreso del usuario
4. Verifica si se desbloquearon nuevas insignias
5. Avanza a la siguiente actividad (después de 2 segundos para que el usuario vea el resultado)

## Normalización de Contenido

El componente normaliza internamente los diferentes tipos de contenido a un formato común:

### Quiz → Preguntas
```typescript
{
  id: 'q-0',
  text: 'What is the capital of France?',
  options: ['London', 'Paris', 'Berlin', 'Madrid'],
  correctAnswer: 1,
  feedback: 'Paris is the capital...'
}
```

### Complete Sentence → Preguntas
```typescript
{
  id: 'blank-0',
  text: 'The cat is _____ the table',
  options: ['on', 'in', 'at'], // mezcladas aleatoriamente
  correctAnswer: 'on',
  feedback: 'Great job!'
}
```

## Funciones Auxiliares

### `normalizeContent(content)`
Convierte el contenido de diferentes tipos a un formato común de preguntas.

### `checkAnswer(userAnswer, correctAnswer)`
Verifica si la respuesta del usuario es correcta, soportando comparación de números e índices, y strings ignorando mayúsculas/minúsculas.

### `shuffleArray(array)`
Mezcla aleatoriamente un array usando el algoritmo Fisher-Yates.

## Estilos y Temas

El componente utiliza:
- **Tailwind CSS** para estilos
- **Gradientes** para efectos visuales
- **Transiciones suaves** para animaciones
- **Modo oscuro** con clases `dark:`
- **Colores semánticos**:
  - Verde: Correcto
  - Rojo: Incorrecto
  - Azul: Seleccionado
  - Gris: Sin seleccionar

## Ejemplo Completo

```tsx
const activity = {
  id: '123',
  title: 'English Grammar Quiz',
  prompt: 'Choose the correct answer for each question',
  points_value: 50,
  time_limit_seconds: 300,
  // ... otros campos
};

const content = {
  type: 'quiz',
  questions: [
    {
      question: 'What is the past tense of "go"?',
      options: ['goed', 'went', 'gone', 'going'],
      correct: 1,
      feedback: 'The past tense of "go" is "went".'
    },
    {
      question: 'Which article is correct: ___ apple',
      options: ['a', 'an', 'the', 'no article'],
      correct: 1,
      feedback: 'We use "an" before words starting with a vowel sound.'
    }
  ]
};

<MultipleChoiceActivity
  activity={activity}
  content={content}
  onComplete={(result) => {
    if (result.isPerfect) {
      console.log('Perfect score! 🎉');
    } else {
      console.log(`Score: ${result.scorePercentage}%`);
    }
  }}
/>
```

## Ventajas sobre los componentes anteriores

1. **Código unificado**: Un solo componente para dos tipos de actividades
2. **Interfaz consistente**: Misma experiencia de usuario para ambos tipos
3. **Más mantenible**: Cambios en un solo lugar
4. **Mejor UX**: Animaciones y feedback visual mejorados
5. **Más flexible**: Fácil de extender para nuevos tipos de actividades
6. **Mejor tipado**: TypeScript completo con interfaces claras

## Notas Técnicas

- El componente es **client-side** (`'use client'`)
- Usa hooks de React: `useState`
- Es completamente **controlado** (controlled component)
- No tiene efectos secundarios hasta que se llama `onComplete`
- Las respuestas se almacenan en un objeto con IDs de pregunta como claves
- El shuffle de opciones es determinístico por sesión (no cambia al re-renderizar)
