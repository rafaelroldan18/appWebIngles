/**
 * Game Assets Configuration
 * Centralized asset paths for easy management and loading
 */

export const GAME_ASSETS = {
    // Common UI Assets (Kenney)
    ui: {
        kenneyUI1: {
            panel: '/assets/games/common/ui/kenney-ui-1/panel.png',
            button: '/assets/games/common/ui/kenney-ui-1/button.png',
            buttonHover: '/assets/games/common/ui/kenney-ui-1/button-hover.png',
            iconPause: '/assets/games/common/ui/kenney-ui-1/icon-pause.png',
            iconHelp: '/assets/games/common/ui/kenney-ui-1/icon-help.png',
        }
    },

    // Word Catcher Specific Assets
    wordCatcher: {
        backgrounds: {
            bg1: '/assets/games/word-catcher/backgrounds/bg_1.png',
        },
        sprites: {
            token: '/assets/games/word-catcher/sprites/token.png',
            tokenBad: '/assets/games/word-catcher/sprites/token-bad.png',
            particle: '/assets/games/word-catcher/sprites/particle.png',
        }
    },

    // Image Match Specific Assets
    imageMatch: {
        backgrounds: {
            bg1: '/assets/games/image-match/backgrounds/bg_1.png',
        },
        cards: {
            cardBack: '/assets/games/image-match/cards/card_back.png',
            cardFrontFrame: '/assets/games/image-match/cards/card_front_frame.png',
            cardMatchGlow: '/assets/games/image-match/cards/card_match_glow.png',
        },
        fx: {
            particle: '/assets/games/image-match/fx/particle.png',
        }
    },

    // Fonts
    fonts: {
        gameFont: '/assets/fonts/game-font.ttf', // Optional
    }
} as const;

/**
 * Asset pack configurations
 * Maps asset pack names to their respective asset sets
 */
export const ASSET_PACKS = {
    'kenney-ui-1': GAME_ASSETS.ui.kenneyUI1,
    'kenney-red': GAME_ASSETS.ui.kenneyUI1, // Can be extended with red variant
    'modern-neon': GAME_ASSETS.ui.kenneyUI1, // Can be extended with neon variant
    'retro-pixel': GAME_ASSETS.ui.kenneyUI1, // Can be extended with pixel variant
} as const;

/**
 * Get assets for a specific pack
 */
export function getAssetPack(packName: keyof typeof ASSET_PACKS) {
    return ASSET_PACKS[packName] || ASSET_PACKS['kenney-ui-1'];
}

/**
 * Preload assets for Phaser
 * Use this in your game's preload() function
 */
export function preloadWordCatcherAssets(scene: Phaser.Scene, assetPack: string = 'kenney-ui-1') {
    const uiAssets = getAssetPack(assetPack as keyof typeof ASSET_PACKS);
    const wcAssets = GAME_ASSETS.wordCatcher;

    // Load UI assets
    scene.load.image('ui-panel', uiAssets.panel);
    scene.load.image('ui-button', uiAssets.button);
    scene.load.image('ui-button-hover', uiAssets.buttonHover);
    scene.load.image('ui-icon-pause', uiAssets.iconPause);
    scene.load.image('ui-icon-help', uiAssets.iconHelp);

    // Load Word Catcher specific assets
    scene.load.image('wc-bg', wcAssets.backgrounds.bg1);
    scene.load.image('wc-token', wcAssets.sprites.token);
    scene.load.image('wc-token-bad', wcAssets.sprites.tokenBad);
    scene.load.image('wc-particle', wcAssets.sprites.particle);
}

/**
 * Preload assets for ImageMatch game
 * Use this in ImageMatchScene's preload() function
 */
export function preloadImageMatchAssets(scene: Phaser.Scene, assetPack: string = 'kenney-ui-1') {
    const uiAssets = getAssetPack(assetPack as keyof typeof ASSET_PACKS);
    const imAssets = GAME_ASSETS.imageMatch;

    // Load UI assets (Kenney)
    scene.load.image('ui-panel', uiAssets.panel);
    scene.load.image('ui-button', uiAssets.button);
    scene.load.image('ui-button-hover', uiAssets.buttonHover);
    scene.load.image('ui-icon-pause', uiAssets.iconPause);
    scene.load.image('ui-icon-help', uiAssets.iconHelp);

    // Load ImageMatch specific assets
    scene.load.image('im-bg', imAssets.backgrounds.bg1);
    scene.load.image('im-card-back', imAssets.cards.cardBack);
    scene.load.image('im-card-front-frame', imAssets.cards.cardFrontFrame);
    scene.load.image('im-card-match-glow', imAssets.cards.cardMatchGlow);
    scene.load.image('im-particle', imAssets.fx.particle);
}

/**
 * Asset dimensions (for reference)
 */
export const ASSET_DIMENSIONS = {
    ui: {
        panel: { width: 400, height: 300 },
        button: { width: 200, height: 80 },
        icon: { width: 64, height: 64 },
    },
    wordCatcher: {
        background: { width: 800, height: 600 },
        token: { width: 64, height: 64 },
        particle: { width: 16, height: 16 },
    },
    imageMatch: {
        background: { width: 800, height: 600 },
        card: { width: 140, height: 140 },
        particle: { width: 16, height: 16 },
    }
} as const;

export type AssetPackName = keyof typeof ASSET_PACKS;
