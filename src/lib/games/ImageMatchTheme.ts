/**
 * Tema: Premium Educational Studio
 * Estilo: Profesional, Moderno, Atractivo (16+)
 */

import * as Phaser from 'phaser';

export const IM_THEME = {
    colors: {
        primary: 0x6366F1,      // Indigo Moderno
        secondary: 0xA5B4FC,    // Lavanda Suave
        accent: 0xFBBF24,       // Ámbar
        error: 0xEF4444,        // Rojo suave
        bgLight: 0xF8FAFC,      // Gris azulado ultra-claro
        text: 0x1E293B,         // Slate profundo
        gold: 0xFBBF24,
        cardBackTop: 0x818CF8,
        cardBackBottom: 0x3730A3
    }
};

/**
 * Crea un panel con estilo moderno y limpio.
 */
export function createIMPanel(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();
    const cornerRadius = 24;

    // Sombra suave profunda
    graphics.fillStyle(0x000000, 0.1);
    graphics.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width, height, cornerRadius);

    // Fondo: Gradiente sutil Indigo Studio
    graphics.fillGradientStyle(
        0xF5F7FF, 0xF5F7FF, // Top: Blanco azulado
        0xEEF2FF, 0xEEF2FF, // Bottom: Indigo muy pálido
        1
    );
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);

    // Borde de marca elegante
    graphics.lineStyle(3, 0x6366F1, 0.6);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, cornerRadius);

    // Brillo interior para efecto premium
    graphics.lineStyle(2, 0xFFFFFF, 0.5);
    graphics.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, cornerRadius - 2);

    return graphics;
}

/**
 * Crea el diseño de una tarjeta Premium (con bordes redondeados y sombras).
 */
export function createIMCardGraphics(
    scene: Phaser.Scene,
    width: number,
    height: number,
    isBack: boolean
): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    const corner = 22;

    if (isBack) {
        // --- DORSO PREMIUM (STUDIO LOOK) ---
        // Fondo con Gradiente Elegante
        g.fillGradientStyle(
            IM_THEME.colors.cardBackTop,
            IM_THEME.colors.cardBackTop,
            IM_THEME.colors.cardBackBottom,
            IM_THEME.colors.cardBackBottom,
            1
        );
        g.fillRoundedRect(-width / 2, -height / 2, width, height, corner);

        // Patrón decorativo: Micro-cuadrícula elegante
        g.lineStyle(1, 0xFFFFFF, 0.08);
        const step = 20;
        for (let i = -width / 2 + 10; i < width / 2; i += step) {
            g.moveTo(i, -height / 2 + 5); g.lineTo(i, height / 2 - 5);
        }
        for (let i = -height / 2 + 10; i < height / 2; i += step) {
            g.moveTo(-width / 2 + 5, i); g.lineTo(width / 2 - 5, i);
        }
        g.strokePath();

        // Icono Central: Rombo redondeado mas estilizado
        const s = Math.min(width, height) * 0.35;
        g.lineStyle(4, 0xFFFFFF, 0.9);

        // Simular rombo rotando el dibujo de un rect redondeado
        // Phaser graphics strokeRoundedRect no soporta rotacion interna facil, 
        // pero podemos usar lineas.
        const halfS = s / 2;
        g.beginPath();
        g.moveTo(0, -halfS); // Arriba
        g.lineTo(halfS, 0);  // Derecha
        g.lineTo(0, halfS);  // Abajo
        g.lineTo(-halfS, 0); // Izquierda
        g.closePath();
        g.strokePath();

        // Brillo interior sutil
        g.lineStyle(2, 0xFFFFFF, 0.3);
        const sInner = s * 0.6;
        const halfSI = sInner / 2;
        g.beginPath();
        g.moveTo(0, -halfSI);
        g.lineTo(halfSI, 0);
        g.lineTo(0, halfSI);
        g.lineTo(-halfSI, 0);
        g.closePath();
        g.strokePath();

        // Borde exterior nítido
        g.lineStyle(2, 0xFFFFFF, 0.4);
        g.strokeRoundedRect(-width / 2, -height / 2, width, height, corner);

    } else {
        // --- CARA FRONTAL (CANVAS LOOK) ---
        g.fillStyle(0xFFFFFF, 1);
        g.fillRoundedRect(-width / 2, -height / 2, width, height, corner);

        // Borde interior sutil
        g.lineStyle(1, 0x000000, 0.03);
        g.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, corner - 1);

        // Borde principal de acento (Indigo Soft)
        g.lineStyle(3, IM_THEME.colors.primary, 0.4);
        g.strokeRoundedRect(-width / 2, -height / 2, width, height, corner);
    }

    return g;
}

/**
 * Crea botones con estilo Premium.
 */
export function createIMButton(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    label: string,
    onClick: () => void,
    isPrimary: boolean = true
) {
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const corner = 12;

    const draw = (over: boolean) => {
        bg.clear();
        const color = isPrimary ? 0x5D82B3 : 0xFFFFFF;
        const textCol = isPrimary ? '#FFFFFF' : '#414856';

        if (over) {
            bg.fillStyle(isPrimary ? 0x4A6FA1 : 0xEEF4FB, 1);
        } else {
            bg.fillStyle(color, 1);
        }

        bg.fillRoundedRect(-width / 2, -height / 2, width, height, corner);
        bg.lineStyle(2, 0x5D82B3, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, corner);
    };

    draw(false);
    const text = scene.add.text(0, 0, label.toUpperCase(), {
        fontSize: '18px', fontFamily: 'Nunito', color: isPrimary ? '#FFFFFF' : '#414856', fontStyle: '900'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => draw(true));
    container.on('pointerout', () => draw(false));
    container.on('pointerdown', onClick);

    return container;
}

/**
 * HUD background styling.
 */
export function createIMHUDBg(scene: Phaser.Scene, width: number, height: number) {
    const g = scene.add.graphics();
    g.fillStyle(0xFFFFFF, 0.85);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    g.lineStyle(2, 0x5D82B3, 0.5);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    return g;
}

/**
 * Icons for HUD buttons.
 */
export function createIMIconButton(scene: Phaser.Scene, x: number, y: number, iconFrame: string, onClick: () => void) {
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();

    const draw = (over: boolean) => {
        bg.clear();
        bg.fillStyle(over ? 0xEEF4FB : 0xFFFFFF, 1);
        bg.fillCircle(0, 0, 20);
        bg.lineStyle(2, 0x5D82B3, 0.6);
        bg.strokeCircle(0, 0, 20);
    };

    draw(false);
    const icon = scene.add.image(0, 0, 'ui_atlas', iconFrame).setDisplaySize(24, 24).setTint(0x414856);

    container.add([bg, icon]);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
    container.on('pointerover', () => draw(true));
    container.on('pointerout', () => draw(false));
    container.on('pointerdown', onClick);
    return container;
}

export function createIMScreenFrame(scene: Phaser.Scene, width: number, height: number) {
    const g = scene.add.graphics();
    g.lineStyle(4, 0x5D82B3, 0.15);
    g.strokeRect(5, 5, width - 10, height - 10);
    return g;
}
