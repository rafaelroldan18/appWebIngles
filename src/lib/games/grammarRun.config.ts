/**
 * Grammar Run Game Configuration
 * Endless runner where player selects correct grammar structures
 */

// Default constants
const DEFAULT_TIME = 300; // 5 mins
const DEFAULT_SPEED_BASE = 0.6;
const DEFAULT_SPEED_INCREMENT = 0.03;
const DEFAULT_SPAWN_RATE = 2.0;
const DEFAULT_ITEMS_LIMIT = 12;

export const GRAMMAR_RUN_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring (base values, pueden ser sobrescritos por mission_config)
    scoring: {
        points_correct: 10,      // Points for passing through correct gate
        points_wrong: -5,        // Penalty for wrong gate
        streak_bonus: true,      // Enable streak bonuses
    },

    // Defaults para mission_config.grammar_run (cuando no viene en la misión)
    defaults: {
        time_limit_seconds: DEFAULT_TIME,
        items_limit: DEFAULT_ITEMS_LIMIT,
        randomize_items: true,
        mode: 'choose_correct' as const,
        speed_base: DEFAULT_SPEED_BASE,
        speed_increment: DEFAULT_SPEED_INCREMENT,
        spawn_rate: DEFAULT_SPAWN_RATE,
    },

    // Visual settings
    visual: {
        backgroundColor: '#87CEEB', // Sky blue
        groundColor: '#8B7355',     // Brown
        correctGateColor: '#10b981', // Green
        wrongGateColor: '#ef4444',   // Red
        playerColor: '#3b82f6',      // Blue
        obstacleColor: '#f59e0b',    // Orange
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
    },

    // Physics
    physics: {
        gravity: 800,
        jumpVelocity: -400,
        laneWidth: 200,
        lanes: 3, // Left, Center, Right
    },

    // Validation limits (clamps para evitar configs imposibles)
    limits: {
        time_limit_seconds: { min: 5, max: 600 },
        items_limit: { min: 1, max: 100 },
        speed_base: { min: 0.5, max: 3.0 },
        speed_increment: { min: 0.0, max: 0.5 },
        spawn_rate: { min: 0.2, max: 5.0 },
    },

    // Presets por dificultad
    difficultyPresets: {
        fácil: {
            time_limit_seconds: 120,
            lives: 5,
            items_limit: 8,
            speed_base: 0.8,
            speed_increment: 0.05,
            spawn_rate: 1.5,
            obstacle_penalty_life: 0,
            wrong_penalty_life: 0,
            points_correct: 10,
            points_wrong: -3,
        },
        medio: {
            time_limit_seconds: 90,
            lives: 3,
            items_limit: 12,
            speed_base: 1.0,
            speed_increment: 0.08,
            spawn_rate: 1.2,
            obstacle_penalty_life: 1,
            wrong_penalty_life: 0,
            points_correct: 10,
            points_wrong: -5,
        },
        difícil: {
            time_limit_seconds: 60,
            lives: 2,
            items_limit: 15,
            speed_base: 1.2,
            speed_increment: 0.12,
            spawn_rate: 1.0,
            obstacle_penalty_life: 1,
            wrong_penalty_life: 1,
            points_correct: 15,
            points_wrong: -8,
        },
    },
} as const;

export type GrammarRunConfig = typeof GRAMMAR_RUN_CONFIG;

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Resolves and validates GrammarRun configuration
 * Applies defaults, clamps values, and ensures safe config
 */
