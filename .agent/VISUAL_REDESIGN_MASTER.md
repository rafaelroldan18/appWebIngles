# 🎨 REDISEÑO VISUAL COMPLETO - SUITE DE JUEGOS EDUCATIVOS

**Fecha:** 2026-02-01  
**Versión:** 1.0  
**Stack:** Phaser 3 + phaser3-rex-plugins + Tweens nativos

---

## 📋 PASO 1: ANÁLISIS COMPLETADO

### Juegos Identificados

1. **WordCatcherScene** - Palabras cayendo (catching game)
2. **GrammarRunScene** - Runner con puertas de gramática
3. **SentenceBuilderScene** - Construcción de oraciones (drag & drop)
4. **ImageMatchScene** - Memory match con cartas
5. **CityExplorerScene** - Exploración de mapa

### Arquitectura Actual

- ✅ Sistema de temas parcial: `WordCatcherTheme.ts`, `GrammarRunTheme.ts`
- ✅ Estilos globales: `GameStyles.ts` con paletas definidas
- ✅ UIKit con componentes reutilizables
- ✅ Sistema de atlas para assets
- ❌ **NO tiene GSAP** (usaremos Phaser Tweens nativos)
- ❌ **NO tiene rex-plugins instalado** (lo instalaremos)

### Eventos Clave Identificados

**Comunes a todos:**
- `init()` - Inicialización
- `create()` - Creación de escena
- `startCountdown()` - Cuenta regresiva 3-2-1
- `togglePause()` - Pausa
- `endGame()` - Fin de juego
- `createMissionCompleteModal()` - Modal de completado

**Feedback:**
- Acierto → `handleCorrectCatch()`, `handleMatch()`, `handleSuccess()`
- Error → `handleWrongCatch()`, `handleMismatch()`, `handleFailure()`

---

## 🎨 PASO 2: LENGUAJE VISUAL COMÚN

### Paleta Base Global

```typescript
COMMON_VISUAL_LANGUAGE = {
  // Colores base (neutrales)
  background: {
    dark: '#0F172A',      // Slate-900
    medium: '#1E293B',    // Slate-800
    light: '#334155'      // Slate-700
  },
  
  // Estados universales
  states: {
    success: '#10B981',   // Verde esmeralda
    error: '#EF4444',     // Rojo coral
    warning: '#F59E0B',   // Ámbar
    info: '#3B82F6'       // Azul
  },
  
  // UI común
  ui: {
    text: '#FFFFFF',
    textDim: '#94A3B8',
    border: '#475569',
    panel: '#1E293B'
  }
}
```

### Tipografía Estándar

```typescript
TYPOGRAPHY = {
  primary: 'Nunito, Inter, sans-serif',
  sizes: {
    title: '48px',
    subtitle: '32px',
    body: '20px',
    small: '16px',
    hud: '24px'
  },
  weights: {
    bold: '700',
    semibold: '600',
    regular: '400'
  }
}
```

### Formas Geométricas Base

- **Paneles:** Rectángulos redondeados (radius: 20-24px)
- **Botones:** Rectángulos redondeados (radius: 12-16px)
- **Tokens/Cards:** Rectángulos redondeados (radius: 16-20px)
- **Bordes:** 2-4px de grosor, con glow opcional

### Principios de Contraste

1. **Fondo oscuro + elementos brillantes** (mejor legibilidad)
2. **Bordes neón** para definir elementos interactivos
3. **Glow sutil** (alpha 0.1-0.3) para profundidad
4. **Gradientes suaves** en fondos (no más de 2 colores)

---

## 🛠️ PASO 3: LIBRERÍAS Y HERRAMIENTAS

### Stack Confirmado

✅ **Phaser 3.90.0** (instalado)
✅ **GSAP** (instalado - animaciones profesionales)
✅ **phaser3-rex-plugins** (instalado - UI moderna)

### Plugins Rex Disponibles

```typescript
import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle';
import BBCodeText from 'phaser3-rex-plugins/plugins/bbcodetext';
import GlowFilterPipeline from 'phaser3-rex-plugins/plugins/glowfilter2pipeline';
```

### GSAP para Animaciones

```typescript
import { gsap } from 'gsap';

// Animaciones suaves y profesionales
gsap.to(target, {
    scale: 1.2,
    duration: 0.4,
    ease: 'back.out'
});
```

### Archivos Creados

1. **`VisualEffects.ts`** - Sistema de efectos con GSAP
2. **`PremiumUI.ts`** - Componentes UI con rex-plugins
   - `createPremiumPanel()` - Paneles con glow
   - `createPremiumButton()` - Botones interactivos
   - `createPremiumCard()` - Cartas con flip
   - `createPremiumToken()` - Tokens animados
   - `createPremiumModal()` - Modales con backdrop

---

## 🎯 PASO 4: JERARQUÍA VISUAL POR ESCENA

### Estructura de Capas (Depth)

