# Paso 6: Validación de Lógica de Misión

## 🎯 Objetivo

Implementar un sistema completo de validación de misiones que verifica:
1. **Disponibilidad activa** (`is_active`)
2. **Rango de fechas** (`available_from`, `available_until`)
3. **Intentos restantes** (contando `game_sessions` vs `max_attempts`)
4. **Teoría requerida** (`show_theory` → muestra `topic_rules`)
5. **Guardado de sesión** y actualización de progreso

## ✅ Componentes Implementados

### 1. MissionValidator (`src/lib/games/MissionValidator.ts`)

**Responsabilidad:** Validar todas las condiciones de una misión

#### Métodos Principales:

```typescript
// Validación completa de misión
static async validateMission(
    studentId: string,
    availabilityId: string
): Promise<MissionValidationResult>

// Verificar si puede iniciar sesión
static async canStartSession(
    studentId: string,
    availabilityId: string
): Promise<{ canStart: boolean; reason?: string }>

// Obtener resumen de misión
static async getMissionSummary(
    studentId: string,
    availabilityId: string
): Promise<MissionSummary | null>
```

#### Validaciones que Realiza:

1. ✅ **Misión existe**
   ```typescript
   const availability = await this.getAvailability(availabilityId);
   if (!availability) return { canPlay: false, reason: 'Misión no encontrada' };
   ```

2. ✅ **Está activa**
   ```typescript
   if (!availability.is_active) {
       return { canPlay: false, reason: 'Esta misión no está activa' };
   }
   ```

3. ✅ **Dentro de rango de fechas**
   ```typescript
   const now = new Date();
   const availableFrom = new Date(availability.available_from);
   const availableUntil = availability.available_until 
       ? new Date(availability.available_until) 
       : null;

   if (now < availableFrom) {
       return { canPlay: false, reason: 'Aún no disponible' };
   }

   if (availableUntil && now > availableUntil) {
       return { canPlay: false, reason: 'Misión expirada' };
   }
   ```

4. ✅ **Tiene intentos disponibles**
   ```typescript
   const attemptsUsed = await this.countAttempts(
       studentId, 
       availability.topic_id, 
       availability.game_type_id
   );

   const attemptsRemaining = availability.max_attempts - attemptsUsed;

   if (attemptsUsed >= availability.max_attempts) {
       return { canPlay: false, reason: 'Límite de intentos alcanzado' };
   }
   ```

5. ✅ **Carga teoría si es necesario**
   ```typescript
   let theoryContent = null;
   if (availability.show_theory) {
       theoryContent = await this.getTheoryContent(availability.topic_id);
   }
   ```

### 2. API Endpoints Creados

#### GET `/api/games/availability/[availabilityId]`
**Propósito:** Obtener información de una misión específica

```typescript
// Incluye joins con game_types y topics
const { data } = await supabase
    .from('game_availability')
    .select(`
        *,
        game_types (name, description),
        topics (title, description)
    `)
    .eq('availability_id', availabilityId)
    .single();
```

#### GET `/api/games/sessions/count`
**Propósito:** Contar intentos de un estudiante

```typescript
// Query params: studentId, topicId, gameTypeId
const { count } = await supabase
    .from('game_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('topic_id', topicId)
    .eq('game_type_id', gameTypeId);

return { count: count || 0 };
```

#### GET `/api/topics/[topicId]/theory`
**Propósito:** Obtener contenido de teoría (topic_rules)

```typescript
const { data } = await supabase
    .from('topic_rules')
    .select('*')
    .eq('topic_id', topicId)
    .order('order_index', { ascending: true });

return data || [];
```

### 3. TheoryModal (`src/components/features/gamification/TheoryModal.tsx`)

**Responsabilidad:** Mostrar contenido de teoría antes del juego

#### Características:

- ✅ Navegación por páginas de teoría
- ✅ Soporte para múltiples formatos (JSON, HTML, plain text, markdown)
- ✅ Indicadores de progreso
- ✅ Botón "Comenzar Juego" al finalizar
- ✅ Opción de cerrar (cancela el juego)

#### Formatos Soportados:

**JSON Estructurado:**
```json
{
    "sections": [
        {
            "title": "Present Simple",
            "content": "Se usa para...",
            "examples": [
                "I play football",
                "She works here"
            ]
        }
    ]
}
```

