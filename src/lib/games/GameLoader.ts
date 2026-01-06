/**
 * GameLoader - Handles loading game data from the backend API
 */

import type { GameContent } from '@/types';

export interface GameData {
    topicId: string;
    gameTypeId: string;
    availabilityId: string;
    maxAttempts: number;
    words: GameContent[];
}

export class GameLoader {
    /**
     * Load game content from the API
     * IMPORTANTE: Filtra por topicId Y gameTypeId para implementar "contenido por juego"
     * Cada juego solo recibe el contenido que le corresponde pedagógicamente
     */
    static async loadGameContent(
        topicId: string,
        gameTypeId: string
    ): Promise<GameContent[]> {
        try {
            console.log(`[GameLoader] Loading content for topic: ${topicId}, game: ${gameTypeId}`);

            // CRÍTICO: Siempre filtrar por gameTypeId para evitar mezcla de contenido
            const response = await fetch(
                `/api/games/content?topicId=${topicId}&targetGameTypeId=${gameTypeId}`
            );

            if (!response.ok) {
                throw new Error(`Failed to load game content for ${gameTypeId}`);
            }

            const data = await response.json();

            console.log(`[GameLoader] Loaded ${data.length} items for ${gameTypeId}`);

            // Validar que el contenido recibido es del juego correcto
            const invalidItems = data.filter((item: GameContent) =>
                item.target_game_type_id && item.target_game_type_id !== gameTypeId
            );

            if (invalidItems.length > 0) {
                console.error(`[GameLoader] WARNING: Received ${invalidItems.length} items for wrong game type!`);
            }

            return data;
        } catch (error) {
            console.error(`[GameLoader] Error loading content for ${gameTypeId}:`, error);
            throw error;
        }
    }

    /**
     * Check if game is available for the student
     */
    static async checkAvailability(
        studentId: string,
        parallelId: string
    ): Promise<any[]> {
        try {
            const response = await fetch(
                `/api/games/availability?parallelId=${parallelId}`
            );

            if (!response.ok) {
                throw new Error('Failed to check game availability');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        }
    }

    /**
     * Validate game data before starting
     */
    static validateGameData(data: GameContent[]): boolean {
        if (!data || data.length === 0) {
            console.error('No game content available');
            return false;
        }

        // Check that we have at least some correct and incorrect words
        const correctWords = data.filter(item => item.is_correct);
        const incorrectWords = data.filter(item => !item.is_correct);

        if (correctWords.length === 0) {
            console.error('[GameLoader] No correct words found. At least one correct word is required.');
            return false;
        }

        if (incorrectWords.length === 0) {
            console.warn('[GameLoader] No incorrect words found - game may be too easy or some mechanics (like Grammar Run gates) may use fallbacks.');
        }

        console.log(`[GameLoader] Validation successful: ${correctWords.length} correct, ${incorrectWords.length} incorrect items.`);

        return true;
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    static shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
