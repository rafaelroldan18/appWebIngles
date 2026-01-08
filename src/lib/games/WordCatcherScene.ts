import Phaser from 'phaser';
import { WORD_CATCHER_CONFIG } from './wordCatcher.config';
import type { GameContent, MissionConfig } from '@/types';
import type { GameSessionManager } from './GameSessionManager';

interface WordSprite extends Phaser.GameObjects.Sprite {
    wordData: GameContent;
    parentContainer: Phaser.GameObjects.Container;
    isClicked?: boolean;
}

export class WordCatcherScene extends Phaser.Scene {
    private words: GameContent[] = [];
    private activeWords: WordSprite[] = [];
    private score: number = 0;
    private timeRemaining: number = 0;
    private sessionManager: GameSessionManager | null = null;
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: MissionConfig | null = null;

    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private correctText!: Phaser.GameObjects.Text;
    private pauseOverlay!: Phaser.GameObjects.Container;

    // Game state
    private gameTimer!: Phaser.Time.TimerEvent;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private isGameOver: boolean = false;
    private isPaused: boolean = false;
    private wordIndex: number = 0;

    constructor() {
        super({ key: 'WordCatcherScene' });
    }

    init(data: {
        words: GameContent[];
        sessionManager: GameSessionManager;
        missionTitle?: string;
        missionInstructions?: string;
        missionConfig?: MissionConfig;
    }) {
        this.words = data.words || [];
        this.sessionManager = data.sessionManager || null;
        this.missionTitle = data.missionTitle || '';
        this.missionInstructions = data.missionInstructions || '';
        this.missionConfig = data.missionConfig || null;

        this.score = 0;
        this.timeRemaining = this.missionConfig?.time_limit_seconds || WORD_CATCHER_CONFIG.gameplay.gameDuration;
        this.isGameOver = false;
        this.isPaused = false;
        this.wordIndex = 0;
        this.activeWords = [];
    }

    preload() {
        // Elementos del Juego
        this.load.image('item_correct', '/assets/games/word-catcher/items/computer.png');
        this.load.image('item_wrong', '/assets/games/word-catcher/items/cd.png');
        this.load.image('background', '/assets/games/word-catcher/background.png');

        // UI Assets (Kenney Pack)
        this.load.image('spark', '/assets/common/ui/star.png');
        this.load.image('ui_panel', '/assets/common/ui/panel_blue.png');
        this.load.image('hud_banner', '/assets/common/ui/button_blue.png');
        this.load.image('pause_icon', '/assets/common/ui/pause_icon.png');
    }

    create() {
        try {
            const { width, height } = this.cameras.main;

            // 1. Fondo Escalado Profesional
            const bg = this.add.image(width / 2, height / 2, 'background');
            const scale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(scale).setScrollFactor(0);

            // 2. HUD Estilizado (Neon Style)
            this.createStandardHUD();

            // 3. Sistema de Pausa
            this.createPauseOverlay();

            // 4. Inputs
            this.input.on('gameobjectdown', this.onWordClicked, this);
            this.input.keyboard?.on('keydown-P', () => this.togglePause());

            // 5. Inicio con Cuenta Regresiva
            this.startCountdown();

            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[WordCatcher] Error en Create:', error);
        }
    }

