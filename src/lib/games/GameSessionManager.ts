/**
 * GameSessionManager - Manages game session lifecycle and score tracking
 */

import type { GameSession, GameSessionDetails } from '@/types';
import { MissionEvaluator } from '../gamification/MissionEvaluator';

export interface SessionItem {
    id: string;
    text: string;
    result: 'correct' | 'wrong' | 'missed';
    user_input?: string;
    correct_answer?: string;
    time_ms: number;
    meta?: any; // Rich breakdown data (prompt, expected, tags, feedback, etc.)
}

export interface SessionData {
    studentId: string;
    topicId: string;
    gameTypeId: string;
    score: number;
    correctCount: number;
    wrongCount: number;
    items: SessionItem[];
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
            items: [],
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
        this.sessionData.score = Math.max(0, this.sessionData.score + points);

        if (isCorrect) {
            this.sessionData.correctCount++;
        } else {
            this.sessionData.wrongCount++;
        }
    }

    /**
     * Record a specific item interaction
     */
    recordItem(item: SessionItem): void {
        this.sessionData.items.push(item);
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
            const accuracy = this.calculateAccuracy();

            // Map session items to standardized answers format
            const answers: GameSessionDetails['answers'] = this.sessionData.items.map(item => ({
                item_id: item.id,
                prompt: item.text,
                student_answer: item.user_input || '',
                correct_answer: item.correct_answer || '',
                is_correct: item.result === 'correct',
                meta: item.meta || { time_ms: item.time_ms } // Preserve rich meta or fallback to time only
            }));

            const details = MissionEvaluator.generateStandardizedDetails(
                this.sessionData.score,
                accuracy,
                this.sessionData.correctCount,
                this.sessionData.wrongCount,
                duration,
                answers
            );

            // Ensure score is non-negative and round to integer (database expects integer type)
            const finalScore = Math.max(0, Math.round(details.summary.score_final));

            const payload = {
                score: finalScore,
                completed: true,
                duration_seconds: duration,
                correct_count: this.sessionData.correctCount,
                wrong_count: this.sessionData.wrongCount,
                details: details,
            };

            // Log the payload for debugging
            console.log('Ending session with payload:', {
                sessionId: this.sessionId,
                score: payload.score,
                duration: payload.duration_seconds,
                correct: payload.correct_count,
                wrong: payload.wrong_count
            });

            const response = await fetch(`/api/games/sessions/${this.sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorData: any = {};
                const contentType = response.headers.get('content-type');

                // Try to parse error response
                if (contentType && contentType.includes('application/json')) {
                    try {
                        errorData = await response.json();
                    } catch (parseError) {
                        console.error('Failed to parse error response:', parseError);
                        errorData = { error: 'Failed to parse server response' };
                    }
                } else {
                    // If not JSON, get text response
                    const textResponse = await response.text();
                    errorData = { error: textResponse || response.statusText };
                }

                console.error('Failed to end session:', {
                    sessionId: this.sessionId,
                    status: response.status,
                    statusText: response.statusText,
                    errorData,
                    sentPayload: payload
                });

                throw new Error(
                    `Failed to end game session: ${errorData.error || response.statusText}` +
                    (errorData.details ? ` (${JSON.stringify(errorData.details)})` : '')
                );
            }

            this.isSessionActive = false;
            console.log('Session ended successfully:', this.sessionId);
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
     * Calculate average time per item
     */
    private calculateAvgTime(): number {
        if (this.sessionData.items.length === 0) return 0;
        const totalTime = this.sessionData.items.reduce((acc, item) => acc + item.time_ms, 0);
        return Math.round(totalTime / this.sessionData.items.length);
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
