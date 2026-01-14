/**
 * Image Match Game Configuration
 * Memory/card matching game for vocabulary with images
 */

// Default constants
const DEFAULT_TIME = 90;
const DEFAULT_FLIP_BACK_DELAY = 650;
const DEFAULT_REVEAL_DELAY = 200;
const DEFAULT_MAX_MOVES: number | null = null; // null = sin límite, o 30 si prefieres
const DEFAULT_SHUFFLE = true;

// Default grids por dificultad
const DEFAULT_GRIDS = {
    fácil: { cols: 4, rows: 3 },  // 4x3 = 12 cartas = 6 pares
    medio: { cols: 4, rows: 4 },  // 4x4 = 16 cartas = 8 pares
    difícil: { cols: 6, rows: 4 }, // 6x4 = 24 cartas = 12 pares
} as const;

export const IMAGE_MATCH_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring
    scoring: {
        matchFound: 10,        // Points for finding a correct pair
        wrongMatch: -3,        // Penalty for wrong match
        timeBonus: 2,          // Bonus per 10 seconds remaining
        perfectGame: 50,       // Bonus for no mistakes
    },

    // Defaults para mission_config.image_match (cuando no viene en la misión)
    defaults: {
        time_limit_seconds: DEFAULT_TIME,
        flip_back_delay_ms: DEFAULT_FLIP_BACK_DELAY,
        reveal_delay_ms: DEFAULT_REVEAL_DELAY,
        max_moves: DEFAULT_MAX_MOVES,
        shuffle: DEFAULT_SHUFFLE,
        pairs_count: 8, // Default value
    },

    // Visual settings
    visual: {
        backgroundColor: '#1e293b',
        cardBackColor: '#3b82f6',
        cardFrontColor: '#ffffff',
        cardMatchedColor: '#10b981',
        cardWrongColor: '#ef4444',
        cardHoverColor: '#2563eb',
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
    },

    // Default grids por dificultad
    defaultGrids: DEFAULT_GRIDS,

    // Grid layout (default, para compatibilidad)
    grid: {
        rows: 4,
        cols: 4,
        cardWidth: 140,
        cardHeight: 140,
        cardSpacing: 15,
        cardRadius: 10,
    },

    // Validation limits (clamps para evitar configs imposibles)
    limits: {
        pairs_count: { min: 1, max: 18 }, // 1 par = 2 tarjetas, a 18 pares = 36 tarjetas
        time_limit_seconds: { min: 5, max: 600 },
        flip_back_delay_ms: { min: 200, max: 1500 }, // 200–1500
        match_delay_ms: { min: 0, max: 600 }, // Legacy, usar reveal_delay_ms
        reveal_delay_ms: { min: 0, max: 600 }, // 0–600
        max_moves: { min: 5, max: 200 }, // 5–200
        grid_cols: { min: 2, max: 6 }, // 2–6
        grid_rows: { min: 2, max: 6 }, // 2–6
    },

    // Defaults por dificultad
    difficultyPresets: {
        fácil: {
            grid: DEFAULT_GRIDS.fácil,
            pairs_count: 6, // 4x3 = 12 cartas = 6 pares
            flip_back_delay_ms: DEFAULT_FLIP_BACK_DELAY,
            reveal_delay_ms: DEFAULT_REVEAL_DELAY,
            max_moves: DEFAULT_MAX_MOVES,
            shuffle: DEFAULT_SHUFFLE,
        },
        medio: {
            grid: DEFAULT_GRIDS.medio,
            pairs_count: 8, // 4x4 = 16 cartas = 8 pares
            flip_back_delay_ms: DEFAULT_FLIP_BACK_DELAY,
            reveal_delay_ms: DEFAULT_REVEAL_DELAY,
            max_moves: DEFAULT_MAX_MOVES,
            shuffle: DEFAULT_SHUFFLE,
        },
        difícil: {
            grid: DEFAULT_GRIDS.difícil,
            pairs_count: 12, // 6x4 = 24 cartas = 12 pares
            flip_back_delay_ms: DEFAULT_FLIP_BACK_DELAY,
            reveal_delay_ms: DEFAULT_REVEAL_DELAY,
            max_moves: DEFAULT_MAX_MOVES,
            shuffle: DEFAULT_SHUFFLE,
        },
    },
} as const;

export type ImageMatchConfig = typeof IMAGE_MATCH_CONFIG;

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calcula dimensiones de tarjetas basado en grid y tamaño de pantalla
 */
