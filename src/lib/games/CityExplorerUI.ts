/**
 * Tema: City Explorer (Minimalist Tactical)
 * Estilo: Flat Professional, Clean Lines, High Contrast.
 */

import * as Phaser from 'phaser';
import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle';
import { gsap } from 'gsap';

export const CE_THEME = {
    colors: {
        background: 0x01040a,   // Casi negro
        surface: 0x0d1117,
        primary: 0x38bdf8,      // Sky Electric
        accent: 0xc084fc,
        success: 0x2dd4bf,
        danger: 0xf43f5e,
        warning: 0xfbbf24,
        grid: 0x161b22,         // Grid muy sutil
        text: 0xf8fafc
    }
};

/**
 * Grid Minimalista
 */
export function createDigitalGrid(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    const bg = scene.add.graphics();
    bg.fillStyle(CE_THEME.colors.background, 1);
    bg.fillRect(0, 0, width, height);
    container.add(bg);

    const dots = scene.add.graphics();
    dots.fillStyle(0x30363d, 0.5);
    const step = 80;
    for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
            dots.fillCircle(x, y, 1);
        }
    }
    container.add(dots);
    return container;
}

/**
 * Marcador Simple (Sin luces estroboscópicas)
 */
export function createHoloMarker(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = CE_THEME.colors.primary
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // Círculo base limpio
    const core = scene.add.circle(0, 0, 8, color, 1);
    const ring = scene.add.graphics();
    ring.lineStyle(2, color, 0.8);
    ring.strokeCircle(0, 0, 20);

    // Brackets pequeños en las esquinas (Minimalistas)
    const b = scene.add.graphics();
    b.lineStyle(1.5, 0xffffff, 0.4);
    const d = 24;
    const s = 6;
    b.moveTo(-d, -d + s); b.lineTo(-d, -d); b.lineTo(-d + s, -d);
    b.moveTo(d, -d + s); b.lineTo(d, -d); b.lineTo(d - s, -d);
    b.moveTo(-d, d - s); b.lineTo(-d, d); b.lineTo(-d + s, d);
    b.moveTo(d, d - s); b.lineTo(d, d); b.lineTo(d - s, d);
    b.strokePath();

    container.add([core, ring, b]);
    return container;
}

/**
 * Cursor de Jugador Limpio (Puntero GPS)
 */
export function createNavCursor(
    scene: Phaser.Scene,
    x: number,
    y: number
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const body = scene.add.graphics();
    body.fillStyle(0xffffff, 1);
    // Forma de punta de flecha limpia
    body.beginPath();
    body.moveTo(0, -14);
    body.lineTo(10, 10);
    body.lineTo(0, 6);
    body.lineTo(-10, 10);
    body.closePath();
    body.fillPath();

    container.add(body);
    return container;
}

/**
 * Zonas Restringidas Profesionales (Uniformidad Cromática)
 */
export function createRestrictedZone(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // Caja sólida limpia, color uniforme con el tema oscuro
    // Usamos un gris azulado muy oscuro para que parezcan "bloques de ciudad" o "edificios"
    // en lugar de zonas de peligro rojas.
    const bg = new RoundRectangle(scene, 0, 0, width, height, 4, 0x111827, 0.8);
    bg.setStrokeStyle(2, 0x1f2937, 1);
    scene.add.existing(bg);

    // Patrón sutil (opcional, líneas muy finas)
    const lines = scene.add.graphics();
    lines.lineStyle(1, 0x374151, 0.3);
    const step = 20;
    for (let i = -width / 2; i < width / 2; i += step) {
        lines.moveTo(i, -height / 2);
        lines.lineTo(i + height, height / 2);
    }
    // Masking lines to rect
    const maskShape = scene.make.graphics({});
    maskShape.fillRoundedRect(x - width / 2, y - height / 2, width, height, 4);
    const mask = maskShape.createGeometryMask();
    lines.setMask(mask);
    lines.strokePath();

    container.add([bg, lines]);
    return container;
}

/**
 * HUD Minimalista
 */
export function createCEHUDBg(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    const bg = new RoundRectangle(scene, 0, 0, width, height, 12, 0x0d1117, 0.95);
    bg.setStrokeStyle(2, 0x30363d, 1);
    scene.add.existing(bg);
    container.add(bg);
    return container;
}

export function createCEIconButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    iconFrame: string,
    onClick: () => void
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const bg = new RoundRectangle(scene, 0, 0, 40, 40, 8, 0x161b22, 1);
    bg.setStrokeStyle(1.5, 0x30363d, 1);
    scene.add.existing(bg);

    const icon = scene.add.image(0, 0, 'ui_atlas', iconFrame).setDisplaySize(20, 20);
    container.add([bg, icon]);

    container.on('pointerdown', () => {
        onClick();
        gsap.to(container, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
    });

    return container;
}
