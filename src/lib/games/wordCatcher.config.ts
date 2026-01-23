/**
 * Word Catcher Game Configuration
 * Defines all game parameters, scoring, and visual settings
 */

export const WORD_CATCHER_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring (base values, pueden ser sobrescritos por mission_config)
    scoring: {
        points_correct: 10,      // Points for catching correct word
        points_wrong: -5,        // Penalty for catching wrong word
        streak_bonus: true,      // Enable streak bonuses
    },

    // Gameplay (NO TOCAR: gameplay)
    gameplay: {
        gameDuration: 120,
        wordFallSpeed: 1.2,
        wordSpawnInterval: 2200,
        maxWordsOnScreen: 6,
    },

    // Defaults para mission_config.word_catcher
    defaults: {
        fall_speed: 120,              // Reducido de 220 a 120 (más lento)
        spawn_rate_ms: 1800,          // Aumentado de 900 a 1800 (más tiempo entre palabras)
        miss_penalty_enabled: true,
    },

    // ✅ Visual settings (UI-only)
    visual: {
        // Fondo general (aunque tú usas imagen, esto te sirve como base global)
        backgroundColor: '#0f172a',

        // Estados de acierto/error
        wordCorrectColor: '#10b981',
        wordIncorrectColor: '#ef4444',
        wordNeutralColor: '#f8fafc',

        // Tipografía
        fontSize: 24,
        fontFamily: 'Fredoka',

        // HUD (UI-only)
        hudBackground: 'rgba(15, 23, 42, 0.9)',
        hudBorder: '#3b82f6',
        scoreColor: '#60a5fa',
        timerColor: '#fbbf24',
        correctCountColor: '#34d399',
        textShadow: '#000000',

        // FX (UI-only)
        glowColor: '#3b82f6',
        particleColor: '#60a5fa',
    },

    physics: {
        gravity: 0,
    },

    // Validation limits
    limits: {
        items: { min: 1, max: 50 },
        distractors_percent: { min: 0, max: 90 },
        spawn_rate_ms: { min: 200, max: 3000 },
        fall_speed: { min: 50, max: 800 },
        time_limit_seconds: { min: 5, max: 600 },
    },

    // Defaults por dificultad
    difficultyPresets: {
        fácil: {
            fall_speed: 90,              // Reducido de 160 a 90 (muy lento)
            spawn_rate_ms: 2200,         // Aumentado de 1100 a 2200 (mucho tiempo entre palabras)
            miss_penalty_enabled: true,
        },
        medio: {
            fall_speed: 120,             // Reducido de 220 a 120 (lento) - coincide con defaults
            spawn_rate_ms: 1800,         // Aumentado de 900 a 1800 (tiempo moderado)
            miss_penalty_enabled: true,
        },
        difícil: {
            fall_speed: 180,             // Reducido de 300 a 180 (moderado)
            spawn_rate_ms: 1400,         // Aumentado de 700 a 1400 (menos agresivo)
            miss_penalty_enabled: true,
        },
    },
} as const;

export type WordCatcherConfig = typeof WORD_CATCHER_CONFIG;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function resolveWordCatcherConfig(missionConfig: any) {
    const difficulty = missionConfig?.difficulty || 'medio';
    const limits = WORD_CATCHER_CONFIG.limits;

    const difficultyPreset =
        WORD_CATCHER_CONFIG.difficultyPresets[difficulty as keyof typeof WORD_CATCHER_CONFIG.difficultyPresets]
        || WORD_CATCHER_CONFIG.difficultyPresets.medio;

    const wordCatcherConfig = missionConfig?.word_catcher || {};

    const resolved = {
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
        time_limit_seconds: clamp(
            missionConfig?.time_limit_seconds || 60,
            limits.time_limit_seconds.min,
            limits.time_limit_seconds.max
        ),
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

        hud_help_enabled: missionConfig?.hud_help_enabled ?? true,
        asset_pack: missionConfig?.asset_pack || 'kenney-ui-1',
        difficulty: difficulty,
    };

    if (wordCatcherConfig.fall_speed && wordCatcherConfig.fall_speed !== resolved.fall_speed) {
        console.warn(`[WordCatcher] fall_speed clamped from ${wordCatcherConfig.fall_speed} to ${resolved.fall_speed}`);
    }
    if (wordCatcherConfig.spawn_rate_ms && wordCatcherConfig.spawn_rate_ms !== resolved.spawn_rate_ms) {
        console.warn(`[WordCatcher] spawn_rate_ms clamped from ${wordCatcherConfig.spawn_rate_ms} to ${resolved.spawn_rate_ms}`);
    }

    console.log('[WordCatcher] Resolved config:', resolved);
    return resolved;
}

export function validateWordCatcherConfig(missionConfig: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const limits = WORD_CATCHER_CONFIG.limits;

    const items = missionConfig?.content_constraints?.items;
    if (items !== undefined && (items < limits.items.min || items > limits.items.max)) {
        errors.push(`items must be between ${limits.items.min} and ${limits.items.max}`);
    }

    const distractors = missionConfig?.content_constraints?.distractors_percent;
    if (distractors !== undefined && (distractors < limits.distractors_percent.min || distractors > limits.distractors_percent.max)) {
        errors.push(`distractors_percent must be between ${limits.distractors_percent.min} and ${limits.distractors_percent.max}`);
    }

    const fallSpeed = missionConfig?.word_catcher?.fall_speed;
    if (fallSpeed !== undefined && (fallSpeed < limits.fall_speed.min || fallSpeed > limits.fall_speed.max)) {
        errors.push(`fall_speed must be between ${limits.fall_speed.min} and ${limits.fall_speed.max}`);
    }

    const spawnRate = missionConfig?.word_catcher?.spawn_rate_ms;
    if (spawnRate !== undefined && (spawnRate < limits.spawn_rate_ms.min || spawnRate > limits.spawn_rate_ms.max)) {
        errors.push(`spawn_rate_ms must be between ${limits.spawn_rate_ms.min} and ${limits.spawn_rate_ms.max}`);
    }

    const timeLimit = missionConfig?.time_limit_seconds;
    if (timeLimit !== undefined && (timeLimit < limits.time_limit_seconds.min || timeLimit > limits.time_limit_seconds.max)) {
        errors.push(`time_limit_seconds must be between ${limits.time_limit_seconds.min} and ${limits.time_limit_seconds.max}`);
    }

    return { valid: errors.length === 0, errors };
}