function calculateCardDimensions(rows: number, cols: number, screenWidth: number, screenHeight: number) {
    const availableWidth = screenWidth * 0.9;
    const availableHeight = (screenHeight - 100) * 0.85; // Reservar espacio para HUD

    const maxCardWidth = (availableWidth - (cols - 1) * 15) / cols;
    const maxCardHeight = (availableHeight - (rows - 1) * 15) / rows;

    const cardSize = Math.min(maxCardWidth, maxCardHeight, 180);

    return {
        cardWidth: cardSize,
        cardHeight: cardSize,
        cardSpacing: 15,
    };
}

/**
 * Resolves and validates ImageMatch configuration
 * Applies defaults, clamps values, and ensures safe config
 */
export function resolveImageMatchConfig(missionConfig: any) {
    const difficulty = missionConfig?.difficulty || 'medio';
    const limits = IMAGE_MATCH_CONFIG.limits;

    // Get base config from difficulty preset or defaults
    const difficultyPreset = IMAGE_MATCH_CONFIG.difficultyPresets[difficulty as keyof typeof IMAGE_MATCH_CONFIG.difficultyPresets]
        || IMAGE_MATCH_CONFIG.difficultyPresets.medio;

    // Merge with mission_config.image_match if present
    const imageMatchConfig = missionConfig?.image_match || {};

    // Resolve grid: priorizar grid explícito, luego asignar según difficulty
    let gridLayout;
    if (imageMatchConfig.grid?.cols && imageMatchConfig.grid?.rows) {
        // Grid explícito desde mission_config
        const cols = clamp(imageMatchConfig.grid.cols, limits.grid_cols.min, limits.grid_cols.max);
        const rows = clamp(imageMatchConfig.grid.rows, limits.grid_rows.min, limits.grid_rows.max);
        const cardDims = calculateCardDimensions(rows, cols, IMAGE_MATCH_CONFIG.width, IMAGE_MATCH_CONFIG.height);
        gridLayout = {
            rows,
            cols,
            ...cardDims
        };
    } else {
        // Si no viene grid, asignar según difficulty
        const defaultGrid = difficultyPreset.grid || DEFAULT_GRIDS.medio;
        const cols = clamp(defaultGrid.cols, limits.grid_cols.min, limits.grid_cols.max);
        const rows = clamp(defaultGrid.rows, limits.grid_rows.min, limits.grid_rows.max);
        const cardDims = calculateCardDimensions(rows, cols, IMAGE_MATCH_CONFIG.width, IMAGE_MATCH_CONFIG.height);
        gridLayout = {
            rows,
            cols,
            ...cardDims
        };
    }

    // Resolve pairs count: priorizar pairs_count explícito, luego calcular desde items
    let pairsCount;
    if (imageMatchConfig.pairs_count !== undefined) {
        pairsCount = clamp(
            imageMatchConfig.pairs_count,
            limits.pairs_count.min,
            Math.min(limits.pairs_count.max, (gridLayout.rows * gridLayout.cols) / 2)
        );
    } else {
        // Calcular desde content_constraints.items (pares = floor(items/2))
        const itemsFromMission = missionConfig?.content_constraints?.items;
        if (itemsFromMission && itemsFromMission > 0) {
            pairsCount = Math.floor(itemsFromMission / 2);
        } else {
            pairsCount = difficultyPreset.pairs_count || IMAGE_MATCH_CONFIG.defaults.pairs_count;
        }
        pairsCount = clamp(
            pairsCount,
            limits.pairs_count.min,
            Math.min(limits.pairs_count.max, (gridLayout.rows * gridLayout.cols) / 2)
        );
    }

    // Resolve reveal_delay_ms: priorizar reveal_delay_ms, luego match_delay_ms, luego preset
    const revealDelay = imageMatchConfig.reveal_delay_ms ??
        imageMatchConfig.match_delay_ms ??
        difficultyPreset.reveal_delay_ms ??
        DEFAULT_REVEAL_DELAY;

    // Resolve and clamp each value
    const resolved = {
        // Content constraints (from mission)
        items: missionConfig?.content_constraints?.items || pairsCount * 2,

        // Time limit
        time_limit_seconds: clamp(
            missionConfig?.time_limit_seconds || DEFAULT_TIME,
            limits.time_limit_seconds.min,
            limits.time_limit_seconds.max
        ),

        // ImageMatch specific
        pairs_count: pairsCount,
        flip_back_delay_ms: clamp(
            imageMatchConfig.flip_back_delay_ms ?? difficultyPreset.flip_back_delay_ms ?? DEFAULT_FLIP_BACK_DELAY,
            limits.flip_back_delay_ms.min,
            limits.flip_back_delay_ms.max
        ),
        match_delay_ms: clamp(revealDelay, limits.match_delay_ms.min, limits.match_delay_ms.max),
        reveal_delay_ms: clamp(revealDelay, limits.reveal_delay_ms.min, limits.reveal_delay_ms.max),
        max_moves: imageMatchConfig.max_moves !== undefined
            ? clamp(imageMatchConfig.max_moves, limits.max_moves.min, limits.max_moves.max)
            : difficultyPreset.max_moves ?? DEFAULT_MAX_MOVES,
        shuffle: imageMatchConfig.shuffle !== undefined
            ? imageMatchConfig.shuffle
            : difficultyPreset.shuffle ?? DEFAULT_SHUFFLE,

        // Grid layout
        grid: gridLayout,

        // Other settings
        hud_help_enabled: missionConfig?.hud_help_enabled ?? true,
        asset_pack: missionConfig?.asset_pack || 'kenney-ui-1',
        difficulty: difficulty,
    };

    // Log warnings if values were clamped
    if (imageMatchConfig.flip_back_delay_ms && imageMatchConfig.flip_back_delay_ms !== resolved.flip_back_delay_ms) {
        console.warn(`[ImageMatch] flip_back_delay_ms clamped from ${imageMatchConfig.flip_back_delay_ms} to ${resolved.flip_back_delay_ms}`);
    }
    if (imageMatchConfig.reveal_delay_ms && imageMatchConfig.reveal_delay_ms !== resolved.reveal_delay_ms) {
        console.warn(`[ImageMatch] reveal_delay_ms clamped from ${imageMatchConfig.reveal_delay_ms} to ${resolved.reveal_delay_ms}`);
    }

    console.log('[ImageMatch] Resolved config:', resolved);

    return resolved;
}

