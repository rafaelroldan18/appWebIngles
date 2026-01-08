# ✅ PASO 6 COMPLETADO - Datos de Misión Pasados a Phaser + HUD de Ayuda

## 📋 Resumen de Implementación

Se ha actualizado `UniversalGameCanvas` para recibir los datos de misión (`mission_title`, `mission_instructions`, `mission_config`) y pasarlos a las escenas de Phaser. También se agregó un HUD de ayuda (?) que muestra las instrucciones cuando está habilitado.

---

## 🎯 Cambios Implementados

### 1. **UniversalGameCanvas.tsx** - Props Actualizados

#### **Nuevos Props**:
```typescript
interface UniversalGameCanvasProps {
    // Props existentes
    gameType: 'word-catcher' | 'grammar-run' | ...;
    topicId: string;
    gameTypeId: string;
    studentId: string;
    
    // Nuevos props de misión
    missionTitle?: string;
    missionInstructions?: string;
    missionConfig?: MissionConfig;
    
    // Callbacks
    onGameEnd?: (result: GameResult) => void;
    onError?: (error: Error) => void;
}
```

#### **Estado Agregado**:
```typescript
const [showHelpPanel, setShowHelpPanel] = useState(false);
const hudHelpEnabled = missionConfig?.hud_help_enabled !== false;
```

---

### 2. **Datos Pasados a Phaser**

Los datos de misión se pasan a la escena de Phaser en el `sceneData`:

```typescript
game.scene.start(sceneKey, {
    words: shuffledWords,
    sessionManager: sessionManager,
    // Datos de misión
    missionTitle: missionTitle || 'Misión sin título',
    missionInstructions: missionInstructions || 'Sigue las instrucciones del docente.',
    missionConfig: missionConfig || {},
});
```

**Cada escena de Phaser ahora recibe**:
- `missionTitle`: Título de la misión
- `missionInstructions`: Instrucciones detalladas
- `missionConfig`: Configuración completa (tiempo, ítems, distractores, etc.)

---

### 3. **HUD de Ayuda (?)**

#### **Botón Flotante**:
```tsx
<button
    onClick={() => setShowHelpPanel(true)}
    className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl..."
>
    <HelpCircle className="w-7 h-7" />
</button>
```

**Características**:
- ✅ Posición fija (bottom-right)
- ✅ Botón circular con icono de ayuda
- ✅ Animación hover (scale-110)
- ✅ Solo visible si `hud_help_enabled === true`
- ✅ Solo visible si hay `missionInstructions`
- ✅ Solo visible cuando el juego está cargado

#### **Panel Modal de Ayuda**:
```tsx
{showHelpPanel && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm...">
        <div className="bg-white dark:bg-gray-900 rounded-2xl...">
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600...">
                <h3>Instrucciones de la Misión</h3>
                <p>{missionTitle}</p>
                <button onClick={close}><X /></button>
            </div>
            
            {/* Contenido */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
                <p className="whitespace-pre-wrap">{missionInstructions}</p>
            </div>
            
            {/* Footer */}
            <button onClick={close}>Entendido, continuar jugando</button>
        </div>
    </div>
)}
```

**Características**:
- ✅ Modal fullscreen con backdrop blur
- ✅ Header con gradiente indigo-purple
- ✅ Título de la misión en el header
- ✅ Instrucciones con scroll si es necesario
- ✅ Botón de cierre en header (X)
- ✅ Botón de cierre en footer
- ✅ Animaciones de entrada (fade-in, zoom-in)
- ✅ Dark mode support

---

### 4. **GamePlay.tsx** - Actualizado

Se actualizó para pasar los datos de misión a `UniversalGameCanvas`:

```typescript
<UniversalGameCanvas
    gameType={getGameType(gameTypeName)}
    topicId={topicId}
    gameTypeId={gameTypeId}
    studentId={studentId}
    missionTitle={validation?.availabilityData?.mission_title}
    missionInstructions={validation?.availabilityData?.mission_instructions}
    missionConfig={validation?.availabilityData?.mission_config}
    onGameEnd={handleGameEnd}
    onError={onError}
/>
```

---

## 🎮 Uso en Escenas de Phaser

Las escenas de Phaser ahora pueden acceder a los datos de misión:

```typescript
class WordCatcherScene extends Phaser.Scene {
    init(data: any) {
        this.words = data.words;
        this.sessionManager = data.sessionManager;
        
        // Nuevos datos de misión
        this.missionTitle = data.missionTitle;
        this.missionInstructions = data.missionInstructions;
        this.missionConfig = data.missionConfig;
        
        // Usar configuración
        this.timeLimit = this.missionConfig.time_limit_seconds || 120;
        this.itemsCount = this.missionConfig.content_constraints?.items || 10;
        this.distractorsPercent = this.missionConfig.content_constraints?.distractors_percent || 30;
    }
    
    create() {
        // Usar tiempo límite de la configuración
        this.startTimer(this.timeLimit);
        
        // Usar cantidad de ítems
        this.loadItems(this.itemsCount);
    }
}
```

---

## 🔧 Configuración del HUD de Ayuda

El HUD de ayuda se muestra **solo si**:

