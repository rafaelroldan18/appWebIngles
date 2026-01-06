
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
    details: any;
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
