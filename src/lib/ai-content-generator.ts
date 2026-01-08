/**
 * Tipos para la generación de contenido con IA
 */

import { GameTypeId } from './game-content-contracts';

export interface AIGenerateContentRequest {
    topicId: string;
    topicTitle: string;
    gameTypeId: GameTypeId;
    count: number;
    contextNote?: string;
}

export interface AIGenerateContentResponse {
    success: boolean;
    content: AIGeneratedContent[];
    count: number;
    validation?: {
        hasWarnings: boolean;
        warnings: string[];
        wasAutoCorrected: boolean;
    };
}

export interface AIGeneratedContent {
    topic_id: string;
    target_game_type_id: GameTypeId;
    content_type: 'word' | 'sentence' | 'location' | 'image-word-pair' | 'option';
    content_text: string;
    is_correct: boolean;
    image_url?: string | null;
    metadata?: any;
}

/**
 * Hook para generar contenido con IA
 */
export async function generateGameContentWithAI(
    request: AIGenerateContentRequest
): Promise<AIGenerateContentResponse> {
    const response = await fetch('/api/ai/generate-game-content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando contenido con IA');
    }

    return response.json();
}
