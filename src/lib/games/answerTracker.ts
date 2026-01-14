/**
 * Answer Tracker for Game Sessions
 * Tracks all player actions and builds detailed answer records
 * Format optimized for results page display
 */

export interface AnswerRecord {
    item_id?: string;
    prompt: string;
    student_answer: any;
    correct_answer: any;
    is_correct: boolean;
    meta?: {
        event: 'catch' | 'miss' | 'avoid' | 'match_attempt';
        was_distractor?: boolean;
        time_ms?: number;
        position?: { x: number; y: number };
        [key: string]: any;
    };
}

export class AnswerTracker {
    private answers: AnswerRecord[] = [];
    private gameStartTime: number;

    constructor() {
        this.gameStartTime = Date.now();
    }

    /**
     * Records when a player catches/clicks a correct word
     */
    recordCorrectCatch(
        itemId: string,
        wordText: string,
        position?: { x: number; y: number },
        tags?: string[]
    ): void {
        const timeMs = Date.now() - this.gameStartTime;

        this.answers.push({
            item_id: itemId,
            prompt: wordText,
            student_answer: 'clicked',
            correct_answer: wordText,
            is_correct: true,
            meta: {
                event: 'catch',
                was_distractor: false,
                time_ms: timeMs,
                position,
                rule_tag: tags && tags.length > 0 ? tags[0] : undefined
            }
        });

        console.log('[AnswerTracker] Correct catch:', { word: wordText, time: `${timeMs}ms` });
    }

    /**
     * Records when a player catches/clicks a distractor (wrong word)
     */
    recordDistractorCatch(
        itemId: string,
        wordText: string,
        position?: { x: number; y: number },
        tags?: string[]
    ): void {
        const timeMs = Date.now() - this.gameStartTime;

        this.answers.push({
            item_id: itemId,
            prompt: wordText,
            student_answer: 'clicked',
            correct_answer: null,
            is_correct: false,
            meta: {
                event: 'catch',
                was_distractor: true,
                time_ms: timeMs,
                position,
                rule_tag: tags && tags.length > 0 ? tags[0] : undefined
            }
        });

        console.log('[AnswerTracker] Distractor catch:', { word: wordText, time: `${timeMs}ms` });
    }

    /**
     * Records when a correct word falls off screen without being caught
     */
    recordMissedWord(
        itemId: string,
        wordText: string,
        position?: { x: number; y: number },
        tags?: string[]
    ): void {
        const timeMs = Date.now() - this.gameStartTime;

        this.answers.push({
            item_id: itemId,
            prompt: wordText,
            student_answer: 'missed',
            correct_answer: wordText,
            is_correct: false,
            meta: {
                event: 'miss',
                was_distractor: false,
                time_ms: timeMs,
                position,
                rule_tag: tags && tags.length > 0 ? tags[0] : undefined
            }
        });

        console.log('[AnswerTracker] Missed word:', { word: wordText, time: `${timeMs}ms` });
    }

    /**
     * Records when a distractor word falls off screen (correctly avoided)
     */
    recordAvoidedDistractor(
        itemId: string,
        wordText: string,
        position?: { x: number; y: number }
    ): void {
        const timeMs = Date.now() - this.gameStartTime;

        this.answers.push({
            item_id: itemId,
            prompt: wordText,
            student_answer: 'avoided',
            correct_answer: null,
            is_correct: true, // Correctly avoiding a distractor is correct!
            meta: {
                event: 'avoid',
                was_distractor: true,
                time_ms: timeMs,
                position
            }
        });

        console.log('[AnswerTracker] Avoided distractor:', { word: wordText, time: `${timeMs}ms` });
    }

    /**
     * Records a match attempt in ImageMatch
     */
    recordMatchAttempt(data: {
        pairId: string;
        contentId: string;
        first: { kind: string; value: string };
        second: { kind: string; value: string };
        isCorrect: boolean;
        moves: number;
        timeMs: number;
        ruleTag?: string;
    }): void {
        this.answers.push({
            item_id: data.contentId,
            prompt: 'PAIR_MATCH',
            student_answer: {
                first: data.first,
                second: data.second
            },
            correct_answer: {
                pair_id: data.pairId,
                rule: 'image+word same pair'
            },
            is_correct: data.isCorrect,
            meta: {
                event: 'match_attempt',
                pair_id: data.pairId,
                moves: data.moves,
                time_ms: data.timeMs,
                rule_tag: data.ruleTag
            }
        });

        console.log('[AnswerTracker] Match attempt:', {
            pair: data.pairId,
            isCorrect: data.isCorrect,
            moves: data.moves
        });
    }

    /**
     * Gets all recorded answers in the standard format
     */
    getAnswers(): AnswerRecord[] {
        return [...this.answers];
    }

    /**
     * Gets answer statistics
     */
    getStats() {
        const total = this.answers.length;
        const correct = this.answers.filter(a => a.is_correct).length;
        const wrong = total - correct;
        const missed = this.answers.filter(a => a.meta?.event === 'miss').length;
        const caught = this.answers.filter(a => a.student_answer === 'clicked').length;
        const distractorsCaught = this.answers.filter(a => a.meta?.was_distractor && a.student_answer === 'clicked').length;

        return {
            total,
            correct,
            wrong,
            missed,
            caught,
            distractorsCaught,
            accuracy: total > 0 ? (correct / total) * 100 : 0
        };
    }

    /**
     * Resets the tracker
     */
    reset(): void {
        this.answers = [];
        this.gameStartTime = Date.now();
    }

    /**
     * Gets the game duration in seconds
     */
    getDuration(): number {
        return Math.floor((Date.now() - this.gameStartTime) / 1000);
    }
}
