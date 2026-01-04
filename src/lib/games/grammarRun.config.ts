/**
 * Grammar Run Game Configuration
 * Endless runner where player selects correct grammar structures
 */

export const GRAMMAR_RUN_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring
    scoring: {
        correctGate: 15,      // Points for passing through correct gate
        wrongGate: -10,       // Penalty for wrong gate
        obstacleHit: -5,      // Penalty for hitting obstacle
        distancePoint: 1,     // Points per distance unit
    },

    // Gameplay
    gameplay: {
        gameDuration: 90,           // seconds
        runnerSpeed: 200,           // pixels per second
        gateSpawnInterval: 3000,    // milliseconds
        obstacleSpawnInterval: 4000, // milliseconds
        maxLives: 3,                // starting lives
        speedIncreaseRate: 1.05,    // speed multiplier every 10 seconds
    },

    // Visual settings
    visual: {
        backgroundColor: '#87CEEB', // Sky blue
        groundColor: '#8B7355',     // Brown
        correctGateColor: '#10b981', // Green
        wrongGateColor: '#ef4444',   // Red
        playerColor: '#3b82f6',      // Blue
        obstacleColor: '#f59e0b',    // Orange
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
    },

    // Physics
    physics: {
        gravity: 800,
        jumpVelocity: -400,
        laneWidth: 200,
        lanes: 3, // Left, Center, Right
    },
} as const;

export type GrammarRunConfig = typeof GRAMMAR_RUN_CONFIG;
