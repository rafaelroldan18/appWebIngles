# City Explorer - Mapa Interactivo Educativo

## 🎮 Descripción General

**City Explorer** es un juego educativo de exploración donde los estudiantes navegan por una ciudad virtual para encontrar lugares y responder preguntas sobre preposiciones. El juego refuerza el vocabulario de ubicaciones y el uso correcto de preposiciones en inglés.

## 🎯 Objetivos Pedagógicos

- Aprender vocabulario de lugares (bank, hospital, school, park, etc.)
- Practicar preposiciones de lugar (next to, above, below, etc.)
- Desarrollar orientación espacial
- Relacionar con la Unidad "The Town Map"

## 🕹️ Mecánicas de Juego

### Controles
- **WASD o Flechas**: Mover al jugador 🚶
- **Mouse**: Responder preguntas

### Gameplay
1. Mapa de ciudad con 9 edificios
2. Objetivo: Encontrar 6 ubicaciones específicas
3. Navegar por el mapa hasta el edificio objetivo
4. Al llegar, responder pregunta sobre preposiciones
5. Continuar hasta completar todas las ubicaciones

### Sistema de Misiones
- **Ubicaciones por juego**: 6
- **Tiempo total**: 4 minutos
- **Tiempo por ubicación**: 30 segundos (aproximado)
- **Indicador visual**: Edificio objetivo marcado en rojo

## 📊 Sistema de Puntuación

### Puntos
- **Ubicación encontrada**: +25 puntos
- **Preposición correcta**: +20 puntos
- **Respuesta incorrecta**: -5 puntos
- **Bonus de velocidad**: +10 puntos (si completa con >60s restantes)

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
  gameDuration: 240, // 4 minutos
  
  // Gameplay
  locationsToFind: 6,
  timePerLocation: 30,
  playerSpeed: 150,
  
  // Puntuación
  locationFound: 25,
  correctPreposition: 20,
  wrongAnswer: -5,
  speedBonus: 10,
}
```

## 🎨 Diseño Visual

### Colores
- **Fondo**: Azul cielo (#87CEEB)
- **Suelo**: Verde claro (#90EE90)
- **Jugador**: Azul (#3b82f6) + emoji 🚶
- **Edificios**: Colores específicos por tipo
  - Bank: Dorado 🏦
  - Hospital: Rojo 🏥
  - School: Teal 🏫
  - Park: Verde 🏞️
  - Restaurant: Rosa 🍽️
  - Library: Púrpura 📚
  - Museum: Rosa claro 🏛️
  - Station: Menta 🚉

### Layout
- **Cuadrícula**: 3×3 edificios
- **Tamaño edificio**: 80×80 px
- **Espaciado**: 20 px
- **Emojis**: 40px para edificios, 24px para jugador

### UI
- **Score**: Esquina superior izquierda
- **Timer**: Esquina superior derecha
- **Objetivo**: Centro superior ("Find the BANK!")
- **Progreso**: Debajo del objetivo ("Locations: 3/6")
- **Instrucciones**: Centro inferior

## 📝 Tipos de Contenido

City Explorer puede usar contenido genérico o específico:

```typescript
interface GameContent {
  content_id: string;
  topic_id: string;
  content_type: 'location' | 'word';
  content_text: string;  // Nombre del lugar
  is_correct: true;
}
```

### Ubicaciones Disponibles

El juego incluye 8 tipos de edificios:
- **bank** 🏦 - Banco
- **hospital** 🏥 - Hospital
- **school** 🏫 - Escuela
- **park** 🏞️ - Parque
- **restaurant** 🍽️ - Restaurante
- **library** 📚 - Biblioteca
- **museum** 🏛️ - Museo
- **station** 🚉 - Estación

### Preposiciones Usadas

- **next to** - al lado de
- **to the right of** - a la derecha de
- **to the left of** - a la izquierda de
- **above** - arriba de
- **below** - abajo de
- **across from** - frente a
- **behind** - detrás de
- **in front of** - delante de
- **near** - cerca de

### Ejemplos de Preguntas

```
"The bank is ___ the hospital."
Options: ["next to", "across from", "behind"]

"The school is ___ the park."
Options: ["to the right of", "to the left of", "above"]

"The library is ___ the museum."
Options: ["below", "above", "next to"]
```

## 🔄 Flujo del Juego

```
1. Inicio
   ↓
2. Mostrar mapa de ciudad (3×3)
   ↓
3. Seleccionar ubicación objetivo aleatoria
   ↓
4. Marcar edificio en rojo
   ↓
5. Mostrar objetivo: "Find the BANK!"
   ↓
6. Jugador navega con WASD/Flechas
   ↓
7. Al llegar al edificio:
   - +25 puntos
   - Mostrar pregunta de preposición
   ↓
8. Jugador responde:
   - Correcto: +20 puntos
   - Incorrecto: -5 puntos
   ↓
9. Siguiente ubicación (repetir 6 veces)
   ↓
10. Al completar 6 ubicaciones:
    - Bonus de velocidad (si aplica)
    - Game Over
    ↓
11. Evaluación pedagógica
    ↓
12. Actualización de progreso
```

## 🎓 Integración con Sistema de Misiones

### Validación Pre-Juego
```typescript
const validation = await MissionValidator.validateMission(
  studentId,
  topicId,
  'city-explorer-id',
  parallelId
);