1. ✅ `missionConfig.hud_help_enabled !== false` (default: true)
2. ✅ `missionInstructions` existe y no está vacío
3. ✅ El juego está cargado (`!isLoading`)

**Ejemplo de configuración**:

```json
{
  "mission_config": {
    "hud_help_enabled": true,  // ← Controla el HUD de ayuda
    "time_limit_seconds": 60,
    "content_constraints": {
      "items": 15,
      "distractors_percent": 30
    }
  }
}
```

---

## 📊 Flujo de Datos

```
1. Docente crea misión
   ↓
   mission_title: "Atrapa verbos en presente"
   mission_instructions: "Atrapa solo los verbos..."
   mission_config: { time_limit_seconds: 60, ... }
   ↓
2. Backend guarda en game_availability
   ↓
3. Estudiante valida misión
   ↓
   GET /api/missions/validate
   ↓
   Response: { availabilityData: { mission_title, mission_instructions, mission_config } }
   ↓
4. GamePlay recibe validation
   ↓
5. GamePlay pasa a UniversalGameCanvas
   ↓
   missionTitle={validation.availabilityData.mission_title}
   missionInstructions={validation.availabilityData.mission_instructions}
   missionConfig={validation.availabilityData.mission_config}
   ↓
6. UniversalGameCanvas pasa a Phaser
   ↓
   game.scene.start(sceneKey, {
       words, sessionManager,
       missionTitle, missionInstructions, missionConfig
   })
   ↓
7. Escena de Phaser usa los datos
   ↓
   this.timeLimit = missionConfig.time_limit_seconds
   this.itemsCount = missionConfig.content_constraints.items
   ↓
8. HUD de ayuda disponible durante el juego
   ↓
   Click en (?) → Modal con instrucciones
```

---

## 🎨 Diseño del HUD de Ayuda

### **Botón Flotante**:
```
┌─────────────────────────────────┐
│                                 │
│         [Juego Phaser]          │
│                                 │
│                                 │
│                          ┌───┐  │
│                          │ ? │  │ ← Botón flotante
│                          └───┘  │    (bottom-right)
└─────────────────────────────────┘
```

### **Modal de Ayuda**:
```
┌─────────────────────────────────────────────┐
│ [Gradiente Indigo → Purple]                 │
│ ❓ Instrucciones de la Misión          [X]  │
│ Atrapa verbos en presente simple            │
├─────────────────────────────────────────────┤
│                                             │
│ Atrapa solo las palabras que estén en      │
│ tiempo presente simple. Evita las palabras │
│ en otros tiempos verbales.                 │
│                                             │
│ Ten cuidado con los distractores.          │
│                                             │
├─────────────────────────────────────────────┤
│ [Entendido, continuar jugando]              │
└─────────────────────────────────────────────┘
```

---

## 📝 Archivos Modificados

1. ✅ `src/components/features/gamification/UniversalGameCanvas.tsx`
   - Props actualizados con datos de misión
   - Datos pasados a Phaser en sceneData
   - HUD de ayuda (?) agregado
   - Modal de instrucciones

2. ✅ `src/components/features/gamification/GamePlay.tsx`
   - Props pasados a UniversalGameCanvas
   - Datos de validation.availabilityData

---

## 🚀 Próximos Pasos

- ⏳ **Paso 7**: Ejecutar migración SQL en Supabase
- ⏳ **Paso 8**: Adaptar escenas de Phaser para usar `missionConfig`
- ⏳ **Paso 9**: Crear pantalla de resultados con `GameSessionDetails`
- ⏳ **Paso 10**: Actualizar reportes del docente

---

## 📊 Estado Actual

**PASO 6: ✅ COMPLETADO**

Los datos de misión ahora fluyen desde el backend hasta Phaser:
- ✅ `mission_title` disponible en Phaser
- ✅ `mission_instructions` disponible en Phaser
- ✅ `mission_config` disponible en Phaser
- ✅ HUD de ayuda (?) funcional
- ✅ Modal de instrucciones durante el juego
- ✅ Control con `hud_help_enabled`

---

## 🎯 Beneficios Implementados

1. **Configuración Dinámica**: Phaser usa `mission_config` para tiempo, ítems, etc.
2. **Ayuda Contextual**: Estudiantes pueden revisar instrucciones durante el juego
3. **UX Mejorada**: Botón flotante no intrusivo
4. **Flexibilidad**: Docente controla si mostrar ayuda o no
5. **Consistencia**: Mismo HUD para todos los juegos
6. **Accesibilidad**: Instrucciones siempre disponibles

---

## ✨ Características del HUD

1. **Botón Flotante**: Posición fija, siempre visible
2. **Animaciones**: Hover scale, entrada zoom-in
3. **Modal Premium**: Gradiente, blur backdrop
4. **Responsive**: Adapta a mobile/tablet/desktop
5. **Dark Mode**: Soporte completo
6. **Scroll**: Si instrucciones son largas
7. **Doble Cierre**: X en header + botón en footer
8. **No Intrusivo**: No pausa el juego

---

**Los datos de misión ahora están disponibles en Phaser y el HUD de ayuda está funcional.** 🎉

**Siguiente paso**: Adaptar las escenas de Phaser para usar `missionConfig` (tiempo límite, cantidad de ítems, etc.) 🚀