```typescript
DEPTH_LAYERS = {
  background: 0,        // Fondo estático/animado
  decoration: 50,       // Elementos decorativos
  ground: 100,          // Suelo/plataformas
  objects: 200,         // Objetos del juego
  player: 300,          // Jugador/elementos principales
  effects: 400,         // Partículas, glow
  ui: 1000,            // HUD
  modal: 2000,         // Modales
  overlay: 3000        // Overlays (pausa, etc.)
}
```

### Rediseño Visual por Juego

#### 1. Word Catcher (Neón Cósmico)

**Fondo:**
- Gradiente vertical: `#0F172A` → `#1A0F2E`
- Partículas flotantes (círculos pequeños, alpha 0.2)
- Movimiento parallax sutil

**Palabras (Tokens):**
- Fondo: `#0F172A` con alpha 0.9
- Borde neón: `#22D3EE` (cyan) o `#818CF8` (indigo)
- Glow exterior: mismo color del borde, alpha 0.15
- Corner radius: 24px
- Animación: pulso suave (scale 1.0 → 1.05, 2s loop)

**Estados:**
- Correcto: Borde verde `#34D399`, glow intenso, escala 1.2
- Error: Borde rojo `#FB7185`, shake, fade out

#### 2. Grammar Run (Neón Eléctrico)

**Fondo:**
- Gradiente: `#1A0033` → `#0A0A1A`
- Líneas cinéticas horizontales (velocidad parallax)
- Grid sutil en el suelo

**Jugador:**
- Forma: Rectángulo redondeado `#00D9FF`
- Trail: Partículas cyan `#00FF88`
- Animación idle: bounce vertical suave

**Puertas:**
- Fondo: `#0A0A1A` alpha 0.95
- Borde: `#9333EA` (púrpura) o `#06B6D4` (cyan)
- Borde doble: exterior grueso + interior fino
- Glow pulsante

**Estados:**
- Correcta: Flash verde `#00FF88`, partículas
- Incorrecta: Flash rojo `#FF0066`, shake cámara

#### 3. Sentence Builder (Minimal Limpio)

**Fondo:**
- Color sólido: `#2C3A47`
- Zonas diferenciadas con sutiles cambios de tono

**Word Blocks:**
- Estado inicial: `#95E1D3` (menta claro)
- Hover: `#F38181` (salmón), scale 1.05
- Colocado: `#AA96DA` (lavanda)
- Correcto: `#48CFAD` (turquesa), glow verde

**Drop Zones:**
- Vacía: Borde punteado `#5F27CD`
- Hover: Borde sólido `#EE5A6F`, glow
- Llena: Fondo `#00D2D3` alpha 0.2

**Animaciones:**
- Drag: Sigue cursor con smooth lerp
- Drop: Snap con ease-out + partículas
- Success: Wave animation en toda la oración

#### 4. Image Match (Cards Modernas)

**Fondo:**
- Gradiente radial: centro `#1E293B` → bordes `#0D1B2A`

**Cartas:**
- Reverso: `#3A86FF` con patrón geométrico sutil
- Frente: Borde `#FB5607`, fondo `#1E293B`
- Shadow: Sombra suave debajo (offset Y: 4px, blur: 8px)
- Corner radius: 16px

**Flip Animation:**
- RotateY 0° → 90° (hide front)
- RotateY 90° → 180° (show back)
- Duration: 300ms, ease: back.out

**Estados:**
- Match: Glow verde `#06FFA5`, scale 1.1, partículas
- Mismatch: Shake, tint rojo temporal

#### 5. City Explorer (Exploración Progresiva)

**Mapa:**
- Fondo: Textura sutil o gradiente `#2C3E50`
- Caminos: Líneas conectando nodos (dash pattern)
- Decoración: Formas geométricas abstractas

**Checkpoints:**
- Inactivo: Círculo gris `#6B7280`, alpha 0.6
- Activo (target): Círculo amarillo `#FBBF24`, glow pulsante
- Completado: Círculo verde `#10B981`, checkmark

**Jugador:**
- Círculo sólido `#6366F1`
- Trail de partículas
- Smooth movement con lerp

---

## ✨ PASO 5: FEEDBACK VISUAL Y MICROINTERACCIONES

### Sistema de Feedback Unificado

```typescript
FEEDBACK_SYSTEM = {
  // Acierto
  correct: {
    visual: [
      'Glow verde (#10B981, alpha 0.6)',
      'Scale pulse (1.0 → 1.2 → 1.0, 400ms)',
      'Partículas verdes (8-12 partículas, radial)'
    ],
    sound: 'sfx_correct',
    camera: 'Flash blanco suave (alpha 0.2, 150ms)'
  },
  
  // Error
  wrong: {
    visual: [
      'Shake horizontal (±8px, 150ms)',
      'Tint rojo temporal (#EF4444, 300ms)',
      'Fade out si se destruye'
    ],
    sound: 'sfx_wrong',
    camera: 'Shake suave (intensity 0.01, 150ms)'
  },
  
  // Recompensa/Completado
  reward: {
    visual: [
      'Burst de partículas doradas',
      'Scale bounce (0 → 1.2 → 1.0, 600ms, elastic)',
      'Glow dorado intenso'
    ],
    sound: 'sfx_success',
    camera: 'Flash dorado (alpha 0.3, 200ms)'
  }
}
```

