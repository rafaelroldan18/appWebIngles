/**
 * Estilos específicos para Word Catcher
 * Tema: Cósmico Neón / Crystal UI
 */

export const WORD_CATCHER_THEME = {
    // Colores principales - Sintonizados con el Bosque Nocturno
    colors: {
        // Bordes y acentos (Tonos mágicos / Bioluminiscentes)
        primary: 0x22D3EE,      // Cyan Aqua (Bioluminiscente)
        secondary: 0x818CF8,    // Indigo suave (Armoniza con las nubes del fondo)
        accent: 0xFBBF24,       // Ámbar/Oro (Contraste cálido y mágico)

        // Fondos
        bgDark: 0x0f172a,       // Azul medianoche rico (Slate-900)
        bgMedium: 0x1e293b,     // Slate-800

        // Estados
        success: 0x34D399,      // Esmeralda mágico
        error: 0xFB7185,        // Rosa/Rojo suave
        warning: 0xFBBF24,      // Ámbar

        // UI
        text: 0xf8fafc,
        textDim: 0x94a3b8,
    },

    // Colores en formato hex string
    hex: {
        primary: '#22D3EE',
        secondary: '#818CF8',
        accent: '#FBBF24',
        bgDark: '#0f172a',
        success: '#34D399',
        error: '#FB7185',
    },

    // Configuración de tokens (palabras cayendo)
    token: {
        cornerRadius: 24,
        borderWidth: 2,         // Borde más fino y elegante
        glowAlpha: 0.15,
        bgAlpha: 0.88,
    },

    // Configuración de modales y HUD
    ui: {
        panelBg: 0x0f172a,
        panelAlpha: 0.94,
        neonIndigo: 0x818CF8,
        neonCyan: 0x22D3EE,
        neonAmber: 0xFBBF24,
        neonEmerald: 0x34D399
    }
};

/**
 * Crea un fondo premium para el HUD con estilo Crystal-Neon
 */
export function createWordCatcherHUDBg(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();
    const theme = WORD_CATCHER_THEME;

    // Gradiente sutil de fondo (Oscuro profundo)
    graphics.fillStyle(theme.colors.bgDark, 0.9);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 18);

    // Borde Neón Dual (Indigo + Cyan)
    graphics.lineStyle(3, theme.colors.secondary, 0.7);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);

    // Brillo interior (Glossy)
    graphics.lineStyle(1.5, 0xffffff, 0.15);
    graphics.strokeRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6, 16);

    return graphics;
}

/**
 * Crea un token premium para las palabras cayendo
 */
export function createPremiumWordToken(
    scene: Phaser.Scene,
    tokenSize: number,
    color: number = 0x00D9FF
): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    const theme = WORD_CATCHER_THEME;

    // 1. Efecto de Resplandor (Glow) - Más suave
    const glow = scene.add.graphics();
    glow.fillStyle(color, 0.1);
    glow.fillRoundedRect(
        -tokenSize / 2 - 6,
        -tokenSize / 2 - 6,
        tokenSize + 12,
        tokenSize + 12,
        theme.token.cornerRadius + 4
    );

    // Animación de pulso para el glow
    scene.tweens.add({
        targets: glow,
        alpha: 0.5,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // 2. Fondo de Cristal (Glass-morphism)
    const bg = scene.add.graphics();
    bg.fillStyle(theme.colors.bgDark, theme.token.bgAlpha);
    bg.fillRoundedRect(
        -tokenSize / 2,
        -tokenSize / 2,
        tokenSize,
        tokenSize,
        theme.token.cornerRadius
    );

    // 3. Borde Neón
    const border = scene.add.graphics();
    border.lineStyle(theme.token.borderWidth, color, 0.8);
    border.strokeRoundedRect(
        -tokenSize / 2,
        -tokenSize / 2,
        tokenSize,
        tokenSize,
        theme.token.cornerRadius
    );

    // 4. Detalle de Reflexión (Shine)
    const shine = scene.add.graphics();
    shine.fillStyle(0xffffff, 0.08);
    shine.fillRoundedRect(
        -tokenSize / 2 + 5,
        -tokenSize / 2 + 5,
        tokenSize - 10,
        tokenSize / 3, // Más pequeño el brillo
        {
            tl: theme.token.cornerRadius - 4,
            tr: theme.token.cornerRadius - 4,
            bl: 4,
            br: 4
        }
    );

    container.add([glow, bg, border, shine]);

    // Guardar referencias
    (container as any).glow = glow;
    (container as any).border = border;
    (container as any).bg = bg;
    (container as any).color = color;

    return container;
}

/**
 * Crea un panel premium con estilo Word Catcher (Neon Glass)
 */
export function createWordCatcherPanel(
    scene: Phaser.Scene,
    width: number,
    height: number,
    color: number = 0x6366F1
): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();
    const theme = WORD_CATCHER_THEME;

    // Sombra/Glow exterior sutil
    graphics.fillStyle(color, 0.1);
    graphics.fillRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, 24);

    // Fondo oscuro (Cristal profundo)
    graphics.fillStyle(theme.colors.bgDark, 0.94);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 22);

    // Borde Neón Principal (Ultra brillante)
    graphics.lineStyle(4, color, 0.9);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);

    // Borde Interior de detalle (Reflejo)
    graphics.lineStyle(1.5, 0xffffff, 0.2);
    graphics.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 18);

    // Brillo superior
    graphics.fillStyle(0xffffff, 0.04);
    graphics.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, 40, { tl: 15, tr: 15, bl: 5, br: 5 });

    return graphics;
}

