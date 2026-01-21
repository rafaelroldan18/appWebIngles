export interface MissionConfig {
    difficulty: 'fácil' | 'medio' | 'difícil';
    time_limit_seconds: number;
    lives?: number; // Vidas iniciales (usado por GrammarRun, etc.)
    content_constraints: {
        items: number;
        distractors_percent: number;
    };
    asset_pack: string;
    hud_help_enabled: boolean;
    // Configuración de scoring (compartida)
    scoring?: {
        points_correct?: number;
        points_wrong?: number;
        streak_bonus?: boolean;
    };
    // Configuración de pacing (compartida)
    pacing?: {
        speed_base?: number;
        speed_increment?: number;
        spawn_rate?: number;
    };
    // Configuración de UI (compartida)
    ui?: {
        show_timer?: boolean;
        show_lives?: boolean;
        show_streak?: boolean;
        show_progress?: boolean;
        show_hint_button?: boolean;
        allow_undo?: boolean;
        allow_clear?: boolean;
        show_correct_on_fail?: boolean;
    };
    // Configuración específica de WordCatcher
    word_catcher?: {
        fall_speed: number;          // Velocidad de caída en píxeles/segundo (ej: 220)
        spawn_rate_ms: number;        // Intervalo entre spawns en milisegundos (ej: 900)
        miss_penalty_enabled: boolean; // Si se penaliza dejar pasar palabras correctas
    };
    // Configuración específica de ImageMatch
    image_match?: {
        board_size?: 'small' | 'medium' | 'large'; // Tamaño del tablero (2x2, 4x4, 6x6)
        pairs_count?: number;          // Número de pares a emparejar
        flip_back_delay_ms?: number;  // Delay antes de voltear tarjetas incorrectas (ms)
        match_delay_ms?: number;      // Delay para mostrar par correcto (ms) - alias: reveal_delay_ms
        reveal_delay_ms?: number;     // Delay para revelar par correcto (ms) - preferido sobre match_delay_ms
        max_moves?: number;           // Límite de movimientos (opcional)
        shuffle?: boolean;            // Si se barajan las tarjetas (default: true)
        grid?: {                      // Grid explícito (opcional, sobreescribe board_size)
            cols: number;
            rows: number;
        };
    };
    // Configuración específica de GrammarRun
    grammar_run?: {
        mode: 'choose_correct' | 'avoid_wrong'; // Modo de juego
        items_limit?: number;         // Número máximo de preguntas
        randomize_items?: boolean;    // Aleatorizar orden de preguntas
        obstacle_penalty_life?: number; // Vidas perdidas por chocar con obstáculo
        wrong_penalty_life?: number;  // Vidas perdidas por respuesta incorrecta
    };
    // Configuración específica de Sentence Builder
    sentence_builder?: {
        items_limit?: number;
        randomize_items?: boolean;
        allow_reorder?: boolean;
        hint_cost?: number;
        auto_check?: boolean;
        max_hints_per_item?: number;
        show_correct_on_fail?: boolean;
    };
    // Configuración específica de City Explorer
    city_explorer?: {
        checkpoints_to_complete: number;       // Número de lugares a encontrar
        attempts_per_challenge: number;        // Intentos por pregunta/reto
        challenge_time_seconds?: number;       // Tiempo límite por reto (opcional)
        hint_cost?: number;                    // Costo de pistas
    };
}

export interface GameSessionDetails {
    summary: {
        score_raw: number;
        score_final: number;
        duration_seconds: number;
        correct_count: number;
        wrong_count: number;
        accuracy: number;
        performance: 'poor' | 'fair' | 'good' | 'excellent';
        passed: boolean;
        completed: boolean;
    };
    breakdown: {
        base_points: number;
        multiplier: number;
        bonus_points: number;
        penalty_points: number;
        rules_used: {
            minScoreToPass: number;
            minAccuracyToPass: number;
            excellentThreshold: number;
        };
    };
    review?: {
        strengths: string[];
        improvements: string[];
        recommended_practice: string;
    };
    answers: Array<{
        item_id?: string;
        prompt: string;
        student_answer: string;
        correct_answer: string;
        is_correct: boolean;
        meta?: any;
    }>;
}

/**
 * Metadata structure for Sentence Builder main item
 */
