import type { GameSessionDetails } from '@/types';

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
    summary: GameSessionDetails['summary'];
    breakdown: GameSessionDetails['breakdown'];
    review?: GameSessionDetails['review'];
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
     * Evaluate game results as a mission with full pedagogical detail
     */
    static evaluateMission(
        score: number,
        accuracy: number,
        correctCount: number,
        wrongCount: number,
        durationSeconds: number = 0,
        answers: GameSessionDetails['answers'] = [],
        criteria: EvaluationCriteria = this.DEFAULT_CRITERIA
    ): MissionResult {
        try {
            const completed = true;
            const success = this.isMissionSuccessful(score, accuracy, criteria);
            const performance = this.calculatePerformance(accuracy, criteria);
            const pointsEarned = this.calculatePointsEarned(score, performance);
            const feedback = this.generateFeedback(performance, success, accuracy);
            const achievements = this.checkAchievements(score, accuracy, correctCount);

            const details = this.generateStandardizedDetails(
                score,
                accuracy,
                correctCount,
                wrongCount,
                durationSeconds,
                answers,
                criteria
            );

            return {
                completed,
                success,
                score,
                accuracy,
                performance,
                pointsEarned,
                feedback,
                achievements,
                summary: details.summary,
                breakdown: details.breakdown,
                review: details.review
            };
        } catch (error) {
            console.error('[MissionEvaluator] Error evaluating mission:', error);
            // Fallback result to avoid crashing the game flow
            return {
                completed: true,
                success: score > 0,
                score,
                accuracy,
                performance: 'fair',
                pointsEarned: score,
                feedback: 'Sesión finalizada. Sigue practicando.',
                achievements: [],
                summary: {
                    score_raw: score,
                    score_final: score,
                    duration_seconds: durationSeconds,
                    correct_count: correctCount,
                    wrong_count: wrongCount,
                    accuracy,
                    performance: 'fair',
                    passed: true,
                    completed: true
                },
                breakdown: {
                    base_points: score,
                    multiplier: 1,
                    bonus_points: 0,
                    penalty_points: 0,
                    rules_used: {
                        minScoreToPass: criteria.minScoreToPass,
                        minAccuracyToPass: criteria.minAccuracyToPass,
                        excellentThreshold: criteria.excellentThreshold
                    }
                }
            };
        }
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
     * Generate standardized details for database storage
     */
    static generateStandardizedDetails(
        score: number,
        accuracy: number,
        correctCount: number,
        wrongCount: number,
        durationSeconds: number,
        answers: GameSessionDetails['answers'],
        criteria: EvaluationCriteria = this.DEFAULT_CRITERIA
    ): GameSessionDetails {
        const success = this.isMissionSuccessful(score, accuracy, criteria);
        const performance = this.calculatePerformance(accuracy, criteria);

        const multipliers = {
            excellent: 1.5,
            good: 1.2,
            fair: 1.0,
            poor: 0.5,
        };
        const multiplier = multipliers[performance];
        const scoreFinal = Math.floor(score * multiplier);
        const review = this.generatePedagogicalReview(answers);

        return {
            summary: {
                score_raw: score,
                score_final: scoreFinal,
                duration_seconds: durationSeconds,
                correct_count: correctCount,
                wrong_count: wrongCount,
                accuracy: accuracy,
                performance: performance,
                passed: success,
                completed: true
            },
            breakdown: {
                base_points: score,
                multiplier: multiplier,
                bonus_points: 0,
                penalty_points: 0,
                rules_used: {
                    minScoreToPass: criteria.minScoreToPass,
                    minAccuracyToPass: criteria.minAccuracyToPass,
                    excellentThreshold: criteria.excellentThreshold
                }
            },
            review,
            answers: answers
        };
    }

    /**
     * Analyzes answers to provide strengths, improvements and practice tips
     */
    private static generatePedagogicalReview(answers: GameSessionDetails['answers']): GameSessionDetails['review'] {
        try {
            const tagStats: Record<string, { correct: number, total: number }> = {};
            const safeAnswers = answers || [];

            safeAnswers.forEach(ans => {
                const tag = ans.meta?.rule_tag || ans.meta?.category || 'general';
                if (!tagStats[tag]) tagStats[tag] = { correct: 0, total: 0 };
                tagStats[tag].total++;

                // Check both is_correct (standardized) and result (raw item from session)
                const isCorrect = (ans as any).is_correct === true || (ans as any).result === 'correct';
                if (isCorrect) tagStats[tag].correct++;
            });

            const strengths: string[] = [];
            const improvements: string[] = [];

            Object.entries(tagStats).forEach(([tag, stats]) => {
                const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                if (accuracy >= 80) strengths.push(tag);
                else if (accuracy < 60) improvements.push(tag);
            });

            // Recommended practice based on the weakest tag
            let recommended_practice = '¡Sigue practicando para mejorar tu fluidez!';

            const improvementEntries = Object.entries(tagStats)
                .filter(([tag]) => improvements.includes(tag))
                .sort((a, b) => {
                    const accA = a[1].total > 0 ? a[1].correct / a[1].total : 0;
                    const accB = b[1].total > 0 ? b[1].correct / b[1].total : 0;
                    return accA - accB;
                });

            if (improvementEntries.length > 0) {
                const weakestTag = improvementEntries[0][0];
                recommended_practice = `Repasar: ${weakestTag.replace(/_/g, ' ')}`;
            } else if (strengths.length > 0 && safeAnswers.length > 5) {
                recommended_practice = '¡Excelente dominio! Intenta subir la dificultad.';
            }

            return {
                strengths: strengths.length > 0 ? strengths.map(s => s.replace(/_/g, ' ')) : ['Dominio del vocabulario base'],
                improvements: improvements.length > 0 ? improvements.map(s => s.replace(/_/g, ' ')) : ['Ninguna debilidad marcada'],
                recommended_practice
            };
        } catch (error) {
            console.error('[MissionEvaluator] Error generating review:', error);
            return {
                strengths: ['Dominio general'],
                improvements: ['Sigue practicando'],
                recommended_practice: '¡Sigue adelante con tu aprendizaje!'
            };
        }
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
