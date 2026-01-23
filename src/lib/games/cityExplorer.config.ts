/**
 * City Explorer Game Configuration
 * Interactive map exploration game for learning locations and prepositions
 */

export const CITY_EXPLORER_CONFIG = {
    // Game dimensions
    width: 800,
    height: 600,

    // Scoring (base values, pueden ser sobrescritos por mission_config)
    scoring: {
        points_correct: 10,      // Points for finding location correctly
        points_wrong: -5,        // Penalty for wrong answer
        streak_bonus: true,      // Enable streak bonuses
    },

    // Gameplay
    gameplay: {
        gameDuration: 240,        // seconds (4 minutes)
        locationsToFind: 6,       // Number of locations to visit
        timePerLocation: 30,      // seconds to find each location
        playerSpeed: 150,         // pixels per second
        hintDelay: 10,            // seconds before hint appears
    },

    // Visual settings
    visual: {
        backgroundColor: '#87CEEB', // Sky blue
        groundColor: '#90EE90',     // Light green
        roadColor: '#696969',       // Dark gray
        playerColor: '#3b82f6',     // Blue
        buildingColors: {
            bank: '#FFD700',          // Gold
            hospital: '#FF6B6B',      // Red
            school: '#4ECDC4',        // Teal
            park: '#95E1D3',          // Light green
            restaurant: '#F38181',    // Pink
            library: '#AA96DA',       // Purple
            museum: '#FCBAD3',        // Light pink
            station: '#A8E6CF',       // Mint
        },
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
    },

    // Map layout
    map: {
        gridSize: 100,              // Size of each grid cell
        buildingSize: 80,           // Size of buildings
        buildingSpacing: 20,        // Space between buildings
    },

    // Locations (emojis for buildings)
    locationEmojis: {
        bank: '🏦',
        hospital: '🏥',
        school: '🏫',
        park: '🏞️',
        restaurant: '🍽️',
        library: '📚',
        museum: '🏛️',
        station: '🚉',
    },
} as const;

export type CityExplorerConfig = typeof CITY_EXPLORER_CONFIG;
