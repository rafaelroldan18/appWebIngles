import * as Phaser from 'phaser';

export type GameKey = 'wc' | 'im' | 'gr' | 'sb' | 'ce';

const GAME_AUDIO_PATHS: Record<GameKey, string> = {
    'wc': 'word-catcher',
    'im': 'image-match',
    'gr': 'grammar-run',
    'sb': 'sentence-builder',
    'ce': 'city-explorer'
};

/**
 * Carga los audios comunes y los específicos del juego
 */
export function loadGameAudio(scene: Phaser.Scene, gameKey: GameKey): void {
    // 1. Cargar Audios Comunes (SFX)
    scene.load.audio('ui_click', '/assets/audio/common/sfx/ui_click.mp3');
    scene.load.audio('correct', '/assets/audio/common/sfx/correct.mp3');
    scene.load.audio('wrong', '/assets/audio/common/sfx/wrong.mp3');
    scene.load.audio('game_win', '/assets/audio/common/sfx/game_win.mp3');
    scene.load.audio('game_start', '/assets/audio/common/sfx/game_start.mp3');

    // 2. Cargar Música Común
    scene.load.audio('main_menu_music', '/assets/audio/common/music/main_menu.mp3');

    // 3. Cargar Audios Específicos del Juego
    const path = GAME_AUDIO_PATHS[gameKey];

    // Música de fondo del juego
    if (gameKey === 'sb') {
        scene.load.audio('bg_music', '/assets/audio/sentence-builder/music/game-music-loop-6-144641.mp3');
    } else {
        scene.load.audio('bg_music', `/assets/audio/${path}/music/bg_music.mp3`);
    }

    // SFX específicos
    switch (gameKey) {
        case 'im':
            scene.load.audio('card_flip', `/assets/audio/${path}/sfx/card_flip.mp3`);
            scene.load.audio('match', `/assets/audio/${path}/sfx/match.mp3`);
            break;
        case 'wc':
            scene.load.audio('catch_correct', `/assets/audio/${path}/sfx/catch_correct.mp3`);
            scene.load.audio('catch_wrong', `/assets/audio/${path}/sfx/catch_wrong.mp3`);
            scene.load.audio('item_spawn', `/assets/audio/${path}/sfx/item_spawn.mp3`);
            break;
        case 'gr':
            scene.load.audio('jump', `/assets/audio/${path}/sfx/jump.mp3`);
            scene.load.audio('collect', `/assets/audio/${path}/sfx/collect.mp3`);
            scene.load.audio('obstacle_hit', `/assets/audio/${path}/sfx/obstacle_hit.mp3`);
            break;
        case 'sb':
            scene.load.audio('pick_word', `/assets/audio/${path}/sfx/pick_word.mp3`);
            scene.load.audio('place_word', `/assets/audio/${path}/sfx/place_word.mp3`);
            scene.load.audio('sentence_ok', `/assets/audio/${path}/sfx/sentence_ok.mp3`);
            break;
        case 'ce':
            scene.load.audio('map_pin', `/assets/audio/${path}/sfx/map_pin.mp3`);
            scene.load.audio('unlock', `/assets/audio/${path}/sfx/unlock.mp3`);
            scene.load.audio('found_clue', `/assets/audio/${path}/sfx/found_clue.mp3`);
            break;
    }

    console.log(`[AudioLoader] Cargando audios para: ${gameKey}`);
}
