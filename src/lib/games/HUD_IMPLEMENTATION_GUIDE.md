# Guía de Implementación del Nuevo Sistema de HUD

## 📋 Patrón Estándar para Cualquier Juego

### **Paso 1: Imports**

```typescript
import Phaser from "phaser";
import { preloadCommonAndGame } from "./assets/assetLoader";
import { ASSET_MANIFEST } from "./assets/manifest";
import { createHud } from "./ui/hudFactory";
```

### **Paso 2: Declarar HUD**

```typescript
export class MyGameScene extends Phaser.Scene {
  private hud!: ReturnType<typeof createHud>;
  private score = 0;
  private timeRemaining = 60;
  
  constructor() {
    super("MyGameScene");
  }
```

### **Paso 3: Preload Assets**

```typescript
preload() {
  // Cambia el gameKey según el juego:
  // "word-catcher", "image-match", "grammar-run", "sentence-builder", "city-explorer"
  preloadCommonAndGame(this, "grammar-run", ASSET_MANIFEST);
}
```

### **Paso 4: Create HUD**

```typescript
create() {
  // Crear HUD con configuración
  this.hud = createHud(this, {
    showTimer: true,      // Mostrar temporizador
    showLives: true,      // Mostrar vidas
    showProgress: true,   // Mostrar progreso
    showHelp: true,       // Mostrar botón de ayuda
  });

  // Configurar callbacks
  this.hud.onPause = () => this.handlePause();
  this.hud.onHelp = () => this.showHelp();

  // Inicializar valores
  this.updateScore(0);
  this.updateTimer(60);
}
```

### **Paso 5: Métodos de Actualización**

```typescript
private updateScore(value: number) {
  this.score = value;
  this.hud.scoreText.setText(`Score: ${this.score}`);
}

private updateTimer(value: number) {
  this.timeRemaining = value;
  if (this.hud.timeText) {
    this.hud.timeText.setText(`Time: ${this.timeRemaining}`);
  }
}

private updateLives(value: number) {
  if (this.hud.livesText) {
    this.hud.livesText.setText(`Lives: ${value}`);
  }
}

private updateProgress(current: number, total: number) {
  if (this.hud.progressText) {
    this.hud.progressText.setText(`${current}/${total}`);
  }
}
```

### **Paso 6: Handlers**

```typescript
private handlePause() {
  this.scene.pause();
  // Mostrar modal de pausa si es necesario
}

private showHelp() {
  // Mostrar instrucciones o hints
}
```

---

## 🎮 Ejemplos por Juego

### **Word Catcher**

```typescript
preload() {
  preloadCommonAndGame(this, "word-catcher", ASSET_MANIFEST);
}

create() {
  this.hud = createHud(this, {
    showTimer: true,
    showLives: false,
    showProgress: false,
    showHelp: true,
  });
  
  this.hud.onPause = () => this.togglePause();
  this.hud.scoreText.setText(`Score: 0`);
}
```

### **Image Match**

```typescript
preload() {
  preloadCommonAndGame(this, "image-match", ASSET_MANIFEST);
}

create() {
  this.hud = createHud(this, {
    showTimer: true,
    showLives: false,
    showProgress: true,
    showHelp: true,
  });
  
  const totalPairs = this.getTotalPairs();
  this.updateProgress(0, totalPairs);
}
```

### **Grammar Run**

```typescript
preload() {
  preloadCommonAndGame(this, "grammar-run", ASSET_MANIFEST);
}

create() {
  this.hud = createHud(this, {
    showTimer: true,
    showLives: true,
    showProgress: true,
    showHelp: true,
  });
  
  this.updateLives(3);
}
```

### **Sentence Builder**

```typescript
preload() {
  preloadCommonAndGame(this, "sentence-builder", ASSET_MANIFEST);
}

create() {
  this.hud = createHud(this, {
    showTimer: true,
    showLives: false,
    showProgress: true,
    showHelp: true,
  });
  
  this.updateProgress(0, this.totalSentences);
}
```

### **City Explorer**

```typescript
preload() {
  preloadCommonAndGame(this, "city-explorer", ASSET_MANIFEST);
}

create() {
  this.hud = createHud(this, {
    showTimer: true,
    showLives: false,
    showProgress: true,
    showHelp: true,
  });
  
  this.updateProgress(0, this.totalCheckpoints);
}
```

---

## ✅ Checklist de Migración

Para migrar un juego existente al nuevo sistema:

- [ ] **Imports**
  - [ ] Importar `preloadCommonAndGame`
  - [ ] Importar `ASSET_MANIFEST`
  - [ ] Importar `createHud`
  - [ ] Remover imports antiguos (AtlasLoader, GameHUD)

- [ ] **Propiedades**
  - [ ] Cambiar `private gameHUD!: GameHUD` por `private hud!: ReturnType<typeof createHud>`
  - [ ] Remover propiedades individuales (scoreText, timerText, etc.)

- [ ] **Preload**
  - [ ] Reemplazar `loadGameAtlases(this, 'key')` por `preloadCommonAndGame(this, 'game-name', ASSET_MANIFEST)`

- [ ] **Create**
  - [ ] Reemplazar `new GameHUD(...)` por `createHud(...)`
  - [ ] Configurar callbacks: `this.hud.onPause = ...`
  - [ ] Inicializar textos directamente

- [ ] **Actualizaciones**
  - [ ] Reemplazar `this.gameHUD.update({...})` por `this.hud.scoreText.setText(...)`
  - [ ] Actualizar todas las referencias a elementos del HUD

---

## 🎯 Ventajas del Nuevo Sistema

1. **Más Simple:** Factory function en lugar de clase
2. **Más Directo:** Acceso directo a elementos
3. **Más Flexible:** Configuración clara
4. **Más Consistente:** Usa Fredoka y ui_atlas
5. **Sin Romper Lógica:** Solo cambia la UI, no el gameplay

---

## 📝 Notas Importantes

- **gameKey en manifest:** Debe coincidir exactamente con las claves en `ASSET_MANIFEST`
- **Callbacks opcionales:** `onPause` y `onHelp` son opcionales
- **Elementos condicionales:** Verifica existencia antes de usar (`if (this.hud.timeText)`)
- **Fuente Fredoka:** Ya está cargada via CSS, no necesitas precargarla
- **Depth:** El HUD está en depth 1000, asegúrate que tu contenido esté por debajo

---

**Creado:** 2026-01-13
**Sistema:** HUD Factory v1.0
**Estado:** Listo para Producción ✨
