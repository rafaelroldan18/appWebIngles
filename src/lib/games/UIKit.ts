/**
 * UIKit - Componentes UI reutilizables para todos los juegos
 * Usa el atlas común (ui_atlas) para mantener consistencia visual
 */

import * as Phaser from 'phaser';
import { DEPTH_LAYERS } from './GameStyles';

/**
 * Crea un panel usando un frame del atlas
 * @param scene - La escena de Phaser
 * @param frame - Nombre del frame (ej: 'common-ui/panels/panel_dark')
 * @param x - Posición X
 * @param y - Posición Y
 * @param width - Ancho deseado
 * @param height - Alto deseado
 * @returns La imagen del panel
 */
export function createPanel(
    scene: Phaser.Scene,
    frame: string,
    x: number,
    y: number,
    width: number,
    height: number
): Phaser.GameObjects.Image {
    const panel = scene.add.image(x, y, 'ui_atlas', frame);
    panel.setDisplaySize(width, height);
    return panel;
}

/**
 * Crea un botón interactivo con texto
 * @param scene - La escena de Phaser
 * @param frame - Nombre del frame del botón (ej: 'common-ui/buttons/btn_primary')
 * @param x - Posición X
 * @param y - Posición Y
 * @param label - Texto del botón
 * @param onClick - Callback al hacer click
 * @param options - Opciones adicionales
 * @returns Contenedor con el botón y el texto
 */
export function createButton(
    scene: Phaser.Scene,
    frame: string,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    options: {
        scale?: number;
        width?: number;
        height?: number;
        fontSize?: string;
        fontColor?: string;
        hoverScale?: number;
        clickScale?: number;
        textOffsetY?: number;
        fontFamily?: string;
    } = {}
): Phaser.GameObjects.Container {
    const {
        scale = 1,
        width,
        height,
        fontSize = '20px',
        fontColor = '#FFFFFF',
        hoverScale = 1.05,
        clickScale = 0.95,
        textOffsetY = 0,
        fontFamily = 'Fredoka'
    } = options;

    const container = scene.add.container(x, y);

    // Botón de fondo
    const button = scene.add.image(0, 0, 'ui_atlas', frame);

    if (width && height) {
        button.setDisplaySize(width, height);
    } else if (width) {
        // Si solo se da ancho, se escala el alto proporcionalmente (asumiendo frame cuadrado o similar)
        const ratio = button.height / button.width;
        button.setDisplaySize(width, width * ratio);
    } else {
        button.setScale(scale);
    }

    button.setInteractive({ useHandCursor: true });

    // Texto del botón
    const text = scene.add.text(0, textOffsetY, label, {
        fontSize,
        fontFamily,
        color: fontColor,
        stroke: '#000000',
        strokeThickness: 2 // Reducido de 4 a 2
    });
    text.setOrigin(0.5);

    // Efectos de hover
    button.on('pointerover', () => {
        if (width && height) {
            button.setDisplaySize(width * hoverScale, height * hoverScale);
        } else {
            button.setScale((button.scale || scale) * hoverScale);
        }
        text.setScale(hoverScale);
    });

    button.on('pointerout', () => {
        if (width && height) {
            button.setDisplaySize(width, height);
        } else {
            button.setScale(scale);
        }
        text.setScale(1);
    });

    button.on('pointerdown', () => {
        if (width && height) {
            button.setDisplaySize(width * clickScale, height * clickScale);
        } else {
            button.setScale((button.scale || scale) * clickScale);
        }
        text.setScale(clickScale);

        // Reproducir sonido de clic si existe
        if (scene.cache.audio.exists('ui_click')) {
            scene.sound.play('ui_click', { volume: 0.5 });
        }

        onClick(); // Trigger immediately on down for responsiveness
    });

    button.on('pointerup', () => {
        if (width && height) {
            button.setDisplaySize(width * hoverScale, height * hoverScale);
        } else {
            button.setScale((button.scale || scale) * hoverScale);
        }
        text.setScale(hoverScale);
    });

    container.add([button, text]);
    return container;
}

/**
 * Crea un botón con icono (sin texto)
 * @param scene - La escena de Phaser
 * @param buttonFrame - Frame del botón de fondo
 * @param iconFrame - Frame del icono
 * @param x - Posición X
 * @param y - Posición Y
 * @param onClick - Callback al hacer click
 * @param options - Opciones adicionales
 * @returns Contenedor con el botón y el icono
 */