/**
 * Validates if a mission config is safe for ImageMatch
 */
export function validateImageMatchConfig(missionConfig: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const limits = IMAGE_MATCH_CONFIG.limits;

    // Check pairs_count
    const pairsCount = missionConfig?.image_match?.pairs_count;
    if (pairsCount !== undefined && (pairsCount < limits.pairs_count.min || pairsCount > limits.pairs_count.max)) {
        errors.push(`pairs_count must be between ${limits.pairs_count.min} and ${limits.pairs_count.max}`);
    }

    // Check flip_back_delay_ms (200–1500)
    const flipBackDelay = missionConfig?.image_match?.flip_back_delay_ms;
    if (flipBackDelay !== undefined && (flipBackDelay < limits.flip_back_delay_ms.min || flipBackDelay > limits.flip_back_delay_ms.max)) {
        errors.push(`flip_back_delay_ms must be between ${limits.flip_back_delay_ms.min} and ${limits.flip_back_delay_ms.max}`);
    }

    // Check reveal_delay_ms (0–600) - preferido sobre match_delay_ms
    const revealDelay = missionConfig?.image_match?.reveal_delay_ms ?? missionConfig?.image_match?.match_delay_ms;
    if (revealDelay !== undefined && (revealDelay < limits.reveal_delay_ms.min || revealDelay > limits.reveal_delay_ms.max)) {
        errors.push(`reveal_delay_ms must be between ${limits.reveal_delay_ms.min} and ${limits.reveal_delay_ms.max}`);
    }

    // Check grid if provided
    const grid = missionConfig?.image_match?.grid;
    if (grid) {
        if (grid.cols !== undefined && (grid.cols < limits.grid_cols.min || grid.cols > limits.grid_cols.max)) {
            errors.push(`grid.cols must be between ${limits.grid_cols.min} and ${limits.grid_cols.max}`);
        }
        if (grid.rows !== undefined && (grid.rows < limits.grid_rows.min || grid.rows > limits.grid_rows.max)) {
            errors.push(`grid.rows must be between ${limits.grid_rows.min} and ${limits.grid_rows.max}`);
        }
        if (grid.cols && grid.rows && (grid.cols * grid.rows) % 2 !== 0) {
            errors.push(`grid.cols * grid.rows must be even (total cards must be even)`);
        }
    }

    // Check max_moves
    const maxMoves = missionConfig?.image_match?.max_moves;
    if (maxMoves !== undefined && (maxMoves < limits.max_moves.min || maxMoves > limits.max_moves.max)) {
        errors.push(`max_moves must be between ${limits.max_moves.min} and ${limits.max_moves.max}`);
    }

    // Check time_limit_seconds
    const timeLimit = missionConfig?.time_limit_seconds;
    if (timeLimit !== undefined && (timeLimit < limits.time_limit_seconds.min || timeLimit > limits.time_limit_seconds.max)) {
        errors.push(`time_limit_seconds must be between ${limits.time_limit_seconds.min} and ${limits.time_limit_seconds.max}`);
    }

    // Check content_constraints.items (debe ser par si se usa como total de cartas)
    const items = missionConfig?.content_constraints?.items;
    if (items !== undefined && items % 2 !== 0) {
        errors.push(`content_constraints.items must be even (represents total cards, which must be even)`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
