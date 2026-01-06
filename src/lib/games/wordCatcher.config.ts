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

    // Gameplay - AJUSTADO PARA FLUIDEZ
    gameplay: {
        gameDuration: 120, // segundos
        wordFallSpeed: 1.2, // VELOCIDAD MODERADA (1.0 es normal, 2.0 es rápido)
        wordSpawnInterval: 2200, // milisegundos entre palabras
        maxWordsOnScreen: 6,
    },

    // Visual settings - ESTILO NEÓN
    visual: {
        backgroundColor: '#1e293b',
        wordCorrectColor: '#00ff00', // Verde neón
        wordIncorrectColor: '#ff0000', // Rojo neón
        wordNeutralColor: '#ffffff',
        fontSize: 22,
        fontFamily: 'Arial Black, sans-serif',
    },

    // Physics (Opcional si no usas motor de física arcade directo)
    physics: {
        gravity: 0, // En este tipo de juego los tweens manejan el movimiento mejor
    },
} as const;

export type WordCatcherConfig = typeof WORD_CATCHER_CONFIG;