export interface MissionConfig {
    difficulty: 'fácil' | 'medio' | 'difícil';
    time_limit_seconds: number;
    content_constraints: {
        items: number;
        distractors_percent: number;
    };
    asset_pack: string;
    hud_help_enabled: boolean;
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
    answers: Array<{
        item_id?: string;
        prompt: string;
        student_answer: string;
        correct_answer: string;
        is_correct: boolean;
        meta?: any;
    }>;
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

export interface TopicAsset {
    asset_id: string;
    topic_id: string;
    url: string;
    asset_type: 'image' | 'icon' | 'file';
    alt_text: string | null;
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
