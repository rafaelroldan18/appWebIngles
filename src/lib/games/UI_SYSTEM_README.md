# Sistema de UI para Juegos - Documentación

Este documento describe el sistema completo de UI reutilizable para todos los juegos.

## 📦 Componentes del Sistema

### 1. **AtlasLoader.ts** - Sistema de Carga de Atlas

Gestiona la carga estandarizada de texturas usando atlas.

**Uso básico:**
```typescript
import { loadGameAtlases } from './AtlasLoader';

preload() {
    // Carga automáticamente ui_atlas (común) + atlas del juego
    loadGameAtlases(this, 'wc'); // 'wc' | 'im' | 'gr' | 'sb' | 'ce'
}
```

**Helpers disponibles:**
- `getUIFrame(frameName)` - Obtiene un frame del atlas común
- `getGameFrame(gameKey, frameName)` - Obtiene un frame del atlas del juego
- `getCommonAtlasKey()` - Devuelve 'ui_atlas'
- `getGameAtlasKey(gameKey)` - Devuelve el key del atlas del juego

---

### 2. **UIKit.ts** - Componentes UI Reutilizables

Biblioteca de componentes visuales listos para usar.

#### 📋 Paneles

```typescript
import { createPanel } from './UIKit';

const panel = createPanel(
    scene,
    'common-ui/panels/panel_dark',  // frame del atlas
    x, y,                            // posición
    400, 300                         // tamaño
);
```

**Frames de paneles disponibles:**
- `common-ui/panels/panel_card` - Panel tipo tarjeta
- `common-ui/panels/panel_dark` - Panel oscuro
- `common-ui/panels/panel_glass` - Panel semi-transparente
- `common-ui/panels/panel_modal` - Panel para modales

#### 🔘 Botones

```typescript
import { createButton, createIconButton } from './UIKit';

// Botón con texto
const button = createButton(
    scene,
    'common-ui/buttons/btn_primary',
    x, y,
    'PLAY',
    () => console.log('Clicked!'),
    { scale: 1.5, fontSize: '24px' }
);

// Botón con icono
const pauseBtn = createIconButton(
    scene,
    'common-ui/buttons/btn_round',
    'common-ui/icons/icon_pause',
    x, y,
    () => scene.scene.pause()
);
```

**Frames de botones disponibles:**
- `common-ui/buttons/btn_primary` - Botón primario
- `common-ui/buttons/btn_secondary` - Botón secundario
- `common-ui/buttons/btn_round` - Botón redondo
- `common-ui/buttons/btn_small` - Botón pequeño

**Frames de iconos disponibles:**
- `common-ui/icons/icon_pause`
- `common-ui/icons/icon_play`
- `common-ui/icons/icon_help`
- `common-ui/icons/icon_sound_on`
- `common-ui/icons/icon_sound_off`
- `common-ui/icons/icon_retry`

#### ✨ Efectos Visuales

```typescript
import { showFeedback, showBurst, showGlow } from './UIKit';

// Mostrar check/cross
showFeedback(scene, x, y, isCorrect);

// Mostrar explosión
showBurst(scene, x, y, 0xFFD700);

// Mostrar brillo
showGlow(scene, x, y, 0xFFFFFF);
```

**Frames de efectos disponibles:**
- `common-ui/fx/fx_check` - Marca de verificación
- `common-ui/fx/fx_cross` - Cruz/error
- `common-ui/fx/fx_burst` - Explosión
- `common-ui/fx/fx_glow` - Brillo

#### 💬 Modales y Toasts

```typescript
import { showModal, showToast } from './UIKit';

// Modal con botones
showModal(scene, {
    title: 'GAME OVER',
    message: '¿Quieres jugar de nuevo?',
    buttons: [
        { label: 'SÍ', onClick: () => restart(), isPrimary: true },
        { label: 'NO', onClick: () => quit(), isPrimary: false }
    ]
});

// Toast temporal
showToast(scene, '¡Correcto! +10 puntos', 2000, true);
```

#### 📊 Barra de Progreso

