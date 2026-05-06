/**
 * Estilos específicos para Sentence Builder
 * Tema: Indigo Modern / Glass UI
 */

export const SB_THEME = {
    colors: {
        primary: 0x6366F1,      // Indigo 600
        secondary: 0x818CF8,    // Indigo 400
        accent: 0xFBBF24,       // Amber 400 (Score)
        bgDark: 0x0f172a,       // Slate 900
        bgMedium: 0x1e293b,     // Slate 800
        success: 0x10B981,      // Emerald 500
        indigo900: 0x312e81,
        white: 0xffffff
    }
};

/**
 * Crea un panel con el estilo Indigo Glass del juego (usado para HUD, Modales, etc)
 */
export function createSBPanel(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();

    // 1. Sombra exterior muy sutil
    graphics.fillStyle(0x4f46e5, 0.1);
    graphics.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 18);

    // 2. Fondo de Cristal Indigo Vibrante (Más claro y vivo)
    graphics.fillStyle(0x4338ca, 0.95); // Indigo 700
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 16);

    // 3. Borde Indigo Neón (Muy brillante)
    graphics.lineStyle(3, 0x818CF8, 1); // Indigo 400
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // 4. Brillo superior (Glass Effect)
    graphics.fillStyle(0xffffff, 0.1);
    graphics.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height / 2.5, { tl: 12, tr: 12, bl: 4, br: 4 });

    // 5. Linea de brillo interior inferior
    graphics.lineStyle(1, 0xffffff, 0.15);
    graphics.strokeRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6, 14);

    return graphics;
}

/**
 * Crea un fondo premium para el HUD de Sentence Builder
 */
export function createSBHUDBg(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Graphics {
    return createSBPanel(scene, width, height);
}

/**
 * Crea un botón con el estilo Indigo Glass del juego
 */
export function createSBButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    isPrimary: boolean = true
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // Fondo (Glass Indigo)
    const bg = scene.add.graphics();
    const drawBtn = (isOver: boolean = false, isDown: boolean = false) => {
        bg.clear();
        const scale = isDown ? 0.95 : (isOver ? 1.05 : 1);
        const bgColor = isPrimary ? 0x4f46e5 : 0x312e81; // Indigo 600 o Indigo 900
        const alpha = isDown ? 1 : 0.9;

        bg.fillStyle(bgColor, alpha);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);

        // Borde Neón
        bg.lineStyle(2, 0x818CF8, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

        // Brillo Glass
        bg.fillStyle(0xffffff, 0.1);
        bg.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height / 2.5, { tl: 10, tr: 10, bl: 2, br: 2 });
    };

    drawBtn();

    const text = scene.add.text(0, 0, label, {
        fontSize: '18px',
        fontFamily: 'Nunito',
        color: '#FFFFFF',
        fontStyle: '900'
    }).setOrigin(0.5);

    container.add([bg, text]);

    // Interactividad
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    scene.input.setDraggable(container); // Just to avoid issues with some layouts

    container.on('pointerover', () => {
        drawBtn(true);
        scene.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    container.on('pointerout', () => {
        drawBtn(false);
        scene.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    container.on('pointerdown', () => {
        drawBtn(true, true);
        scene.tweens.add({ targets: container, scale: 0.95, duration: 50 });
        onClick();
        if (scene.cache.audio.exists('ui_click')) scene.sound.play('ui_click', { volume: 0.5 });
    });
    container.on('pointerup', () => {
        drawBtn(true, false);
        scene.tweens.add({ targets: container, scale: 1.05, duration: 50 });
    });

    return container;
}

/**
 * Crea un botón circular de icono con el estilo Indigo Glass
 */
export function createSBIconButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    iconFrame: string,
    onClick: () => void
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const radius = 22;

    const bg = scene.add.graphics();
    const draw = (isOver: boolean = false, isDown: boolean = false) => {
        bg.clear();
        bg.fillStyle(0x4f46e5, 0.9);
        bg.fillCircle(0, 0, radius);
        bg.lineStyle(2, 0x818CF8, 1);
        bg.strokeCircle(0, 0, radius);
        // Brillo
        bg.fillStyle(0xffffff, 0.1);
        bg.fillEllipse(0, -radius / 2, radius * 1.5, radius, 10);
    };
    draw();

    const icon = scene.add.image(0, 0, 'ui_atlas', iconFrame).setScale(0.7).setTint(0xffffff);
    container.add([bg, icon]);

    container.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);
    container.on('pointerover', () => scene.tweens.add({ targets: container, scale: 1.1, duration: 100 }));
    container.on('pointerout', () => scene.tweens.add({ targets: container, scale: 1, duration: 100 }));
    container.on('pointerdown', () => {
        scene.tweens.add({ targets: container, scale: 0.9, duration: 50 });
        onClick();
        if (scene.cache.audio.exists('ui_click')) scene.sound.play('ui_click', { volume: 0.5 });
    });

    return container;
}

/**
 * Crea un botón pequeño cuadrado (para +/- volumen) con estilo Indigo
 */
export function createSBSmallButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const size = 32;

    const bg = scene.add.graphics();
    const draw = (isOver: boolean = false) => {
        bg.clear();
        bg.fillStyle(0x6366f1, isOver ? 1 : 0.8);
        bg.fillRoundedRect(-size / 2, -size / 2, size, size, 8);
        bg.lineStyle(2, 0x818CF8, 1);
        bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 8);
    };
    draw();

    const text = scene.add.text(0, 0, label, {
        fontSize: '22px', fontFamily: 'Nunito', color: '#FFFFFF', fontStyle: '900'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setInteractive(new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => { draw(true); scene.tweens.add({ targets: container, scale: 1.1, duration: 100 }); });
    container.on('pointerout', () => { draw(false); scene.tweens.add({ targets: container, scale: 1, duration: 100 }); });
    container.on('pointerdown', () => { scene.tweens.add({ targets: container, scale: 0.9, duration: 50 }); onClick(); });

    return container;
}
