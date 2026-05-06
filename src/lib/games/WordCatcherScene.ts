import * as Phaser from 'phaser';
import { gsap } from 'gsap';
import { WORD_CATCHER_CONFIG, resolveWordCatcherConfig } from './wordCatcher.config';
import { preloadCommonAndGame } from './assets/assetLoader';
import { ASSET_MANIFEST } from './assets/manifest';
import { GameHUD } from './GameHUD';
import { createButton, createPanel, showGlow, showImpactParticles, showFullscreenRequest, showGameInstructions } from './UIKit';
import { buildGameDataset, type PreparedGameItem, type GameDataset } from './gameLoader.utils';
import { AnswerTracker } from './answerTracker';
import { loadGameAudio } from './AudioLoader';
import { SoundManager } from './SoundManager';
import type { GameContent, MissionConfig } from '@/types/game.types';
import type { GameSessionManager } from './GameSessionManager';
import { createPremiumWordToken, createWordCatcherPanel, WORD_CATCHER_THEME } from './WordCatcherTheme';
import { showCorrectFeedback, showWrongFeedback, createTrailParticle } from './VisualEffects';

interface WordSprite extends Phaser.GameObjects.Container {
    wordData: PreparedGameItem;
    baseSprite: Phaser.GameObjects.Image;
    wordText: Phaser.GameObjects.Text;
    isClicked?: boolean;
}

export class WordCatcherScene extends Phaser.Scene {
    // Game data
    private gameDataset!: GameDataset;
    private answerTracker!: AnswerTracker;
    private activeWords: WordSprite[] = [];
    private wordIndex: number = 0;
    private wordsCompleted: number = 0; // Track how many words have been caught or missed
    private soundManager!: SoundManager;

    // Game state
    private score: number = 0;
    private timeElapsed: number = 0; // Changed from timeRemaining to timeElapsed (counts UP)
    private isGameOver: boolean = false;
    private isPaused: boolean = false;
    private gameStartTime: number = 0;

    // Configuration
    private sessionManager: GameSessionManager | null = null;
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: MissionConfig | null = null;
    private resolvedConfig: any = null;
    private translations: any = null;

    // UI Elements
    private gameHUD!: GameHUD;
    private correctText!: Phaser.GameObjects.Text;
    private caughtPanel!: Phaser.GameObjects.GameObject;
    private pauseOverlay!: Phaser.GameObjects.Container;
    private helpOverlay: Phaser.GameObjects.Container | null = null;
    private missionCompleteContainer: Phaser.GameObjects.Container | null = null;
    private missionCompleteDimmer: Phaser.GameObjects.Rectangle | null = null;

    // Visual Elements
    private backgroundGradient!: Phaser.GameObjects.Graphics;
    private globalBorder!: Phaser.GameObjects.Graphics;
    private floatingParticles: Phaser.GameObjects.Graphics[] = [];

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private countdownText: Phaser.GameObjects.Text | null = null;

    constructor() {
        super({ key: 'WordCatcherScene' });
    }

    // Data for restart
    private initData: any = null;

    init(data: {
        words: GameContent[];
        sessionManager: GameSessionManager;
        missionTitle?: string;
        missionInstructions?: string;
        missionConfig?: MissionConfig;
        translations?: any;
    }) {
        this.initData = data;
        this.translations = data.translations || null;
        this.sessionManager = data.sessionManager || null;
        this.missionTitle = data.missionTitle || '';
        this.missionInstructions = data.missionInstructions || '';
        this.missionConfig = data.missionConfig || null;

        this.resolvedConfig = resolveWordCatcherConfig(this.missionConfig);

        this.gameDataset = buildGameDataset(
            data.words || [],
            this.missionConfig || {
                difficulty: 'medio',
                time_limit_seconds: 60,
                content_constraints: { items: 12, distractors_percent: 30 },
                asset_pack: 'kenney-ui-1',
                hud_help_enabled: true
            }
        );

        this.answerTracker = new AnswerTracker();

        this.score = 0;
        this.timeElapsed = 0; // Start at 0 and count UP
        this.isGameOver = false;
        this.isPaused = false;
        this.wordIndex = 0;
        this.wordsCompleted = 0;
        this.activeWords = [];
        this.gameStartTime = Date.now();
    }

    preload() {
        preloadCommonAndGame(this, 'word-catcher', ASSET_MANIFEST);
        loadGameAudio(this, 'wc');
        // 🎨 Ya no usamos imagen de fondo, ahora es gradiente generado
        // this.load.image('wc_bg_fixed', '/assets/backgrounds/word-catcher/bg_soft.png');
    }

