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

    // Visual settings - ESTILO MODERNO Y PULIDO
    visual: {
        backgroundColor: '#0f172a', // Fondo más oscuro y elegante
        wordCorrectColor: '#10b981', // Verde esmeralda moderno
        wordIncorrectColor: '#ef4444', // Rojo coral moderno
        wordNeutralColor: '#f8fafc', // Blanco suave
        fontSize: 24, // Ligeramente más grande para mejor legibilidad
        fontFamily: 'Arial Black, sans-serif',
        // Nuevos colores para UI mejorada
        hudBackground: 'rgba(15, 23, 42, 0.9)', // Fondo HUD con transparencia
        hudBorder: '#3b82f6', // Azul brillante para bordes
        scoreColor: '#60a5fa', // Azul cielo para score
        timerColor: '#fbbf24', // Amarillo dorado para timer
        correctCountColor: '#34d399', // Verde menta para contador
        textShadow: '#000000', // Sombra negra para contraste
        glowColor: '#3b82f6', // Color de resplandor
        particleColor: '#60a5fa', // Color de partículas
    },

    // Physics (Opcional si no usas motor de física arcade directo)
    physics: {
        gravity: 0, // En este tipo de juego los tweens manejan el movimiento mejor
    },
} as const;

export type WordCatcherConfig = typeof WORD_CATCHER_CONFIG;