export function createIconButton(
    scene: Phaser.Scene,
    buttonFrame: string,
    iconFrame: string,
    x: number,
    y: number,
    onClick: () => void,
    options: {
        scale?: number;
        iconScale?: number;
        hoverScale?: number;
        clickScale?: number;
        iconOffsetY?: number;
        iconAtlas?: string;
    } = {}
): Phaser.GameObjects.Container {
    const {
        scale = 1,
        iconScale = 1,
        hoverScale = 1.1,
        clickScale = 0.9,
        iconOffsetY = 0,
        iconAtlas = 'ui_atlas'
    } = options;

    const container = scene.add.container(x, y);

    // Botón de fondo
    const button = scene.add.image(0, 0, 'ui_atlas', buttonFrame);
    button.setScale(scale);

    // Aumentar el área interactiva ligeramente para facilitar el toque
    button.setInteractive({ useHandCursor: true });
    button.input.hitArea.setTo(-5, -5, button.width + 10, button.height + 10);

    // Icono
    const icon = scene.add.image(0, iconOffsetY, iconAtlas, iconFrame);
    icon.setScale(iconScale);

    // Efectos de hover
    button.on('pointerover', () => {
        container.setScale(hoverScale);
    });

    button.on('pointerout', () => {
        container.setScale(1);
    });

    button.on('pointerdown', () => {
        container.setScale(clickScale);

        // Reproducir sonido de clic si existe
        if (scene.cache.audio.exists('ui_click')) {
            scene.sound.play('ui_click', { volume: 0.5 });
        }

        onClick(); // Trigger immediately
    });

    button.on('pointerup', () => {
        container.setScale(hoverScale);
    });

    container.add([button, icon]);
    return container;
}

/**
 * Muestra feedback visual (check o cross)
 * @param scene - La escena de Phaser
 * @param x - Posición X
 * @param y - Posición Y
 * @param isCorrect - true para check, false para cross
 * @param duration - Duración de la animación en ms
 * @returns El sprite del feedback
 */
export function showFeedback(
    scene: Phaser.Scene,
    x: number,
    y: number,
    isCorrect: boolean,
    duration: number = 1000
): Phaser.GameObjects.Image {
    const frame = isCorrect ? 'common-ui/fx/fx_check' : 'common-ui/fx/fx_cross';
    const color = isCorrect ? 0x00FF00 : 0xFF0000;

    const feedback = scene.add.image(x, y, 'ui_atlas', frame);
    feedback.setScale(0);
    feedback.setTint(color);
    feedback.setDepth(2000);

    // Animación de aparición
    scene.tweens.add({
        targets: feedback,
        scale: 3,
        alpha: 0,
        duration,
        ease: 'Back.easeOut',
        onComplete: () => feedback.destroy()
    });

    return feedback;
}

/**
 * Muestra un efecto de burst (explosión)
 * @param scene - La escena de Phaser
 * @param x - Posición X
 * @param y - Posición Y
 * @param color - Color del burst (hex)
 * @param duration - Duración de la animación en ms
 */
export function showBurst(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = 0xFFD700,
    duration: number = 800
): Phaser.GameObjects.Image {
    const burst = scene.add.image(x, y, 'ui_atlas', 'common-ui/fx/fx_burst');
    burst.setScale(0);
    burst.setTint(color);
    burst.setDepth(1999);
    burst.setAlpha(0.8);

    scene.tweens.add({
        targets: burst,
        scale: 1.5,
        alpha: 0,
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => burst.destroy()
    });

    return burst;
}

/**
 * Muestra un efecto de glow (brillo) más profesional (neón)
 */
export function showGlow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = 0xFFFFFF,
    duration: number = 600
): Phaser.GameObjects.Image {
    const glow = scene.add.image(x, y, 'ui_atlas', 'common-ui/fx/fx_glow');
    glow.setScale(0.2);
    glow.setTint(color);
    glow.setDepth(DEPTH_LAYERS.effects);
    glow.setAlpha(0.8);

    scene.tweens.add({
        targets: glow,
        scale: 1.5,
        alpha: 0,
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => glow.destroy()
    });

    return glow;
}

