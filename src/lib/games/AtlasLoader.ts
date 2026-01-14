/**
 * AtlasLoader - Sistema estandarizado de carga de atlas
 * Carga automáticamente el atlas común (common-ui) + el atlas específico del juego
 */

export type GameKey = 'wc' | 'im' | 'gr' | 'sb' | 'ce';

/**
 * Mapeo de claves de juego a nombres de carpetas de atlas
 */
const GAME_ATLAS_FOLDERS: Record<GameKey, string> = {
    'wc': 'word-catcher',
    'im': 'image-match',
    'gr': 'grammar-run',
    'sb': 'sentence-builder',
    'ce': 'city-explorer'
};

/**
 * Configuración de atlas
 */
export const ATLAS_CONFIG = {
    common: {
        key: 'ui_atlas',
        textureURL: '/assets/atlases/common-ui/texture.png',
        atlasURL: '/assets/atlases/common-ui/texture.json'
    },
    games: {
        wc: {
            key: 'wc_atlas',
            textureURL: '/assets/atlases/word-catcher/texture.png',
            atlasURL: '/assets/atlases/word-catcher/texture.json'
        },
        im: {
            key: 'im_atlas',
            textureURL: '/assets/atlases/image-match/texture.png',
            atlasURL: '/assets/atlases/image-match/texture.json'
        },
        gr: {
            key: 'gr_atlas',
            textureURL: '/assets/atlases/grammar-run/texture.png',
            atlasURL: '/assets/atlases/grammar-run/texture.json'
        },
        sb: {
            key: 'sb_atlas',
            textureURL: '/assets/atlases/sentence-builder/texture.png',
            atlasURL: '/assets/atlases/sentence-builder/texture.json'
        },
        ce: {
            key: 'ce_atlas',
            textureURL: '/assets/atlases/city-explorer/texture.png',
            atlasURL: '/assets/atlases/city-explorer/texture.json'
        }
    }
} as const;

/**
 * Carga el atlas común (UI) y el atlas específico del juego
 * 
 * @param scene - La escena de Phaser donde cargar los atlas
 * @param gameKey - Clave del juego ('wc', 'im', 'gr', 'sb', 'ce')
 * 
 * @example
 * ```typescript
 * preload() {
 *     loadGameAtlases(this, 'wc');
 *     // Ahora puedes usar frames como: 'panel_card', 'btn_primary', 'wc_token', etc.
 * }
 * ```
 */
export function loadGameAtlases(scene: Phaser.Scene, gameKey: GameKey): void {
    // Cargar atlas común (UI compartida)
    scene.load.atlas(
        ATLAS_CONFIG.common.key,
        ATLAS_CONFIG.common.textureURL,
        ATLAS_CONFIG.common.atlasURL
    );

    // Cargar atlas específico del juego
    const gameAtlas = ATLAS_CONFIG.games[gameKey];
    scene.load.atlas(
        gameAtlas.key,
        gameAtlas.textureURL,
        gameAtlas.atlasURL
    );

    console.log(`[AtlasLoader] Cargando atlas: ${ATLAS_CONFIG.common.key} + ${gameAtlas.key}`);
}

/**
 * Obtiene el nombre del atlas del juego basado en la clave
 */
export function getGameAtlasKey(gameKey: GameKey): string {
    return ATLAS_CONFIG.games[gameKey].key;
}

/**
 * Obtiene el nombre del atlas común
 */
export function getCommonAtlasKey(): string {
    return ATLAS_CONFIG.common.key;
}

/**
 * Helper para obtener un frame del atlas común
 * 
 * @example
 * ```typescript
 * const panelFrame = getUIFrame('panel_card');
 * this.add.image(x, y, panelFrame.atlas, panelFrame.frame);
 * ```
 */
export function getUIFrame(frameName: string): { atlas: string; frame: string } {
    return {
        atlas: ATLAS_CONFIG.common.key,
        frame: frameName
    };
}

/**
 * Helper para obtener un frame del atlas del juego
 * 
 * @example
 * ```typescript
 * const tokenFrame = getGameFrame('wc', 'token');
 * this.add.image(x, y, tokenFrame.atlas, tokenFrame.frame);
 * ```
 */
export function getGameFrame(gameKey: GameKey, frameName: string): { atlas: string; frame: string } {
    return {
        atlas: ATLAS_CONFIG.games[gameKey].key,
        frame: frameName
    };
}
