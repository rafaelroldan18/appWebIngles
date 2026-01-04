/**
 * Image Match Game Configuration
 * Memory/card matching game for vocabulary with images
 */

export const IMAGE_MATCH_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring
    scoring: {
        matchFound: 20,        // Points for finding a correct pair
        wrongMatch: -3,        // Penalty for wrong match
        timeBonus: 2,          // Bonus per 10 seconds remaining
        perfectGame: 50,       // Bonus for no mistakes
    },

    // Gameplay
    gameplay: {
        gameDuration: 180,     // seconds (3 minutes)
        pairsCount: 8,         // Number of pairs to match
        flipBackDelay: 1000,   // ms before flipping back wrong matches
        matchDelay: 500,       // ms to show matched pair
    },

    // Visual settings
    visual: {
        backgroundColor: '#1e293b',
        cardBackColor: '#3b82f6',
        cardFrontColor: '#ffffff',
        cardMatchedColor: '#10b981',
        cardWrongColor: '#ef4444',
        cardHoverColor: '#2563eb',
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
    },

    // Grid layout
    grid: {
        rows: 4,
        cols: 4,
        cardWidth: 140,
        cardHeight: 140,
        cardSpacing: 15,
        cardRadius: 10,
    },
} as const;

export type ImageMatchConfig = typeof IMAGE_MATCH_CONFIG;
