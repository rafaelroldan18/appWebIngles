# Guía de Integración Phaser + Next.js + React + TypeScript

## ✅ Sistema Actual

Tu aplicación ya tiene un componente robusto de integración: **`UniversalGameCanvas.tsx`**

### **Características Implementadas:**

1. ✅ **"use client"** - Evita SSR
2. ✅ **useEffect con cleanup** - Destruye el juego correctamente
3. ✅ **useRef para container** - Referencia estable al DOM
4. ✅ **Configuración Phaser** - Scale.FIT + CENTER_BOTH
5. ✅ **Múltiples escenas** - Soporta todos los juegos
6. ✅ **GameSessionManager** - Gestión de sesiones
7. ✅ **Estados de carga** - initializing → briefing → playing
8. ✅ **Manejo de errores** - Error boundaries

---

## 📋 Patrón Estándar (Ya Implementado)

### **Estructura del Componente:**

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MyGameScene } from '@/lib/games/MyGameScene';

export default function PhaserGameWrapper() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Crear instancia de Phaser
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 1280,
      height: 720,
      backgroundColor: '#0b1020',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [MyGameScene],
    });

    gameRef.current = game;

    // Cleanup al desmontar
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

---

## 🎯 Tu Implementación Actual

### **UniversalGameCanvas.tsx** (Mejorado)

**Ventajas de tu implementación:**

1. **Genérico:** Soporta múltiples juegos via prop `gameType`
2. **Gestión de Estado:** Maneja initializing → briefing → playing
3. **Carga de Datos:** Integrado con GameLoader
4. **Sesiones:** GameSessionManager para tracking
5. **Callbacks:** onGameEnd, onError para comunicación con React
6. **UI de Carga:** Estados visuales durante carga
7. **Briefing Screen:** Pantalla de instrucciones antes de jugar

### **Configuración de Phaser:**

```typescript
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameContainerRef.current,
  width: 1280,
  height: 720,
  backgroundColor: '#0b1020',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [selectedScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
});
```

---

## 🔧 Mejores Prácticas

### **1. Evitar SSR (Server-Side Rendering)**

✅ **Ya implementado:**
```typescript
'use client'; // Directiva de Next.js 13+
```

### **2. Cleanup Correcto**

✅ **Ya implementado:**
```typescript
useEffect(() => {
  // ... crear juego
  return () => {
    game.destroy(true); // true = remover canvas
    gameRef.current = null;
  };
}, []);
```

### **3. Verificar Container**

✅ **Ya implementado:**
```typescript
if (!containerRef.current) return;
```

### **4. Evitar Re-renders**

✅ **Ya implementado:**
```typescript
const gameRef = useRef<Phaser.Game | null>(null);
// useRef no causa re-renders
```

### **5. Comunicación Phaser ↔ React**

✅ **Ya implementado:**
```typescript
// Desde Phaser Scene
this.events.emit('game-end', result);

// En React
scene.events.on('game-end', (result) => {
  onGameEnd?.(result);
});
```

---

## 📦 Estructura de Archivos

```
src/
├── components/
│   └── features/
│       └── gamification/
│           └── UniversalGameCanvas.tsx ✅ Wrapper principal
├── lib/
│   └── games/
│       ├── assets/
│       │   ├── manifest.ts ✅ Assets centralizados
│       │   └── assetLoader.ts ✅ Loader
│       ├── ui/
│       │   └── hudFactory.ts ✅ HUD común
│       ├── WordCatcherScene.ts ✅ Escena
│       ├── ImageMatchScene.ts ✅ Escena
│       ├── GrammarRunScene.ts ✅ Escena
│       ├── SentenceBuilderScene.ts ✅ Escena
│       ├── CityExplorerScene.ts ✅ Escena
│       ├── GameLoader.ts ✅ Carga de datos
│       └── GameSessionManager.ts ✅ Sesiones
└── public/
    └── assets/
        └── atlases/ ✅ Texturas
```

---

## 🎮 Uso del Componente

### **Ejemplo en una Página:**

```typescript
import UniversalGameCanvas from '@/components/features/gamification/UniversalGameCanvas';

export default function GamePage() {
  const handleGameEnd = (result) => {
    console.log('Game ended:', result);
    // Navegar a resultados, guardar en DB, etc.
  };

  const handleError = (error) => {
    console.error('Game error:', error);
    // Mostrar mensaje de error
  };

  return (
    <div className="w-full h-screen">
      <UniversalGameCanvas
        gameType="word-catcher"
        topicId="topic-123"
        gameTypeId="game-456"
        studentId="student-789"
        missionTitle="Catch the Verbs!"
        missionInstructions="Click on all the verbs you see falling down."
        missionConfig={{
          time_limit: 60,
          lives: 3,
          // ... más config
        }}
        onGameEnd={handleGameEnd}
        onError={handleError}
      />
    </div>
  );
}
```

---

## 🚀 Optimizaciones Adicionales (Opcionales)

### **1. Lazy Loading de Escenas**

```typescript
const loadScene = async (gameType: string) => {
  switch (gameType) {
    case 'word-catcher':
      const { WordCatcherScene } = await import('@/lib/games/WordCatcherScene');
      return WordCatcherScene;
    // ... otros juegos
  }
};
```

### **2. Preload de Assets**

```typescript
// Ya lo tienes con preloadCommonAndGame()
preload() {
  preloadCommonAndGame(this, 'word-catcher', ASSET_MANIFEST);
}
```

### **3. Responsive Scaling**

```typescript
// Ya implementado
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```

### **4. Performance Monitoring**

```typescript
useEffect(() => {
  const game = new Phaser.Game({
    // ... config
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
  });
}, []);
```

---

## ✅ Checklist de Integración

Tu implementación ya cumple con todo:

- [x] **"use client"** para evitar SSR
- [x] **useRef** para container y game instance
- [x] **useEffect** con cleanup
- [x] **Verificación de container** antes de crear juego
- [x] **Destrucción correcta** del juego
- [x] **Configuración de scale** responsive
- [x] **Múltiples escenas** soportadas
- [x] **Comunicación Phaser ↔ React** via events
- [x] **Manejo de errores** robusto
- [x] **Estados de carga** visuales

---

## 🎯 Conclusión

**Tu integración Phaser + Next.js ya está implementada de forma profesional y estable.**

No necesitas cambios en `UniversalGameCanvas.tsx`. El componente ya sigue todas las mejores prácticas:

1. ✅ Evita SSR con "use client"
2. ✅ Usa refs para estabilidad
3. ✅ Cleanup correcto
4. ✅ Responsive scaling
5. ✅ Manejo de múltiples juegos
6. ✅ Comunicación bidireccional
7. ✅ Estados de carga
8. ✅ Error handling

**El sistema está listo para producción.** ✨

---

**Creado:** 2026-01-13
**Sistema:** Phaser + Next.js Integration
**Estado:** Producción Ready ✅
