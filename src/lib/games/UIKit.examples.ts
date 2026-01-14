/**
 * GUÍA DE USO DEL UI KIT
 * 
 * Este archivo muestra ejemplos de cómo usar todos los componentes del UIKit
 * en tus juegos. Copia y adapta estos ejemplos según necesites.
 */

import * as Phaser from 'phaser';
import {
    createPanel,
    createButton,
    createIconButton,
    showFeedback,
    showBurst,
    showGlow,
    showModal,
    showToast,
    createProgressBar
} from './UIKit';

// ============================================
// EJEMPLO 1: Crear un panel de pausa
// ============================================
function createPausePanel(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const { width, height } = scene.cameras.main;
    const container = scene.add.container(0, 0);

    // Panel de fondo
    const panel = createPanel(
        scene,
        'common-ui/panels/panel_modal',
        width / 2,
        height / 2,
        400,
        300
    );

    // Título
    const title = scene.add.text(width / 2, height / 2 - 80, 'PAUSED', {
        fontSize: '48px',
        fontFamily: 'Arial Black',
        color: '#FFD700'
    }).setOrigin(0.5);

    // Botón de continuar
    const resumeBtn = createButton(
        scene,
        'common-ui/buttons/btn_primary',
        width / 2,
        height / 2,
        'RESUME',
        () => {
            container.destroy();
            scene.scene.resume();
        },
        { scale: 1.5 }
    );

    // Botón de salir
    const quitBtn = createButton(
        scene,
        'common-ui/buttons/btn_secondary',
        width / 2,
        height / 2 + 80,
        'QUIT',
        () => {
            scene.scene.start('MenuScene');
        },
        { scale: 1.5 }
    );

    container.add([panel, title, resumeBtn, quitBtn]);
    return container;
}

// ============================================
// EJEMPLO 2: Mostrar feedback al responder
// ============================================
function handleAnswer(scene: Phaser.Scene, x: number, y: number, isCorrect: boolean): void {
    // Mostrar check o cross
    showFeedback(scene, x, y, isCorrect);

    if (isCorrect) {
        // Efectos adicionales para respuesta correcta
        showBurst(scene, x, y, 0x00FF00);
        showGlow(scene, x, y, 0xFFD700);
        showToast(scene, '¡Correcto! +10 puntos', 1500, true);
    } else {
        // Efectos para respuesta incorrecta
        showBurst(scene, x, y, 0xFF0000);
        showToast(scene, 'Incorrecto. Intenta de nuevo', 1500, false);
    }
}

// ============================================
// EJEMPLO 3: Modal de fin de juego
// ============================================
function showGameOverModal(scene: Phaser.Scene, score: number, onRestart: () => void): void {
    showModal(scene, {
        title: 'GAME OVER',
        message: `Tu puntuación final: ${score}\n\n¿Quieres jugar de nuevo?`,
        buttons: [
            {
                label: 'RESTART',
                onClick: onRestart,
                isPrimary: true
            },
            {
                label: 'MENU',
                onClick: () => scene.scene.start('MenuScene'),
                isPrimary: false
            }
        ],
        width: 500,
        height: 350
    });
}

// ============================================
// EJEMPLO 4: Botones de control en HUD
// ============================================
function createControlButtons(scene: Phaser.Scene): void {
    const { width } = scene.cameras.main;

    // Botón de pausa
    const pauseBtn = createIconButton(
        scene,
        'common-ui/buttons/btn_round',
        'common-ui/icons/icon_pause',
        width - 60,
        40,
        () => {
            scene.scene.pause();
            createPausePanel(scene);
        },
        { scale: 0.8, iconScale: 1.2 }
    );

    // Botón de ayuda
    const helpBtn = createIconButton(
        scene,
        'common-ui/buttons/btn_round',
        'common-ui/icons/icon_help',
        width - 130,
        40,
        () => {
            showModal(scene, {
                title: 'AYUDA',
                message: 'Atrapa las palabras correctas y evita las incorrectas.\n\nCada palabra correcta suma puntos.',
                buttons: [{ label: 'ENTENDIDO', onClick: () => { }, isPrimary: true }]
            });
        },
        { scale: 0.8, iconScale: 1.2 }
    );
}

