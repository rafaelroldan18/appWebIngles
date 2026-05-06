/**
 * PremiumUI - Componentes UI premium usando phaser3-rex-plugins
 * Proporciona elementos visuales modernos con glow, sombras y efectos
 */

import * as Phaser from 'phaser';
import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle';
import { gsap } from 'gsap';

// ============================================
// CONFIGURACIÓN DE COMPONENTES
// ============================================

export const PREMIUM_UI_CONFIG = {
    panel: {
        cornerRadius: 20,
        strokeWidth: 3,
        glowPadding: 6
    },
    button: {
        cornerRadius: 15,
        strokeWidth: 2,
        padding: { x: 20, y: 12 }
    },
    card: {
        cornerRadius: 16,
        strokeWidth: 2,
        shadowOffset: { x: 0, y: 4 },
        shadowBlur: 8
    },
    token: {
        cornerRadius: 24,
        strokeWidth: 2,
        glowPadding: 8
    }
} as const;

// ============================================
// PANELES PREMIUM
// ============================================

/**
 * Crea un panel premium con glow y bordes neón
 */
export function createPremiumPanel(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
        bgColor?: number;
        bgAlpha?: number;
        borderColor?: number;
        borderAlpha?: number;
        glowColor?: number;
        glowAlpha?: number;
        cornerRadius?: number;
    } = {}
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const config = PREMIUM_UI_CONFIG.panel;

    const bgColor = options.bgColor ?? 0x0F172A;
    const bgAlpha = options.bgAlpha ?? 0.95;
    const borderColor = options.borderColor ?? 0x6366F1;
    const borderAlpha = options.borderAlpha ?? 0.8;
    const glowColor = options.glowColor ?? borderColor;
    const glowAlpha = options.glowAlpha ?? 0.15;
    const cornerRadius = options.cornerRadius ?? config.cornerRadius;

    // 1. Glow exterior (usando RoundRectangle de rex)
    const glow = new RoundRectangle(
        scene,
        0,
        0,
        width + config.glowPadding * 2,
        height + config.glowPadding * 2,
        cornerRadius + 4,
        glowColor,
        glowAlpha
    );

    // 2. Fondo principal
    const background = new RoundRectangle(
        scene,
        0,
        0,
        width,
        height,
        cornerRadius,
        bgColor,
        bgAlpha
    );

    // 3. Borde neón
    const border = new RoundRectangle(
        scene,
        0,
        0,
        width,
        height,
        cornerRadius
    );
    border.setStrokeStyle(config.strokeWidth, borderColor, borderAlpha);

    // 4. Brillo interior (shine)
    const shine = new RoundRectangle(
        scene,
        0,
        -height / 2 + 25,
        width - 20,
        40,
        { tl: 15, tr: 15, bl: 5, br: 5 },
        0xFFFFFF,
        0.05
    );

    container.add([glow, background, border, shine]);

    // Guardar referencias
    (container as any).glow = glow;
    (container as any).background = background;
    (container as any).border = border;

    return container;
}

/**
 * Crea un botón premium con efectos hover y click
 */
export function createPremiumButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    options: {
        width?: number;
        height?: number;
        bgColor?: number;
        borderColor?: number;
        textColor?: string;
        fontSize?: string;
        fontFamily?: string;
    } = {}
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const config = PREMIUM_UI_CONFIG.button;

    // Calcular dimensiones
    const tempText = scene.add.text(0, 0, text, {
        fontSize: options.fontSize ?? '20px',
        fontFamily: options.fontFamily ?? 'Nunito'
    });
    const textWidth = tempText.width;
    const textHeight = tempText.height;
    tempText.destroy();

    const width = options.width ?? (textWidth + config.padding.x * 2);
    const height = options.height ?? (textHeight + config.padding.y * 2);

    const bgColor = options.bgColor ?? 0x6366F1;
    const borderColor = options.borderColor ?? 0xFFFFFF;
    const textColor = options.textColor ?? '#FFFFFF';

    // Fondo del botón
    const background = new RoundRectangle(
        scene,
        0,
        0,
        width,
        height,
        config.cornerRadius,
        bgColor,
        0.9
    );

    // Borde
    const border = new RoundRectangle(
        scene,
        0,
        0,
        width,
        height,
        config.cornerRadius
    );
    border.setStrokeStyle(config.strokeWidth, borderColor, 0.8);

    // Texto
    const buttonText = scene.add.text(0, 0, text, {
        fontSize: options.fontSize ?? '20px',
        fontFamily: options.fontFamily ?? 'Nunito',
        color: textColor,
        fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([background, border, buttonText]);

    // Hacer interactivo
    container.setSize(width, height);
    container.setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
    );

    // Efectos hover con GSAP
    container.on('pointerover', () => {
        gsap.to(container, {
            scale: 1.05,
            duration: 0.1,
            ease: 'power2.out'
        });
        gsap.to(background, {
            alpha: 1,
            duration: 0.1
        });
    });

    container.on('pointerout', () => {
        gsap.to(container, {
            scale: 1,
            duration: 0.1,
            ease: 'power2.out'
        });
        gsap.to(background, {
            alpha: 0.9,
            duration: 0.1
        });
    });

    container.on('pointerdown', () => {
        gsap.to(container, {
            scale: 0.95,
            duration: 0.05,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
            onComplete: onClick
        });
    });

    return container;
}

/**
 * Crea una carta premium con flip animation
 */