export function resolveGrammarRunConfig(missionConfig: any) {
    const difficulty = missionConfig?.difficulty || 'medio';
    const limits = GRAMMAR_RUN_CONFIG.limits;

    // Get base config from difficulty preset or defaults
    const difficultyPreset = GRAMMAR_RUN_CONFIG.difficultyPresets[difficulty as keyof typeof GRAMMAR_RUN_CONFIG.difficultyPresets]
        || GRAMMAR_RUN_CONFIG.difficultyPresets.medio;

    // Merge with mission_config.grammar_run if present
    const grammarRunConfig = missionConfig?.grammar_run || {};

    // Resolve scoring
    const scoringConfig = missionConfig?.scoring || {};
    const resolvedScoring = {
        points_correct: scoringConfig.points_correct ?? difficultyPreset.points_correct ?? GRAMMAR_RUN_CONFIG.scoring.points_correct,
        points_wrong: scoringConfig.points_wrong ?? difficultyPreset.points_wrong ?? GRAMMAR_RUN_CONFIG.scoring.points_wrong,
        streak_bonus: scoringConfig.streak_bonus ?? GRAMMAR_RUN_CONFIG.scoring.streak_bonus,
    };

    // Resolve pacing
    const pacingConfig = missionConfig?.pacing || {};
    const resolvedPacing = {
        speed_base: clamp(
            pacingConfig.speed_base ?? grammarRunConfig.speed_base ?? difficultyPreset.speed_base ?? DEFAULT_SPEED_BASE,
            limits.speed_base.min,
            limits.speed_base.max
        ),
        speed_increment: clamp(
            pacingConfig.speed_increment ?? grammarRunConfig.speed_increment ?? difficultyPreset.speed_increment ?? DEFAULT_SPEED_INCREMENT,
            limits.speed_increment.min,
            limits.speed_increment.max
        ),
        spawn_rate: clamp(
            pacingConfig.spawn_rate ?? grammarRunConfig.spawn_rate ?? difficultyPreset.spawn_rate ?? DEFAULT_SPAWN_RATE,
            limits.spawn_rate.min,
            limits.spawn_rate.max
        ),
    };

    // Resolve UI settings
    const uiConfig = missionConfig?.ui || {};
    const resolvedUI = {
        show_timer: uiConfig.show_timer ?? true,
        show_lives: uiConfig.show_lives ?? true,
        show_streak: uiConfig.show_streak ?? true,
        show_progress: uiConfig.show_progress ?? true,
        show_hint_button: uiConfig.show_hint_button ?? false,
    };

    // Resolve and clamp each value
    const resolved = {
        // Time limit
        time_limit_seconds: clamp(
            missionConfig?.time_limit_seconds ?? difficultyPreset.time_limit_seconds ?? DEFAULT_TIME,
            limits.time_limit_seconds.min,
            limits.time_limit_seconds.max
        ),

        // GrammarRun specific
        mode: grammarRunConfig.mode || GRAMMAR_RUN_CONFIG.defaults.mode,
        items_limit: clamp(
            missionConfig?.content_constraints?.items ?? grammarRunConfig.items_limit ?? difficultyPreset.items_limit ?? DEFAULT_ITEMS_LIMIT,
            limits.items_limit.min,
            limits.items_limit.max
        ),
        randomize_items: grammarRunConfig.randomize_items ?? GRAMMAR_RUN_CONFIG.defaults.randomize_items,

        // Scoring
        scoring: resolvedScoring,

        // Pacing
        pacing: resolvedPacing,

        // UI
        ui: resolvedUI,

        // Other settings
        hud_help_enabled: missionConfig?.hud_help_enabled ?? true,
        difficulty: difficulty,
    };

    // Log warnings if values were clamped
    if (grammarRunConfig.speed_base && grammarRunConfig.speed_base !== resolved.pacing.speed_base) {
        console.warn(`[GrammarRun] speed_base clamped from ${grammarRunConfig.speed_base} to ${resolved.pacing.speed_base}`);
    }
    if (grammarRunConfig.items_limit && grammarRunConfig.items_limit !== resolved.items_limit) {
        console.warn(`[GrammarRun] items_limit clamped from ${grammarRunConfig.items_limit} to ${resolved.items_limit}`);
    }

    console.log('[GrammarRun] Resolved config:', resolved);

    return resolved;
}

/**
 * Validates if a mission config is safe for GrammarRun
 */
export function validateGrammarRunConfig(missionConfig: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const limits = GRAMMAR_RUN_CONFIG.limits;

    // Check time_limit_seconds
    const timeLimit = missionConfig?.time_limit_seconds;
    if (timeLimit !== undefined && (timeLimit < limits.time_limit_seconds.min || timeLimit > limits.time_limit_seconds.max)) {
        errors.push(`time_limit_seconds must be between ${limits.time_limit_seconds.min} and ${limits.time_limit_seconds.max}`);
    }

    // Check grammar_run specific
    const grammarRunConfig = missionConfig?.grammar_run;
    if (grammarRunConfig) {
        // items_limit
        const itemsLimit = grammarRunConfig.items_limit;
        if (itemsLimit !== undefined && (itemsLimit < limits.items_limit.min || itemsLimit > limits.items_limit.max)) {
            errors.push(`items_limit must be between ${limits.items_limit.min} and ${limits.items_limit.max}`);
        }

        // speed_base
        const speedBase = grammarRunConfig.speed_base;
        if (speedBase !== undefined && (speedBase < limits.speed_base.min || speedBase > limits.speed_base.max)) {
            errors.push(`speed_base must be between ${limits.speed_base.min} and ${limits.speed_base.max}`);
        }

        // speed_increment
        const speedIncrement = grammarRunConfig.speed_increment;
        if (speedIncrement !== undefined && (speedIncrement < limits.speed_increment.min || speedIncrement > limits.speed_increment.max)) {
            errors.push(`speed_increment must be between ${limits.speed_increment.min} and ${limits.speed_increment.max}`);
        }

        // spawn_rate
        const spawnRate = grammarRunConfig.spawn_rate;
        if (spawnRate !== undefined && (spawnRate < limits.spawn_rate.min || spawnRate > limits.spawn_rate.max)) {
            errors.push(`spawn_rate must be between ${limits.spawn_rate.min} and ${limits.spawn_rate.max}`);
        }

        // mode
        const mode = grammarRunConfig.mode;
        if (mode !== undefined && mode !== 'choose_correct' && mode !== 'avoid_wrong') {
            errors.push(`mode must be either 'choose_correct' or 'avoid_wrong'`);
        }
    }

    // Check pacing if provided
    const pacing = missionConfig?.pacing;
    if (pacing) {
        if (pacing.speed_base !== undefined && (pacing.speed_base < limits.speed_base.min || pacing.speed_base > limits.speed_base.max)) {
            errors.push(`pacing.speed_base must be between ${limits.speed_base.min} and ${limits.speed_base.max}`);
        }
        if (pacing.speed_increment !== undefined && (pacing.speed_increment < limits.speed_increment.min || pacing.speed_increment > limits.speed_increment.max)) {
            errors.push(`pacing.speed_increment must be between ${limits.speed_increment.min} and ${limits.speed_increment.max}`);
        }
        if (pacing.spawn_rate !== undefined && (pacing.spawn_rate < limits.spawn_rate.min || pacing.spawn_rate > limits.spawn_rate.max)) {
            errors.push(`pacing.spawn_rate must be between ${limits.spawn_rate.min} and ${limits.spawn_rate.max}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