/**
 * Crea una explosión de partículas sutil para dar 'Juice' a la interacción
 */
export function showImpactParticles(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = 0xFFFFFF
): void {
    // Crear una textura simple circular para las partículas si no existe
    if (!scene.textures.exists('impact-particle')) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('impact-particle', 8, 8);
    }

    const emitter = scene.add.particles(x, y, 'impact-particle', {
        speed: { min: 50, max: 200 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        quantity: 12,
        blendMode: 'ADD',
        tint: color,
        emitting: false
    });

    emitter.explode(12);

    // Limpieza automática
    scene.time.delayedCall(500, () => emitter.destroy());
}

/**
 * Opciones para el modal
 */
export interface ModalOptions {
    title?: string;
    message: string;
    buttons?: Array<{
        label: string;
        onClick: () => void;
        isPrimary?: boolean;
    }>;
    width?: number;
    height?: number;
    closeOnBackdrop?: boolean;
}

/**
 * Interface for game instruction options
 */
export interface InstructionOptions {
    title: string;
    instructions: string;
    controls: string;
    buttonLabel?: string;
    iconFrame?: string; // Icono representativo del objetivo (ej: una medalla o item del juego)
    controlIcons?: string[]; // Lista de iconos de controles (ej: ['mouse', 'arrows'])
    requestFullscreen?: boolean; // Si debe pedir pantalla completa al iniciar
    onStart: () => void;
}

/**
 * Muestra una pantalla de instrucciones/tutorial antes de empezar el juego.
 * @param scene - La escena de Phaser
 * @param options - Opciones de la instrucción
 * @returns El contenedor del tutorial
 */
export function showGameInstructions(
    scene: Phaser.Scene,
    options: InstructionOptions
): Phaser.GameObjects.Container {
    const {
        title,
        instructions,
        controls,
        buttonLabel = 'READY!',
        iconFrame,
        controlIcons = [],
        requestFullscreen = false,
        onStart
    } = options;

    const { width, height } = scene.cameras.main;
    const container = scene.add.container(width / 2, height / 2).setDepth(40000);

    // Fondo oscuro total (Dimmer)
    const backdrop = scene.add.rectangle(0, 0, width, height, 0x000000, 0.9)
        .setInteractive()
        .setScrollFactor(0);

    // Panel central usando nineslice para fondo y borde del atlas de modales
    const panelW = Math.min(600, width * 0.90);
    const panelH = Math.min(450, height * 0.80);

    // Background Panel (glass effect with tint)
    const panelBg = scene.add.nineslice(
        0, 0,
        'modals_atlas',
        'Default/Panel/panel-001.png',
        panelW, panelH,
        20, 20, 20, 20
    ).setTint(0x0a1a2e).setAlpha(0.85);

    // Border Frame
    const panelBorder = scene.add.nineslice(
        0, 0,
        'modals_atlas',
        'Default/Border/panel-border-001.png',
        panelW, panelH,
        20, 20, 20, 20
    ).setTint(0x3b82f6);

    // Título principal
    const titleText = scene.add.text(0, -panelH * 0.36, title.toUpperCase(), {
        fontSize: '32px',
        fontFamily: 'Nunito',
        color: '#fbbf24',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
        letterSpacing: 2
    }).setOrigin(0.5);

    // --- SECCIÓN: HOW TO PLAY ---
    const sectionControls = scene.add.text(0, -panelH * 0.18, 'MISSION OBJECTIVE', {
        fontSize: '20px',
        fontFamily: 'Nunito',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1
    }).setOrigin(0.5);

    // Texto de instrucciones (objetivo del juego)
    const instructText = scene.add.text(0, -panelH * 0.04, instructions, {
        fontSize: '17px',
        fontFamily: 'Nunito',
        color: '#cbd5e1', // Color más suave (slate-300)
        align: 'center',
        wordWrap: { width: panelW - 80 },
        lineSpacing: 4
    }).setOrigin(0.5);

    // Texto de controles (botones y teclas) - DENTRO del panel
    const controlsText = scene.add.text(0, panelH * 0.14, controls, {
        fontSize: '16px',
        fontFamily: 'Fredoka',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelW - 80 },
        lineSpacing: 2
    }).setOrigin(0.5);

    // Botón de inicio - DENTRO del panel
    const startBtn = createButton(
        scene,
        'common-ui/buttons/btn_primary',
        0,
        panelH * 0.36,
        buttonLabel,
        () => {
            if (requestFullscreen && !scene.scale.isFullscreen) {
                try { scene.scale.startFullscreen(); } catch (e) { console.warn(e); }
            }
            cleanup();
            onStart();
        },
        { width: 220, height: 60, fontSize: '24px' }
    );

    // Hint: Space to start - FUERA del panel, debajo
    const spaceHint = scene.add.text(0, panelH * 0.50 + 20, 'or press SPACE to start', {
        fontSize: '13px',
        fontFamily: 'Fredoka',
        color: '#94a3b8',
        fontStyle: 'italic'
    }).setOrigin(0.5);

    // Agregar todos los elementos al contenedor
    container.add([backdrop, panelBg, panelBorder, titleText, sectionControls, instructText, controlsText, startBtn, spaceHint]);

    // Cleanup function
    const cleanup = () => {
        scene.input.keyboard?.off('keydown-SPACE', spaceHandler);
        container.destroy();
    };

    const spaceHandler = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
            if (requestFullscreen && !scene.scale.isFullscreen) {
                try { scene.scale.startFullscreen(); } catch (e) { console.warn(e); }
            }
            cleanup();
            onStart();
        }
    };

    // Keyboard listener
    scene.input.keyboard?.on('keydown-SPACE', spaceHandler);

    // Animación de entrada con rebote
    container.setScale(0.7);
    container.setAlpha(0);
    scene.tweens.add({
        targets: container,
        scale: 1,
        alpha: 1,
        duration: 500,
        ease: 'Back.easeOut'
    });

    return container;
}

