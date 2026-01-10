# WordCatcher - Misiones de Prueba

Este documento contiene 3 misiones de prueba para WordCatcher con diferentes niveles de dificultad.

## 🎮 Misión 1: Fácil

**Configuración:**
```json
{
  "time_limit_seconds": 90,
  "difficulty": "fácil",
  "content_constraints": {
    "items": 8,
    "distractors_percent": 10
  },
  "word_catcher": {
    "fall_speed": 160,
    "spawn_rate_ms": 1100,
    "miss_penalty_enabled": true
  },
  "hud_help_enabled": true,
  "asset_pack": "kenney-ui-1"
}
```

**Características:**
- ⏱️ **Tiempo:** 90 segundos (más tiempo para pensar)
- 📊 **Items:** 8 palabras total
- 🎯 **Distractores:** 10% (solo 1 distractor)
- 🚀 **Velocidad:** 160 px/s (lento)
- ⏰ **Spawn:** 1100ms (palabras aparecen más espaciadas)
- 💡 **Ideal para:** Principiantes, primera vez jugando

---

## 🎮 Misión 2: Medio (Estándar)

**Configuración:**
```json
{
  "time_limit_seconds": 60,
  "difficulty": "medio",
  "content_constraints": {
    "items": 12,
    "distractors_percent": 30
  },
  "word_catcher": {
    "fall_speed": 220,
    "spawn_rate_ms": 900,
    "miss_penalty_enabled": true
  },
  "hud_help_enabled": true,
  "asset_pack": "kenney-ui-1"
}
```

**Características:**
- ⏱️ **Tiempo:** 60 segundos (tiempo estándar)
- 📊 **Items:** 12 palabras total
- 🎯 **Distractores:** 30% (4 distractores)
- 🚀 **Velocidad:** 220 px/s (moderado)
- ⏰ **Spawn:** 900ms (ritmo normal)
- 💡 **Ideal para:** Estudiantes con experiencia básica

---

## 🎮 Misión 3: Difícil

**Configuración:**
```json
{
  "time_limit_seconds": 45,
  "difficulty": "difícil",
  "content_constraints": {
    "items": 16,
    "distractors_percent": 40
  },
  "word_catcher": {
    "fall_speed": 300,
    "spawn_rate_ms": 700,
    "miss_penalty_enabled": true
  },
  "hud_help_enabled": false,
  "asset_pack": "kenney-ui-1"
}
```

**Características:**
- ⏱️ **Tiempo:** 45 segundos (presión de tiempo)
- 📊 **Items:** 16 palabras total
- 🎯 **Distractores:** 40% (6-7 distractores)
- 🚀 **Velocidad:** 300 px/s (rápido)
- ⏰ **Spawn:** 700ms (palabras aparecen muy frecuentemente)
- ❌ **Sin ayuda:** `hud_help_enabled: false`
- 💡 **Ideal para:** Estudiantes avanzados, desafío

---

## 📊 Comparativa

| Aspecto | Fácil | Medio | Difícil |
|---------|-------|-------|---------|
| Tiempo | 90s | 60s | 45s |
| Items | 8 | 12 | 16 |
| Distractores | 10% (1) | 30% (4) | 40% (6-7) |
| Velocidad | 160 px/s | 220 px/s | 300 px/s |
| Spawn Rate | 1100ms | 900ms | 700ms |
| Ayuda | ✅ | ✅ | ❌ |
| Presión | 🟢 Baja | 🟡 Media | 🔴 Alta |

---

## 🎯 Progresión de Dificultad

### Fácil → Medio
- ⏱️ -30s de tiempo (-33%)
- 📊 +4 items (+50%)
- 🎯 +3 distractores (+300%)
- 🚀 +60 px/s velocidad (+37%)
- ⏰ -200ms spawn (-18%)

### Medio → Difícil
- ⏱️ -15s de tiempo (-25%)
- 📊 +4 items (+33%)
- 🎯 +2-3 distractores (+67%)
- 🚀 +80 px/s velocidad (+36%)
- ⏰ -200ms spawn (-22%)
- ❌ Sin botón de ayuda

---

## 💡 Recomendaciones de Uso

### Misión Fácil
- Primera sesión con el juego
- Estudiantes jóvenes (6-8 años)
- Vocabulario nuevo
- Práctica de reconocimiento

### Misión Medio
- Estudiantes con experiencia
- Vocabulario familiar
- Práctica regular
- Evaluación estándar

### Misión Difícil
- Estudiantes avanzados
- Vocabulario dominado
- Desafío/competencia
- Evaluación final

---

## 🔧 Cómo Crear Estas Misiones

### Opción 1: Desde la UI (Recomendado)

1. Ir a **Panel de Docente** → **Misiones**
2. Click en **"Nueva Misión"**
3. Seleccionar:
   - **Juego:** Word Catcher
   - **Tema:** (el tema con contenido)
   - **Paralelo:** (tu clase)
4. Configurar según las especificaciones arriba
5. Activar la misión

### Opción 2: Script SQL (Avanzado)

Ver archivo `insert-wordcatcher-missions.sql` en este directorio.

---

## ✅ Checklist de Prueba

Después de crear las misiones, verificar:

- [ ] Las 3 misiones aparecen en el panel de docente
- [ ] Cada misión tiene su configuración correcta
- [ ] El tema tiene suficiente contenido (mínimo 16 items para difícil)
- [ ] Al menos 40% del contenido son distractores (para difícil)
- [ ] Las misiones están activas
- [ ] Los estudiantes pueden verlas
- [ ] El juego carga correctamente
- [ ] La velocidad y spawn rate se aplican
- [ ] El botón de ayuda aparece/desaparece según configuración
- [ ] Las respuestas se registran correctamente
- [ ] La pantalla de resultados muestra datos correctos

---

## 📝 Notas Adicionales

### Contenido Requerido

Para que estas misiones funcionen, necesitas un tema con:
- **Mínimo:** 16 ítems de contenido
- **Correctos:** Al menos 10 palabras correctas
- **Distractores:** Al menos 6-7 palabras incorrectas

### Ejemplo de Contenido

**Tema:** "Animals - Animales"

**Palabras Correctas (10):**
1. DOG
2. CAT
3. BIRD
4. FISH
5. HORSE
6. COW
7. PIG
8. SHEEP
9. CHICKEN
10. DUCK

**Distractores (7):**
1. CAR (vehículo, no animal)
2. TREE (planta, no animal)
3. HOUSE (edificio, no animal)
4. BOOK (objeto, no animal)
5. CHAIR (mueble, no animal)
6. APPLE (fruta, no animal)
7. WATER (líquido, no animal)

---

## 🚀 Próximos Pasos

1. Crear el tema con contenido suficiente
2. Crear las 3 misiones
3. Probar cada nivel
4. Ajustar dificultad según feedback
5. Activar para estudiantes