    create() {
        try {
            const { width, height } = this.cameras.main;
            this.soundManager = new SoundManager(this);

            // 🎨 FONDO REDISEÑADO: Gradiente animado moderno
            this.createAnimatedBackground();

            // 🎨 BORDE GLOBAL DEL JUEGO
            this.createGlobalBorder();

            // 2) HUD
            this.configureHUD();

            // 3) Pausa
            this.createPauseOverlay();

            // 4) Inputs
            this.input.on('gameobjectdown', this.onWordClicked, this);
            this.input.keyboard?.on('keydown-P', () => this.togglePause());

            // 5) Resize Listener para Pantalla Completa
            this.scale.on('resize', this.onResize, this);

            // 6) Tutorial + Start Flow (Combines Fullscreen + Instructions)
            this.isPaused = true;
            showGameInstructions(this, {
                title: 'Word Catcher',
                instructions: this.missionInstructions || 'Catch the correct words falling from the sky! Each correct word adds 10 points.',
                controls: 'Click or Tap on falling items to catch them.\n\n• PAUSE (⏸): Pause the game\n• HELP (?): View instructions',
                controlIcons: ['mouse'],
                requestFullscreen: true,
                buttonLabel: 'START PLAYING',
                onStart: () => {
                    this.isPaused = false;
                    this.startCountdown();
                }
            });

            // 6) Textura para partículas
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('generic-particle', 8, 8);

            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[WordCatcher] Error en Create:', error);
        }
    }

    /**
     * 🎨 Crea un fondo animado con gradiente moderno y partículas flotantes
     */
    private createAnimatedBackground() {
        const { width, height } = this.cameras.main;
        const theme = WORD_CATCHER_THEME;

        // Limpiar elementos previos
        if (this.backgroundGradient) this.backgroundGradient.destroy();
        this.floatingParticles.forEach(p => {
            gsap.killTweensOf(p);
            p.destroy();
        });
        this.floatingParticles = [];

        // 1. FONDO BASE: Gradiente profundo
        this.backgroundGradient = this.add.graphics();
        this.backgroundGradient.setDepth(0);
        this.backgroundGradient.fillGradientStyle(
            0x0B0F1A, 0x0B0F1A, // Top: Casi negro
            0x1A0F2E, 0x1A0F2E, // Bottom: Indigo profundo
            1
        );
        this.backgroundGradient.fillRect(0, 0, width, height);

        // 2. NEBULOSAS ULTRA-SUTILES (Solo 2 blobs para evitar distracción)
        const colors = [0x6366F1, 0x8B5CF6];
        for (let i = 0; i < 2; i++) {
            const blob = this.add.graphics();
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(300, 500);

            blob.fillStyle(colors[i], 0.01); // 1% de opacidad (casi invisible)
            blob.fillCircle(0, 0, size);
            blob.setPosition(x, y);
            blob.setDepth(1);

            // Movimiento casi imperceptible (1 a 2 minutos por ciclo)
            gsap.to(blob, {
                x: x + Phaser.Math.Between(-40, 40),
                y: y + Phaser.Math.Between(-40, 40),
                duration: Phaser.Math.Between(60, 120),
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });

            this.floatingParticles.push(blob);
        }

        // 3. ESTRELLAS ESTÁTICAS (Titulantes extremadamente lentas)
        for (let i = 0; i < 35; i++) {
            const star = this.add.graphics();
            const x = Phaser.Math.Between(20, width - 20);
            const y = Phaser.Math.Between(20, height - 20);
            const size = Phaser.Math.FloatBetween(0.4, 1.2);

            star.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.1, 0.3));
            star.fillCircle(0, 0, size);
            star.setPosition(x, y);
            star.setDepth(2);

            // Respiración muy lenta (10 a 25 segundos)
            gsap.to(star, {
                alpha: 0.05,
                duration: Phaser.Math.Between(10, 25),
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: Phaser.Math.Between(0, 15)
            });

