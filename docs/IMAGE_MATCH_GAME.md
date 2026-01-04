# Image Match - Juego de Memoria/Tarjetas

## 🎮 Descripción General

**Image Match** es un juego educativo de memoria donde los estudiantes encuentran pares coincidentes de imágenes (emojis) y palabras. El juego refuerza el vocabulario visual y la asociación palabra-imagen.

## 🎯 Objetivos Pedagógicos

- Asociar palabras con representaciones visuales
- Reforzar vocabulario mediante memoria visual
- Desarrollar habilidades de concentración
- Relacionar con actividades de "Matching Pairs"

## 🕹️ Mecánicas de Juego

### Controles
- **Click/Touch**: Voltear tarjetas
- **Memoria**: Recordar posiciones de tarjetas

### Gameplay
1. Cuadrícula de 4×4 (16 tarjetas)
2. 8 pares de imagen-palabra
3. Todas las tarjetas boca abajo al inicio
4. Click en una tarjeta para voltearla
5. Click en segunda tarjeta
6. Si coinciden: permanecen visibles (verde)
7. Si no coinciden: se voltean de nuevo
8. Objetivo: Encontrar todos los pares

### Sistema de Pares
- **Cada par**: Una tarjeta con emoji 🐱 + Una tarjeta con palabra "cat"
- **Total**: 8 pares = 16 tarjetas
- **Coincidencia**: Mismo contenido, diferente tipo (emoji vs palabra)

## 📊 Sistema de Puntuación

### Puntos
- **Par encontrado**: +20 puntos
- **Par incorrecto**: -3 puntos
- **Bonus de tiempo**: +2 puntos por cada 10 segundos restantes
- **Juego perfecto**: +50 puntos (sin errores)

### Evaluación
Usa los mismos criterios estándar:
- **Mínimo para aprobar**: 50 puntos, 60% precisión
- **Excelente**: 80%+ precisión → ×1.5 multiplicador
- **Bueno**: 65-79% precisión → ×1.2 multiplicador
- **Aceptable**: 60-64% precisión → ×1.0 multiplicador
- **Bajo**: <60% precisión → ×0.5 multiplicador

## ⚙️ Configuración del Juego

```typescript
{
  // Dimensiones
  width: 800,
  height: 600,
  
  // Duración
  gameDuration: 180, // 3 minutos
  
  // Gameplay
  pairsCount: 8,
  flipBackDelay: 1000, // ms antes de voltear
  matchDelay: 500,     // ms para mostrar match
  
  // Grid
  rows: 4,
  cols: 4,
  cardWidth: 140,
  cardHeight: 140,
  cardSpacing: 15,
  
  // Puntuación
  matchFound: 20,
  wrongMatch: -3,
  timeBonus: 2,
  perfectGame: 50,
}
```

## 🎨 Diseño Visual