```typescript
import { createProgressBar } from './UIKit';

const progressBar = createProgressBar(scene, x, y, 300, 20);
progressBar.setProgress(75); // 0-100
```

#### 🏆 Rewards

**Frames de recompensas disponibles:**
- `common-ui/rewards/star_full` - Estrella llena
- `common-ui/rewards/star_empty` - Estrella vacía
- `common-ui/rewards/trophy` - Trofeo
- `common-ui/rewards/badge_gold` - Medalla dorada

---

### 3. **GameHUD.ts** - HUD Común

HUD estandarizado para todos los juegos.

```typescript
import { GameHUD } from './GameHUD';

create() {
    this.gameHUD = new GameHUD(this, {
        showScore: true,
        showTimer: true,
        showLives: false,
        showProgress: false,
        showPauseButton: true,
        showHelpButton: true,
        maxLives: 3,
        totalItems: 10
    });

    // Configurar callbacks
    this.gameHUD.onPause(() => this.togglePause());
    this.gameHUD.onHelp(() => this.showHelp());

    // Actualizar valores
    this.gameHUD.update({
        score: 100,
        timeRemaining: 45,
        lives: 2,
        progress: 50
    });
}
```

---

## 🎨 Paleta de Colores Recomendada

```typescript
const COLORS = {
    primary: 0x6366F1,    // Índigo
    success: 0x10B981,    // Verde
    error: 0xEF4444,      // Rojo
    warning: 0xF59E0B,    // Ámbar
    gold: 0xFFD700,       // Dorado
    white: 0xFFFFFF,
    black: 0x000000
};
```

---

## 📝 Ejemplos Completos

Ver `UIKit.examples.ts` para ejemplos detallados de:
- Panel de pausa
- Modal de fin de juego
- Sistema de feedback
- Barra de progreso
- Sistema de vidas
- Y más...

---

## 🎮 Integración en Juegos

### Paso 1: Cargar Atlas
```typescript
preload() {
    loadGameAtlases(this, 'wc'); // Carga ui_atlas + wc_atlas
}
```

### Paso 2: Crear HUD
```typescript
create() {
    this.gameHUD = new GameHUD(this, {
        showScore: true,
        showTimer: true
    });
}
```

### Paso 3: Usar Componentes
```typescript
// Mostrar feedback
showFeedback(this, x, y, true);

// Mostrar modal
showModal(this, {
    message: '¡Nivel completado!',
    buttons: [{ label: 'CONTINUAR', onClick: () => nextLevel() }]
});
```

---

## 🔧 Personalización

Todos los componentes aceptan opciones de personalización:

```typescript
createButton(scene, frame, x, y, label, onClick, {
    scale: 1.5,           // Escala del botón
    fontSize: '24px',     // Tamaño de fuente
    fontColor: '#FFD700', // Color del texto
    hoverScale: 1.1,      // Escala al hacer hover
    clickScale: 0.95      // Escala al hacer click
});
```

---

## 📚 Recursos del Atlas Común

El atlas `ui_atlas` contiene todos los recursos compartidos:
- 4 tipos de paneles
- 4 tipos de botones
- 7 iconos
- 4 efectos visuales
- 4 elementos de recompensa

**Ubicación:** `/public/assets/atlases/common-ui/`

---

## ✅ Checklist de Implementación

- [x] Sistema de carga de atlas (AtlasLoader)
- [x] HUD común reutilizable (GameHUD)
- [x] UI Kit con componentes básicos (UIKit)
- [x] Ejemplos de uso (UIKit.examples)
- [ ] Aplicar a todos los juegos
- [ ] Diseño específico por juego
- [ ] Testing y refinamiento

---

## 🚀 Próximos Pasos

1. Aplicar el HUD a todos los juegos (IM, GR, SB, CE)
2. Crear componentes específicos por juego usando el UIKit
3. Implementar animaciones y transiciones
4. Optimizar rendimiento
5. Testing en diferentes resoluciones

---

**Última actualización:** 2026-01-13