### Microinteracciones Estándar

**Botones:**
```typescript
button.on('pointerover', () => {
  scene.tweens.add({
    targets: button,
    scale: 1.05,
    duration: 100,
    ease: 'Quad.easeOut'
  });
});

button.on('pointerdown', () => {
  scene.tweens.add({
    targets: button,
    scale: 0.95,
    duration: 50,
    yoyo: true
  });
});
```

**Elementos Interactivos:**
- Hover: Scale 1.05, glow sutil
- Click: Scale 0.95 → 1.0 (bounce)
- Disabled: Grayscale + alpha 0.5

---

## 🎨 PASO 6: IDENTIDAD VISUAL DIFERENCIADA

### Matriz de Diferenciación

| Juego | Color Primario | Ritmo | Intensidad Efectos | Estilo |
|-------|---------------|-------|-------------------|--------|
| Word Catcher | Cyan `#22D3EE` | Medio | Media | Neón suave |
| Grammar Run | Púrpura `#9333EA` | Rápido | Alta | Neón intenso |
| Sentence Builder | Coral `#FF6B6B` | Lento | Baja | Minimal |
| Image Match | Naranja `#FB5607` | Medio | Media | Cards premium |
| City Explorer | Amarillo `#FBBF24` | Lento | Baja | Exploración |

### Variaciones Cromáticas

Cada juego usa:
- **1 color primario** (identidad)
- **1 color secundario** (contraste)
- **Colores de estado comunes** (verde/rojo/amarillo)

---

## 🏆 PASO 7: ESTADOS DE MISIÓN

### Representación Visual

```typescript
MISSION_STATES = {
  locked: {
    icon: 'lock',
    tint: 0x6B7280,  // Gris
    alpha: 0.5,
    interactive: false
  },
  
  active: {
    icon: 'play',
    glow: 'pulsante',
    border: 'color primario',
    interactive: true
  },
  
  completed: {
    icon: 'check',
    tint: 0x10B981,  // Verde
    particles: 'estrellas doradas',
    interactive: true
  },
  
  failed: {
    icon: 'cross',
    tint: 0xEF4444,  // Rojo
    alpha: 0.7,
    interactive: true
  }
}
```

---

## 🔄 PASO 8: TRANSICIONES

### Transiciones Estándar

**Entrada a Juego:**
```typescript
// 1. Fade in fondo (300ms)
// 2. Scale bounce elementos UI (400ms, stagger 50ms)
// 3. Countdown 3-2-1 (scale + fade cada número)
```

**Finalización:**
```typescript
// 1. Slow motion effect (timeScale 0.5, 500ms)
// 2. Fade out elementos juego (300ms)
// 3. Modal aparece (scale 0.5 → 1.0, back.out, 400ms)
```

**Retorno:**
```typescript
// 1. Modal desaparece (scale 1.0 → 0.8, fade out, 200ms)
// 2. Escena fade out (300ms)
// 3. Emit evento 'gameComplete'
```

---

## ⚡ PASO 9: RENDIMIENTO

### Optimizaciones

1. **Object Pooling** para partículas
2. **Tweens:** Máximo 20 simultáneos
3. **Partículas:** Máximo 50 activas
4. **Glow:** Solo en elementos clave (no todo)
5. **Depth sorting:** Usar capas fijas, no cambiar constantemente

### Límites

- FPS objetivo: 60
- Partículas por efecto: 8-15
- Duración máxima tween: 1000ms
- Alpha mínimo antes de destroy: 0.1

---

## 📚 PASO 10: DOCUMENTACIÓN DE IMPLEMENTACIÓN

### Archivos a Crear/Modificar

**Nuevos:**
1. `VisualEffects.ts` - Sistema unificado de efectos
2. `ParticleManager.ts` - Gestor de partículas
3. `TransitionManager.ts` - Gestor de transiciones

**Modificar:**
1. Cada `*Scene.ts` - Aplicar nuevo sistema visual
2. Cada `*Theme.ts` - Completar paletas
3. `GameStyles.ts` - Añadir constantes faltantes
4. `UIKit.ts` - Mejorar componentes

### Checklist por Juego

- [ ] Fondo rediseñado
- [ ] Elementos principales con nuevo estilo
- [ ] Feedback visual implementado
- [ ] Microinteracciones añadidas
- [ ] Transiciones suavizadas
- [ ] Partículas optimizadas
- [ ] Testing de rendimiento
- [ ] Documentación actualizada

---

## 🎯 PRÓXIMOS PASOS

1. **Instalar phaser3-rex-plugins** (opcional pero recomendado)
2. **Crear sistema de efectos unificado**
3. **Aplicar rediseño juego por juego**
4. **Testing visual y de rendimiento**
5. **Documentar componentes reutilizables**

---

**Fin del documento maestro**
