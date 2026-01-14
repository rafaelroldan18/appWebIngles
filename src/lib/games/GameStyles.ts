/**
 * GameStyles - Estilos globales consistentes para todos los juegos
 * Define tipografías, colores, tamaños y animaciones estándar
 */

// ============================================
// TIPOGRAFÍA
// ============================================

export const GAME_FONTS = {
    // Fuente principal para títulos y UI
    primary: 'Fredoka, Arial Black, sans-serif',

    // Fuente secundaria para textos largos
    secondary: 'Baloo 2, Arial, sans-serif',

    // Fuente para números y scores
    numeric: 'Fredoka, Arial Black, monospace',
} as const;

export const FONT_SIZES = {
    // HUD y UI
    hudScore: '28px',
    hudTimer: '24px',
    hudLabel: '16px',
    hudProgress: '18px',

    // Títulos
    title: '48px',
    subtitle: '32px',
    heading: '24px',

    // Contenido
    body: '20px',
    small: '16px',
    tiny: '14px',

    // Botones
    buttonLarge: '24px',
    buttonMedium: '20px',
    buttonSmall: '16px',
} as const;

// ============================================
// COLORES
// ============================================

export const GAME_COLORS = {
    // Colores principales
    primary: 0x6366F1,      // Índigo
    secondary: 0x8B5CF6,    // Violeta

    // Estados
    success: 0x10B981,      // Verde
    error: 0xEF4444,        // Rojo
    warning: 0xF59E0B,      // Ámbar
    info: 0x3B82F6,         // Azul

    // Especiales
    gold: 0xFFD700,         // Dorado
    silver: 0xC0C0C0,       // Plateado
    bronze: 0xCD7F32,       // Bronce

    // Neutrales
    white: 0xFFFFFF,
    black: 0x000000,
    gray: 0x6B7280,
    darkGray: 0x374151,
    lightGray: 0xD1D5DB,

    // Fondos
    bgDark: 0x0F172A,       // Slate-900
    bgLight: 0xF8FAFC,      // Slate-50

    // UI
    panel: 0x1E293B,        // Slate-800
    panelLight: 0x334155,   // Slate-700
} as const;

// Versiones en string para CSS
export const GAME_COLORS_HEX = {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    gold: '#FFD700',
    white: '#FFFFFF',
    black: '#000000',
} as const;

// ============================================
// ESTILOS DE TEXTO
// ============================================

export const TEXT_STYLES = {
    // Títulos
    title: {
        fontSize: FONT_SIZES.title,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.gold,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 6,
    },

    subtitle: {
        fontSize: FONT_SIZES.subtitle,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 4,
    },

    // HUD
    hudScore: {
        fontSize: FONT_SIZES.hudScore,
        fontFamily: GAME_FONTS.numeric,
        color: GAME_COLORS_HEX.gold,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 4,
    },

    hudTimer: {
        fontSize: FONT_SIZES.hudTimer,
        fontFamily: GAME_FONTS.numeric,
        color: GAME_COLORS_HEX.white,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 3,
    },

    hudLabel: {
        fontSize: FONT_SIZES.hudLabel,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 3,
    },

    // Contenido
    body: {
        fontSize: FONT_SIZES.body,
        fontFamily: GAME_FONTS.secondary,
        color: GAME_COLORS_HEX.white,
    },

    bodyDark: {
        fontSize: FONT_SIZES.body,
        fontFamily: GAME_FONTS.secondary,
        color: GAME_COLORS_HEX.black,
    },

    // Botones
    button: {
        fontSize: FONT_SIZES.buttonMedium,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 4,
    },

    buttonLarge: {
        fontSize: FONT_SIZES.buttonLarge,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 5,
    },
} as const;

// ============================================
// ESPACIADO Y MÁRGENES
// ============================================

export const SPACING = {
    // Márgenes
    marginTiny: 4,
    marginSmall: 8,
    marginMedium: 16,
    marginLarge: 24,
    marginXLarge: 32,
    marginXXLarge: 48,

    // Padding
    paddingTiny: 4,
    paddingSmall: 8,
    paddingMedium: 12,
    paddingLarge: 16,
    paddingXLarge: 24,

    // Gaps
    gapSmall: 8,
    gapMedium: 16,
    gapLarge: 24,

    // HUD específico
    hudPadding: 20,
    hudMargin: 20,
    hudGap: 16,
} as const;

// ============================================
// ANIMACIONES Y TRANSICIONES
// ============================================

export const ANIMATIONS = {
    // Duraciones (en ms)
    duration: {
        instant: 100,
        fast: 200,
        normal: 300,
        slow: 500,
        verySlow: 800,
    },

    // Easings de Phaser
    easing: {
        linear: 'Linear',
        easeIn: 'Quad.easeIn',
        easeOut: 'Quad.easeOut',
        easeInOut: 'Quad.easeInOut',
        backOut: 'Back.easeOut',
        backIn: 'Back.easeIn',
        elasticOut: 'Elastic.easeOut',
        bounceOut: 'Bounce.easeOut',
    },
} as const;

