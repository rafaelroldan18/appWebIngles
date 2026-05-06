/**
 * VisualEffects - Sistema unificado de efectos visuales
 * Proporciona feedback consistente en todos los juegos
 * Usa GSAP para animaciones profesionales y suaves
 */

import * as Phaser from 'phaser';
import { gsap } from 'gsap';
import { GAME_COLORS, ANIMATIONS } from './GameStyles';

// ============================================
// CONFIGURACIÓN DE EFECTOS
// ============================================

export const VISUAL_FX_CONFIG = {
    // Feedback de acierto
    correct: {
        glowColor: GAME_COLORS.success,
        glowAlpha: 0.6,
        scalePulse: { from: 1.0, to: 1.2, duration: 400 },
        particleCount: 12,
        particleColor: GAME_COLORS.success,
        cameraFlash: { alpha: 0.2, duration: 150, color: 0xFFFFFF }
    },

    // Feedback de error
    wrong: {
        shakeIntensity: 8,
        shakeDuration: 150,
        tintColor: GAME_COLORS.error,
        tintDuration: 300,
        cameraShake: { intensity: 0.01, duration: 150 }
    },

    // Recompensa/Completado
    reward: {
        burstColor: GAME_COLORS.gold,
        burstParticles: 20,
        scaleBounce: { from: 0, to: 1.2, final: 1.0, duration: 600 },
        glowColor: GAME_COLORS.gold,
        glowAlpha: 0.8,
        cameraFlash: { alpha: 0.3, duration: 200, color: 0xFFD700 }
    },

    // Hover (botones, elementos interactivos)
    hover: {
        scale: 1.05,
        duration: 100,
        glowAlpha: 0.3
    },

    // Click
    click: {
        scaleDown: 0.95,
        duration: 50
    }
} as const;

// ============================================
// EFECTOS DE FEEDBACK
// ============================================

/**
 * Muestra feedback visual de acierto
 */
export function showCorrectFeedback(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: {
        scale?: number;
        skipParticles?: boolean;
        skipCameraFlash?: boolean;
    } = {}
): void {
    const config = VISUAL_FX_CONFIG.correct;

    // Glow verde
    const glow = scene.add.circle(x, y, 40, config.glowColor, config.glowAlpha);
    glow.setDepth(400);

    scene.tweens.add({
        targets: glow,
        scale: { from: 0.5, to: 1.5 },
        alpha: { from: config.glowAlpha, to: 0 },
        duration: config.scalePulse.duration,
        ease: 'Quad.easeOut',
        onComplete: () => glow.destroy()
    });

    // Partículas
    if (!options.skipParticles) {
        createRadialParticles(scene, x, y, config.particleColor, config.particleCount);
    }

    // Flash de cámara
    if (!options.skipCameraFlash) {
        scene.cameras.main.flash(
            config.cameraFlash.duration,
            255, 255, 255,
            false,
            undefined,
            config.cameraFlash.alpha
        );
    }
}

/**
 * Muestra feedback visual de error
 */
export function showWrongFeedback(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    options: {
        skipShake?: boolean;
        skipCameraShake?: boolean;
        destroyAfter?: boolean;
    } = {}
): void {
    const config = VISUAL_FX_CONFIG.wrong;
    const gameObject = target as any;

    // Shake horizontal
    if (!options.skipShake && gameObject.x !== undefined) {
        const originalX = gameObject.x;
        scene.tweens.add({
            targets: target,
            x: originalX + config.shakeIntensity,
            duration: config.shakeDuration / 4,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                gameObject.x = originalX;
            }
        });
    }

    // Tint rojo temporal
    if (gameObject.setTint) {
        gameObject.setTint(config.tintColor);
        scene.time.delayedCall(config.tintDuration, () => {
            if (gameObject.clearTint) {
                gameObject.clearTint();
            }
        });
    }

    // Shake de cámara
    if (!options.skipCameraShake) {
        scene.cameras.main.shake(
            config.cameraShake.duration,
            config.cameraShake.intensity
        );
    }

    // Destruir después
    if (options.destroyAfter) {
        scene.tweens.add({
            targets: target,
            alpha: 0,
            duration: 300,
            delay: 200,
            onComplete: () => {
                if (gameObject.destroy) {
                    gameObject.destroy();
                }
            }
        });
    }
}

/**
 * Muestra feedback de recompensa/logro
 */
