/**
 * MissionValidator - Validates if a game mission is available and accessible
 * Pedagogical layer: Controls when and how students can play
 */

export interface MissionValidation {
    isValid: boolean;
    canPlay: boolean;
    reason?: string;
    attemptsRemaining?: number;
    availabilityData?: any;
}

export class MissionValidator {
    /**
     * Validate if a mission is available for a student
     * Checks: dates, attempts, availability
     */
    static async validateMission(
        studentId: string,
        topicId: string,
        gameTypeId: string,
        parallelId: string
    ): Promise<MissionValidation> {
        try {
            // 1. Check if mission exists and is active
            const response = await fetch(
                `/api/missions/validate?studentId=${studentId}&topicId=${topicId}&gameTypeId=${gameTypeId}&parallelId=${parallelId}`
            );

            if (!response.ok) {
                return {
                    isValid: false,
                    canPlay: false,
                    reason: 'No se encontró una misión activa para este juego',
                };
            }

            const validation = await response.json();
            return validation;
        } catch (error) {
            console.error('Error validating mission:', error);
            return {
                isValid: false,
                canPlay: false,
                reason: 'Error al validar la misión',
            };
        }
    }

    /**
     * Check if student has attempts remaining
     */
    static hasAttemptsRemaining(attemptsUsed: number, maxAttempts: number): boolean {
        return attemptsUsed < maxAttempts;
    }

    /**
     * Check if mission is within valid date range
     */
    static isWithinDateRange(availableFrom: string, availableUntil: string | null): boolean {
        const now = new Date();
        const from = new Date(availableFrom);

        if (now < from) {
            return false; // Mission hasn't started yet
        }

        if (availableUntil) {
            const until = new Date(availableUntil);
            if (now > until) {
                return false; // Mission has expired
            }
        }

        return true;
    }

    /**
     * Get user-friendly message for validation failure
     */
    static getValidationMessage(validation: MissionValidation): string {
        if (!validation.isValid) {
            return validation.reason || 'Esta misión no está disponible';
        }

        if (!validation.canPlay) {
            if (validation.attemptsRemaining === 0) {
                return 'Has agotado todos tus intentos para esta misión';
            }
            return validation.reason || 'No puedes jugar esta misión en este momento';
        }

        return '';
    }

    /**
     * Format attempts remaining message
     */
    static getAttemptsMessage(attemptsRemaining: number): string {
        if (attemptsRemaining === 1) {
            return '⚠️ Te queda 1 intento';
        }
        return `Intentos restantes: ${attemptsRemaining}`;
    }
}