**HTML:**
```html
<h3>Present Simple</h3>
<p>Se usa para...</p>
<ul>
    <li>I play football</li>
</ul>
```

**Plain Text / Markdown:**
```
# Present Simple
Se usa para...
- I play football
- She works here
```

### 4. MissionGate (`src/components/features/gamification/MissionGate.tsx`)

**Responsabilidad:** Componente gate que valida antes de renderizar el juego

#### Flujo de Validación:

```
Usuario intenta jugar
        ↓
MissionGate valida misión
        ↓
    ¿Es válida?
    /        \
  NO         SÍ
   ↓          ↓
Muestra    ¿Requiere teoría?
error      /            \
         NO             SÍ
          ↓              ↓
    Renderiza      Muestra TheoryModal
      juego              ↓
                   Usuario completa teoría
                         ↓
                   Renderiza juego
```

#### Estados del Componente:

1. **Validando** - Spinner de carga
2. **No puede jugar** - Mensaje de error con razón
3. **Mostrando teoría** - TheoryModal
4. **Puede jugar** - Renderiza el juego

#### Props:

```typescript
interface MissionGateProps {
    studentId: string;
    availabilityId: string;
    onMissionValidated: (data: {
        topicId: string;
        gameTypeId: string;
        canPlay: boolean;
    }) => void;
    children: React.ReactNode; // El juego
}
```

## 🔄 Flujo Completo de Validación

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario hace click en "Jugar Misión"                        │
│    availabilityId = "mission_123"                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. MissionGate se monta                                         │
│    useEffect(() => validateMission(), [])                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. MissionValidator.validateMission()                           │
│                                                                 │
│    a) GET /api/games/availability/mission_123                   │
│       → Obtiene info de la misión                              │
│                                                                 │
│    b) Verifica is_active                                        │
│       ❌ Si false → return { canPlay: false }                   │
│                                                                 │
│    c) Verifica fechas                                           │
│       ❌ Si fuera de rango → return { canPlay: false }          │
│                                                                 │
│    d) GET /api/games/sessions/count?studentId=X&topicId=Y...    │
│       → Cuenta intentos usados                                 │
│                                                                 │
│    e) Verifica intentos                                         │
│       ❌ Si attemptsUsed >= max_attempts → return { canPlay: false } │
│                                                                 │
│    f) Si show_theory = true:                                    │
│       GET /api/topics/Y/theory                                  │
│       → Obtiene topic_rules                                    │
│                                                                 │
│    g) ✅ return { canPlay: true, showTheory, theoryContent }    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. MissionGate procesa resultado                                │
│                                                                 │
│    if (!canPlay) {                                              │
│        → Muestra mensaje de error                              │
│        → Muestra intentos usados                               │
│        → Botón "Volver"                                        │
│    }                                                            │
│                                                                 │
│    else if (showTheory && !hasSeenTheory) {                     │
│        → Muestra TheoryModal                                   │
│    }                                                            │
│                                                                 │
│    else {                                                       │
│        → Renderiza el juego (children)                         │
│    }                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5a. Si debe mostrar teoría:                                     │
│                                                                 │
│     TheoryModal renderiza topic_rules                           │
│     Usuario navega por páginas                                  │
│     Usuario hace click en "Comenzar Juego"                      │
│     → setHasSeenTheory(true)                                    │
│     → Renderiza el juego                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Juego se ejecuta normalmente                                 │
│    (UniversalGameCanvas → Phaser → GameSessionManager)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Al finalizar el juego:                                       │
│                                                                 │
│    GameSessionManager.endSession()                              │
│    → PUT /api/games/sessions/{sessionId}                        │
│    → Guarda score, correct_count, wrong_count, etc.            │
│    → completed = true                                          │
│                                                                 │
│    Esto incrementa el contador de intentos para la próxima vez │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Ejemplo de Uso Completo

### Escenario: Estudiante intenta jugar "Word Catcher - Animals"

#### Configuración de la Misión:
```json
{
    "availability_id": "mission_123",
    "game_type_id": "word_catcher",
    "topic_id": "animals_456",
    "parallel_id": "class_789",
    "available_from": "2026-01-01T00:00:00Z",
    "available_until": "2026-12-31T23:59:59Z",
    "max_attempts": 3,
    "show_theory": true,
    "is_active": true
}
```

