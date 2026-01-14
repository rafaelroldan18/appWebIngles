# Rediseño de Sentence Builder - Plan de Implementación

## Estado Actual
SentenceBuilderScene usa rectángulos y textos básicos para todo:
- Word cards: Rectangles con texto
- Slots: Rectangles con bordes
- Botones: Rectangles con texto
- Feedback: Texto simple

## Objetivo del Rediseño
Usar el sistema de atlas profesional sin cambiar la lógica del juego.

## Cambios Necesarios

### 1. Preload
```typescript
preload() {
    loadGameAtlases(this, 'sb'); // Carga ui_atlas + sb_atlas
}
```

### 2. HUD
Reemplazar createHUD() para usar GameHUD:
```typescript
this.gameHUD = new GameHUD(this, {
    showScore: true,
    showTimer: true,
    showProgress: true,
    totalItems: this.gameContent.length
});
```

### 3. Word Cards (Word Bank)
Cambiar de Rectangle a Image del atlas:
- Frame normal: `'sb_atlas', 'sentence-builder/tiles/tile_word'`
- Frame activo: `'sb_atlas', 'sentence-builder/tiles/tile_word_active'`
- Usar Container para agrupar sprite + text

### 4. Slots (Sentence Area)
Cambiar de Rectangle a Image del atlas:
- Slot vacío: `'sb_atlas', 'sentence-builder/slots/slot_empty'`
- Slot lleno: `'sb_atlas', 'sentence-builder/slots/slot_filled'`

### 5. Botones de Control
Usar createButton del UIKit:
- Check: `btn_primary`
- Undo: `btn_secondary`
- Clear: `btn_secondary`
- Hint: `btn_small`

### 6. Feedback
Reemplazar feedbackText por:
- `showFeedback(scene, x, y, isCorrect)` - Check/Cross animado
- `showToast(scene, message, duration, isSuccess)` - Mensajes temporales

### 7. Modales
Usar `showModal()` para:
- Game Over
- Confirmaciones
- Instrucciones

## Archivos a Modificar
- `SentenceBuilderScene.ts` - Archivo principal

## Frames Disponibles

### Del atlas común (ui_atlas):
- Botones: btn_primary, btn_secondary, btn_small, btn_round
- Paneles: panel_modal, panel_dark, panel_glass
- Efectos: fx_check, fx_cross, fx_burst, fx_glow
- Icons: icon_pause, icon_help, icon_retry

### Del atlas de Sentence Builder (sb_atlas):
- Tiles: tile_word, tile_word_active
- Slots: slot_empty, slot_filled

## Próximos Pasos
1. Crear versión rediseñada manteniendo toda la lógica
2. Probar que funcione correctamente
3. Ajustar spacing y padding para que se vea limpio
4. Aplicar el mismo patrón a los demás juegos