if (validation.canPlay) {
  // Cargar City Explorer
} else {
  // Mostrar mensaje de bloqueo
}
```

### Evaluación Post-Juego
```typescript
const result = MissionEvaluator.evaluateMission(
  score,        // Puntaje final
  accuracy,     // % de respuestas correctas
  correctCount, // Ubicaciones + preposiciones correctas
  wrongCount    // Respuestas incorrectas
);

// result.success → ¿Aprobó la misión?
// result.pointsEarned → Puntos con multiplicador
// result.feedback → Mensaje pedagógico
```

## 🚀 Uso en la Aplicación

### Para Docentes

1. **Crear Contenido** (Opcional - el juego funciona sin contenido específico)
   ```sql
   INSERT INTO game_content (topic_id, content_type, content_text, is_correct)
   VALUES 
     ('town-map-id', 'location', 'bank', true),
     ('town-map-id', 'location', 'hospital', true);
   ```

2. **Crear Misión**
   ```typescript
   await createMission({
     game_type_id: 'city-explorer-id',
     topic_id: 'town-map-id',
     parallel_id: 'parallel-id',
     available_from: '2026-01-10',
     available_until: '2026-01-17',
     max_attempts: 3
   });
   ```

### Para Estudiantes

1. **Acceder al Juego**
   - Ir a "Mis Juegos"
   - Ver misión "City Explorer - The Town Map"
   - Click "Jugar Ahora"

2. **Jugar**
   - Usar WASD o flechas para moverse
   - Encontrar el edificio marcado en rojo
   - Responder pregunta de preposición
   - Completar 6 ubicaciones

3. **Ver Resultados**
   - Puntaje final
   - Ubicaciones encontradas
   - Precisión en preposiciones
   - Estado de misión

## 📊 Métricas Rastreadas

### Por Sesión
- `score`: Puntaje total
- `correct_count`: Respuestas correctas (ubicaciones + preposiciones)
- `wrong_count`: Respuestas incorrectas
- `duration_seconds`: Tiempo jugado
- `details.locationsFound`: Ubicaciones completadas
- `details.totalLocations`: Total de ubicaciones (6)
- `details.completed`: Misión completada (boolean)

### Por Estudiante
- Sesiones completadas
- Puntaje promedio
- Precisión promedio
- Ubicaciones promedio encontradas
- Progreso en el tema

## 🎯 Estrategias Pedagógicas

### Aprendizaje Espacial
- Navegación activa por el mapa
- Orientación y ubicación
- Relaciones espaciales

### Vocabulario Contextual
- Lugares en contexto visual
- Asociación emoji-palabra
- Uso práctico de preposiciones

### Gamificación
- Exploración libre
- Objetivos claros
- Feedback inmediato

## 🔧 Personalización

### Ajustar Dificultad
```typescript
// En cityExplorer.config.ts
{
  gameplay: {
    locationsToFind: 8,      // Más ubicaciones
    timePerLocation: 45,     // Más tiempo
    playerSpeed: 200,        // Más rápido
  },
  scoring: {
    wrongAnswer: -2,         // Menor penalización
    speedBonus: 20,          // Mayor bonus
  }
}
```

### Agregar Más Ubicios
```typescript
// En CityExplorerScene.ts
const locations = [
  'bank', 'hospital', 'school',
  'park', 'restaurant', 'library',
  'museum', 'station', 'supermarket' // Nuevo
];

// En cityExplorer.config.ts
locationEmojis: {
  ...existing,
  supermarket: '🛒',
}
```

## 🎮 Características Especiales

### Generación Dinámica de Preguntas
- Preguntas basadas en edificios cercanos
- Preposiciones calculadas por posición relativa
- Opciones aleatorias cada vez

### Detección de Proximidad
- Radio de 60 píxeles para llegar
- Detección automática al acercarse
- Feedback visual (edificio marcado)

### Movimiento Fluido
- Control con WASD o flechas
- Velocidad configurable
- Límites del mundo (no sale del mapa)

## 🐛 Troubleshooting

### Jugador no se mueve
- Verificar que el juego no esté en modo pregunta
- Revisar controles (WASD o flechas)
- Recargar la página

### Preguntas no aparecen
- Verificar que el jugador llegó al edificio
- Revisar distancia de detección (60px)
- Revisar consola para errores

### Edificios no aparecen
- Verificar configuración de colores
- Verificar emojis soportados
- Revisar tamaño del mapa

## 📚 Archivos del Juego

```
src/lib/games/
├── cityExplorer.config.ts      # Configuración
└── CityExplorerScene.ts        # Escena Phaser

src/components/features/gamification/
└── UniversalGameCanvas.tsx     # Wrapper (compartido)

docs/
└── CITY_EXPLORER_GAME.md       # Esta documentación
```

## ✅ Checklist de Implementación

- [x] Configuración creada
- [x] Escena Phaser implementada
- [x] Mapa de ciudad (3×3)
- [x] Sistema de navegación
- [x] Detección de proximidad
- [x] Generación de preguntas
- [x] Sistema de preposiciones
- [x] Feedback visual
- [x] Sistema de puntuación
- [x] Bonus de velocidad
- [x] Temporizador
- [x] Game Over screen
- [x] Integración con UniversalGameCanvas
- [x] Integración con MissionValidator
- [x] Integración con MissionEvaluator
- [x] Documentación completa

## 🎉 Resultado

City Explorer está **completamente implementado** y listo para ser usado como misión pedagógica en el sistema educativo gamificado.

---

**Última actualización**: 2026-01-03
**Estado**: ✅ COMPLETADO - 5/5 juegos implementados (100%)
