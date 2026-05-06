/**
 * Estilos específicos para Grammar Run
 * Tema: Neón Suave Cyberpunk
 */

export const GRAMMAR_RUN_THEME = {
    // Colores principales
    colors: {
        // Bordes y acentos
        primary: 0x9333EA,      // Púrpura suave
        secondary: 0x06B6D4,    // Cyan suave
        accent: 0xFBBF24,       // Amarillo dorado

        // Fondos
        bgDark: 0x0a0a1a,       // Fondo muy oscuro
        bgMedium: 0x1a1a2e,     // Fondo medio

        // Estados - MÁS VIBRANTES Y NEÓN
        success: 0x00FF88,      // Verde neón brillante (antes #10b981)
        error: 0xFF0066,        // Rosa neón intenso (antes #ef4444)
        warning: 0xFFBF00,      // Amarillo neón (antes #f59e0b)

        // UI
        text: 0xffffff,         // Texto blanco
        textDim: 0x94a3b8,      // Texto atenuado

        // Botones - MÁS VIBRANTES
        buttonPrimary: 0xA855F7,    // Púrpura más brillante
        buttonSecondary: 0x475569,  // Gris oscuro
        buttonSuccess: 0x00FF88,    // Verde neón
        buttonDanger: 0xFF0066,     // Rosa neón
    },

    // Colores en formato hex string
    hex: {
        primary: '#9333EA',
        secondary: '#06B6D4',
        accent: '#FBBF24',
        bgDark: '#0a0a1a',
        bgMedium: '#1a1a2e',
        success: '#00FF88',
        error: '#FF0066',
        warning: '#FFBF00',
        text: '#ffffff',
        textDim: '#94a3b8',
        buttonPrimary: '#A855F7',
        buttonSecondary: '#475569',
        buttonSuccess: '#00FF88',
        buttonDanger: '#FF0066',
    },

    // Estilos de texto
    textStyles: {
        title: {
            fontSize: '32px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
        },
        subtitle: {
            fontSize: '24px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        },
        body: {
            fontSize: '18px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        },
        small: {
            fontSize: '14px',
            fontFamily: 'Nunito',
            color: '#ffffff', // Blanco brillante (antes #94a3b8)
        },
    },

    // Configuración de paneles
    panel: {
        borderWidth: 3,
        borderAlpha: 0.7,
        innerBorderWidth: 2,
        innerBorderAlpha: 0.6,
        bgAlpha: 0.95,
        cornerRadius: 20,
    },

    // Configuración de botones
    button: {
        borderWidth: 2,
        borderAlpha: 0.8,
        bgAlpha: 0.9,
        cornerRadius: 15,
        padding: { x: 20, y: 12 },
    },

    // Animaciones
    animations: {
        pulseDuration: 2500,
        pulseAlpha: 0.9,
        hoverScale: 1.05,
        clickScale: 0.95,
    },
};

/**
 * Crea un panel con estilo Grammar Run
 */
export function createGrammarRunPanel(
    scene: Phaser.Scene,
    width: number,
    height: number
): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();
    const theme = GRAMMAR_RUN_THEME;

    // Fondo oscuro
    graphics.fillStyle(theme.colors.bgDark, theme.panel.bgAlpha);
    graphics.fillRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        theme.panel.cornerRadius
    );

    // Borde exterior púrpura MÁS GRUESO Y BRILLANTE
    graphics.lineStyle(
        5, // Más grueso (antes 3)
        theme.colors.primary,
        0.9 // Más opaco (antes 0.7)
    );
    graphics.strokeRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        theme.panel.cornerRadius
    );

    // Borde interior cyan MÁS VISIBLE
    graphics.lineStyle(
        3, // Más grueso (antes 2)
        theme.colors.secondary,
        0.8 // Más opaco (antes 0.6)
    );
    graphics.strokeRoundedRect(
        -width / 2 + 6,
        -height / 2 + 6,
        width - 12,
        height - 12,
        theme.panel.cornerRadius - 4
    );

    return graphics;
}

/**
 * Crea un botón con estilo Grammar Run
 */
export function createGrammarRunButton(
    scene: Phaser.Scene,
    text: string,
    type: 'primary' | 'secondary' | 'success' | 'danger' = 'primary'
): Phaser.GameObjects.Container {
    const theme = GRAMMAR_RUN_THEME;
    const container = scene.add.container(0, 0);

    // Determinar color según tipo
    let bgColor: number;
    let textColor = theme.hex.text;

    switch (type) {
        case 'primary':
            bgColor = theme.colors.buttonPrimary;
            break;
        case 'secondary':
            bgColor = theme.colors.buttonSecondary;
            break;
        case 'success':
            bgColor = theme.colors.buttonSuccess;
            break;
        case 'danger':
            bgColor = theme.colors.buttonDanger;
            break;
    }

    // Medir texto para calcular tamaño del botón
    const tempText = scene.add.text(0, 0, text, theme.textStyles.body);
    const textWidth = tempText.width;
    const textHeight = tempText.height;
    tempText.destroy();

    const btnWidth = textWidth + theme.button.padding.x * 2;
    const btnHeight = textHeight + theme.button.padding.y * 2;

    // Fondo del botón
    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, theme.button.bgAlpha);
    bg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        theme.button.cornerRadius
    );

    // Borde del botón
    bg.lineStyle(theme.button.borderWidth, 0xffffff, theme.button.borderAlpha);
    bg.strokeRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        theme.button.cornerRadius
    );

    // Texto del botón
    const btnText = scene.add.text(0, 0, text, {
        ...theme.textStyles.body,
        color: textColor,
    }).setOrigin(0.5);

    container.add([bg, btnText]);

    // Hacer interactivo
    container.setSize(btnWidth, btnHeight);
    container.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
    });

    // Efectos hover
    container.on('pointerover', () => {
        scene.tweens.add({
            targets: container,
            scale: theme.animations.hoverScale,
            duration: 100,
        });
    });

    container.on('pointerout', () => {
        scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 100,
        });
    });

    container.on('pointerdown', () => {
        scene.tweens.add({
            targets: container,
            scale: theme.animations.clickScale,
            duration: 50,
            yoyo: true,
        });
    });

    return container;
}
