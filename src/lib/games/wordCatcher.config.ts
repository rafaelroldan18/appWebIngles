/**
 * Word Catcher Game Configuration
 * Defines all game parameters, scoring, and visual settings
 */

export const WORD_CATCHER_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring
    scoring: {
        correctCatch: 10,
        wrongCatch: -5,
        missedWord: -2,
    },

    // Gameplay
    gameplay: {
        gameDuration: 120, // seconds
        wordFallSpeed: 100, // pixels per second
        wordSpawnInterval: 2000, // milliseconds
        maxWordsOnScreen: 8,
    },

    // Visual settings
    visual: {
        backgroundColor: '#1e293b',
        wordCorrectColor: '#10b981',
        wordIncorrectColor: '#ef4444',
        wordNeutralColor: '#ffffff',
        fontSize: 24,
        fontFamily: 'Arial, sans-serif',
    },

    // Physics
    physics: {
        gravity: 200,
        bounceMin: 0.2,
        bounceMax: 0.4,
    },
} as const;

export type WordCatcherConfig = typeof WORD_CATCHER_CONFIG;
