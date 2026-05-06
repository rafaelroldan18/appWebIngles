/**
 * GameStyles - Estilos globales consistentes para todos los juegos
 * Define tipografías, colores, tamaños y animaciones estándar
 */

// ============================================
// TIPOGRAFÍA
// ============================================

export const GAME_FONTS = {
    // Fuente principal para títulos y UI (Más profesional y limpia)
    primary: '"Nunito", "Inter", sans-serif',

    // Fuente secundaria para textos largos
    secondary: '"Nunito", sans-serif',

    // Fuente para números y scores
    numeric: '"Nunito", "Roboto Mono", monospace',
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
// PALETAS DE COLORES POR JUEGO
// Esquemas vibrantes y motivadores específicos para cada juego
// ============================================

export const GAME_THEMES = {
    // 🎯 GRAMMAR RUN - Energía y Velocidad
    // Paleta de neón vibrante con tonos eléctricos
    grammarRun: {
        name: 'Grammar Run',
        colors: {
            // Colores principales - Neón eléctrico
            primary: 0xFF00FF,          // Magenta neón brillante
            secondary: 0x00FFFF,        // Cyan eléctrico
            accent: 0xFFFF00,           // Amarillo neón

            // Elementos del juego
            player: 0x00D9FF,           // Cyan brillante (neutral y moderno)
            obstacle: 0xFF4500,         // Naranja rojizo vibrante (OrangeRed)
            ground: 0x9400D3,           // Violeta oscuro (DarkViolet)
            background: 0x1A0033,       // Púrpura muy oscuro

            // Efectos y partículas
            trail: 0x00FF88,            // Verde neón
            glow: 0xFF00AA,             // Rosa neón
            spark: 0xFFFF33,            // Amarillo brillante

            // UI específica
            correctAnswer: 0x00FF00,    // Verde lima brillante
            wrongAnswer: 0xFF0066,      // Rosa rojizo intenso
            powerUp: 0xFFD700,          // Dorado brillante
        },
        hex: {
            primary: '#FF00FF',
            secondary: '#00FFFF',
            accent: '#FFFF00',
            player: '#00D9FF',
            obstacle: '#FF4500',
            ground: '#9400D3',
            background: '#1A0033',
            trail: '#00FF88',
            glow: '#FF00AA',
            spark: '#FFFF33',
            correctAnswer: '#00FF00',
            wrongAnswer: '#FF0066',
            powerUp: '#FFD700',
        }
    },

    // 🎪 WORD CIRCUS - Diversión y Alegría
    // Paleta de circo vibrante con colores festivos
    wordCircus: {
        name: 'Word Circus',
        colors: {
            // Colores principales - Circo festivo
            primary: 0xFF6B35,          // Naranja coral vibrante
            secondary: 0xF7B801,        // Amarillo dorado brillante
            accent: 0xE63946,           // Rojo carmesí intenso

            // Elementos del juego
            balloon: 0xFF1654,          // Rosa fucsia brillante
            balloonAlt1: 0x4ECDC4,      // Turquesa vibrante
            balloonAlt2: 0x9B59B6,      // Púrpura real
            balloonAlt3: 0xF39C12,      // Naranja dorado
            background: 0x2C3E50,       // Azul pizarra oscuro

            // Efectos
            pop: 0xFFD93D,              // Amarillo brillante
            confetti1: 0xFF6B9D,        // Rosa chicle
            confetti2: 0x6BCB77,        // Verde menta brillante
            confetti3: 0xFFA07A,        // Salmón claro

            // UI específica
            correctPop: 0x2ECC71,       // Verde esmeralda
            wrongPop: 0xE74C3C,         // Rojo brillante
            combo: 0xF1C40F,            // Amarillo sol
        },
        hex: {
            primary: '#FF6B35',
            secondary: '#F7B801',
            accent: '#E63946',
            balloon: '#FF1654',
            balloonAlt1: '#4ECDC4',
            balloonAlt2: '#9B59B6',
            balloonAlt3: '#F39C12',
            background: '#2C3E50',
            pop: '#FFD93D',
            confetti1: '#FF6B9D',
            confetti2: '#6BCB77',
            confetti3: '#FFA07A',
            correctPop: '#2ECC71',
            wrongPop: '#E74C3C',
            combo: '#F1C40F',
        }
    },

    // 🧩 WORD PUZZLE - Concentración y Claridad
    // Paleta moderna con gradientes vibrantes
    wordPuzzle: {
        name: 'Word Puzzle',
        colors: {
            // Colores principales - Gradiente moderno
            primary: 0x667EEA,          // Azul índigo brillante
            secondary: 0x764BA2,        // Púrpura profundo
            accent: 0xF093FB,           // Rosa lavanda brillante

            // Elementos del juego
            tile: 0x4FACFE,             // Azul cielo brillante
            tileSelected: 0xFF0080,     // Magenta intenso
            tileCorrect: 0x43E97B,      // Verde menta brillante
            tileWrong: 0xFA709A,        // Rosa coral
            background: 0x0F2027,       // Azul marino muy oscuro

            // Efectos
            glow: 0x00F5FF,             // Cyan brillante
            particle: 0xFFB6FF,         // Rosa pastel brillante
            trail: 0x38EF7D,            // Verde lima brillante

            // UI específica
            hint: 0xFEAC5E,             // Naranja melocotón
            match: 0x4BC0C8,            // Turquesa brillante
            complete: 0xC471F5,         // Púrpura orquídea
        },
        hex: {
            primary: '#667EEA',
            secondary: '#764BA2',
            accent: '#F093FB',
            tile: '#4FACFE',
            tileSelected: '#FF0080',
            tileCorrect: '#43E97B',
            tileWrong: '#FA709A',
            background: '#0F2027',
            glow: '#00F5FF',
            particle: '#FFB6FF',
            trail: '#38EF7D',
            hint: '#FEAC5E',
            match: '#4BC0C8',
            complete: '#C471F5',
        }
    },

    // 🎮 MEMORY MATCH - Memoria y Enfoque
    // Paleta de neón retro gaming
    memoryMatch: {
        name: 'Memory Match',
        colors: {
            // Colores principales - Retro gaming
            primary: 0xFF006E,          // Rosa neón intenso
            secondary: 0x8338EC,        // Púrpura eléctrico
            accent: 0xFFBE0B,           // Amarillo dorado brillante

            // Elementos del juego
            cardBack: 0x3A86FF,         // Azul brillante
            cardFront: 0xFB5607,        // Naranja intenso
            cardMatch: 0x06FFA5,        // Verde menta neón
            cardMismatch: 0xFF006E,     // Rosa neón
            background: 0x0D1B2A,       // Azul oscuro profundo

            // Efectos
            flip: 0xFFD60A,             // Amarillo brillante
            match: 0x00F5D4,            // Turquesa neón
            glow: 0xFF0A54,             // Rosa rojizo brillante
            particle: 0x9D4EDD,         // Púrpura medio brillante

            // UI específica
            timer: 0xFF5400,            // Naranja rojizo
            score: 0x00BBF9,            // Azul cielo brillante
            combo: 0xFFBE0B,            // Amarillo dorado
        },
        hex: {
            primary: '#FF006E',
            secondary: '#8338EC',
            accent: '#FFBE0B',
            cardBack: '#3A86FF',
            cardFront: '#FB5607',
            cardMatch: '#06FFA5',
            cardMismatch: '#FF006E',
            background: '#0D1B2A',
            flip: '#FFD60A',
            match: '#00F5D4',
            glow: '#FF0A54',
            particle: '#9D4EDD',
            timer: '#FF5400',
            score: '#00BBF9',
            combo: '#FFBE0B',
        }
    },

    // 📚 SENTENCE BUILDER - Creatividad y Construcción
    // Paleta de construcción vibrante
    sentenceBuilder: {
        name: 'Sentence Builder',
        colors: {
            // Colores principales - Constructor vibrante
            primary: 0xFF6B6B,          // Rojo coral brillante
            secondary: 0x4ECDC4,        // Turquesa vibrante
            accent: 0xFFE66D,           // Amarillo pastel brillante

            // Elementos del juego
            wordBlock: 0x95E1D3,        // Verde menta claro
            wordBlockHover: 0xF38181,   // Rosa salmón
            wordBlockPlaced: 0xAA96DA,  // Lavanda brillante
            wordBlockCorrect: 0x48CFAD, // Verde turquesa
            background: 0x2C3A47,       // Gris azulado oscuro

            // Zonas de construcción
            dropZone: 0x5F27CD,         // Púrpura intenso
            dropZoneActive: 0xEE5A6F,   // Rosa rojizo
            dropZoneFilled: 0x00D2D3,   // Cyan brillante

            // Efectos
            snap: 0xFECA57,             // Amarillo mostaza brillante
            complete: 0x1DD1A1,         // Verde esmeralda brillante
            error: 0xFF6348,            // Rojo tomate brillante

            // UI específica
            hint: 0xFFA502,             // Naranja brillante
            validation: 0x5F27CD,       // Púrpura intenso
            success: 0x00D2D3,          // Cyan brillante
        },
        hex: {
            primary: '#FF6B6B',
            secondary: '#4ECDC4',
            accent: '#FFE66D',
            wordBlock: '#95E1D3',
            wordBlockHover: '#F38181',
            wordBlockPlaced: '#AA96DA',
            wordBlockCorrect: '#48CFAD',
            background: '#2C3A47',
            dropZone: '#5F27CD',
            dropZoneActive: '#EE5A6F',
            dropZoneFilled: '#00D2D3',
            snap: '#FECA57',
            complete: '#1DD1A1',
            error: '#FF6348',
            hint: '#FFA502',
            validation: '#5F27CD',
            success: '#00D2D3',
        }
    },
} as const;

// Helper para obtener el tema de un juego
export function getGameTheme(gameName: keyof typeof GAME_THEMES) {
    return GAME_THEMES[gameName];
}

// ============================================
// ESTILOS DE TEXTO
// ============================================

export const TEXT_STYLES = {
    // Títulos
    title: {
        fontSize: FONT_SIZES.title,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: GAME_COLORS_HEX.primary,
        strokeThickness: 2,
    },

    subtitle: {
        fontSize: FONT_SIZES.subtitle,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: GAME_COLORS_HEX.black,
        strokeThickness: 1,
    },

    // HUD
    hudScore: {
        fontSize: FONT_SIZES.hudScore,
        fontFamily: GAME_FONTS.numeric,
        color: GAME_COLORS_HEX.gold,
        stroke: '#000000',
        strokeThickness: 2,
    },

    hudTimer: {
        fontSize: FONT_SIZES.hudTimer,
        fontFamily: GAME_FONTS.numeric,
        color: GAME_COLORS_HEX.white,
        stroke: '#000000',
        strokeThickness: 1,
    },

    hudLabel: {
        fontSize: FONT_SIZES.hudLabel,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: '#000000',
        strokeThickness: 1,
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
        stroke: '#000000',
        strokeThickness: 1,
    },

    buttonLarge: {
        fontSize: FONT_SIZES.buttonLarge,
        fontFamily: GAME_FONTS.primary,
        color: GAME_COLORS_HEX.white,
        stroke: '#000000',
        strokeThickness: 2,
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
