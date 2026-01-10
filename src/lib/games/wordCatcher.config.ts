/**
 * Word Catcher Game Configuration
 * Defines all game parameters, scoring, and visual settings
 */

export const WORD_CATCHER_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring
    scoring: {
        correctCatch: 10,
        wrongCatch: -5,
        missedWord: -2,
    },

    // Gameplay - AJUSTADO PARA FLUIDEZ
    gameplay: {
        gameDuration: 120, // segundos
        wordFallSpeed: 1.2, // VELOCIDAD MODERADA (1.0 es normal, 2.0 es rápido)
        wordSpawnInterval: 2200, // milisegundos entre palabras
        maxWordsOnScreen: 6,
    },

    // Defaults para mission_config.word_catcher (cuando no viene en la misión)
    defaults: {
        fall_speed: 220,              // Velocidad de caída en píxeles/segundo
        spawn_rate_ms: 900,           // Intervalo entre spawns en milisegundos
        miss_penalty_enabled: true,   // Penalizar palabras correctas no atrapadas
    },

    // Visual settings - ESTILO MODERNO Y PULIDO
    visual: {
        backgroundColor: '#0f172a', // Fondo más oscuro y elegante
        wordCorrectColor: '#10b981', // Verde esmeralda moderno
        wordIncorrectColor: '#ef4444', // Rojo coral moderno
        wordNeutralColor: '#f8fafc', // Blanco suave
        fontSize: 24, // Ligeramente más grande para mejor legibilidad
        fontFamily: 'Arial Black, sans-serif',
        // Nuevos colores para UI mejorada
        hudBackground: 'rgba(15, 23, 42, 0.9)', // Fondo HUD con transparencia
        hudBorder: '#3b82f6', // Azul brillante para bordes
        scoreColor: '#60a5fa', // Azul cielo para score
        timerColor: '#fbbf24', // Amarillo dorado para timer
        correctCountColor: '#34d399', // Verde menta para contador
        textShadow: '#000000', // Sombra negra para contraste
        glowColor: '#3b82f6', // Color de resplandor
        particleColor: '#60a5fa', // Color de partículas
    },

    // Physics (Opcional si no usas motor de física arcade directo)
    physics: {
        gravity: 0, // En este tipo de juego los tweens manejan el movimiento mejor
    },

    // Validation limits - Evita configuraciones "locas"
    limits: {
        items: { min: 5, max: 30 },
        distractors_percent: { min: 0, max: 60 },
        spawn_rate_ms: { min: 350, max: 2000 },
        fall_speed: { min: 100, max: 500 },
        time_limit_seconds: { min: 15, max: 300 },
    },

    // Defaults por dificultad
    difficultyPresets: {
        fácil: {
            fall_speed: 160,
            spawn_rate_ms: 1100,
            miss_penalty_enabled: true,
        },
        medio: {
            fall_speed: 220,
            spawn_rate_ms: 900,
            miss_penalty_enabled: true,
        },
        difícil: {
            fall_speed: 300,
            spawn_rate_ms: 700,
            miss_penalty_enabled: true,
        },
    },
} as const;

export type WordCatcherConfig = typeof WORD_CATCHER_CONFIG;

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Resolves and validates WordCatcher configuration
 * Applies defaults, clamps values, and ensures safe config
 */