            this.floatingParticles.push(star);
        }

        // 4. POLVO CÓSMICO (Muy pocos elementos y lentos)
        for (let i = 0; i < 8; i++) {
            const dust = this.add.graphics();
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(2, 4);
            const color = 0x818CF8;

            dust.fillStyle(color, 0.1);
            dust.fillCircle(0, 0, size);
            dust.setPosition(x, y);
            dust.setDepth(3);

            // Deriva espacial ultra-lenta (40 a 80 segundos)
            const duration = Phaser.Math.Between(40, 80);
            gsap.to(dust, {
                y: y - 200,
                x: x + Phaser.Math.Between(-20, 20),
                alpha: 0,
                duration: duration,
                repeat: -1,
                ease: 'linear',
                onRepeat: () => {
                    dust.setPosition(Phaser.Math.Between(0, width), height + 20);
                    dust.setAlpha(0.1);
                }
            });

            this.floatingParticles.push(dust);
        }
    }

    /**
     * Crea un borde de neón alrededor de todo el juego para enmarcarlo
     */
    private createGlobalBorder() {
        const { width, height } = this.cameras.main;

        if (this.globalBorder) this.globalBorder.destroy();
        const borderThickness = 4;
        const cornerRadius = 12; // Menos redondeado como se solicitó
        const theme = WORD_CATCHER_THEME;

        this.globalBorder = this.add.graphics();
        this.globalBorder.setDepth(25000); // Debajo de los modales (30000) pero encima de todo lo demás
        this.globalBorder.setScrollFactor(0);

        // Neon Glow sutil alrededor de todo
        this.globalBorder.lineStyle(borderThickness + 2, theme.colors.secondary, 0.4);
        this.globalBorder.strokeRoundedRect(
            borderThickness / 2,
            borderThickness / 2,
            width - borderThickness,
            height - borderThickness,
            cornerRadius
        );

        // Borde Principal Uniforme (Indigo unificado con el HUD)
        this.globalBorder.lineStyle(borderThickness, theme.colors.secondary, 1);
        this.globalBorder.strokeRoundedRect(
            borderThickness / 2,
            borderThickness / 2,
            width - borderThickness,
            height - borderThickness,
            cornerRadius
        );

        // Detalle interior muy fino
        this.globalBorder.lineStyle(1, 0xFFFFFF, 0.2);
        this.globalBorder.strokeRoundedRect(
            borderThickness + 1,
            borderThickness + 1,
            width - (borderThickness * 2) - 2,
            height - (borderThickness * 2) - 2,
            cornerRadius - 2
        );
    }

    private onResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Forzar actualización de cámara
        this.cameras.main.setSize(width, height);

        // Re-crear elementos adaptativos
        this.createAnimatedBackground();
        this.createGlobalBorder();

        if (this.gameHUD) {
            this.gameHUD.refreshLayout();
        }

        // Reposicionar panel de 'CAUGHT'
        if (this.caughtPanel) {
            const panelW = Phaser.Math.Clamp(Math.round(width * 0.18), 160, 210);
            (this.caughtPanel as any).setPosition(12 + panelW / 2, 95);
        }

        // Re-crear overlay de pausa si está visible
        if (this.pauseOverlay) {
            const wasVisible = this.pauseOverlay.visible;
            this.pauseOverlay.destroy();
            this.createPauseOverlay();
            this.pauseOverlay.setVisible(wasVisible);
        }

        // Re-crear overlay de ayuda si está activo
        if (this.helpOverlay && this.helpOverlay.active) {
            this.helpOverlay.destroy();
            this.showHelpPanel();
        }

        // Re-posicionar modal de misión completa si existe
        if (this.missionCompleteContainer && this.missionCompleteContainer.active) {
            this.missionCompleteContainer.setPosition(width / 2, height / 2);
            if (this.missionCompleteDimmer) {
                this.missionCompleteDimmer.setPosition(width / 2, height / 2);
                this.missionCompleteDimmer.setDisplaySize(width, height);
            }
        }

        // Reposicionar contador de inicio si está activo
        if (this.countdownText && this.countdownText.active) {
            this.countdownText.setPosition(width / 2, height / 2);
        }
    }

    private configureHUD() {
        const V = WORD_CATCHER_CONFIG.visual;

        this.gameHUD = new GameHUD(this, {
            showTimer: true,
            showLives: false,
            showProgress: false,
            showHelpButton: this.resolvedConfig.hud_help_enabled,
            showPauseButton: true,
            showScore: true
        }, this.soundManager);

        this.gameHUD.onPause(() => this.togglePause());
        this.gameHUD.onHelp(() => this.showHelpPanel());

        this.gameHUD.update({
            score: this.score,
            timeRemaining: this.timeElapsed
        });

        // ---- UI-only: CAUGHT en panel premium, anclado bajo HUD (responsive)
        const { width } = this.cameras.main;

        const hudBottom = 36 + 32;
        const y = hudBottom + 25;

        const panelW = Phaser.Math.Clamp(Math.round(width * 0.18), 160, 210);
        const panelH = 44;

        const panelX = 12 + panelW / 2;

        // Panel Premium Word Catcher
        this.caughtPanel = createWordCatcherPanel(this, panelW, panelH, WORD_CATCHER_THEME.colors.secondary)
            .setDepth(1000)
            .setScrollFactor(0);

        (this.caughtPanel as Phaser.GameObjects.Graphics).setPosition(panelX, y);

        // Texto CAUGHT
        this.correctText = this.add.text(panelX, y, 'CAUGHT: 0', {
            fontSize: '16px',
            fontFamily: 'Nunito',
            color: '#efefef',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
    }

    private buildGamePayload() {
        const stats = this.answerTracker.getStats();
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);

        const totalInteractions = stats.caught + stats.missed + stats.wrong;
        const accuracy = totalInteractions > 0
            ? Math.round((stats.caught / totalInteractions) * 100)
            : 0;

        const perfectCatch = stats.wrong === 0 && stats.caught >= 5;

        // Calcular score normalizado sobre 10 basado en precisión
        // Fórmula: (accuracy / 100) * 10 = nota sobre 10
        const normalizedScore = Math.round((accuracy / 100) * 10 * 10) / 10; // Con 1 decimal

        return {
            score: normalizedScore,           // Nota sobre 10 (ej: 8.5/10)
            scoreRaw: this.score + (perfectCatch ? 500 : 0),  // Puntos brutos (ej: 110 puntos)
            correctCount: stats.caught,
            wrongCount: stats.wrong,
            durationSeconds: duration,
            accuracy: accuracy,
            answers: this.answerTracker.getAnswers().map(ans => ({
                ...ans,
                is_correct: ans.is_correct || (ans as any).result === 'correct'
            })),
            perfectCatch: perfectCatch,
            totalInteractions: totalInteractions
        };
    }

    private endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isPaused = true;
        this.spawnTimer?.remove();
        this.gameTimer?.remove();
        this.soundManager.stopMusic();
        this.soundManager.playSfx('game_win');

        const payload = this.buildGamePayload();
        this.gameHUD.setVisible(false); // Hide HUD to prevent interaction

        this.createMissionCompleteModal({
            caught: payload.correctCount,
            totalInteractions: payload.totalInteractions,
            accuracy: payload.accuracy,
            perfectCatch: payload.perfectCatch,
            eventData: payload
        });
    }

    private createPauseOverlay() {
        const { width, height } = this.cameras.main;

        this.pauseOverlay = this.add.container(0, 0).setDepth(30000).setVisible(false).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x0f172a, 0.98).setOrigin(0).setInteractive();

        // 🎨 MODAL UNIFORME: Tamaño estándar
        const panelW = 400;
        const panelH = 280;

        // 🎨 MODAL UNIFORME: Usando el color secundario (Indigo) para todos
        const panel = createWordCatcherPanel(this, panelW, panelH, WORD_CATCHER_THEME.colors.secondary);
        this.pauseOverlay.add(panel);
        panel.setPosition(width / 2, height / 2);

        // 🎨 TÍTULO UNIFORME: 36px
        const title = this.add.text(width / 2, height / 2 - panelH * 0.32, 'PAUSED', {
            fontSize: '36px',
            fontFamily: 'Nunito',
            color: '#22D3EE',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const { createWCButton } = require('./WordCatcherTheme');

        const resumeBtn = createWCButton(this, width / 2, height / 2 + 20, 200, 55, 'RESUME', WORD_CATCHER_THEME.colors.primary, () => {
            this.togglePause();
        });

        const exitBtn = createWCButton(this, width / 2, height / 2 + 95, 200, 55, 'EXIT', WORD_CATCHER_THEME.colors.error, () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();

            const payload = this.buildGamePayload();

            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error(e));
            }

            this.events.emit('exit', payload);
            this.events.emit('game-exit', payload);
            this.game.events.emit('exit', payload);
            this.game.events.emit('game-exit', payload);
        });

        this.pauseOverlay.add([dim, title, resumeBtn, exitBtn]);
        this.pauseOverlay.sendToBack(dim);
    }

    private createMissionCompleteModal(stats: any) {
        const { width, height } = this.cameras.main;

        // Container at very high depth
        this.missionCompleteContainer = this.add.container(width / 2, height / 2).setDepth(50000).setScrollFactor(0);

        // Backdrop covering EVERYTHING (Scene-level)
        this.missionCompleteDimmer = this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a, 0.98)
            .setInteractive().setScrollFactor(0).setDepth(49999);

        const container = this.missionCompleteContainer;
        const dim = this.missionCompleteDimmer;

        // 🎨 MODAL REDUCIDO
        const panelW = 380;
        const panelH = 340; // Slightly more height for better text spacing

        // 🎨 MODAL UNIFORME: Usando el color secundario (Indigo) para todos
        const panel = createWordCatcherPanel(this, panelW, panelH, WORD_CATCHER_THEME.colors.secondary);
        container.add(panel);

        // 🎨 TÍTULO UNIFORME: 26px
        const title = this.add.text(0, -panelH * 0.36, 'MISSION COMPLETE', {
            fontSize: '26px',
            fontFamily: 'Nunito',
            color: '#FBBF24',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(title);

        const statsStartY = -50;
        const lineHeight = 40;

        // 🎨 TEXTOS UNIFORMES: 20px para stats
        const caughtText = this.add.text(0, statsStartY, `WORDS CAUGHT: ${stats.caught}`, {
            fontSize: '20px',
            fontFamily: 'Nunito',
            color: '#22D3EE',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(caughtText);

        const bonusStatus = stats.perfectCatch ? 'ACTIVE (+500)' : 'INACTIVE';
        const bonusColor = stats.perfectCatch ? '#34D399' : '#94a3b8';
        const bonusText = this.add.text(0, statsStartY + lineHeight, `PERFECT CATCH: ${bonusStatus}`, {
            fontSize: '16px',
            fontFamily: 'Nunito',
            color: bonusColor,
            stroke: '#000000',
            strokeThickness: 2,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(bonusText);

        let rank = 'NOVICE';
        let icon = '🌱';
        if (stats.accuracy >= 90) { rank = 'MASTER'; icon = '👑'; }
        else if (stats.accuracy >= 70) { rank = 'EXPERT'; icon = '🎓'; }
        else if (stats.accuracy >= 50) { rank = 'ROOKIE'; icon = '⭐'; }

        const rankText = this.add.text(0, statsStartY + lineHeight * 2, `RANK: ${icon} ${rank}`, {
            fontSize: '24px',
            fontFamily: 'Nunito',
            color: '#FBBF24',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(rankText);

        const btnY = panelH * 0.28;
        const { createWCButton } = require('./WordCatcherTheme');

        // 🎨 BOTONES PREMIUM ESTILO WC
        const summaryBtn = createWCButton(this, -85, btnY, 160, 50, 'RESULTS', WORD_CATCHER_THEME.colors.secondary, () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();

            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error('End session error', e));
            }

            gsap.to(container, {
                scale: 0,
                duration: 0.3,
                ease: 'back.in',
                onComplete: () => {
                    dim.destroy();
                    this.events.emit('gameOver', stats.eventData);
                    this.events.emit('game-over', stats.eventData);
                    this.events.emit('GAME_OVER', stats.eventData);
                    this.game.events.emit('gameOver', stats.eventData);
                    this.game.events.emit('game-over', stats.eventData);
                    this.game.events.emit('GAME_OVER', stats.eventData);
                }
            });
        });
        container.add(summaryBtn);

        const repeatBtn = createWCButton(this, 85, btnY, 160, 50, 'REPEAT', WORD_CATCHER_THEME.colors.primary, () => {
            gsap.to(container, {
                scale: 0,
                duration: 0.3,
                ease: 'back.in',
                onComplete: () => {
                    dim.destroy();
                    this.spawnTimer?.remove();
                    this.gameTimer?.remove();
                    this.activeWords.forEach(w => w.destroy());
                    this.activeWords = [];

                    if (this.initData) this.scene.restart(this.initData);
                    else this.scene.restart();
                }
            });
        });
        container.add(repeatBtn);

        // 🎨 ANIMACIÓN DE ENTRADA MEJORADA con GSAP
        container.setScale(0);
        container.setAlpha(0);

        gsap.to(container, {
            scale: 1,
            alpha: 1,
            duration: 0.6,
            ease: 'back.out(1.7)'
        });
    }

    private togglePause(showOverlay: boolean = true) {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            if (showOverlay) this.pauseOverlay.setVisible(true);
            if (this.gameTimer) this.gameTimer.paused = true;
            if (this.spawnTimer) this.spawnTimer.paused = true;
            this.tweens.pauseAll();
        } else {
            this.pauseOverlay.setVisible(false);
            if (this.gameTimer) this.gameTimer.paused = false;
            if (this.spawnTimer) this.spawnTimer.paused = false;
            this.tweens.resumeAll();
        }
    }

    private showHelpPanel() {
        const wasPaused = this.isPaused;
        // Pausar el juego PERO sin mostrar el menú de pausa
        if (!this.isPaused) this.togglePause(false);

        const { width, height } = this.cameras.main;

        if (this.helpOverlay) this.helpOverlay.destroy();
        this.helpOverlay = this.add.container(0, 0).setDepth(30000).setScrollFactor(0);

        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a, 0.9).setInteractive().setScrollFactor(0);

        // 🎨 MODAL UNIFORME: Tamaño estándar
        const panelW = 480;
        const panelH = 340;

        // 🎨 MODAL UNIFORME: Usando el color secundario (Indigo) para todos
        const panel = createWordCatcherPanel(this, panelW, panelH, WORD_CATCHER_THEME.colors.secondary);
        panel.setPosition(width / 2, height / 2);

        // 🎨 TÍTULO UNIFORME: 28px
        const title = this.add.text(width / 2, height / 2 - panelH * 0.35, 'INSTRUCTIONS', {
            fontSize: '28px',
            fontFamily: 'Nunito',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 🎨 TEXTO UNIFORME: 18px
        const instructionsText = this.missionInstructions || 'Catch the correct items!';
        const instructions = this.add.text(width / 2, height / 2 - 10, instructionsText, {
            fontSize: '18px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: panelW - 80 },
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 🎨 BOTÓN PREMIUM ESTILO WC
        const { createWCButton } = require('./WordCatcherTheme');
        const closeBtn = createWCButton(this, width / 2, height / 2 + panelH * 0.32, 200, 55, 'READY!', WORD_CATCHER_THEME.colors.primary, () => {
            if (this.helpOverlay) {
                this.helpOverlay.destroy();
                this.helpOverlay = null;
            }
            // Si pausamos nosotros el juego al entrar, lo despausamos al salir
            if (!wasPaused) this.togglePause(false);
        });

        this.helpOverlay.add([dim, panel, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;

        // 🎨 COUNTDOWN MEJORADO con GSAP
        this.countdownText = this.add.text(width / 2, height / 2, '3', {
            fontSize: '120px',
            fontFamily: 'Nunito',
            color: '#22D3EE', // Cyan neón
            stroke: '#000000',
            strokeThickness: 10,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1500);

        const txt = this.countdownText;

        // Animación inicial
        txt.setScale(0);
        gsap.to(txt, {
            scale: 1.2,
            duration: 0.3,
            ease: 'back.out(3)'
        });

        this.time.addEvent({
            delay: 1000, repeat: 3,
            callback: () => {
                count--;
                if (count > 0) {
                    txt.setText(count.toString());
                    // Animación de pulso
                    gsap.fromTo(txt,
                        { scale: 0.5, alpha: 0.5 },
                        { scale: 1.2, alpha: 1, duration: 0.3, ease: 'back.out(3)' }
                    );
                } else if (count === 0) {
                    txt.setText('GO!').setColor('#34D399'); // Verde éxito
                    this.soundManager.playSfx('game_start');
                    // Animación explosiva
                    gsap.fromTo(txt,
                        { scale: 0.5 },
                        {
                            scale: 1.5,
                            duration: 0.3,
                            ease: 'back.out(4)',
                            onComplete: () => {
                                gsap.to(txt, {
                                    alpha: 0,
                                    scale: 2,
                                    duration: 0.4,
                                    ease: 'power2.in'
                                });
                            }
                        }
                    );
                } else {
                    txt.destroy();
                    this.startGameplay();
                }
            }
        });
    }

    private startGameplay() {
        this.gameTimer = this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
        this.spawnTimer = this.time.addEvent({
            delay: this.resolvedConfig.spawn_rate_ms,
            callback: this.spawnWord, callbackScope: this, loop: true
        });
        this.spawnWord();
        this.gameStartTime = Date.now();
        this.soundManager.playMusic('bg_music', 0.4);
    }

    private updateTimer() {
        if (this.isPaused) return;
        this.timeElapsed++; // Count UP instead of down
        this.gameHUD.update({ timeRemaining: this.timeElapsed });
    }

    private spawnWord() {
        if (this.isGameOver || this.isPaused) return;

        if (this.wordIndex >= this.gameDataset.totalCount) {
            if (this.spawnTimer) this.spawnTimer.remove();
            return;
        }

        const wordData = this.gameDataset.items[this.wordIndex % this.gameDataset.items.length];
        this.wordIndex++;
        this.soundManager.playSfx('item_spawn', 0.2); // Reducido volumen ligeramente

        const { width, height } = this.cameras.main;

        // DISEÑO PREMIUM: Usamos la función del tema
        const tokenSize = Phaser.Math.Clamp(Math.round(width * 0.11), 100, 135);
        const margin = (tokenSize / 2) + 20; // Margen para evitar desbordar el borde global
        const x = Phaser.Math.Between(margin, width - margin);

        const container = this.add.container(x, -100).setDepth(200) as unknown as WordSprite;
        const randomColor = Phaser.Utils.Array.GetRandom([
            0x22D3EE, // Cyan Aqua
            0x818CF8, // Indigo suave
            0x34D399, // Esmeralda
            0xFBBF24, // Ámbar/Oro
            0xF472B6, // Rosa suave
            0x60A5FA  // Azul cielo
        ]);

        const visual = createPremiumWordToken(this, tokenSize, randomColor);

        // Almacenamos el sprite invisible para interacción (compatibilidad con lógica previa)
        const sprite = this.add.image(0, 0, 'wc_atlas', 'word-catcher/tokens/token_base')
            .setDisplaySize(tokenSize, tokenSize)
            .setAlpha(0.001)
            .setInteractive({ useHandCursor: true });

        const fontSize = Phaser.Math.Clamp(Math.round(tokenSize * 0.18), 18, 26);
        const wordText = this.add.text(0, 2, wordData.content_text.toUpperCase(), {
            fontSize: `${fontSize}px`,
            fontFamily: 'Nunito',
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold',
            wordWrap: { width: tokenSize - 25 }
        }).setOrigin(0.5);

        wordText.setShadow(0, 2, '#000000', 4, true, true);

        container.add([visual, sprite, wordText]);
        container.setScale(0.5);
        container.alpha = 0;

        // Guardamos referencias para la lógica existente
        container.wordData = wordData;
        container.baseSprite = sprite as any;
        container.wordText = wordText;

        // Attach references from visual for handlers
        (container as any).glow = (visual as any).glow;
        (container as any).border = (visual as any).border;
        (container as any).bg = (visual as any).bg;

        // 🎨 ANIMACIÓN DE ENTRADA MEJORADA con GSAP
        gsap.to(container, {
            scale: 1.0,
            alpha: 1,
            duration: 0.4,
            ease: 'back.out(1.7)'
        });

        // 🎨 MICROANIMACIÓN: Flotación sutil continua
        gsap.to(container, {
            y: '+=8',
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // 🎨 MICROANIMACIÓN: Rotación muy sutil
        gsap.to(container, {
            rotation: 0.03, // ~1.7 grados
            duration: 3,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onWordClicked(pointer, container));

        // 5. ANIMACIÓN DE CAÍDA (Suave)
        const fallSpeed = this.resolvedConfig.fall_speed;
        const fallDuration = (height + 250) / (fallSpeed / 1000);

        // Caída vertical lineal
        gsap.to(container, {
            y: height + 200,
            duration: fallDuration / 1000,
            ease: 'none',
            onComplete: () => {
                if (container.active) {
                    this.onWordMissed(container);
                    container.destroy();
                }
            }
        });

        // Vaivén reducido
        const swayWidth = Phaser.Math.Between(10, 25);
        gsap.to(container, {
            x: x + swayWidth,
            duration: Phaser.Math.Between(4, 6),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        // Rotación dinámica durante la caída
        gsap.to(container, {
            rotation: Phaser.Math.FloatBetween(-0.05, 0.05),
            duration: Phaser.Math.Between(1, 3),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        this.activeWords.push(container);
    }

    private onWordClicked(pointer: Phaser.Input.Pointer, gameObject: any) {
        if (this.isPaused || this.isGameOver) return;
        const wordContainer = gameObject as WordSprite;
        if (!wordContainer.wordData || wordContainer.isClicked) return;

        wordContainer.isClicked = true;

        // Detener TODAS las animaciones de GSAP inmediatamente
        gsap.killTweensOf(wordContainer);
        if ((wordContainer as any).glow) gsap.killTweensOf((wordContainer as any).glow);

        if (wordContainer.wordData.is_correct) this.handleCorrectCatch(wordContainer);
        else this.handleWrongCatch(wordContainer);
    }

    private handleCorrectCatch(container: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.points_correct;
        this.score += points;

        this.answerTracker.recordCorrectCatch(
            container.wordData.content_id, container.wordData.content_text,
            { x: container.x, y: container.y },
            container.wordData.metadata?.rule_tag ? [container.wordData.metadata.rule_tag] : []
        );

        this.sessionManager?.updateScore(points, true);
        this.soundManager.playSfx('catch_correct', 0.8);
        this.soundManager.playSfx('correct', 0.5);

        // 🎨 FEEDBACK VISUAL PREMIUM con GSAP
        const glow = (container as any).glow as Phaser.GameObjects.Graphics;
        const border = (container as any).border as Phaser.GameObjects.Graphics;
        const bg = (container as any).bg as Phaser.GameObjects.Graphics;
        const feedbackSize = 140;

        // Cambiar colores a Esmeralda Éxito
        glow.clear().fillStyle(0x34D399, 0.6).fillRoundedRect(-feedbackSize / 2 - 10, -feedbackSize / 2 - 10, feedbackSize + 20, feedbackSize + 20, 30);
        border.clear().lineStyle(5, 0x34D399, 1).strokeRoundedRect(-feedbackSize / 2, -feedbackSize / 2, feedbackSize, feedbackSize, 20);
        bg.clear().fillStyle(0x064e3b, 0.95).fillRoundedRect(-feedbackSize / 2, -feedbackSize / 2, feedbackSize, feedbackSize, 20);

        container.wordText.setColor('#FFFFFF').setStroke('#000000', 4);

        // Animación de salida elegante (Fade + Float UP)
        gsap.to(container, {
            y: container.y - 80,
            scale: 1.1,
            alpha: 0,
            duration: 0.8,
            ease: 'power1.out',
            onComplete: () => {
                container.destroy();
                this.wordsCompleted++;
                this.checkGameCompletion();
            }
        });

        this.updateUI_Stats();
    }

    private handleWrongCatch(container: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.points_wrong;
        this.score = Math.max(0, this.score + points);

        this.answerTracker.recordDistractorCatch(
            container.wordData.content_id, container.wordData.content_text,
            { x: container.x, y: container.y },
            container.wordData.metadata?.rule_tag ? [container.wordData.metadata.rule_tag] : []
        );

        this.sessionManager?.updateScore(points, false);
        this.soundManager.playSfx('catch_wrong', 0.9);
        this.soundManager.playSfx('wrong', 0.6);

        // 🎨 FEEDBACK VISUAL PREMIUM DE ERROR con GSAP
        const glow = (container as any).glow as Phaser.GameObjects.Graphics;
        const border = (container as any).border as Phaser.GameObjects.Graphics;
        const bg = (container as any).bg as Phaser.GameObjects.Graphics;
        const feedbackSize = 140;

        // Cambiar colores a Rosa/Rojo Error
        glow.clear().fillStyle(0xFB7185, 0.6).fillRoundedRect(-feedbackSize / 2 - 10, -feedbackSize / 2 - 10, feedbackSize + 20, feedbackSize + 20, 30);
        border.clear().lineStyle(5, 0xFB7185, 1).strokeRoundedRect(-feedbackSize / 2, -feedbackSize / 2, feedbackSize, feedbackSize, 20);
        bg.clear().fillStyle(0x4c0519, 0.95).fillRoundedRect(-feedbackSize / 2, -feedbackSize / 2, feedbackSize, feedbackSize, 20);

        container.wordText.setColor('#FB7185').setStroke('#000000', 4);

        // Animación de Error Suave (Pequeño retroceso y caída)
        gsap.to(container, {
            y: container.y + 100,
            scale: 0.85,
            alpha: 0,
            duration: 1.0,
            ease: 'power2.in',
            onComplete: () => {
                container.destroy();
                this.wordsCompleted++;
                this.checkGameCompletion();
            }
        });

        this.updateUI_Stats();
    }

    private onWordMissed(sprite: WordSprite) {
        if (sprite.isClicked) return;

        if (sprite.wordData.is_correct) {
            if (this.resolvedConfig.miss_penalty_enabled) {
                const penalty = WORD_CATCHER_CONFIG.scoring.points_wrong;
                this.score = Math.max(0, this.score + penalty);
                this.sessionManager?.updateScore(penalty, false);
            }
            this.answerTracker.recordMissedWord(
                sprite.wordData.content_id, sprite.wordData.content_text,
                { x: sprite.x, y: sprite.y },
                sprite.wordData.metadata?.rule_tag ? [sprite.wordData.metadata.rule_tag] : []
            );
        } else {
            this.answerTracker.recordAvoidedDistractor(sprite.wordData.content_id, sprite.wordData.content_text);
        }

        this.updateUI_Stats();
        this.wordsCompleted++;
        this.checkGameCompletion();
    }

    private checkGameCompletion() {
        if (this.wordsCompleted >= this.gameDataset.totalCount) {
            this.endGame();
        }
    }

    private updateUI_Stats() {
        this.gameHUD.update({ score: this.score });
        const stats = this.answerTracker.getStats();
        this.correctText.setText(`CAUGHT: ${stats.caught}`);
    }
}