/**
 * Crea un botón premium estilo neón para Word Catcher
 */
export function createWCButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void
): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const theme = WORD_CATCHER_THEME;

    // Fondo del botón (Glass)
    const bg = scene.add.graphics();
    bg.fillStyle(theme.colors.bgDark, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);

    // Borde Neón
    const border = scene.add.graphics();
    border.lineStyle(3, color, 1);
    border.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    // Glow sutil
    const glow = scene.add.graphics();
    glow.fillStyle(color, 0.15);
    glow.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 16);

    // Texto
    const text = scene.add.text(0, 0, label, {
        fontSize: '20px',
        fontFamily: 'Nunito',
        color: '#ffffff',
        fontStyle: '900',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5);

    container.add([glow, bg, border, text]);

    // Area interactiva
    const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerdown', () => {
        scene.tweens.add({ targets: container, scale: 0.95, duration: 80, yoyo: true });
        if (scene.cache.audio.exists('ui_click')) scene.sound.play('ui_click', { volume: 0.5 });
        onClick();
    });

    hitArea.on('pointerover', () => {
        border.lineStyle(4, color, 1); border.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        glow.setAlpha(0.3);
    });

    hitArea.on('pointerout', () => {
        border.clear().lineStyle(3, color, 1); border.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        glow.setAlpha(0.15);
    });

    return container;
}

/**
 * Crea un botón de icono premium estilo neón para el HUD de Word Catcher
 */
export function createWCIconButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    iconFrame: string,
    color: number,
    onClick: () => void
): Phaser.GameObjects.Container {
    const size = 44;
    const container = scene.add.container(x, y);
    const theme = WORD_CATCHER_THEME;

    const bg = scene.add.graphics();
    bg.fillStyle(theme.colors.bgDark, 0.9);
    bg.fillCircle(0, 0, size / 2);

    const border = scene.add.graphics();
    border.lineStyle(3, color, 1);
    border.strokeCircle(0, 0, size / 2);

    const icon = scene.add.image(0, 0, 'ui_atlas', iconFrame);
    icon.setDisplaySize(size * 0.6, size * 0.6);

    container.add([bg, border, icon]);

    const hitArea = scene.add.circle(0, 0, size / 2, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerdown', () => {
        scene.tweens.add({ targets: container, scale: 0.9, duration: 80, yoyo: true });
        if (scene.cache.audio.exists('ui_click')) scene.sound.play('ui_click', { volume: 0.5 });
        onClick();
    });

    hitArea.on('pointerover', () => border.lineStyle(4, color, 1).strokeCircle(0, 0, size / 2));
    hitArea.on('pointerout', () => border.clear().lineStyle(3, color, 1).strokeCircle(0, 0, size / 2));

    return container;
}
