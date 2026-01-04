/**
 * MissionEvaluator - Evaluates game results as mission completion
 * Pedagogical layer: Interprets scores and determines success/failure
 */

export interface MissionResult {
    completed: boolean;
    success: boolean;
    score: number;
    accuracy: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    pointsEarned: number;
    feedback: string;
    achievements?: string[];
}

export interface EvaluationCriteria {
    minScoreToPass: number;
    minAccuracyToPass: number;
    excellentThreshold: number;
    goodThreshold: number;
}

export class MissionEvaluator {
    // Default criteria - can be customized per topic/game
    private static DEFAULT_CRITERIA: EvaluationCriteria = {
        minScoreToPass: 50,
        minAccuracyToPass: 60,
        excellentThreshold: 80,
        goodThreshold: 65,
    };

    /**
     * Evaluate game results as a mission
     */
    static evaluateMission(
        score: number,
        accuracy: number,
        correctCount: number,
        wrongCount: number,
        criteria: EvaluationCriteria = this.DEFAULT_CRITERIA
    ): MissionResult {
        const completed = true; // Game was finished
        const success = this.isMissionSuccessful(score, accuracy, criteria);
        const performance = this.calculatePerformance(accuracy, criteria);
        const pointsEarned = this.calculatePointsEarned(score, performance);
        const feedback = this.generateFeedback(performance, success, accuracy);
        const achievements = this.checkAchievements(score, accuracy, correctCount);

        return {
            completed,
            success,
            score,
            accuracy,
            performance,
            pointsEarned,
            feedback,
            achievements,
        };
    }

    /**
     * Determine if mission was successful
     */
    private static isMissionSuccessful(
        score: number,
        accuracy: number,
        criteria: EvaluationCriteria
    ): boolean {
        return score >= criteria.minScoreToPass && accuracy >= criteria.minAccuracyToPass;
    }

    /**
     * Calculate performance level
     */
    private static calculatePerformance(
        accuracy: number,
        criteria: EvaluationCriteria
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        if (accuracy >= criteria.excellentThreshold) return 'excellent';
        if (accuracy >= criteria.goodThreshold) return 'good';
        if (accuracy >= criteria.minAccuracyToPass) return 'fair';
        return 'poor';
    }

    /**
     * Calculate points earned based on performance
     */
    private static calculatePointsEarned(
        score: number,
        performance: 'excellent' | 'good' | 'fair' | 'poor'
    ): number {
        const multipliers = {
            excellent: 1.5,
            good: 1.2,
            fair: 1.0,
            poor: 0.5,
        };

        return Math.floor(score * multipliers[performance]);
    }

    /**
     * Generate pedagogical feedback
     */
    private static generateFeedback(
        performance: 'excellent' | 'good' | 'fair' | 'poor',
        success: boolean,
        accuracy: number
    ): string {
        if (performance === 'excellent') {
            return '¡Excelente trabajo! Has dominado este tema. 🌟';
        }
        if (performance === 'good') {
            return '¡Buen trabajo! Estás progresando muy bien. 💪';
        }
        if (performance === 'fair') {
            return 'Misión completada. Sigue practicando para mejorar. 📚';
        }
        if (success) {
            return 'Has completado la misión, pero hay espacio para mejorar. 🎯';
        }
        return `Misión no completada. Necesitas al menos ${this.DEFAULT_CRITERIA.minAccuracyToPass}% de precisión. Inténtalo de nuevo. 🔄`;
    }

    /**
     * Check for achievements/badges
     */
    private static checkAchievements(
        score: number,
        accuracy: number,
        correctCount: number
    ): string[] {
        const achievements: string[] = [];

        if (accuracy === 100) {
            achievements.push('perfect_score');
        }
        if (score >= 150) {
            achievements.push('high_scorer');
        }
        if (correctCount >= 20) {
            achievements.push('word_master');
        }

        return achievements;
    }

    /**
     * Get criteria for specific topic (can be customized)
     */
    static getCriteriaForTopic(topicId: string): EvaluationCriteria {
        // In the future, this could load from database
        // For now, return default criteria
        return this.DEFAULT_CRITERIA;
    }

    /**
     * Format result for display
     */
    static formatResultMessage(result: MissionResult): string {
        const emoji = result.success ? '✅' : '❌';
        const status = result.success ? 'COMPLETADA' : 'NO COMPLETADA';

        return `${emoji} Misión ${status}\n${result.feedback}\nPuntos ganados: ${result.pointsEarned}`;
    }
}