export function createPremiumCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
        frontColor?: number;
        backColor?: number;
        borderColor?: number;
        shadowColor?: number;
    } = {}
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const config = PREMIUM_UI_CONFIG.card;

    const frontColor = options.frontColor ?? 0x1E293B;
    const backColor = options.backColor ?? 0x3A86FF;
    const borderColor = options.borderColor ?? 0xFFFFFF;
    const shadowColor = options.shadowColor ?? 0x000000;

    // Sombra
    const shadow = new RoundRectangle(
        scene,
        config.shadowOffset.x,
        config.shadowOffset.y,
        width,
        height,
        config.cornerRadius,
        shadowColor,
        0.3
    );

    // Reverso (back)
    const back = new RoundRectangle(
        scene,
        0,
        0,
        width,
        height,
        config.cornerRadius,
        backColor,
        1
    );
    back.setStrokeStyle(config.strokeWidth, borderColor, 0.8);
    back.setVisible(true);

    // Frente (front)
    const front = new RoundRectangle(
        scene,
        0,
        0,
        width,
        height,
        config.cornerRadius,
        frontColor,
        1
    );
    front.setStrokeStyle(config.strokeWidth, borderColor, 0.8);
    front.setVisible(false);

    container.add([shadow, back, front]);

    // Guardar referencias
    (container as any).shadow = shadow;
    (container as any).back = back;
    (container as any).front = front;
    (container as any).isFlipped = false;

    return container;
}

/**
 * Flip animation para carta
 */
export function flipCard(
    card: Phaser.GameObjects.Container,
    faceUp: boolean,
    duration: number = 0.3
): void {
    const back = (card as any).back;
    const front = (card as any).front;

    if (faceUp) {
        // Mostrar frente
        gsap.to(card, {
            scaleX: 0,
            duration: duration / 2,
            ease: 'power2.in',
            onComplete: () => {
                back.setVisible(false);
                front.setVisible(true);
                gsap.to(card, {
                    scaleX: 1,
                    duration: duration / 2,
                    ease: 'back.out'
                });
            }
        });
    } else {
        // Mostrar reverso
        gsap.to(card, {
            scaleX: 0,
            duration: duration / 2,
            ease: 'power2.in',
            onComplete: () => {
                front.setVisible(false);
                back.setVisible(true);
                gsap.to(card, {
                    scaleX: 1,
                    duration: duration / 2,
                    ease: 'back.out'
                });
            }
        });
    }

    (card as any).isFlipped = faceUp;
}

/**
 * Crea un token premium (para palabras cayendo, etc.)
 */
export function createPremiumToken(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    options: {
        bgColor?: number;
        borderColor?: number;
        glowColor?: number;
        text?: string;
        textColor?: string;
        fontSize?: string;
    } = {}
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const config = PREMIUM_UI_CONFIG.token;

    const bgColor = options.bgColor ?? 0x0F172A;
    const borderColor = options.borderColor ?? 0x22D3EE;
    const glowColor = options.glowColor ?? borderColor;

    // 1. Glow exterior (pulsante)
    const glow = new RoundRectangle(
        scene,
        0,
        0,
        size + config.glowPadding * 2,
        size + config.glowPadding * 2,
        config.cornerRadius + 4,
        glowColor,
        0.15
    );

    // Animación de pulso con GSAP
    gsap.to(glow, {
        alpha: 0.4,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
    });

    // 2. Fondo
    const background = new RoundRectangle(
        scene,
        0,
        0,
        size,
        size,
        config.cornerRadius,
        bgColor,
        0.9
    );

    // 3. Borde neón
    const border = new RoundRectangle(
        scene,
        0,
        0,
        size,
        size,
        config.cornerRadius
    );
    border.setStrokeStyle(config.strokeWidth, borderColor, 0.8);

    // 4. Shine
    const shine = new RoundRectangle(
        scene,
        0,
        -size / 2 + size / 6,
        size - 10,
        size / 3,
        { tl: config.cornerRadius - 4, tr: config.cornerRadius - 4, bl: 4, br: 4 },
        0xFFFFFF,
        0.08
    );

    container.add([glow, background, border, shine]);

    // Texto opcional
    if (options.text) {
        const text = scene.add.text(0, 0, options.text, {
            fontSize: options.fontSize ?? '18px',
            fontFamily: 'Nunito',
            color: options.textColor ?? '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text);
    }

    // Guardar referencias
    (container as any).glow = glow;
    (container as any).background = background;
    (container as any).border = border;
    (container as any).borderColor = borderColor;

    return container;
}

/**
 * Añade efecto de glow pulsante a un objeto
 */
export function addGlowPulse(
    target: Phaser.GameObjects.GameObject,
    options: {
        alphaFrom?: number;
        alphaTo?: number;
        duration?: number;
    } = {}
): gsap.core.Tween {
    return gsap.to(target, {
        alpha: options.alphaTo ?? 0.5,
        duration: options.duration ?? 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
    });
}

/**
 * Crea un modal premium con backdrop
 */
export function createPremiumModal(
    scene: Phaser.Scene,
    width: number,
    height: number,
    options: {
        title?: string;
        bgColor?: number;
        borderColor?: number;
    } = {}
): Phaser.GameObjects.Container {
    const centerX = scene.cameras.main.width / 2;
    const centerY = scene.cameras.main.height / 2;

    const container = scene.add.container(centerX, centerY);
    container.setDepth(2000);

    // Backdrop
    const backdrop = scene.add.rectangle(
        0,
        0,
        scene.cameras.main.width,
        scene.cameras.main.height,
        0x000000,
        0.7
    );
    backdrop.setOrigin(0.5);
    backdrop.setInteractive();

    // Panel del modal
    const panel = createPremiumPanel(scene, 0, 0, width, height, {
        bgColor: options.bgColor ?? 0x1E293B,
        borderColor: options.borderColor ?? 0x6366F1
    });

    container.add([backdrop, panel]);

    // Animación de entrada con GSAP
    container.setAlpha(0);
    container.setScale(0.5);

    gsap.to(container, {
        alpha: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out'
    });

    return container;
}