### Colores
- **Fondo**: Azul oscuro (#1e293b)
- **Tarjeta boca abajo**: Azul (#3b82f6)
- **Tarjeta boca arriba**: Blanco (#ffffff)
- **Par correcto**: Verde (#10b981)
- **Par incorrecto**: Rojo (#ef4444)
- **Hover**: Azul oscuro (#2563eb)

### Layout
- **Cuadrícula**: 4 filas × 4 columnas
- **Tarjetas**: 140×140 px
- **Espaciado**: 15 px
- **Centrado**: Automático

### UI
- **Score**: Esquina superior izquierda
- **Timer**: Esquina superior derecha
- **Pares**: Centro superior ("Pairs: 3/8")
- **Instrucciones**: Centro inferior

## 📝 Tipos de Contenido

Image Match usa contenido de tipo `word` con emojis:

```typescript
interface GameContent {
  content_id: string;
  topic_id: string;
  content_type: 'word';
  content_text: string;  // Palabra (se convierte a emoji automáticamente)
  is_correct: true;      // Solo palabras correctas
}
```

### Mapeo de Emojis

El juego incluye un mapeo automático de palabras a emojis:

```typescript
{
  // Animales
  'cat': '🐱', 'dog': '🐶', 'bird': '🐦', 'fish': '🐟',
  'elephant': '🐘', 'lion': '🦁', 'monkey': '🐵', 'tiger': '🐯',
  
  // Comida
  'apple': '🍎', 'banana': '🍌', 'pizza': '🍕', 'burger': '🍔',
  'cake': '🍰', 'cookie': '🍪', 'bread': '🍞', 'cheese': '🧀',
  
  // Objetos
  'book': '📚', 'pen': '🖊️', 'phone': '📱', 'computer': '💻',
  'car': '🚗', 'house': '🏠', 'tree': '🌳', 'flower': '🌸',
  
  // Clima
  'sun': '☀️', 'rain': '🌧️', 'cloud': '☁️', 'snow': '❄️',
  
  // Colores
  'red': '🔴', 'blue': '🔵', 'green': '🟢', 'yellow': '🟡',
  
  // Acciones
  'run': '🏃', 'walk': '🚶', 'jump': '🦘', 'swim': '🏊',
  'eat': '🍽️', 'drink': '🥤', 'sleep': '😴', 'study': '📖',
}
```

### Ejemplos de Contenido

**Tema: Animals**
```json
[
  { "content_text": "cat", "is_correct": true },
  { "content_text": "dog", "is_correct": true },
  { "content_text": "bird", "is_correct": true },
  { "content_text": "fish", "is_correct": true },
  { "content_text": "elephant", "is_correct": true },
  { "content_text": "lion", "is_correct": true },
  { "content_text": "monkey", "is_correct": true },
  { "content_text": "tiger", "is_correct": true }
]
```

**Tema: Food**
```json
[
  { "content_text": "apple", "is_correct": true },
  { "content_text": "banana", "is_correct": true },
  { "content_text": "pizza", "is_correct": true },
  { "content_text": "burger", "is_correct": true }
]
```

## 🔄 Flujo del Juego

```
1. Inicio
   ↓
2. Crear 8 pares (16 tarjetas)
   ↓
3. Mezclar tarjetas aleatoriamente
   ↓
4. Mostrar cuadrícula boca abajo
   ↓
5. Jugador voltea primera tarjeta
   ↓
6. Jugador voltea segunda tarjeta
   ↓
7. Sistema verifica:
   - ¿Mismo content_id?
   - ¿Diferente tipo (emoji vs palabra)?
   ↓
8. Si coinciden:
   - Marcar como encontradas (verde)
   - +20 puntos
   - Permanecen visibles
   ↓
9. Si no coinciden:
   - Mostrar rojo brevemente
   - -3 puntos
   - Voltear de nuevo después de 1s
   ↓
10. Repetir hasta:
    - Todos los pares encontrados
    - Tiempo agotado
    ↓
11. Bonus:
    - Juego perfecto: +50 puntos
    - Tiempo restante: +2 por cada 10s
    ↓
12. Game Over
    ↓
13. Evaluación pedagógica
    ↓
14. Actualización de progreso
```

## 🎓 Integración con Sistema de Misiones

### Validación Pre-Juego
```typescript
const validation = await MissionValidator.validateMission(
  studentId,
  topicId,
  'image-match-id',
  parallelId
);

if (validation.canPlay) {
  // Cargar Image Match
} else {
  // Mostrar mensaje de bloqueo
}
```

### Evaluación Post-Juego
```typescript
const result = MissionEvaluator.evaluateMission(
  score,        // Puntaje final
  accuracy,     // % de pares correctos
  correctCount, // Pares encontrados
  wrongCount    // Intentos incorrectos
);

// result.success → ¿Aprobó la misión?
// result.pointsEarned → Puntos con multiplicador
// result.feedback → Mensaje pedagógico
```

## 🚀 Uso en la Aplicación

### Para Docentes

1. **Crear Contenido**
   ```sql
   INSERT INTO game_content (topic_id, content_type, content_text, is_correct)
   VALUES 
     ('animals-id', 'word', 'cat', true),
     ('animals-id', 'word', 'dog', true),
     ('animals-id', 'word', 'bird', true);
   ```

2. **Crear Misión**
   ```typescript
   await createMission({
     game_type_id: 'image-match-id',
     topic_id: 'animals-id',
     parallel_id: 'parallel-id',
     available_from: '2026-01-10',
     available_until: '2026-01-17',
     max_attempts: 3
   });
   ```

### Para Estudiantes

1. **Acceder al Juego**
   - Ir a "Mis Juegos"
   - Ver misión "Image Match - Animals"
   - Click "Jugar Ahora"

2. **Jugar**
   - Click en tarjetas para voltearlas
   - Recordar posiciones
   - Encontrar pares coincidentes
   - Completar todos los pares

3. **Ver Resultados**
   - Puntaje final
   - Pares encontrados
   - Precisión
   - Bonus de juego perfecto

## 📊 Métricas Rastreadas

### Por Sesión
- `score`: Puntaje total
- `correct_count`: Pares encontrados
- `wrong_count`: Intentos incorrectos
- `duration_seconds`: Tiempo jugado
- `details.pairsMatched`: Pares completados
- `details.totalPairs`: Total de pares
- `details.wrongMatches`: Errores cometidos
- `details.perfectGame`: Sin errores (boolean)

### Por Estudiante
- Sesiones completadas
- Puntaje promedio
- Precisión promedio
- Juegos perfectos
- Progreso en el tema

## 🎯 Estrategias Pedagógicas

### Memoria Visual
- Asociación imagen-palabra
- Refuerzo mediante repetición
- Aprendizaje multimodal

### Concentración
- Requiere atención sostenida
- Memoria a corto plazo
- Estrategia de recordar posiciones

### Gamificación
- Bonus por juego perfecto
- Penalización leve por errores
- Bonus de tiempo

## 🔧 Personalización

### Ajustar Dificultad
```typescript
// En imageMatch.config.ts
{
  gameplay: {
    pairsCount: 6,        // Menos pares (más fácil)
    flipBackDelay: 1500,  // Más tiempo para memorizar
  },
  scoring: {
    wrongMatch: -1,       // Menor penalización
    perfectGame: 100,     // Mayor recompensa
  }
}
```

### Agregar Más Emojis
```typescript
// En ImageMatchScene.ts
private emojiMap = {
  ...existing,
  'new-word': '🆕',
  'custom': '✨',
};
```

## 🎮 Características Especiales

### Detección Inteligente de Pares
- Verifica mismo `content_id`
- Verifica diferentes tipos (emoji vs palabra)
- Previene emparejar dos emojis o dos palabras

### Feedback Visual
- Tarjetas cambian de color al voltear
- Verde para pares correctos
- Rojo para pares incorrectos
- Animación suave de volteo

### Prevención de Spam
- Bloquea clicks durante procesamiento
- Solo 2 tarjetas volteadas a la vez
- Tarjetas emparejadas no se pueden voltear

## 🐛 Troubleshooting

### Emojis no aparecen
- Verificar que las palabras estén en `emojiMap`
- Agregar nuevas palabras al mapeo
- Usar palabras en minúsculas

### Tarjetas no voltean
- Verificar que el juego no esté procesando
- Esperar a que se voltee el par anterior
- Revisar consola para errores

### Pares no coinciden
- Verificar que `content_id` sea igual
- Verificar que tipos sean diferentes
- Revisar datos en `game_content`

## 📚 Archivos del Juego

```
src/lib/games/
├── imageMatch.config.ts      # Configuración
└── ImageMatchScene.ts        # Escena Phaser

src/components/features/gamification/
└── UniversalGameCanvas.tsx   # Wrapper (compartido)

docs/
└── IMAGE_MATCH_GAME.md       # Esta documentación
```

## ✅ Checklist de Implementación

- [x] Configuración creada
- [x] Escena Phaser implementada
- [x] Sistema de tarjetas
- [x] Detección de pares
- [x] Mapeo de emojis
- [x] Feedback visual
- [x] Sistema de puntuación
- [x] Bonus de juego perfecto
- [x] Temporizador
- [x] Game Over screen
- [x] Integración con UniversalGameCanvas
- [x] Integración con MissionValidator
- [x] Integración con MissionEvaluator
- [x] Documentación completa

## 🎉 Resultado

Image Match está **completamente implementado** y listo para ser usado como misión pedagógica en el sistema educativo gamificado.

---

**Última actualización**: 2026-01-03
