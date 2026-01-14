/**
 * UIKit - Componentes UI reutilizables para todos los juegos
 * Usa el atlas común (ui_atlas) para mantener consistencia visual
 */

import * as Phaser from 'phaser';

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
        strokeThickness: 4
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
    } = {}
): Phaser.GameObjects.Container {
    const {
        scale = 1,
        iconScale = 1,
        hoverScale = 1.1,
        clickScale = 0.9,
        iconOffsetY = 0
    } = options;

    const container = scene.add.container(x, y);

    // Botón de fondo
    const button = scene.add.image(0, 0, 'ui_atlas', buttonFrame);
    button.setScale(scale);

    // Aumentar el área interactiva ligeramente para facilitar el toque
    button.setInteractive({ useHandCursor: true });
    button.input.hitArea.setTo(-5, -5, button.width + 10, button.height + 10);

    // Icono
    const icon = scene.add.image(0, iconOffsetY, 'ui_atlas', iconFrame);
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
 * Muestra un efecto de glow (brillo)
 * @param scene - La escena de Phaser
 * @param x - Posición X
 * @param y - Posición Y
 * @param color - Color del glow (hex)
 * @param duration - Duración de la animación en ms
 */
export function showGlow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = 0xFFFFFF,
    duration: number = 1000
): Phaser.GameObjects.Image {
    const glow = scene.add.image(x, y, 'ui_atlas', 'common-ui/fx/fx_glow');
    glow.setScale(0.5);
    glow.setTint(color);
    glow.setDepth(1998);
    glow.setAlpha(0.6);

    scene.tweens.add({
        targets: glow,
        scale: 1.2,
        alpha: 0,
        duration,
        ease: 'Sine.easeOut',
        onComplete: () => glow.destroy()
    });

    return glow;
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
        height = 300,
        closeOnBackdrop = true
    } = options;

    const { width: screenWidth, height: screenHeight } = scene.cameras.main;
    const container = scene.add.container(0, 0);
    container.setDepth(3000);

    // Fondo oscuro (backdrop)
    const backdrop = scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    backdrop.setOrigin(0);
    if (closeOnBackdrop) {
        backdrop.setInteractive();
        backdrop.on('pointerdown', () => {
            container.destroy();
        });
    }

    // Panel del modal
    const panel = createPanel(
        scene,
        'common-ui/panels/panel_modal',
        screenWidth / 2,
        screenHeight / 2,
        width,
        height
    );

    // Título (si existe)
    let yOffset = screenHeight / 2 - height / 2 + 60;
    if (title) {
        const titleText = scene.add.text(screenWidth / 2, yOffset, title, {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        });
        titleText.setOrigin(0.5);
        container.add(titleText);
        yOffset += 60;
    }

    // Mensaje
    const messageText = scene.add.text(screenWidth / 2, yOffset, message, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: width - 80 }
    });
    messageText.setOrigin(0.5);

    // Botones
    const buttonSpacing = 150;
    const totalButtonWidth = buttons.length * buttonSpacing;
    const startX = screenWidth / 2 - totalButtonWidth / 2 + buttonSpacing / 2;
    const buttonY = screenHeight / 2 + height / 2 - 60;

    const buttonContainers = buttons.map((btn, index) => {
        const buttonFrame = btn.isPrimary
            ? 'common-ui/buttons/btn_primary'
            : 'common-ui/buttons/btn_secondary';

        return createButton(
            scene,
            buttonFrame,
            startX + index * buttonSpacing,
            buttonY,
            btn.label,
            () => {
                btn.onClick();
                container.destroy();
            },
            { scale: 1.5, fontSize: '18px' }
        );
    });

    container.add([backdrop, panel, messageText, ...buttonContainers]);

    // Animación de entrada
    container.setAlpha(0);
    panel.setScale(0.5);
    scene.tweens.add({
        targets: container,
        alpha: 1,
        duration: 200
    });
    scene.tweens.add({
        targets: panel,
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
    bg.setStrokeStyle(3, 0xFFFFFF, 0.8);

    // Texto
    const text = scene.add.text(0, 0, message, {
        fontSize: '18px',
        fontFamily: 'Arial Black',
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
export function showFullscreenRequest(scene: Phaser.Scene, onDone?: () => void) {
    // Si ya está en pantalla completa (por un reinicio de escena, por ejemplo), no preguntar de nuevo
    if (scene.scale.isFullscreen) {
        if (onDone) onDone();
        return;
    }

    return showModal(scene, {
        title: 'PANTALLA COMPLETA',
        message: '¿Permitir poner en pantalla completa el juego?',
        buttons: [
            {
                label: 'OK',
                isPrimary: true,
                onClick: () => {
                    if (!scene.scale.isFullscreen) {
                        scene.scale.startFullscreen();
                    }
                    if (onDone) onDone();
                }
            }
        ],
        closeOnBackdrop: false
    });
}
