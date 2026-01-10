# Ejemplo de mission_config para WordCatcher

Este documento muestra el formato estándar de `mission_config` para misiones de **Word Catcher**.

## Estructura Completa

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

## Descripción de Campos

### Campos Globales (todos los juegos)

- **`time_limit_seconds`** (number): Duración del juego en segundos
  - Ejemplo: `60` = 1 minuto

- **`difficulty`** (string): Nivel de dificultad
  - Valores: `"fácil"`, `"medio"`, `"difícil"`

- **`content_constraints`** (object): Restricciones de contenido
  - **`items`** (number): Cantidad de ítems a mostrar en el juego
  - **`distractors_percent`** (number): Porcentaje de distractores (palabras incorrectas)
    - Ejemplo: `30` = 30% de las palabras serán incorrectas

- **`hud_help_enabled`** (boolean): Si se muestra ayuda en el HUD
  - `true` = mostrar ayuda
  - `false` = ocultar ayuda

- **`asset_pack`** (string): Pack de assets visuales a usar
  - Valores: `"kenney-ui-1"`, `"kenney-red"`, `"modern-neon"`, `"retro-pixel"`

### Campos Específicos de WordCatcher

- **`word_catcher`** (object, opcional): Configuración específica del juego
  
  - **`fall_speed`** (number): Velocidad de caída de las palabras en píxeles/segundo
    - Rango recomendado: `50` - `500`
    - Valor por defecto: `220`
    - Más alto = palabras caen más rápido
  
  - **`spawn_rate_ms`** (number): Intervalo entre aparición de palabras en milisegundos
    - Rango recomendado: `300` - `3000`
    - Valor por defecto: `900`
    - Más bajo = palabras aparecen más frecuentemente
  
  - **`miss_penalty_enabled`** (boolean): Si se penaliza dejar pasar palabras correctas
    - `true` = se restan puntos por palabras correctas no atrapadas
    - `false` = no hay penalización
    - Valor por defecto: `true`

## Valores por Defecto

Si no se especifica el objeto `word_catcher`, se usan estos valores por defecto:

```typescript
{
  fall_speed: 220,
  spawn_rate_ms: 900,
  miss_penalty_enabled: true
}
```

Estos valores están definidos en `src/lib/games/wordCatcher.config.ts` bajo `WORD_CATCHER_CONFIG.defaults`.

## Ejemplos de Configuraciones

### Configuración Fácil
```json
{
  "time_limit_seconds": 90,
  "difficulty": "fácil",
  "content_constraints": {
    "items": 8,
    "distractors_percent": 20
  },
  "word_catcher": {
    "fall_speed": 150,
    "spawn_rate_ms": 1200,
    "miss_penalty_enabled": false
  },
  "hud_help_enabled": true,
  "asset_pack": "kenney-ui-1"
}
```

### Configuración Media (Estándar)
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

### Configuración Difícil
```json
{
  "time_limit_seconds": 45,
  "difficulty": "difícil",
  "content_constraints": {
    "items": 15,
    "distractors_percent": 40
  },
  "word_catcher": {
    "fall_speed": 300,
    "spawn_rate_ms": 600,
    "miss_penalty_enabled": true
  },
  "hud_help_enabled": false,
  "asset_pack": "kenney-ui-1"
}
```

## Implementación

### Tipos TypeScript

El tipo está definido en `src/types/game.types.ts`:

```typescript
export interface MissionConfig {
    difficulty: 'fácil' | 'medio' | 'difícil';
    time_limit_seconds: number;
    content_constraints: {
        items: number;
        distractors_percent: number;
    };
    asset_pack: string;
    hud_help_enabled: boolean;
    word_catcher?: {
        fall_speed: number;
        spawn_rate_ms: number;
        miss_penalty_enabled: boolean;
    };
}
```

### Uso en el Juego

El juego de WordCatcher debe:

1. Leer `mission_config` del objeto de misión
2. Si existe `mission_config.word_catcher`, usar esos valores
3. Si no existe, usar los valores de `WORD_CATCHER_CONFIG.defaults`

Ejemplo:

```typescript
const fallSpeed = missionConfig?.word_catcher?.fall_speed ?? WORD_CATCHER_CONFIG.defaults.fall_speed;
const spawnRate = missionConfig?.word_catcher?.spawn_rate_ms ?? WORD_CATCHER_CONFIG.defaults.spawn_rate_ms;
const penaltyEnabled = missionConfig?.word_catcher?.miss_penalty_enabled ?? WORD_CATCHER_CONFIG.defaults.miss_penalty_enabled;
```