export interface SentenceBuilderMetadata {
    item_kind: 'builder';
    prompt?: string;
    target_tokens: string[]; // The correct order
    accepted_variants?: string[][]; // Optional alternatives
    explanation?: string;
    tags?: string[];
    distractors?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    order?: number;
}

/**
 * Metadata structure for Sentence Builder word item
 */
export interface SentenceBuilderWordMetadata {
    parent_sentence_id: string;
    is_distractor?: boolean;
    order?: number;
}

export interface GameType {
    game_type_id: string;
    name: string;
    description: string;
}

export interface GameAvailability {
    availability_id: string;
    game_type_id: string;
    topic_id: string;
    parallel_id: string;
    available_from: string;
    available_until: string | null;
    max_attempts: number;
    show_theory: boolean;
    is_active: boolean;
    created_at: string;
    activated_at: string | null; // Timestamp cuando se activó la misión
    mission_title: string;
    mission_instructions: string;
    mission_config: MissionConfig;
    // Relaciones opcionales (cuando se hace join)
    game_types?: {
        name: string;
        description: string;
    };
    topics?: {
        title: string;
        description: string | null;
    };
}


export interface GameContent {
    content_id: string;
    topic_id: string;
    target_game_type_id?: string; // ID del juego específico para el que fue creado este contenido
    content_type: 'word' | 'sentence' | 'location' | 'image-word-pair' | 'option' | 'image';
    content_text: string;
    is_correct: boolean;
    image_url?: string | null;
    metadata?: any;
    created_at: string;
}

export interface GameSession {
    session_id: string;
    student_id: string;
    topic_id: string;
    game_type_id: string;
    score: number;
    completed: boolean;
    duration_seconds: number | null;
    correct_count: number;
    wrong_count: number;
    details: GameSessionDetails;
    played_at: string;
}

export interface StudentProgress {
    progress_id: string;
    student_id: string;
    activities_completed: number;
    total_score: number;
    last_updated_at: string;
}

export interface Topic {
    topic_id: string;
    title: string;
    description: string | null;
    level: string;
    theory_content?: any;
    created_by: string;
    created_at: string;
}



export interface TopicRule {
    rule_id: string;
    topic_id: string;
    title: string | null;
    content_json: any;
    format: 'json' | 'plain' | 'html' | 'markdown';
    order_index: number;
    created_at: string;
}

// ============================================
// GrammarRun Specific Types
// ============================================

/**
 * Represents a grammar question with its options
 * Built from game_content rows with content_type = 'sentence' and 'option'
 */
export interface GrammarQuestion {
    questionId: string;           // content_id de la sentence
    questionText: string;         // content_text de la sentence
    correctOption: string;        // metadata.correct_option de la sentence
    options: GrammarOption[];     // Array de opciones (de filas option)
    explanation?: string;         // metadata.explanation (opcional)
    ruleTag?: string;            // metadata.rule_tag (opcional)
    level?: string;              // metadata.level (opcional)
    order?: number;              // metadata.order (opcional)
}

/**
 * Represents a single option for a grammar question
 * Built from game_content rows with content_type = 'option'
 */
export interface GrammarOption {
    optionId: string;            // content_id de la option
    optionText: string;          // content_text de la option
    isCorrect: boolean;          // is_correct de la option
    parentSentenceId: string;    // metadata.parent_sentence_id
    order?: number;              // metadata.order (opcional)
}

/**
 * Metadata structure for sentence content_type
 */
export interface GrammarSentenceMetadata {
    item_kind: 'grammar_question';
    correct_option: string;
    prompt?: string;
    wrong_options?: string[];
    rule_tag?: string;
    explanation?: string;
    level?: 'fácil' | 'medio' | 'difícil';
    order?: number;
}

/**
 * Metadata structure for option content_type
 */
export interface GrammarOptionMetadata {
    parent_sentence_id: string;
    order?: number;
}

// ============================================
// City Explorer Specific Types
// ============================================

export interface CityExplorerLocationMetadata {
    item_kind: 'location';
    location_id: string; // Explicit ID for linking
    x: number;
    y: number;
    radius: number;
    emoji?: string;
}

export interface CityExplorerChallengeMetadata {
    item_kind: 'challenge';
    location_id: string; // Foreing Key to Location
    challenge_kind: 'mcq' | 'input';
    correct_option?: string; // ID of correct option if MCQ
    explanation?: string;
}

