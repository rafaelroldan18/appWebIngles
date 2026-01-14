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

            const url = `/api/games/content?topicId=${topicId}&targetGameTypeId=${gameTypeId}`;
            console.log(`[GameLoader] Fetching from: ${url}`);

            // CRÍTICO: Siempre filtrar por gameTypeId para evitar mezcla de contenido
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[GameLoader] API Error (${response.status}):`, errorText);
                throw new Error(`Failed to load game content for ${gameTypeId}: ${response.status}`);
            }

            const data = await response.json();

            console.log(`[GameLoader] API Response:`, {
                itemCount: data.length,
                firstItem: data[0],
                gameTypeId: gameTypeId
            });

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
     * Flexible validation that works for all game types
     */
    static validateGameData(data: GameContent[]): boolean {
        if (!data || data.length === 0) {
            console.error('No game content available');
            return false;
        }

        console.log(`[GameLoader] Validating ${data.length} content items`);

        // Basic validation passed - we have content
        // Some games (like Image Match) don't use is_correct field
        // They use pair_id or other structures

        // Optional: Check for games that DO use is_correct (Word Catcher, Grammar Run)
        const hasCorrectField = data.some(item => 'is_correct' in item);

        if (hasCorrectField) {
            const correctWords = data.filter(item => item.is_correct);
            const incorrectWords = data.filter(item => !item.is_correct);

            if (correctWords.length === 0) {
                console.error('[GameLoader] No correct words found. At least one correct word is required for this game type.');
                return false;
            }

            if (incorrectWords.length === 0) {
                console.warn('[GameLoader] No incorrect words found - game may be too easy or some mechanics may use fallbacks.');
            }

            console.log(`[GameLoader] Validation successful: ${correctWords.length} correct, ${incorrectWords.length} incorrect items.`);
        } else {
            console.log(`[GameLoader] Validation successful: ${data.length} items loaded (no is_correct field required for this game type).`);
        }

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