    private createStandardHUD() {
        const { width } = this.cameras.main;
        const hudDepth = 1000;
        const config = WORD_CATCHER_CONFIG.visual;

        // Banner Superior mejorado con gradiente y borde
        const bannerBg = this.add.rectangle(width / 2, 40, width * 0.96, 70, 0x0f172a, 0.95)
            .setDepth(hudDepth)
            .setStrokeStyle(2, 0x3b82f6, 0.6);

        // Efecto de brillo sutil en el banner
        const bannerGlow = this.add.rectangle(width / 2, 40, width * 0.96, 2, 0x60a5fa, 0.3)
            .setDepth(hudDepth + 0.5);

        // Iconos decorativos para mejor UX
        const scoreIcon = this.add.text(width * 0.12, 40, '⭐', {
            fontSize: '20px'
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        // Score con mejor diseño
        this.scoreText = this.add.text(width * 0.15, 40, 'SCORE: 0', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: config.scoreColor,
            stroke: config.textShadow,
            strokeThickness: 5,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        // Timer con diseño destacado
        const timerIcon = this.add.text(width / 2 - 50, 40, '⏱️', {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        this.timerText = this.add.text(width / 2, 40, `${this.timeRemaining}`, {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: config.timerColor,
            stroke: config.textShadow,
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        // Animación pulsante para el timer
        this.tweens.add({
            targets: this.timerText,
            scale: { from: 1, to: 1.05 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Contador de capturas mejorado
        const caughtIcon = this.add.text(width * 0.78, 40, '🎯', {
            fontSize: '18px'
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        this.correctText = this.add.text(width * 0.82, 40, 'CAUGHT: 0', {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: config.correctCountColor,
            stroke: config.textShadow,
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        // Botón de Pausa mejorado con efecto hover
        const pauseBtn = this.add.image(width - 50, 40, 'pause_icon')
            .setScale(0.85)
            .setTint(0x60a5fa)
            .setDepth(hudDepth + 1);

        // Círculo de fondo para el botón de pausa
        const pauseBtnBg = this.add.circle(width - 50, 40, 20, 0x1e293b, 0.8)
            .setDepth(hudDepth)
            .setStrokeStyle(2, 0x3b82f6, 0.5);

        pauseBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, pauseBtn.width, pauseBtn.height), Phaser.Geom.Rectangle.Contains);

        pauseBtn.on('pointerdown', () => {
            console.log('Pause button clicked');
            this.togglePause();
        });

        // Hover effects mejorados
        pauseBtn.on('pointerover', () => {
            pauseBtn.setScale(0.95).setTint(0x93c5fd);
            pauseBtnBg.setFillStyle(0x3b82f6, 0.3);
        });
        pauseBtn.on('pointerout', () => {
            pauseBtn.setScale(0.85).setTint(0x60a5fa);
            pauseBtnBg.setFillStyle(0x1e293b, 0.8);
        });

        // Botón de Ayuda "?" si está habilitado
        if (this.missionConfig?.hud_help_enabled) {
            const helpBtnX = width - 100;
            const helpBtnBg = this.add.circle(helpBtnX, 40, 20, 0x1e293b, 0.8)
                .setDepth(hudDepth)
                .setStrokeStyle(2, 0x8b5cf6, 0.5);

            const helpText = this.add.text(helpBtnX, 40, '?', {
                fontSize: '22px',
                fontFamily: 'Arial Black',
                color: '#a78bfa'
            }).setOrigin(0.5).setDepth(hudDepth + 1);

            helpText.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);

            helpText.on('pointerdown', () => {
                this.showHelpPanel();
            });

            helpText.on('pointerover', () => {
                helpText.setScale(1.2).setColor('#c4b5fd');
                helpBtnBg.setFillStyle(0x8b5cf6, 0.3);
            });
            helpText.on('pointerout', () => {
                helpText.setScale(1).setColor('#a78bfa');
                helpBtnBg.setFillStyle(0x1e293b, 0.8);
            });
        }

        // Sub-banner de misión
        const missionLabel = this.missionTitle || 'CATCH THE CORRECT WORDS!';
        const missionBg = this.add.rectangle(width / 2, 88, 500, 32, 0x1e293b, 0.7)
            .setOrigin(0.5)
            .setDepth(hudDepth)
            .setStrokeStyle(1, 0x3b82f6, 0.4);

        const missionText = this.add.text(width / 2, 88, `🎮 MISSION: ${missionLabel.toUpperCase()} 🎮`, {
            fontSize: '15px',
            fontFamily: 'Arial Black',
            color: '#e2e8f0',
            stroke: config.textShadow,
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        // Animación sutil para el texto de misión
        this.tweens.add({
            targets: missionText,
            alpha: { from: 0.8, to: 1 },
            duration: 1500,
            yayo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createPauseOverlay() {
        const { width, height } = this.cameras.main;
        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false);

        // Dark dimmer (consumes clicks to block game interaction)
        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
        dim.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        dim.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Block click propagation - pero no bloqueamos si es en el botón
            pointer.event.stopPropagation();
        });

        // Kenney Panel
        const panel = this.add.image(width / 2, height / 2, 'ui_panel')
            .setDisplaySize(400, 300);

        const title = this.add.text(width / 2, height / 2 - 80, 'PAUSED', {
            fontSize: '42px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        const subtitle = this.add.text(width / 2, height / 2, 'Game Paused', {
            fontSize: '20px', fontFamily: 'Arial', color: '#eeeeee', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        // Resume Button - crear directamente sin container anidado para evitar problemas de interacción
        const resumeBtn = this.createButton(width / 2, height / 2 + 80, 'RESUME', () => {
            this.togglePause();
        });

        // Asegurar que el botón esté por encima del dimmer
        resumeBtn.setDepth(2001);

        this.pauseOverlay.add([dim, panel, title, subtitle, resumeBtn]);
    }

    private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);

        // 180x50 Button
        const width = 180;
        const height = 50;

        // Use hud_banner as button background
        const bg = this.add.image(0, 0, 'hud_banner')
            .setDisplaySize(width, height);

        // Explicit interactive area on the background image - usar hitArea más grande
        const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        const label = this.add.text(0, 0, text, {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        container.add([bg, label]);

        // Event listeners on the background image directly - usar pointerup en lugar de pointerdown para mejor compatibilidad
        bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Prevenir que el evento se propague al dimmer
            pointer.event.stopPropagation();

            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        });

        // También agregar pointerup como respaldo
        bg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            callback();
        });

        bg.on('pointerover', () => {
            bg.setTint(0xdddddd);
            bg.setScale(1.05);
        });

        bg.on('pointerout', () => {
            bg.clearTint();
            bg.setScale(1);
        });

        // cursor
        bg.input!.cursor = 'pointer';

        // Asegurar que el container también sea interactivo
        container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
        container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            callback();
        });

        return container;
    }

    private togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);

        if (this.isPaused) {
            this.pauseGame();
        } else {
            this.resumeGame();
        }
    }

    private pauseGame() {
        this.gameTimer.paused = true;
        this.spawnTimer.paused = true;
        this.tweens.pauseAll();
    }

    private resumeGame() {
        this.gameTimer.paused = false;
        this.spawnTimer.paused = false;
        this.tweens.resumeAll();
    }

    private showHelpPanel() {
        if (this.isGameOver) return;

        const wasPaused = this.isPaused;
        if (!wasPaused) this.togglePause();

        const { width, height } = this.cameras.main;
        const helpOverlay = this.add.container(0, 0).setDepth(3000);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
        dim.setInteractive();

        const panel = this.add.image(width / 2, height / 2, 'ui_panel')
            .setDisplaySize(500, 400);

        const title = this.add.text(width / 2, height / 2 - 140, 'MISIÓN', {
            fontSize: '32px', fontFamily: 'Arial Black', color: '#ffffff'
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2, this.missionInstructions || 'No hay instrucciones específicas.', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 400 }
        }).setOrigin(0.5);

        const closeBtn = this.createButton(width / 2, height / 2 + 130, 'ENTENDIDO', () => {
            helpOverlay.destroy();
            if (!wasPaused) this.togglePause();
        });

        helpOverlay.add([dim, panel, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        const config = WORD_CATCHER_CONFIG.visual;
        let count = 3;

        // Fondo semitransparente para el countdown
        const countdownBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
            .setDepth(1500);

        const countText = this.add.text(width / 2, height / 2, '3', {
            fontSize: '140px',
            fontFamily: 'Arial Black',
            color: config.scoreColor,
            stroke: config.textShadow,
            strokeThickness: 15,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(1501);

        // Círculo de pulso alrededor del número
        const pulseCircle = this.add.circle(width / 2, height / 2, 100, 0x3b82f6, 0.3)
            .setDepth(1500);

        this.time.addEvent({
            delay: 1000, repeat: 3,
            callback: () => {
                count--;
                if (count > 0) {
                    countText.setText(count.toString());
                    // Animación de pulso
                    this.tweens.add({
                        targets: countText,
                        scale: { from: 1, to: 1.3 },
                        duration: 200,
                        yoyo: true,
                        ease: 'Back.easeOut'
                    });
                    this.tweens.add({
                        targets: pulseCircle,
                        radius: { from: 100, to: 200 },
                        alpha: { from: 0.3, to: 0 },
                        duration: 500,
                        onComplete: () => {
                            pulseCircle.setRadius(100).setAlpha(0.3);
                        }
                    });
                    this.cameras.main.shake(150, 0.015);
                } else if (count === 0) {
                    countText.setText('GO!').setColor(config.wordCorrectColor);
                    // Animación final
                    this.tweens.add({
                        targets: countText,
                        scale: { from: 1, to: 1.5 },
                        duration: 300,
                        ease: 'Back.easeOut'
                    });
                    this.tweens.add({
                        targets: pulseCircle,
                        radius: { from: 100, to: 300 },
                        alpha: { from: 0.3, to: 0 },
                        duration: 600
                    });
                    this.cameras.main.shake(200, 0.02);
                } else {
                    countText.destroy();
                    countdownBg.destroy();
                    pulseCircle.destroy();
                    this.startGameplay();
                }
            }
        });
    }

    private startGameplay() {
        this.gameTimer = this.time.addEvent({
            delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true
        });
        this.spawnTimer = this.time.addEvent({
            delay: WORD_CATCHER_CONFIG.gameplay.wordSpawnInterval,
            callback: this.spawnWord, callbackScope: this, loop: true
        });
        this.spawnWord();
    }

    private updateTimer() {
        if (this.isPaused) return;
        this.timeRemaining--;
        this.timerText.setText(`${this.timeRemaining}`);

        // Efectos visuales cuando queda poco tiempo
        if (this.timeRemaining <= 10) {
            this.timerText.setColor('#ef4444');
            // Animación de advertencia
            if (this.timeRemaining % 2 === 0) {
                this.tweens.add({
                    targets: this.timerText,
                    scale: { from: 1, to: 1.2 },
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
            // Efecto de pulso en el fondo del timer
            const timerBg = this.add.circle(this.cameras.main.width / 2, 40, 30, 0xef4444, 0.2)
                .setDepth(999);
            this.tweens.add({
                targets: timerBg,
                alpha: 0,
                scale: 1.5,
                duration: 500,
                onComplete: () => timerBg.destroy()
            });
        }
        if (this.timeRemaining <= 0) this.endGame();
    }

    private spawnWord() {
        if (this.isGameOver || this.isPaused) return;

        const wordData = this.words[this.wordIndex % this.words.length];
        this.wordIndex++;
        const config = WORD_CATCHER_CONFIG.visual;

        const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
        const container = this.add.container(x, -70).setDepth(1);

        const texture = wordData.is_correct ? 'item_correct' : 'item_wrong';
        const sprite = this.add.sprite(0, 0, texture).setScale(1.5) as WordSprite;

        // Efecto de sombra para el sprite
        const shadow = this.add.circle(0, 5, sprite.width * 0.4, 0x000000, 0.3)
            .setDepth(0);

        // Glow effect basado en si es correcto o incorrecto
        const glowColor = wordData.is_correct ? 0x10b981 : 0xef4444;
        const glow = this.add.circle(0, 0, sprite.width * 0.6, glowColor, 0.2)
            .setDepth(0.5);

        // Texto mejorado con mejor contraste
        const wordText = this.add.text(0, -10, wordData.content_text, {
            fontSize: String(config.fontSize) + 'px',
            fontFamily: config.fontFamily,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(2);

        // Indicador visual de tipo (correcto/incorrecto)
        const indicator = this.add.circle(0, -sprite.height * 0.4, 8, glowColor, 1)
            .setDepth(2);

        container.add([shadow, glow, sprite, wordText, indicator]);
        sprite.setInteractive({ useHandCursor: true });
        sprite.wordData = wordData;
        sprite.parentContainer = container;

        // Animación de entrada suave
        container.setAlpha(0).setScale(0.8);
        this.tweens.add({
            targets: container,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Animación de pulso sutil para palabras correctas
        if (wordData.is_correct) {
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.2, to: 0.4 },
                scale: { from: 1, to: 1.1 },
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Fall animation mejorada
        this.tweens.add({
            targets: container,
            y: this.cameras.main.height + 100,
            angle: { from: -3, to: 3 }, // Rotación más suave
            duration: 6000 / WORD_CATCHER_CONFIG.gameplay.wordFallSpeed,
            ease: 'Linear',
            onComplete: () => {
                if (!this.isGameOver && container.active) {
                    this.onWordMissed(sprite);
                    container.destroy();
                }
            }
        });

        // Sway animation (Wind effect) mejorada
        this.tweens.add({
            targets: container,
            x: container.x + Phaser.Math.Between(-35, 35),
            duration: Phaser.Math.Between(2000, 3000),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Hover effect mejorado
        sprite.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scale: 1.1,
                duration: 150,
                ease: 'Back.easeOut'
            });
            glow.setAlpha(0.4);
        });

        sprite.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 150,
                ease: 'Back.easeIn'
            });
            glow.setAlpha(0.2);
        });

        this.activeWords.push(sprite);
    }

    private onWordClicked(pointer: Phaser.Input.Pointer, gameObject: any) {
        if (this.isPaused || this.isGameOver) return;
        const sprite = gameObject as WordSprite;
        if (!sprite.wordData || sprite.isClicked) return;

        sprite.isClicked = true;
        if (sprite.wordData.is_correct) this.handleCorrectCatch(sprite);
        else this.handleWrongCatch(sprite);
    }

    private handleCorrectCatch(sprite: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.correctCatch;
        this.score += points;
        this.sessionManager?.updateScore(points, true);
        this.sessionManager?.recordItem({
            id: sprite.wordData.content_id,
            text: sprite.wordData.content_text,
            result: 'correct',
            user_input: sprite.wordData.content_text,
            correct_answer: sprite.wordData.content_text,
            time_ms: 0 // Simplificado
        });

        const container = sprite.parentContainer;
        const config = WORD_CATCHER_CONFIG.visual;

        // Partículas mejoradas con múltiples efectos
        const mainEmitter = this.add.particles(container.x, container.y, 'spark', {
            speed: { min: 150, max: 300 },
            scale: { start: 1.8, end: 0 },
            lifespan: 800,
            quantity: 30,
            blendMode: 'ADD',
            tint: 0x10b981,
            angle: { min: 0, max: 360 }
        });

        // Partículas secundarias más pequeñas
        const sparkEmitter = this.add.particles(container.x, container.y, 'spark', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.8, end: 0 },
            lifespan: 500,
            quantity: 15,
            blendMode: 'SCREEN',
            tint: 0x34d399
        });

        this.time.delayedCall(600, () => {
            mainEmitter.destroy();
            sparkEmitter.destroy();
        });

        // Efecto de explosión visual mejorado
        const explosion = this.add.circle(container.x, container.y, 0, 0x10b981, 0.6)
            .setDepth(50);

        this.tweens.add({
            targets: explosion,
            radius: 80,
            alpha: 0,
            duration: 400,
            onComplete: () => explosion.destroy()
        });

        // Animación de captura mejorada con rotación
        this.tweens.add({
            targets: container,
            scale: 2.2,
            alpha: 0,
            angle: 360,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.removeWord(sprite);
                container.destroy();
            }
        });

        // Feedback visual en el score
        this.tweens.add({
            targets: this.scoreText,
            scale: { from: 1, to: 1.2 },
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        });

        this.showFloatingText(container.x, container.y, `+${points}`, config.wordCorrectColor);
        this.updateUI_Stats();
    }

    private handleWrongCatch(sprite: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.wrongCatch;
        this.score += points;
        this.sessionManager?.updateScore(points, false);
        this.sessionManager?.recordItem({
            id: sprite.wordData.content_id,
            text: sprite.wordData.content_text,
            result: 'wrong',
            user_input: sprite.wordData.content_text,
            correct_answer: this.words.find(w => w.is_correct)?.content_text || '',
            time_ms: 0
        });

        const container = sprite.parentContainer;
        const config = WORD_CATCHER_CONFIG.visual;

        // Shake mejorado
        this.cameras.main.shake(200, 0.01);
        sprite.setTint(0xef4444);

        // Partículas de error
        const errorEmitter = this.add.particles(container.x, container.y, 'spark', {
            speed: { min: 100, max: 250 },
            scale: { start: 1.2, end: 0 },
            lifespan: 500,
            quantity: 20,
            blendMode: 'NORMAL',
            tint: 0xef4444,
            angle: { min: 180, max: 360 }
        });

        this.time.delayedCall(500, () => errorEmitter.destroy());

        // Efecto de rechazo visual
        const rejectGlow = this.add.circle(container.x, container.y, 0, 0xef4444, 0.5)
            .setDepth(50);

        this.tweens.add({
            targets: rejectGlow,
            radius: 60,
            alpha: 0,
            duration: 300,
            onComplete: () => rejectGlow.destroy()
        });

        // Animación de rechazo mejorada (shake + fade)
        this.tweens.add({
            targets: container,
            x: container.x + 20,
            yoyo: true,
            repeat: 5,
            duration: 50,
            ease: 'Power2',
            onComplete: () => {
                this.tweens.add({
                    targets: container,
                    alpha: 0,
                    scale: 0.3,
                    angle: -45,
                    duration: 250,
                    ease: 'Power2',
                    onComplete: () => {
                        this.removeWord(sprite);
                        container.destroy();
                    }
                });
            }
        });

        this.showFloatingText(container.x, container.y, `${points}`, config.wordIncorrectColor);
        this.updateUI_Stats();
    }

    private onWordMissed(sprite: WordSprite) {
        if (sprite.isClicked) return;
        if (sprite.wordData.is_correct) {
            const points = WORD_CATCHER_CONFIG.scoring.missedWord;
            this.score += points;
            this.sessionManager?.updateScore(points, false);
            this.showFloatingText(sprite.parentContainer.x, this.cameras.main.height - 60, 'MISSED!', '#ff0000');
        }
        this.removeWord(sprite);
        this.updateUI_Stats();
    }

    private removeWord(sprite: WordSprite) {
        const index = this.activeWords.indexOf(sprite);
        if (index > -1) this.activeWords.splice(index, 1);
        sprite.destroy();
    }

    private showFloatingText(x: number, y: number, text: string, color: string) {
        const config = WORD_CATCHER_CONFIG.visual;
        const fText = this.add.text(x, y, text, {
            fontSize: '42px',
            fontFamily: 'Arial Black',
            color,
            stroke: config.textShadow,
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 8, stroke: true, fill: true }
        }).setOrigin(0.5).setDepth(100);

        // Animación mejorada con escala y rotación
        this.tweens.add({
            targets: fText,
            y: y - 120,
            alpha: 0,
            scale: { from: 1, to: 1.3 },
            angle: { from: 0, to: 10 },
            duration: 1400,
            ease: 'Power2',
            onComplete: () => fText.destroy()
        });
    }

    private updateUI_Stats() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        if (this.sessionManager) {
            const data = this.sessionManager.getSessionData();
            this.correctText.setText(`CAUGHT: ${data.correctCount}`);
        }
    }

    private async endGame() {
        this.isGameOver = true;
        this.gameTimer.remove();
        this.spawnTimer.remove();
        this.activeWords.forEach(w => w.parentContainer?.destroy());

        // Save session
        const sessionData = this.sessionManager ? this.sessionManager.getSessionData() : { correctCount: 0, wrongCount: 0 };

        const { width, height } = this.cameras.main;
        const config = WORD_CATCHER_CONFIG.visual;

        // 1. Dark Overlay Fade In mejorado
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0).setDepth(3000);
        this.tweens.add({ targets: overlay, alpha: 0.85, duration: 600, ease: 'Power2' });

        // 2. Scoreboard Panel mejorado con diseño moderno
        const panelContainer = this.add.container(width / 2, height / 2).setDepth(3001).setScale(0);

        // Fondo del panel con gradiente y borde
        const boardBg = this.add.rectangle(0, 0, 550, 450, 0x0f172a, 0.95)
            .setStrokeStyle(3, 0x3b82f6, 0.8);

        // Efecto de brillo en el borde superior
        const boardGlow = this.add.rectangle(0, -200, 550, 4, 0x3b82f6, 0.6);

        const board = this.add.image(0, 0, 'ui_panel').setDisplaySize(550, 450).setAlpha(0.9);

        // Título mejorado con icono
        const titleIcon = this.add.text(0, -180, '🏆', {
            fontSize: '50px'
        }).setOrigin(0.5);

        const title = this.add.text(0, -150, 'MISSION COMPLETE', {
            fontSize: '42px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: config.textShadow,
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 8, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Línea decorativa
        const divider = this.add.rectangle(0, -100, 400, 2, 0x3b82f6, 0.5);

        // Stats mejoradas con iconos
        const scoreLabel = this.add.text(0, -50, `FINAL SCORE`, {
            fontSize: '22px',
            color: '#cbd5e1',
            fontFamily: 'Arial',
            stroke: config.textShadow,
            strokeThickness: 2
        }).setOrigin(0.5);

        const scoreValue = this.add.text(0, 10, `${this.score}`, {
            fontSize: '72px',
            color: config.timerColor,
            fontFamily: 'Arial Black',
            stroke: config.textShadow,
            strokeThickness: 8,
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Animación pulsante para el score
        this.tweens.add({
            targets: scoreValue,
            scale: { from: 1, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Estadísticas con mejor diseño
        const statsContainer = this.add.container(0, 100);

        const correctIcon = this.add.text(-120, 0, '✅', { fontSize: '24px' }).setOrigin(0.5);
        const correctLabel = this.add.text(-100, 0, `Correct: ${sessionData.correctCount}`, {
            fontSize: '22px',
            color: config.wordCorrectColor,
            fontFamily: 'Arial Black',
            stroke: config.textShadow,
            strokeThickness: 3
        }).setOrigin(0.5);

        const wrongIcon = this.add.text(120, 0, '❌', { fontSize: '24px' }).setOrigin(0.5);
        const wrongLabel = this.add.text(100, 0, `Missed: ${sessionData.wrongCount}`, {
            fontSize: '22px',
            color: config.wordIncorrectColor,
            fontFamily: 'Arial Black',
            stroke: config.textShadow,
            strokeThickness: 3
        }).setOrigin(0.5);

        statsContainer.add([correctIcon, correctLabel, wrongIcon, wrongLabel]);

        panelContainer.add([boardBg, boardGlow, board, titleIcon, title, divider, scoreLabel, scoreValue, statsContainer]);

        // Animación mejorada de entrada
        this.tweens.add({
            targets: panelContainer,
            scale: 1,
            duration: 800,
            ease: 'Back.out',
            onStart: () => {
                this.cameras.main.shake(300, 0.02);
            }
        });

        // 3. Confetti Effect mejorado con múltiples colores
        const confettiEmitter = this.add.particles(0, -200, 'spark', {
            x: width / 2,
            y: height / 2,
            speed: { min: 150, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: 2500,
            quantity: 80,
            blendMode: 'ADD',
            tint: [0x60a5fa, 0x10b981, 0xfbbf24, 0xef4444, 0xa78bfa]
        });
        confettiEmitter.setDepth(3000);

        // Efecto de ondas concéntricas
        const wave1 = this.add.circle(width / 2, height / 2, 0, 0x3b82f6, 0.3)
            .setDepth(2999);
        const wave2 = this.add.circle(width / 2, height / 2, 0, 0x10b981, 0.2)
            .setDepth(2999);

        this.tweens.add({
            targets: wave1,
            radius: { from: 0, to: 400 },
            alpha: { from: 0.3, to: 0 },
            duration: 1000,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: wave2,
            radius: { from: 0, to: 500 },
            alpha: { from: 0.2, to: 0 },
            duration: 1200,
            delay: 200,
            ease: 'Power2'
        });

        // 4. Emit Event Delay
        this.time.delayedCall(3000, () => {
            const sessionData = this.sessionManager?.getSessionData();
            this.events.emit('gameOver', {
                scoreRaw: this.score,
                correctCount: sessionData?.correctCount || 0,
                wrongCount: sessionData?.wrongCount || 0,
                durationSeconds: this.sessionManager?.getDuration() || 0,
                answers: sessionData?.items.map(item => ({
                    item_id: item.id,
                    prompt: item.text,
                    student_answer: item.user_input || '',
                    correct_answer: item.correct_answer || '',
                    is_correct: item.result === 'correct',
                    meta: { time_ms: item.time_ms }
                })) || []
            });
        });
    }
}