// ============================================
// EJEMPLO 5: Barra de progreso
// ============================================
function createLevelProgress(scene: Phaser.Scene): void {
    const { width } = scene.cameras.main;

    const progressBar = createProgressBar(scene, width / 2, 100, 300, 20);

    // Simular progreso
    let progress = 0;
    scene.time.addEvent({
        delay: 100,
        callback: () => {
            progress += 2;
            progressBar.setProgress(progress);
            if (progress >= 100) {
                showToast(scene, '¡Nivel completado!', 2000, true);
            }
        },
        repeat: 50
    });
}

// ============================================
// EJEMPLO 6: Panel de instrucciones
// ============================================
function showInstructions(scene: Phaser.Scene, instructions: string): void {
    const { width, height } = scene.cameras.main;
    const container = scene.add.container(0, 0).setDepth(2000);

    // Fondo oscuro
    const backdrop = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    backdrop.setOrigin(0);

    // Panel
    const panel = createPanel(
        scene,
        'common-ui/panels/panel_glass',
        width / 2,
        height / 2,
        600,
        400
    );

    // Título
    const title = scene.add.text(width / 2, height / 2 - 150, 'INSTRUCCIONES', {
        fontSize: '32px',
        fontFamily: 'Arial Black',
        color: '#FFD700'
    }).setOrigin(0.5);

    // Texto de instrucciones
    const text = scene.add.text(width / 2, height / 2 - 50, instructions, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        align: 'center',
        wordWrap: { width: 500 }
    }).setOrigin(0.5);

    // Botón de comenzar
    const startBtn = createButton(
        scene,
        'common-ui/buttons/btn_primary',
        width / 2,
        height / 2 + 120,
        'COMENZAR',
        () => {
            container.destroy();
            scene.events.emit('game-start');
        },
        { scale: 1.8, fontSize: '24px' }
    );

    container.add([backdrop, panel, title, text, startBtn]);
}

// ============================================
// EJEMPLO 7: Efectos combinados para logro
// ============================================
function showAchievement(scene: Phaser.Scene, achievementName: string): void {
    const { width, height } = scene.cameras.main;
    const x = width / 2;
    const y = height / 2;

    // Efectos visuales
    showGlow(scene, x, y, 0xFFD700, 2000);
    showBurst(scene, x, y, 0xFFD700, 1500);

    // Panel de logro
    const container = scene.add.container(x, y).setDepth(3000);

    const panel = createPanel(scene, 'common-ui/panels/panel_dark', 0, 0, 400, 150);

    const trophy = scene.add.image(-120, 0, 'ui_atlas', 'common-ui/rewards/trophy');
    trophy.setScale(2);

    const text = scene.add.text(20, 0, achievementName, {
        fontSize: '24px',
        fontFamily: 'Arial Black',
        color: '#FFD700',
        wordWrap: { width: 250 }
    }).setOrigin(0, 0.5);

    container.add([panel, trophy, text]);

    // Animación de entrada
    container.setScale(0);
    scene.tweens.add({
        targets: container,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
    });

    // Animación de salida
    scene.time.delayedCall(3000, () => {
        scene.tweens.add({
            targets: container,
            scale: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => container.destroy()
        });
    });
}

// ============================================
// EJEMPLO 8: Sistema de vidas con estrellas
// ============================================
function createLivesDisplay(scene: Phaser.Scene, maxLives: number = 3): {
    container: Phaser.GameObjects.Container;
    updateLives: (lives: number) => void;
} {
    const container = scene.add.container(60, 40);
    const stars: Phaser.GameObjects.Image[] = [];

    for (let i = 0; i < maxLives; i++) {
        const star = scene.add.image(i * 40, 0, 'ui_atlas', 'common-ui/rewards/star_full');
        star.setScale(0.7);
        stars.push(star);
        container.add(star);
    }

    const updateLives = (lives: number) => {
        stars.forEach((star, index) => {
            const frame = index < lives
                ? 'common-ui/rewards/star_full'
                : 'common-ui/rewards/star_empty';
            star.setTexture('ui_atlas', frame);
        });
    };

    return { container, updateLives };
}

// ============================================
// EXPORTAR EJEMPLOS PARA REFERENCIA
// ============================================
export const UIKitExamples = {
    createPausePanel,
    handleAnswer,
    showGameOverModal,
    createControlButtons,
    createLevelProgress,
    showInstructions,
    showAchievement,
    createLivesDisplay
};