/**
 * Muestra un modal con mensaje y botones
 * @param scene - La escena de Phaser
 * @param options - Opciones del modal
 * @returns El contenedor del modal
 */
export function showModal(
    scene: Phaser.Scene,
    options: ModalOptions
): Phaser.GameObjects.Container {
    const {
        title,
        message,
        buttons = [{ label: 'OK', onClick: () => { }, isPrimary: true }],
        width = 500,
        height = 360,
        closeOnBackdrop = true
    } = options;

    const cam = scene.cameras.main;
    const container = scene.add.container(cam.worldView.centerX, cam.worldView.centerY);
    container.setDepth(40000);

    // Fondo oscuro (backdrop) - Covers viewport
    const backdrop = scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.7)
        .setInteractive()
        .setPosition(0, 0); // Position at container's center relative to screen

    // So we offset backdrop by -center.
    backdrop.setX(-cam.width / 2);
    backdrop.setY(-cam.height / 2);
    backdrop.setOrigin(0);

    if (closeOnBackdrop) {
        backdrop.on('pointerdown', () => {
            container.destroy();
        });
    }

    // Panel del modal usando nineslice de modals_atlas (glass effect)
    const panelBg = scene.add.nineslice(
        0, 0,
        'modals_atlas',
        'Default/Panel/panel-001.png',
        width, height,
        20, 20, 20, 20
    ).setTint(0x0a1a2e).setAlpha(0.85);

    const panelBorder = scene.add.nineslice(
        0, 0,
        'modals_atlas',
        'Default/Border/panel-border-001.png',
        width, height,
        20, 20, 20, 20
    ).setTint(0x3b82f6);

    // Layout inside modal
    let currentY = -height * 0.35;
    const modalContent: Phaser.GameObjects.GameObject[] = [backdrop, panelBg, panelBorder];

    // Título (si existe)
    if (title) {
        const titleText = scene.add.text(0, currentY, title, {
            fontSize: '36px',
            fontFamily: 'Fredoka',
            color: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
        modalContent.push(titleText);
        currentY += 80;
    }

    // Mensaje
    const messageText = scene.add.text(0, currentY, message, {
        fontSize: '24px',
        fontFamily: 'Fredoka',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: width - 80 },
        lineSpacing: 4
    }).setOrigin(0.5);
    modalContent.push(messageText);

    // Botones - DENTRO del panel
    const buttonSpacing = 160;
    const totalButtonWidth = (buttons.length - 1) * buttonSpacing;
    const startX = -totalButtonWidth / 2;
    const buttonY = height * 0.32; // Cambiado para estar dentro del panel

    buttons.forEach((btn, index) => {
        const buttonFrame = btn.isPrimary
            ? 'common-ui/buttons/btn_primary'
            : 'common-ui/buttons/btn_secondary';

        const btnObj = createButton(
            scene,
            buttonFrame,
            startX + index * buttonSpacing,
            buttonY,
            btn.label,
            () => {
                btn.onClick();
                container.destroy();
            },
            {
                width: buttons.length > 1 ? 140 : 180,
                height: 60,
                fontSize: '20px'
            }
        );
        modalContent.push(btnObj);
    });

    container.add(modalContent);

    // Animación de entrada
    container.setAlpha(0);
    container.setScale(0.8);
    scene.tweens.add({
        targets: container,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: 'Back.easeOut'
    });

    return container;
}