export function resolveWordCatcherConfig(missionConfig: any) {
    const difficulty = missionConfig?.difficulty || 'medio';
    const limits = WORD_CATCHER_CONFIG.limits;

    // Get base config from difficulty preset or defaults
    const difficultyPreset = WORD_CATCHER_CONFIG.difficultyPresets[difficulty as keyof typeof WORD_CATCHER_CONFIG.difficultyPresets]
        || WORD_CATCHER_CONFIG.difficultyPresets.medio;

    // Merge with mission_config.word_catcher if present
    const wordCatcherConfig = missionConfig?.word_catcher || {};

    // Resolve and clamp each value
    const resolved = {
        // Content constraints
        items: clamp(
            missionConfig?.content_constraints?.items || 12,
            limits.items.min,
            limits.items.max
        ),
        distractors_percent: clamp(
            missionConfig?.content_constraints?.distractors_percent || 30,
            limits.distractors_percent.min,
            limits.distractors_percent.max
        ),

        // Time limit
        time_limit_seconds: clamp(
            missionConfig?.time_limit_seconds || 60,
            limits.time_limit_seconds.min,
            limits.time_limit_seconds.max
        ),

        // WordCatcher specific
        fall_speed: clamp(
            wordCatcherConfig.fall_speed ?? difficultyPreset.fall_speed,
            limits.fall_speed.min,
            limits.fall_speed.max
        ),
        spawn_rate_ms: clamp(
            wordCatcherConfig.spawn_rate_ms ?? difficultyPreset.spawn_rate_ms,
            limits.spawn_rate_ms.min,
            limits.spawn_rate_ms.max
        ),
        miss_penalty_enabled: wordCatcherConfig.miss_penalty_enabled ?? difficultyPreset.miss_penalty_enabled,

        // Other settings
        hud_help_enabled: missionConfig?.hud_help_enabled ?? true,
        asset_pack: missionConfig?.asset_pack || 'kenney-ui-1',
        difficulty: difficulty,
    };

    // Log warnings if values were clamped
    if (wordCatcherConfig.fall_speed && wordCatcherConfig.fall_speed !== resolved.fall_speed) {
        console.warn(`[WordCatcher] fall_speed clamped from ${wordCatcherConfig.fall_speed} to ${resolved.fall_speed}`);
    }
    if (wordCatcherConfig.spawn_rate_ms && wordCatcherConfig.spawn_rate_ms !== resolved.spawn_rate_ms) {
        console.warn(`[WordCatcher] spawn_rate_ms clamped from ${wordCatcherConfig.spawn_rate_ms} to ${resolved.spawn_rate_ms}`);
    }

    console.log('[WordCatcher] Resolved config:', resolved);

    return resolved;
}

/**
 * Validates if a mission config is safe for WordCatcher
 */
export function validateWordCatcherConfig(missionConfig: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const limits = WORD_CATCHER_CONFIG.limits;

    // Check items
    const items = missionConfig?.content_constraints?.items;
    if (items !== undefined && (items < limits.items.min || items > limits.items.max)) {
        errors.push(`items must be between ${limits.items.min} and ${limits.items.max}`);
    }

    // Check distractors_percent
    const distractors = missionConfig?.content_constraints?.distractors_percent;
    if (distractors !== undefined && (distractors < limits.distractors_percent.min || distractors > limits.distractors_percent.max)) {
        errors.push(`distractors_percent must be between ${limits.distractors_percent.min} and ${limits.distractors_percent.max}`);
    }

    // Check fall_speed
    const fallSpeed = missionConfig?.word_catcher?.fall_speed;
    if (fallSpeed !== undefined && (fallSpeed < limits.fall_speed.min || fallSpeed > limits.fall_speed.max)) {
        errors.push(`fall_speed must be between ${limits.fall_speed.min} and ${limits.fall_speed.max}`);
    }

    // Check spawn_rate_ms
    const spawnRate = missionConfig?.word_catcher?.spawn_rate_ms;
    if (spawnRate !== undefined && (spawnRate < limits.spawn_rate_ms.min || spawnRate > limits.spawn_rate_ms.max)) {
        errors.push(`spawn_rate_ms must be between ${limits.spawn_rate_ms.min} and ${limits.spawn_rate_ms.max}`);
    }

    // Check time_limit_seconds
    const timeLimit = missionConfig?.time_limit_seconds;
    if (timeLimit !== undefined && (timeLimit < limits.time_limit_seconds.min || timeLimit > limits.time_limit_seconds.max)) {
        errors.push(`time_limit_seconds must be between ${limits.time_limit_seconds.min} and ${limits.time_limit_seconds.max}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