#### Paso 1: Validación
```typescript
const result = await MissionValidator.validateMission("student_001", "mission_123");

// Resultado:
{
    isValid: true,
    canPlay: true,
    availability: { ... },
    attemptsUsed: 1,      // Ya jugó 1 vez
    attemptsRemaining: 2,  // Le quedan 2 intentos
    showTheory: true,
    theoryContent: [
        {
            rule_id: "rule_1",
            title: "Animals Vocabulary",
            content_json: {
                sections: [
                    {
                        title: "Common Animals",
                        content: "Learn these basic animal names...",
                        examples: ["cat", "dog", "bird"]
                    }
                ]
            },
            format: "json"
        }
    ]
}
```

#### Paso 2: Mostrar Teoría
```tsx
<TheoryModal
    isOpen={true}
    theoryContent={result.theoryContent}
    topicTitle="Animals"
    onContinue={() => {
        // Usuario completó la teoría
        // Ahora puede jugar
    }}
/>
```

#### Paso 3: Jugar
```tsx
<UniversalGameCanvas
    gameType="word-catcher"
    topicId="animals_456"
    gameTypeId="word_catcher"
    studentId="student_001"
/>
```

#### Paso 4: Finalizar y Guardar
```typescript
// Al terminar el juego:
await sessionManager.endSession({
    wordsShown: 15,
    finalTime: 60
});

// Ahora attemptsUsed = 2
// attemptsRemaining = 1
```

## 🎨 Ejemplo de Integración en Página

```tsx
'use client';

import MissionGate from '@/components/features/gamification/MissionGate';
import UniversalGameCanvas from '@/components/features/gamification/UniversalGameCanvas';
import { useState } from 'react';

export default function GamePage({ params }: { params: { availabilityId: string } }) {
    const [missionData, setMissionData] = useState<any>(null);

    return (
        <div className="container mx-auto p-8">
            <MissionGate
                studentId="student_001"
                availabilityId={params.availabilityId}
                onMissionValidated={(data) => {
                    console.log('Mission validated:', data);
                    setMissionData(data);
                }}
            >
                {missionData?.canPlay && (
                    <UniversalGameCanvas
                        gameType="word-catcher"
                        topicId={missionData.topicId}
                        gameTypeId={missionData.gameTypeId}
                        studentId="student_001"
                        onGameEnd={(result) => {
                            console.log('Game ended:', result);
                            // Redirigir a resultados o dashboard
                        }}
                    />
                )}
            </MissionGate>
        </div>
    );
}
```

## ✅ Checklist de Validaciones

### Antes de Jugar:
- [x] Misión existe en BD
- [x] Misión está activa (`is_active = true`)
- [x] Fecha actual >= `available_from`
- [x] Fecha actual <= `available_until` (si existe)
- [x] `attemptsUsed < max_attempts`
- [x] Si `show_theory = true`, mostrar `topic_rules`

### Durante el Juego:
- [x] Contenido filtrado por `target_game_type_id`
- [x] SessionManager trackea score y estadísticas
- [x] Phaser usa solo contenido recibido

### Después del Juego:
- [x] SessionManager guarda sesión en BD
- [x] `completed = true`
- [x] Se incrementa contador de intentos
- [x] Se actualiza progreso del estudiante

## 🚀 Beneficios de esta Arquitectura

1. **Control Total del Docente**
   - Define cuándo está disponible cada misión
   - Limita intentos por estudiante
   - Decide si mostrar teoría antes del juego

2. **Experiencia del Estudiante**
   - Mensajes claros si no puede jugar
   - Repaso de teoría antes del juego (si es necesario)
   - Sabe cuántos intentos le quedan

3. **Integridad de Datos**
   - No se pueden hacer más intentos de los permitidos
   - No se puede jugar fuera del rango de fechas
   - Todas las validaciones son server-side

4. **Escalabilidad**
   - Fácil agregar nuevas validaciones
   - Fácil modificar reglas de disponibilidad
   - Sistema modular y mantenible

---

**Estado:** ✅ Completado  
**Fecha:** 2026-01-05
