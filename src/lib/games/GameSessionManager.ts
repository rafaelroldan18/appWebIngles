/**
 * GameSessionManager - Manages game session lifecycle and score tracking
 */

import type { GameSession } from '@/types';

export interface SessionData {
    studentId: string;
    topicId: string;
    gameTypeId: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    details: any;
    startTime: number;
}

export class GameSessionManager {
    private sessionId: string | null = null;
    private sessionData: SessionData;
    private isSessionActive: boolean = false;

    constructor(studentId: string, topicId: string, gameTypeId: string) {
        this.sessionData = {
            studentId,
            topicId,
            gameTypeId,
            score: 0,
            correctCount: 0,
            wrongCount: 0,
            details: {},
            startTime: Date.now(),
        };
    }

    /**
     * Start a new game session
     */
    async startSession(): Promise<string> {
        try {
            const response = await fetch('/api/games/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: this.sessionData.studentId,
                    topic_id: this.sessionData.topicId,
                    game_type_id: this.sessionData.gameTypeId,
                    score: 0,
                    completed: false,
                    correct_count: 0,
                    wrong_count: 0,
                    details: {},
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to start game session');
            }

            const session = await response.json();
            this.sessionId = session.session_id;
            this.isSessionActive = true;

            return this.sessionId;
        } catch (error) {
            console.error('Error starting session:', error);
            throw error;
        }
    }

    /**
     * Update score and statistics
     */
    updateScore(points: number, isCorrect: boolean): void {
        this.sessionData.score += points;

        if (isCorrect) {
            this.sessionData.correctCount++;
        } else {
            this.sessionData.wrongCount++;
        }
    }

    /**
     * Get current session data
     */
    getSessionData(): SessionData {
        return { ...this.sessionData };
    }

    /**
     * Calculate game duration in seconds
     */
    getDuration(): number {
        return Math.floor((Date.now() - this.sessionData.startTime) / 1000);
    }

    /**
     * End the session and submit results
     */
    async endSession(additionalDetails?: any): Promise<void> {
        if (!this.sessionId || !this.isSessionActive) {
            console.warn('No active session to end');
            return;
        }

        try {
            const duration = this.getDuration();

            const response = await fetch(`/api/games/sessions/${this.sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: Math.max(0, this.sessionData.score), // Ensure non-negative
                    completed: true,
                    duration_seconds: duration,
                    correct_count: this.sessionData.correctCount,
                    wrong_count: this.sessionData.wrongCount,
                    details: {
                        ...this.sessionData.details,
                        ...additionalDetails,
                        finalScore: this.sessionData.score,
                        accuracy: this.calculateAccuracy(),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to end game session');
            }

            this.isSessionActive = false;
        } catch (error) {
            console.error('Error ending session:', error);
            throw error;
        }
    }

    /**
     * Calculate accuracy percentage
     */
    private calculateAccuracy(): number {
        const total = this.sessionData.correctCount + this.sessionData.wrongCount;
        if (total === 0) return 0;
        return Math.round((this.sessionData.correctCount / total) * 100);
    }

    /**
     * Check if session is active
     */
    isActive(): boolean {
        return this.isSessionActive;
    }

    /**
     * Get session ID
     */
    getSessionId(): string | null {
        return this.sessionId;
    }
}