export function showRewardFeedback(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: {
        skipParticles?: boolean;
        skipCameraFlash?: boolean;
    } = {}
): Phaser.GameObjects.Graphics {
    const config = VISUAL_FX_CONFIG.reward;

    // Burst dorado
    const burst = scene.add.graphics();
    burst.setPosition(x, y);
    burst.setDepth(400);
    burst.fillStyle(config.burstColor, 0.8);
    burst.fillCircle(0, 0, 60);

    scene.tweens.add({
        targets: burst,
        scale: { from: config.scaleBounce.from, to: config.scaleBounce.to },
        alpha: { from: 1, to: 0 },
        duration: config.scaleBounce.duration,
        ease: 'Back.easeOut',
        onComplete: () => burst.destroy()
    });

    // Partículas doradas
    if (!options.skipParticles) {
        createBurstParticles(scene, x, y, config.burstColor, config.burstParticles);
    }

    // Flash de cámara
    if (!options.skipCameraFlash) {
        scene.cameras.main.flash(
            config.cameraFlash.duration,
            255, 215, 0, // Dorado
            false,
            undefined,
            config.cameraFlash.alpha
        );
    }

    return burst;
}

// ============================================
// MICROINTERACCIONES
// ============================================

/**
 * Aplica efecto hover a un elemento interactivo
 */
export function applyHoverEffect(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    options: {
        scale?: number;
        duration?: number;
        addGlow?: boolean;
        glowColor?: number;
    } = {}
): void {
    const config = VISUAL_FX_CONFIG.hover;
    const scale = options.scale ?? config.scale;
    const duration = options.duration ?? config.duration;

    scene.tweens.add({
        targets: target,
        scale: scale,
        duration: duration,
        ease: 'Quad.easeOut'
    });

    // Glow opcional
    if (options.addGlow) {
        const gameObject = target as any;
        if (gameObject.setTint) {
            gameObject.setTint(options.glowColor ?? 0xFFFFFF);
        }
    }
}

/**
 * Remueve efecto hover
 */
export function removeHoverEffect(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    options: {
        duration?: number;
    } = {}
): void {
    const config = VISUAL_FX_CONFIG.hover;
    const duration = options.duration ?? config.duration;

    scene.tweens.add({
        targets: target,
        scale: 1.0,
        duration: duration,
        ease: 'Quad.easeOut'
    });

    // Remover tint
    const gameObject = target as any;
    if (gameObject.clearTint) {
        gameObject.clearTint();
    }
}

/**
 * Aplica efecto click (bounce)
 */
export function applyClickEffect(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    onComplete?: () => void
): void {
    const config = VISUAL_FX_CONFIG.click;

    scene.tweens.add({
        targets: target,
        scale: config.scaleDown,
        duration: config.duration,
        yoyo: true,
        ease: 'Quad.easeInOut',
        onComplete: onComplete
    });
}

// ============================================
// PARTÍCULAS
// ============================================

/**
 * Crea partículas radiales (explosión circular)
 */
function createRadialParticles(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number,
    count: number = 12
): void {
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
        const angle = angleStep * i;
        const particle = scene.add.circle(x, y, 4, color, 1);
        particle.setDepth(400);

        const distance = 60 + Math.random() * 20;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        scene.tweens.add({
            targets: particle,
            x: targetX,
            y: targetY,
            alpha: 0,
            scale: 0.5,
            duration: 400 + Math.random() * 200,
            ease: 'Quad.easeOut',
            onComplete: () => particle.destroy()
        });
    }
}

/**
 * Crea partículas de burst (explosión con variación)
 */
function createBurstParticles(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number,
    count: number = 20
): void {
    for (let i = 0; i < count; i++) {
        const particle = scene.add.circle(x, y, 3 + Math.random() * 3, color, 1);
        particle.setDepth(400);

        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 60;
        const distance = speed;

        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        scene.tweens.add({
            targets: particle,
            x: targetX,
            y: targetY,
            alpha: 0,
            scale: 0,
            duration: 600 + Math.random() * 400,
            ease: 'Quad.easeOut',
            onComplete: () => particle.destroy()
        });
    }
}

/**
 * Crea trail de partículas (para movimiento)
 */
export function createTrailParticle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number,
    size: number = 6
): void {
    const particle = scene.add.circle(x, y, size, color, 0.6);
    particle.setDepth(350);

    scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
    });
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Fade in con bounce
 */
export function fadeInBounce(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    duration: number = 400
): void {
    const gameObject = target as any;
    gameObject.setAlpha(0);
    gameObject.setScale(0.5);

    scene.tweens.add({
        targets: target,
        alpha: 1,
        scale: 1,
        duration: duration,
        ease: 'Back.easeOut'
    });
}

/**
 * Fade out
 */
export function fadeOut(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    duration: number = 300,
    onComplete?: () => void
): void {
    scene.tweens.add({
        targets: target,
        alpha: 0,
        duration: duration,
        ease: 'Quad.easeIn',
        onComplete: onComplete
    });
}

/**
 * Pulse animation (loop infinito)
 */
export function addPulseAnimation(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    options: {
        scaleFrom?: number;
        scaleTo?: number;
        duration?: number;
    } = {}
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets: target,
        scale: {
            from: options.scaleFrom ?? 1.0,
            to: options.scaleTo ?? 1.1
        },
        duration: options.duration ?? 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}
