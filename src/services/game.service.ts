
import type {
    GameType,
    GameAvailability,
    GameContent,
    GameSession,
    StudentProgress
} from '@/types';

export class GameService {
    /**
     * Obtiene todos los tipos de juegos disponibles
     */
    static async getGameTypes(): Promise<GameType[]> {
        const response = await fetch('/api/games/types', {
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener tipos de juegos');
        }
        return response.json();
    }

    /**
     * Obtiene la disponibilidad de juegos para un paralelo específico
     * @param parallelId - ID del paralelo
     * @param activeOnly - Si es true, solo devuelve misiones activas (default: true)
     */
    static async getAvailability(parallelId: string, activeOnly: boolean = true): Promise<GameAvailability[]> {
        const response = await fetch(`/api/games/availability?parallelId=${parallelId}&activeOnly=${activeOnly}&_t=${Date.now()}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener disponibilidad de juegos');
        }
        return response.json();
    }

    /**
     * Obtiene el contenido de un juego para un tema
     */
    static async getGameContent(topicId: string): Promise<GameContent[]> {
        const response = await fetch(`/api/games/content?topicId=${topicId}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener contenido del juego');
        }
        return response.json();
    }

    /**
     * Crea una nueva sesión de juego
     */
    static async createSession(data: Partial<GameSession>): Promise<GameSession> {
        const response = await fetch('/api/games/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear sesión de juego');
        }
        return response.json();
    }

    /**
     * Actualiza una sesión de juego (por ejemplo, al finalizar)
     */
    static async updateSession(sessionId: string, data: Partial<GameSession>): Promise<GameSession> {
        const response = await fetch(`/api/games/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar sesión de juego');
        }
        return response.json();
    }

    /**
     * Obtiene el progreso de un estudiante
     */
    static async getProgress(studentId: string): Promise<StudentProgress> {
        const response = await fetch(`/api/progress?studentId=${studentId}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener progreso del estudiante');
        }
        return response.json();
    }

    /**
     * Obtiene las sesiones de juego de un estudiante
     */
    static async getSessions(studentId: string): Promise<GameSession[]> {
        const response = await fetch(`/api/games/sessions?studentId=${studentId}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener sesiones de juego');
        }
        return response.json();
    }
}
