/**
 * Sentence Builder Game Configuration
 * Drag and drop game for building sentences from words
 */

export const SENTENCE_BUILDER_CONFIG = {
    // Game dimensions
    width: 1280,
    height: 720,

    // Scoring (base values, pueden ser sobrescritos por mission_config)
    scoring: {
        points_correct: 10,      // Points for correct sentence
        points_wrong: -5,        // Penalty for wrong sentence
        streak_bonus: true,      // Enable streak bonuses
    },

    // Gameplay
    gameplay: {
        gameDuration: 180,          // seconds (3 minutes)
        sentencesPerGame: 8,        // Number of sentences to build
        timePerSentence: 30,        // seconds per sentence
        maxHintsPerSentence: 2,     // Hints available
        shuffleWords: true,         // Shuffle word order
    },

    // Visual settings
    visual: {
        backgroundColor: '#f8fafc',
        wordCardColor: '#3b82f6',
        wordCardHoverColor: '#2563eb',
        slotColor: '#e2e8f0',
        slotFilledColor: '#10b981',
        correctColor: '#10b981',
        incorrectColor: '#ef4444',
        fontSize: 20,
        fontFamily: 'Arial, sans-serif',
    },

    // Layout
    layout: {
        wordCardWidth: 120,
        wordCardHeight: 50,
        wordCardSpacing: 15,
        slotSpacing: 10,
        buildAreaY: 200,
        wordBankY: 450,
    },
} as const;

export type SentenceBuilderConfig = typeof SENTENCE_BUILDER_CONFIG;