// ============================================
// CONFIGURACIÓN DE MODALES
// ============================================

export const MODAL_CONFIG = {
    // Tamaños
    width: {
        small: 400,
        medium: 500,
        large: 600,
        xlarge: 700,
    },

    height: {
        small: 250,
        medium: 350,
        large: 450,
        xlarge: 550,
    },

    // Backdrop
    backdropAlpha: 0.7,
    backdropColor: GAME_COLORS.black,

    // Animación de entrada
    entryAnimation: {
        duration: ANIMATIONS.duration.normal,
        easing: ANIMATIONS.easing.backOut,
        scaleFrom: 0.5,
        scaleTo: 1,
        alphaFrom: 0,
        alphaTo: 1,
    },

    // Animación de salida
    exitAnimation: {
        duration: ANIMATIONS.duration.fast,
        easing: ANIMATIONS.easing.easeIn,
        scaleFrom: 1,
        scaleTo: 0.8,
        alphaFrom: 1,
        alphaTo: 0,
    },
} as const;

// ============================================
// CONFIGURACIÓN DE EFECTOS VISUALES
// ============================================

export const FX_CONFIG = {
    // Feedback (check/cross)
    feedback: {
        duration: 1000,
        scale: 3,
        alpha: 0,
    },

    // Burst (explosión)
    burst: {
        duration: 800,
        scale: 1.5,
        alpha: 0,
    },

    // Glow (brillo)
    glow: {
        duration: 1000,
        scaleFrom: 0.5,
        scaleTo: 1.2,
        alphaFrom: 0.6,
        alphaTo: 0,
    },

    // Shake de cámara
    shake: {
        duration: 150,
        intensity: 0.01,
    },

    // Flash de cámara
    flash: {
        duration: 200,
        alpha: 0.5,
    },
} as const;

// ============================================
// CONFIGURACIÓN DE SONIDOS (para futuro)
// ============================================

export const SOUND_KEYS = {
    // UI
    buttonClick: 'sfx_button_click',
    buttonHover: 'sfx_button_hover',
    modalOpen: 'sfx_modal_open',
    modalClose: 'sfx_modal_close',

    // Feedback
    correct: 'sfx_correct',
    wrong: 'sfx_wrong',
    success: 'sfx_success',
    fail: 'sfx_fail',

    // Efectos
    pop: 'sfx_pop',
    whoosh: 'sfx_whoosh',
    ding: 'sfx_ding',
    buzz: 'sfx_buzz',

    // Música
    bgmMenu: 'bgm_menu',
    bgmGame: 'bgm_game',
    bgmVictory: 'bgm_victory',
} as const;

// ============================================
// DEPTH LAYERS (Z-INDEX)
// ============================================

export const DEPTH_LAYERS = {
    background: 0,
    ground: 100,
    objects: 200,
    player: 300,
    effects: 400,
    ui: 1000,
    hud: 1001,
    modal: 2000,
    modalContent: 2001,
    overlay: 3000,
    debug: 9999,
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Crea un estilo de texto personalizado combinando estilos base
 */
export function createTextStyle(
    baseStyle: keyof typeof TEXT_STYLES,
    overrides: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}
): Phaser.Types.GameObjects.Text.TextStyle {
    return {
        ...TEXT_STYLES[baseStyle],
        ...overrides,
    };
}

/**
 * Aplica una animación de fade in a un objeto
 */
export function fadeIn(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    duration: number = ANIMATIONS.duration.normal
): Phaser.Tweens.Tween {
    const gameObject = target as any;
    gameObject.setAlpha(0);

    return scene.tweens.add({
        targets: target,
        alpha: 1,
        duration,
        ease: ANIMATIONS.easing.easeOut,
    });
}

/**
 * Aplica una animación de fade out a un objeto
 */
export function fadeOut(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    duration: number = ANIMATIONS.duration.normal,
    onComplete?: () => void
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets: target,
        alpha: 0,
        duration,
        ease: ANIMATIONS.easing.easeIn,
        onComplete,
    });
}

/**
 * Aplica una animación de scale bounce a un objeto
 */
export function scaleBounce(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    scaleFrom: number = 0,
    scaleTo: number = 1,
    duration: number = ANIMATIONS.duration.normal
): Phaser.Tweens.Tween {
    const gameObject = target as any;
    gameObject.setScale(scaleFrom);

    return scene.tweens.add({
        targets: target,
        scale: scaleTo,
        duration,
        ease: ANIMATIONS.easing.backOut,
    });
}

/**
 * Aplica una animación combinada de fade in + scale bounce
 */
export function fadeInBounce(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    duration: number = ANIMATIONS.duration.normal
): void {
    fadeIn(scene, target, duration);
    scaleBounce(scene, target, 0.5, 1, duration);
}

/**
 * Obtiene un color del tema
 */
export function getColor(colorName: keyof typeof GAME_COLORS): number {
    return GAME_COLORS[colorName];
}

/**
 * Obtiene un color en formato hexadecimal
 */
export function getColorHex(colorName: keyof typeof GAME_COLORS_HEX): string {
    return GAME_COLORS_HEX[colorName];
}