/**
 * Muestra un toast (mensaje temporal)
 * @param scene - La escena de Phaser
 * @param message - Mensaje a mostrar
 * @param duration - Duración en ms
 * @param isSuccess - true para verde, false para rojo
 */
export function showToast(
    scene: Phaser.Scene,
    message: string,
    duration: number = 2000,
    isSuccess: boolean = true
): Phaser.GameObjects.Container {
    const { width, height } = scene.cameras.main;
    const container = scene.add.container(width / 2, height - 100);
    container.setDepth(3500);

    // Panel de fondo
    const bg = scene.add.rectangle(0, 0, 400, 60, isSuccess ? 0x10B981 : 0xEF4444, 0.95);

    // Texto
    const text = scene.add.text(0, 0, message, {
        fontSize: '18px',
        fontFamily: 'Fredoka',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    // Animación de entrada
    container.setY(height + 50);
    scene.tweens.add({
        targets: container,
        y: height - 100,
        duration: 300,
        ease: 'Back.easeOut'
    });

    // Animación de salida
    scene.time.delayedCall(duration, () => {
        scene.tweens.add({
            targets: container,
            y: height + 50,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => container.destroy()
        });
    });

    return container;
}

/**
 * Crea una barra de progreso
 * @param scene - La escena de Phaser
 * @param x - Posición X
 * @param y - Posición Y
 * @param width - Ancho de la barra
 * @param height - Alto de la barra
 * @returns Objeto con métodos para actualizar la barra
 */
export function createProgressBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
): {
    container: Phaser.GameObjects.Container;
    setProgress: (progress: number) => void;
    destroy: () => void;
} {
    const container = scene.add.container(x, y);

    // Fondo
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);

    // Barra de progreso
    const bar = scene.add.graphics();

    container.add([bg, bar]);

    const setProgress = (progress: number) => {
        const clampedProgress = Math.max(0, Math.min(100, progress));
        const barWidth = (width - 4) * (clampedProgress / 100);

        bar.clear();
        bar.fillStyle(0x4CAF50, 1);
        bar.fillRoundedRect(
            -width / 2 + 2,
            -height / 2 + 2,
            barWidth,
            height - 4,
            (height - 4) / 2
        );
    };

    return {
        container,
        setProgress,
        destroy: () => container.destroy()
    };
}

/**
 * Muestra un modal solicitando permiso para entrar en pantalla completa.
 * Es necesario una interacción de usuario para que el navegador lo permita.
 * @param scene - La escena de Phaser
 * @param onDone - Callback opcional al cerrar el modal
 */
export function showFullscreenRequest(
    scene: Phaser.Scene,
    onDone?: () => void,
    options: { title?: string; message?: string; buttonLabel?: string } = {}
) {
    // Si ya está en pantalla completa (por un reinicio de escena, por ejemplo), no preguntar de nuevo
    if (scene.scale.isFullscreen) {
        if (onDone) onDone();
        return;
    }

    const {
        title = 'FULLSCREEN',
        message = 'Enable fullscreen mode for a better experience?',
        buttonLabel = 'START!'
    } = options;

    return showModal(scene, {
        title,
        message,
        buttons: [
            {
                label: buttonLabel,
                isPrimary: true,
                onClick: () => {
                    try {
                        if (!scene.scale.isFullscreen) {
                            scene.scale.startFullscreen();
                        }
                    } catch (e) {
                        console.warn('Fullscreen failed:', e);
                    }
                    if (onDone) onDone();
                }
            }
        ],
        closeOnBackdrop: false
    });
}
