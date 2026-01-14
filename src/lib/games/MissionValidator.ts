/**
 * MissionValidator - Validates game mission availability and requirements
 * 
 * Verifica:
 * 1. Si la misión está activa (is_active)
 * 2. Si está dentro del rango de fechas (available_from, available_until)
 * 3. Cuántos intentos le quedan al estudiante (max_attempts vs game_sessions)
 * 4. Si debe mostrar teoría antes del juego (show_theory)
 */

import type { GameAvailability } from '@/types';

export interface MissionValidationResult {
    isValid: boolean;
    canPlay: boolean;
    reason?: string;
    availability?: GameAvailability;
    attemptsUsed: number;
    attemptsRemaining: number;
    showTheory: boolean;
    theoryContent?: any;
}

export class MissionValidator {
    /**
     * Valida si un estudiante puede jugar una misión específica
     */
    static async validateMission(
        studentId: string,
        availabilityId: string
    ): Promise<MissionValidationResult> {
        try {
            console.log(`[MissionValidator] Validating mission ${availabilityId} for student ${studentId}`);

            // 1. Obtener información de disponibilidad
            const availability = await this.getAvailability(availabilityId);

            if (!availability) {
                return {
                    isValid: false,
                    canPlay: false,
                    reason: 'Misión no encontrada',
                    attemptsUsed: 0,
                    attemptsRemaining: 0,
                    showTheory: false
                };
            }

            // 2. Verificar si está activa
            if (!availability.is_active) {
                return {
                    isValid: false,
                    canPlay: false,
                    reason: 'Esta misión no está activa actualmente',
                    availability,
                    attemptsUsed: 0,
                    attemptsRemaining: 0,
                    showTheory: false
                };
            }

            // 3. Verificar rango de fechas
            const now = new Date();
            const availableFrom = new Date(availability.available_from);
            const availableUntil = availability.available_until
                ? new Date(availability.available_until)
                : null;

            if (now < availableFrom) {
                return {
                    isValid: false,
                    canPlay: false,
                    reason: `Esta misión estará disponible desde ${availableFrom.toLocaleDateString()}`,
                    availability,
                    attemptsUsed: 0,
                    attemptsRemaining: 0,
                    showTheory: false
                };
            }

            if (availableUntil && now > availableUntil) {
                return {
                    isValid: false,
                    canPlay: false,
                    reason: `Esta misión expiró el ${availableUntil.toLocaleDateString()}`,
                    availability,
                    attemptsUsed: 0,
                    attemptsRemaining: 0,
                    showTheory: false
                };
            }

            // 4. Contar intentos usados
            const attemptsUsed = await this.countAttempts(
                studentId,
                availability.topic_id,
                availability.game_type_id,
                availability.created_at
            );

            const attemptsRemaining = Math.max(0, availability.max_attempts - attemptsUsed);

            // 5. Verificar si tiene intentos disponibles
            if (attemptsUsed >= availability.max_attempts) {
                return {
                    isValid: true,
                    canPlay: false,
                    reason: `Has alcanzado el límite de ${availability.max_attempts} intentos para esta misión`,
                    availability,
                    attemptsUsed,
                    attemptsRemaining: 0,
                    showTheory: false
                };
            }

            // 6. Obtener teoría si show_theory está activo
            let theoryContent = null;
            if (availability.show_theory) {
                theoryContent = await this.getTheoryContent(availability.topic_id);
            }

            // ✅ Todo válido, puede jugar
            console.log(`[MissionValidator] ✅ Mission valid. Attempts: ${attemptsUsed}/${availability.max_attempts}`);

            return {
                isValid: true,
                canPlay: true,
                availability,
                attemptsUsed,
                attemptsRemaining,
                showTheory: availability.show_theory,
                theoryContent
            };

        } catch (error) {
            console.error('[MissionValidator] Error validating mission:', error);
            return {
                isValid: false,
                canPlay: false,
                reason: 'Error al validar la misión',
                attemptsUsed: 0,
                attemptsRemaining: 0,
                showTheory: false
            };
        }
    }

    /**
     * Obtiene información de disponibilidad de la misión
     */
    private static async getAvailability(availabilityId: string): Promise<GameAvailability | null> {
        try {
            const response = await fetch(`/api/games/availability/${availabilityId}`);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[MissionValidator] Error fetching availability:', error);
            return null;
        }
    }

    /**
     * Cuenta cuántos intentos ha usado el estudiante para este juego/tema
     */
    private static async countAttempts(
        studentId: string,
        topicId: string,
        gameTypeId: string,
        since?: string
    ): Promise<number> {
        try {
            let url = `/api/games/sessions/count?studentId=${studentId}&topicId=${topicId}&gameTypeId=${gameTypeId}`;
            if (since) {
                url += `&since=${encodeURIComponent(since)}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                console.warn('[MissionValidator] Could not fetch attempts count, assuming 0');
                return 0;
            }

            const data = await response.json();
            return data.count || 0;
        } catch (error) {
            console.error('[MissionValidator] Error counting attempts:', error);
            return 0;
        }
    }

    /**
     * Obtiene el contenido de teoría del tema (topic_rules)
     */
    private static async getTheoryContent(topicId: string): Promise<any> {
        try {
            const response = await fetch(`/api/topics/${topicId}/theory`);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[MissionValidator] Error fetching theory:', error);
            return null;
        }
    }

    /**
     * Valida si el estudiante puede iniciar una nueva sesión
     * (Llamar ANTES de crear la sesión)
     */
    static async canStartSession(
        studentId: string,
        availabilityId: string
    ): Promise<{ canStart: boolean; reason?: string }> {
        const validation = await this.validateMission(studentId, availabilityId);

        if (!validation.canPlay) {
            return {
                canStart: false,
                reason: validation.reason
            };
        }

        return { canStart: true };
    }

    /**
     * Obtiene un resumen de la misión para mostrar al estudiante
     */
    static async getMissionSummary(
        studentId: string,
        availabilityId: string
    ): Promise<{
        title: string;
        description: string;
        attemptsUsed: number;
        attemptsTotal: number;
        attemptsRemaining: number;
        showTheory: boolean;
        canPlay: boolean;
        reason?: string;
    } | null> {
        const validation = await this.validateMission(studentId, availabilityId);

        if (!validation.availability) {
            return null;
        }

        return {
            title: validation.availability.topics?.title || 'Misión',
            description: validation.availability.topics?.description || '',
            attemptsUsed: validation.attemptsUsed,
            attemptsTotal: validation.availability.max_attempts,
            attemptsRemaining: validation.attemptsRemaining,
            showTheory: validation.showTheory,
            canPlay: validation.canPlay,
            reason: validation.reason
        };
    }
}
