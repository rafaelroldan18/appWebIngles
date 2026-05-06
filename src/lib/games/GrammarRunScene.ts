/**
 * GrammarRunScene - Endless runner game for grammar practice
 * Rediseñado con un estilo Minimalista Moderno Premium (Clean UI)
 */

import * as Phaser from 'phaser';
import { gsap } from 'gsap';
import { GRAMMAR_RUN_CONFIG, resolveGrammarRunConfig } from './grammarRun.config';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { createPanel, createButton, showFeedback, showGlow, showImpactParticles, showBurst, showToast, showFullscreenRequest, showGameInstructions } from './UIKit';
import type { GameContent, MissionConfig, GrammarQuestion, GrammarOption } from '@/types';
import type { GameSessionManager } from './GameSessionManager';
import { loadGrammarRunContent, validateGrammarRunContent } from './gameLoader.utils';
import { loadGameAudio } from './AudioLoader';
import { SoundManager } from './SoundManager';
import { getGameTheme } from './GameStyles';
import { GRAMMAR_RUN_THEME, createGrammarRunPanel, createGrammarRunButton } from './GrammarRunTheme';
import { showCorrectFeedback, showWrongFeedback } from './VisualEffects';

interface Gate {
    container: Phaser.GameObjects.Container;
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
    textObj: Phaser.GameObjects.Text;
    question: GrammarQuestion;
    option: GrammarOption;
    lane: number;
}

export class GrammarRunScene extends Phaser.Scene {
    private questions: GrammarQuestion[] = [];
    private sessionManager: GameSessionManager | null = null;
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: MissionConfig | null = null;
    private resolvedConfig: any = null;
    private isPaused: boolean = false;
    private translations: any = null;

    // Game objects
    private player!: Phaser.GameObjects.Sprite;
    private ground!: Phaser.GameObjects.Rectangle;
    private gates: Gate[] = [];
    private obstacles: Phaser.GameObjects.Image[] = [];

    // UI Elements
    private hud!: GameHUD;
    private promptContainer!: Phaser.GameObjects.Container;
    private promptBg!: Phaser.GameObjects.Image;
    private promptText!: Phaser.GameObjects.Text;
    private ghostGroup!: Phaser.GameObjects.Group;
    private trailParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

    // 🎨 Visual Elements - Cinéticos
    private kineticLines: Phaser.GameObjects.Graphics[] = [];
    private speedParticles: Phaser.GameObjects.Graphics[] = [];

    // Game state
    private score: number = 0;
    private timeElapsed: number = 0;
    private distance: number = 0;
    private currentLane: number = 1; // 0=left, 1=center, 2=right
    private isGameOver: boolean = false;
    private currentSpeed: number = 200;
    private contentIndex: number = 0;
    private streak: number = 0;
    private bestStreak: number = 0;
    private correctCount: number = 0;
    private wrongCount: number = 0;
    private soundManager!: SoundManager;

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;
    private speedIncreaseTimer!: Phaser.Time.TimerEvent;
    private nextQuestionTimer!: Phaser.Time.TimerEvent;

    // Game state flags
    private isWaitingForNextQuestion: boolean = false;
    private hasRespondedToCurrentQuestion: boolean = false;
    private currentQuestionGates: Gate[] = [];
    private currentQuestionData: GrammarQuestion | null = null;

    // Time tracking per question
    private questionStartTime: number = 0;

    constructor() {
        super({ key: 'GrammarRunScene' });
    }

    preload() {
        this.load.atlas('ui_atlas', '/assets/atlases/common-ui/texture.png', '/assets/atlases/common-ui/texture.json');
        loadGameAtlases(this, 'gr');
        loadGameAudio(this, 'gr');
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
        const rawContent = data.words || [];
        this.sessionManager = data.sessionManager || null;
        this.missionTitle = data.missionTitle || 'GRAMMAR RUN';
        this.missionInstructions = data.missionInstructions || 'Select the correct grammar structure!';
        this.missionConfig = data.missionConfig || null;

        // Resolve configuration
        this.resolvedConfig = resolveGrammarRunConfig(this.missionConfig);

        // Load and validate grammar questions
        console.log('[GrammarRun] Loading questions from content...');
        const validation = validateGrammarRunContent(rawContent);
        if (!validation.valid) {
            console.error('[GrammarRun] Content validation failed:', validation.error);
            this.questions = [];
        } else {
            this.questions = loadGrammarRunContent(rawContent);
            console.log('[GrammarRun] Loaded questions:', this.questions.length);
        }

        // Initialize game state from resolved config
        this.score = 0;
        this.timeElapsed = 0;
        this.distance = 0;
        this.currentLane = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.currentSpeed = this.resolvedConfig.pacing.speed_base * 100;
        this.contentIndex = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.gates = [];
        this.currentQuestionGates = [];
        this.obstacles = [];
        this.isWaitingForNextQuestion = false;

        // Shuffle questions if configured
        if (this.resolvedConfig.randomize_items) {
            this.questions = Phaser.Utils.Array.Shuffle([...this.questions]);
        }

        // Limit questions to items_limit
        if (this.questions.length > this.resolvedConfig.items_limit) {
            this.questions = this.questions.slice(0, this.resolvedConfig.items_limit);
        }
    }

    create() {
        console.log('[GrammarRun] Scene create() started');
        try {
            this.isPaused = true;
            showGameInstructions(this, {
                title: 'Grammar Run',
                instructions: this.missionInstructions || 'Run and pass through the correct grammar gates! Avoid obstacles and build your path.',
                controls: 'Use Arrow Keys (← →) or A/D to change lanes.\n\n• PAUSE (⏸): Pause the game\n• HELP (?): View instructions',
                controlIcons: ['arrows'],
                requestFullscreen: true,
                buttonLabel: 'START RUNNING',
                onStart: () => {
                    this.isPaused = false;
                    this.startCountdown();
                }
            });

            this.soundManager = new SoundManager(this);

            const { width, height } = this.cameras.main;

            // 🎨 FONDO CINÉTICO
            this.createKineticBackground();

            // Create player
            this.createPlayer();

            // Create HUD
            this.createHUD();

            // Setup controls
            this.setupControls();

            // Enable physics
            this.physics.world.setBounds(0, 0, width, height);

            console.log('[GrammarRun] Scene create() finished successfully');
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[GrammarRun] Critical error in create():', error);
            this.add.text(400, 300, 'Error initializing game', { color: '#ff0000' }).setOrigin(0.5);
        }
    }

    /**
     * 🎨 Crea un fondo dinámico limpio con estrellas parpadeantes y nebulosa sutil
     */
    private createKineticBackground() {
        const { width, height } = this.cameras.main;

        // 🌌 FONDO: Gradiente de Nebulosa Cernida
        const bg = this.add.graphics();
        bg.setDepth(-100);
        bg.fillGradientStyle(0x0F172A, 0x0F172A, 0x1E1B4B, 0x020617, 1);
        bg.fillRect(0, 0, width, height);

        // ✨ ESTRELLAS PARPADEANTES (Campo Estelar Limpio, sin figuras raras)
        for (let i = 0; i < 40; i++) {
            const star = this.add.graphics();
            star.setDepth(-90);

            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);

            star.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.3, 0.8));
            star.fillCircle(0, 0, size);
            star.setPosition(x, y);

            this.speedParticles.push(star);

            // Movimiento hacia abajo
            gsap.to(star, {
                y: height + 50,
                duration: Phaser.Math.FloatBetween(4, 10),
                repeat: -1,
                ease: 'none',
                onRepeat: () => {
                    star.y = -10;
                    star.x = Phaser.Math.Between(0, width);
                }
            });

            // Parpadeo aleatorio
            gsap.to(star, {
                alpha: 0.1,
                duration: Phaser.Math.FloatBetween(0.5, 2),
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }

        // ✨ CHISPAS DE DATOS (Speed Sparks)
        // Partículas muy pequeñas y rápidas que dan sensación de movimiento
        for (let i = 0; i < 30; i++) {
            const spark = this.add.graphics();
            spark.setDepth(-85);
            spark.fillStyle(0xFFFFFF, 0.6);
            spark.fillCircle(0, 0, 1.5);

            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            spark.setPosition(x, y);

            this.speedParticles.push(spark);

            gsap.to(spark, {
                y: height + 50,
                duration: Phaser.Math.FloatBetween(0.8, 2),
                repeat: -1,
                ease: 'none',
                onRepeat: () => {
                    spark.y = -10;
                    spark.x = Phaser.Math.Between(0, width);
                }
            });
        }

        // 🌫️ NEBULOSA DE FONDO (Sutil resplandor)
        const glow = this.add.graphics();
        glow.setDepth(-95);
        glow.fillGradientStyle(0x06B6D4, 0x8B5CF6, 0x10B981, 0x020617, 0.2);
        glow.fillCircle(width / 2, height, width);

        gsap.to(glow, {
            alpha: 0.1,
            duration: 5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    private createHUD() {
        this.hud = new GameHUD(this, {
            showScore: true,
            showTimer: true,
            showLives: false,
            showProgress: false,
            showPauseButton: true,
            showHelpButton: this.resolvedConfig.hud_help_enabled
        }, this.soundManager);

        this.hud.onPause(() => this.togglePause());
        if (this.resolvedConfig.hud_help_enabled) {
            this.hud.onHelp(() => this.showHelpPanel());
        }

        const hudContainer = this.hud.getContainer();
        const topPanel = hudContainer.getAt(0) as Phaser.GameObjects.Image;
        if (topPanel && topPanel.setTint) {
            topPanel.setTint(0x0a0a1a);
            topPanel.setAlpha(0.95);
            topPanel.setDisplaySize(this.scale.width, 60);
        }

        if (this.hud['soundButton']) {
            const soundBtn = this.hud['soundButton'] as Phaser.GameObjects.Container;
            const soundBg = soundBtn.getAt(0) as Phaser.GameObjects.Image;
            if (soundBg && soundBg.setTint) soundBg.setTint(GRAMMAR_RUN_THEME.colors.secondary);
        }

        if (this.hud['helpButton']) {
            const helpBtn = this.hud['helpButton'] as Phaser.GameObjects.Container;
            const helpBg = helpBtn.getAt(0) as Phaser.GameObjects.Image;
            if (helpBg && helpBg.setTint) helpBg.setTint(GRAMMAR_RUN_THEME.colors.warning);
        }

        if (this.hud['pauseButton']) {
            const pauseBtn = this.hud['pauseButton'] as Phaser.GameObjects.Container;
            const pauseBg = pauseBtn.getAt(0) as Phaser.GameObjects.Image;
            if (pauseBg && pauseBg.setTint) pauseBg.setTint(GRAMMAR_RUN_THEME.colors.primary);
        }

        this.hud.update({
            score: this.score,
            timeRemaining: this.timeElapsed
        });

        this.createPromptPanel();
    }

    private createPromptPanel() {
        const { width, height } = this.scale;
        const panelY = height * 0.2;

        this.promptContainer = this.add.container(width / 2, panelY)
            .setDepth(50)
            .setScrollFactor(0);

        // Panel Minimalista (Single Border)
        const panelWidth = width * 0.65;
        const panelHeight = 80;

        const panelGraphics = this.add.graphics();

        // Fondo tipo cristal oscuro
        panelGraphics.fillStyle(0x0a0a1a, 0.85);
        panelGraphics.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 12);

        // Una sola línea limpia (Cyan suave)
        panelGraphics.lineStyle(2, 0x06B6D4, 0.8);
        panelGraphics.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 12);

        this.promptBg = panelGraphics as any;

        this.promptText = this.add.text(0, 0, 'GET READY...', {
            fontSize: '22px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: width * 0.55 }
        }).setOrigin(0.5);

        this.promptContainer.add([panelGraphics, this.promptText]);
        this.promptContainer.setAlpha(0);
    }

    private togglePause() {
        if (this.isGameOver) return;
        if (this.isPaused && !this.pauseOverlay) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.world.pause();
            if (this.gameTimer) this.gameTimer.paused = true;
            if (this.nextQuestionTimer) this.nextQuestionTimer.paused = true;
            if (this.speedIncreaseTimer) this.speedIncreaseTimer.paused = true;
            this.showPauseOverlay();
        } else {
            this.physics.world.resume();
            if (this.gameTimer) this.gameTimer.paused = false;
            if (this.nextQuestionTimer) this.nextQuestionTimer.paused = false;
            if (this.speedIncreaseTimer) this.speedIncreaseTimer.paused = false;
            this.tweens.resumeAll();
            this.hidePauseOverlay();
        }
    }

    private pauseOverlay: Phaser.GameObjects.Container | null = null;

    private showPauseOverlay() {
        const { width, height } = this.cameras.main;
        this.pauseOverlay = this.add.container(0, 0).setDepth(10000).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        const pW = 520;
        const pH = 420;
        const panelBg = createGrammarRunPanel(this, pW, pH);
        panelBg.setPosition(width / 2, height / 2);

        this.tweens.add({
            targets: panelBg,
            alpha: GRAMMAR_RUN_THEME.animations.pulseAlpha,
            duration: GRAMMAR_RUN_THEME.animations.pulseDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const title = this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
            ...GRAMMAR_RUN_THEME.textStyles.title,
            color: GRAMMAR_RUN_THEME.hex.accent,
        }).setOrigin(0.5);

        const resumeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 0, 'CONTINUAR', () => this.togglePause(), { width: 200, height: 60 });
        const resumeBg = resumeBtn.getAt(0) as Phaser.GameObjects.Image;
        if (resumeBg && resumeBg.setTint) resumeBg.setTint(GRAMMAR_RUN_THEME.colors.success);

        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', width / 2, height / 2 + 80, 'SALIR', () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();
            this.game.events.emit('GAME_EXIT');
        }, { width: 200, height: 60 });
        const exitBg = exitBtn.getAt(0) as Phaser.GameObjects.Image;
        if (exitBg && exitBg.setTint) exitBg.setTint(GRAMMAR_RUN_THEME.colors.error);

        this.pauseOverlay.add([dim, panelBg, title, resumeBtn, exitBtn]);
    }

    private hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }

    private showHelpPanel() {
        if (this.isGameOver) return;
        const wasPaused = this.isPaused;
        if (!wasPaused) this.togglePause();

        const { width, height } = this.cameras.main;
        const panelContainer = this.add.container(0, 0).setDepth(10001).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        const pW = 550;
        const pH = 400;
        const bg = createGrammarRunPanel(this, pW, pH);
        bg.setPosition(width / 2, height / 2);

        this.tweens.add({
            targets: bg,
            alpha: GRAMMAR_RUN_THEME.animations.pulseAlpha,
            duration: GRAMMAR_RUN_THEME.animations.pulseDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const title = this.add.text(width / 2, height / 2 - 140, 'INSTRUCCIONES', {
            ...GRAMMAR_RUN_THEME.textStyles.subtitle,
            color: GRAMMAR_RUN_THEME.hex.accent,
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2 - 20, this.missionInstructions || 'Sigue las reglas del juego.', {
            ...GRAMMAR_RUN_THEME.textStyles.body,
            align: 'center',
            wordWrap: { width: 450 },
        }).setOrigin(0.5);

        const closeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 120, 'ENTENDIDO', () => {
            panelContainer.destroy();
            if (!wasPaused) this.togglePause();
        }, { width: 200, height: 60 });
        const closeBg = closeBtn.getAt(0) as Phaser.GameObjects.Image;
        if (closeBg && closeBg.setTint) closeBg.setTint(GRAMMAR_RUN_THEME.colors.primary);

        panelContainer.add([dim, bg, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;
        const countText = this.add.text(width / 2, height / 2, `${count}`, {
            fontSize: '120px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        const timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countText.setText(`${count}`);
                    this.cameras.main.shake(100, 0.01);
                } else if (count === 0) {
                    countText.setText('RUN!');
                    countText.setColor('#10b981');
                    this.cameras.main.flash(500);
                } else {
                    this.soundManager.playSfx('game_start');
                    countText.destroy();
                    timer.remove();
                    this.startGameplay();
                }
            },
            repeat: 3
        });
    }

    private startGameplay() {
        this.physics.resume();
        if (this.sys.game.canvas) this.sys.game.canvas.focus();

        this.startGameTimer();
        this.startSpeedIncrease();
        this.time.delayedCall(1000, () => this.spawnGate());
        this.startDecorativeObstacles();
        this.soundManager.playMusic('bg_music', 0.4);
    }

    private createPlayer() {
        const { width, height } = this.scale;
        const groundHeight = height * 0.15;

        const playerContainer = this.add.container(
            width / 2,
            height - groundHeight - 50
        );
        playerContainer.setDepth(200);

        const outerGlow = this.add.graphics();
        outerGlow.fillStyle(0x0891B2, 0.3);
        outerGlow.fillCircle(0, 0, 50);
        outerGlow.setBlendMode(Phaser.BlendModes.ADD);
        playerContainer.add(outerGlow);

        gsap.to(outerGlow, {
            alpha: 0.6,
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        gsap.to(outerGlow, {
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        const innerGlow = this.add.graphics();
        innerGlow.fillStyle(0x06B6D4, 0.5);
        innerGlow.fillCircle(0, 0, 35);
        innerGlow.setBlendMode(Phaser.BlendModes.ADD);
        playerContainer.add(innerGlow);

        gsap.to(innerGlow, {
            alpha: 0.8,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        this.player = this.add.sprite(0, 0, 'gr_atlas', 'grammar-run/player/player_run_01');
        this.player.setScale(1.6);
        playerContainer.add(this.player);

        this.anims.create({
            key: 'run',
            frames: [
                { key: 'gr_atlas', frame: 'grammar-run/player/player_run_01' },
                { key: 'gr_atlas', frame: 'grammar-run/player/player_run_02' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.player.play('run');
        this.player.setTint(0xFFFFFF);

        gsap.to(this.player, {
            y: -3,
            duration: 0.4,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        const outline = this.add.graphics();
        outline.lineStyle(2, 0x00FFFF, 0.6); // Single border thin
        outline.strokeCircle(0, 0, 32);
        outline.setBlendMode(Phaser.BlendModes.ADD);
        playerContainer.add(outline);
        playerContainer.sendToBack(outline);

        gsap.to(outline, {
            rotation: Math.PI * 2,
            duration: 4,
            repeat: -1,
            ease: 'linear'
        });

        this.physics.add.existing(playerContainer);
        const body = playerContainer.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setGravityY(GRAMMAR_RUN_CONFIG.physics.gravity * 1.5);
        body.setSize(50, 70);
        body.setOffset(-25, -35);

        (this.player as any).container = playerContainer;

        if (!this.textures.exists('energy-particle')) {
            const particleGraphics = this.make.graphics({ x: 0, y: 0 });
            particleGraphics.fillStyle(0x00FFFF, 1);
            particleGraphics.fillCircle(4, 4, 4);
            particleGraphics.generateTexture('energy-particle', 8, 8);
            particleGraphics.destroy();
        }

        this.trailParticles = this.add.particles(0, 0, 'energy-particle', {
            speed: { min: 30, max: 150 },
            scale: { start: 1.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            quantity: 3,
            frequency: 30,
            angle: { min: 70, max: 110 },
            follow: playerContainer,
            followOffset: { x: 0, y: 35 },
            blendMode: Phaser.BlendModes.ADD,
            tint: [0x00FFFF, 0x06B6D4, 0x0891B2]
        });
        this.trailParticles.setDepth(199);
    }

    private setupControls() {
        this.input.keyboard?.on('keydown-LEFT', () => this.changeLane(-1));
        this.input.keyboard?.on('keydown-RIGHT', () => this.changeLane(1));
        this.input.keyboard?.on('keydown-A', () => this.changeLane(-1));
        this.input.keyboard?.on('keydown-D', () => this.changeLane(1));

        this.input.keyboard?.on('keydown-SPACE', () => this.jump());
        this.input.keyboard?.on('keydown-UP', () => this.jump());
        this.input.keyboard?.on('keydown-W', () => this.jump());

        this.input.keyboard?.addCapture([
            Phaser.Input.Keyboard.KeyCodes.SPACE,
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.W
        ]);
    }

    private jump() {
        if (this.isGameOver || this.isPaused) return;
        const playerContainer = (this.player as any).container as Phaser.GameObjects.Container;
        if (!playerContainer) return;
        const body = playerContainer.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        if (body.blocked.down || playerContainer.y >= this.scale.height - 80) {
            body.setVelocityY(-650);
            this.soundManager.playSfx('jump', 0.6);
            this.tweens.add({
                targets: this.player,
                scaleY: 1.15,
                scaleX: 0.85,
                angle: -10,
                duration: 120,
                yoyo: true,
                ease: 'Cubic.easeOut',
                onComplete: () => this.player.setAngle(0)
            });
        }
    }

    private changeLane(direction: number) {
        if (this.isGameOver) return;
        const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
        if (newLane !== this.currentLane) {
            this.soundManager.playSfx('jump', 0.5);
            this.currentLane = newLane;
            this.movePlayerToLane(direction);
            this.highlightSelectedGate();
        }
    }

    private movePlayerToLane(direction: number) {
        const { width } = this.scale;
        const laneWidth = width / 3;
        const targetX = laneWidth * this.currentLane + laneWidth / 2;
        const playerContainer = (this.player as any).container as Phaser.GameObjects.Container;
        if (!playerContainer) return;

        this.player.stop();
        this.player.setFrame('grammar-run/player/player_jump');

        this.tweens.add({
            targets: playerContainer,
            x: targetX,
            duration: 200,
            ease: 'Power2',
        });

        this.tweens.add({
            targets: playerContainer,
            y: playerContainer.y - 40,
            angle: direction * 15,
            duration: 150,
            yoyo: true,
            ease: 'Sine.easeOut',
            onUpdate: () => this.createGhost(),
            onComplete: () => {
                if (!this.isGameOver) this.player.play('run');
                this.player.setAngle(0);
                const grTheme = getGameTheme('grammarRun');
                showImpactParticles(this, playerContainer.x, playerContainer.y + 40, (grTheme.colors as any).spark);
            }
        });
    }

    private createGhost() {
        if (!this.player || this.isGameOver) return;
        const playerContainer = (this.player as any).container as Phaser.GameObjects.Container;
        if (!playerContainer) return;

        const ghost = this.add.image(playerContainer.x, playerContainer.y, this.player.texture.key, this.player.frame.name)
            .setScale(this.player.scaleX, this.player.scaleY)
            .setAngle(this.player.angle)
            .setAlpha(0.6)
            .setTint(0x00FFFF)
            .setDepth(98);

        this.tweens.add({
            targets: ghost,
            alpha: 0,
            scale: this.player.scaleX * 0.8,
            duration: 400,
            onComplete: () => ghost.destroy()
        });
    }

    private highlightSelectedGate() {
        this.currentQuestionGates.forEach(gate => {
            if (gate.lane === this.currentLane) {
                this.tweens.add({ targets: gate.container, scale: 1.06, duration: 150, ease: 'Back.easeOut' });
            } else {
                this.tweens.add({ targets: gate.container, scale: 1.0, duration: 150 });
            }
        });
    }

    private startGameTimer() {
        this.gameTimer = this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
    }

    private updateTimer() {
        this.timeElapsed++;
        if (this.hud) this.hud.update({ timeRemaining: this.timeElapsed });
    }

    private startSpeedIncrease() {
        this.speedIncreaseTimer = this.time.addEvent({
            delay: 10000,
            callback: () => { this.currentSpeed *= (1 + this.resolvedConfig.pacing.speed_increment); },
            callbackScope: this,
            loop: true
        });
    }

    private startDecorativeObstacles() {
        this.time.addEvent({
            delay: 2000,
            callback: () => { if (!this.isGameOver) this.spawnDecorativeObstacle(); },
            loop: true
        });
    }

    /**
     * Reemplazo total: Esferas de energía minimalistas (limpias y modernas)
     */
    private spawnDecorativeObstacle() {
        const { width, height } = this.scale;
        const side = Phaser.Math.Between(0, 1);
        const x = side === 0 ? Phaser.Math.Between(30, 70) : width - Phaser.Math.Between(30, 70);

        const obstacle = this.add.graphics();
        const radius = Phaser.Math.Between(10, 18);
        const color = Phaser.Math.Between(0, 1) === 0 ? 0xFBBF24 : 0xEF4444;

        obstacle.fillStyle(color, 0.4);
        obstacle.fillCircle(0, 0, radius);
        obstacle.lineStyle(2, 0xFFFFFF, 0.8);
        obstacle.strokeCircle(0, 0, radius);

        obstacle.setPosition(x, -50);
        obstacle.setDepth(-80);

        gsap.to(obstacle, { alpha: 0.3, scale: 0.8, duration: 1000, yoyo: true, repeat: -1 });

        this.physics.add.existing(obstacle);
        const body = (obstacle as any).body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(this.currentSpeed * 0.9);
        this.obstacles.push(obstacle as any);
    }

    private spawnGate() {
        if (this.contentIndex >= this.questions.length) {
            if (!this.isGameOver) this.time.delayedCall(2000, () => this.endGame('all_questions'));
            return;
        }

        if (this.isGameOver || this.isWaitingForNextQuestion) return;

        const { width } = this.scale;
        const laneWidth = width / 3;
        const gateHeight = 150;
        const gateWidth = laneWidth - 40;
        const y = -gateHeight;

        const question = this.questions[this.contentIndex];
        this.contentIndex++;
        this.isWaitingForNextQuestion = true;
        this.currentQuestionGates = [];

        this.updatePromptUI(question.questionText);
        this.currentQuestionData = question;
        this.hasRespondedToCurrentQuestion = false;
        this.questionStartTime = Date.now();

        const correctOption = question.options.find(opt => opt.isCorrect);
        if (!correctOption) {
            this.prepareNextQuestion();
            return;
        }

        let wrongOptions = question.options.filter(opt => !opt.isCorrect);
        Phaser.Utils.Array.Shuffle(wrongOptions);
        wrongOptions = wrongOptions.slice(0, 2);

        const roundOptions = Phaser.Utils.Array.Shuffle([
            { option: correctOption, isCorrect: true },
            ...wrongOptions.map(opt => ({ option: opt, isCorrect: false }))
        ]);

        roundOptions.forEach((optData, index) => {
            const gate = this.createGateInLane(index, y, gateWidth, gateHeight, question, optData.option);
            this.currentQuestionGates.push(gate);
        });
    }

    private prepareNextQuestion() {
        if (this.isGameOver) return;
        this.isWaitingForNextQuestion = false;
        this.currentQuestionGates = [];
        const delay = (this.resolvedConfig.pacing.spawn_rate * 1000);
        this.nextQuestionTimer = this.time.delayedCall(delay, () => this.spawnGate());
    }

    private updatePromptUI(text: string) {
        if (!this.promptText || !this.promptBg) return;
        this.tweens.add({
            targets: this.promptContainer,
            alpha: 0,
            y: 100,
            duration: 200,
            onComplete: () => {
                this.promptText.setText(text);
                this.tweens.add({ targets: this.promptContainer, alpha: 1, y: 120, duration: 300, ease: 'Back.easeOut' });
            }
        });
    }

    private createGateInLane(lane: number, y: number, width: number, height: number, question: GrammarQuestion, option: GrammarOption) {
        const { width: screenWidth } = this.scale;
        const laneWidth = screenWidth / 3;
        const x = laneWidth * lane + laneWidth / 2;
        const container = this.add.container(x, y);

        // 🧼 DISEÑO MINIMALISTA DE COMPUERTAS (Glassmorphic, Single border)
        let color: number;
        if (lane === 0) color = 0x10B981;
        else if (lane === 1) color = 0xFBBF24;
        else color = 0x06B6D4;

        const portalGraphics = this.add.graphics();
        const pW = width * 1.0;
        const pH = height * 0.65;

        portalGraphics.fillStyle(0x020617, 0.9);
        portalGraphics.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, 12);
        portalGraphics.lineStyle(2, color, 1);
        portalGraphics.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, 12);

        const gateSprite = portalGraphics;
        this.tweens.add({ targets: gateSprite, alpha: 0.9, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const textObj = this.add.text(0, 0, option.optionText, {
            fontSize: '22px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width * 0.45 },
            // SIN cajas de fondo feas
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        container.add([gateSprite, textObj]);
        this.physics.add.existing(container);
        (container.body as Phaser.Physics.Arcade.Body).setSize(width * 0.85, height * 0.8);
        (container.body as Phaser.Physics.Arcade.Body).setVelocityY(this.currentSpeed);

        const gate: Gate = { container, sprite: gateSprite, textObj, question, option, lane };
        this.gates.push(gate);

        const playerContainer = (this.player as any).container as Phaser.GameObjects.Container;
        if (playerContainer) {
            this.physics.add.overlap(playerContainer, container, () => this.handleGatePass(gate));
        }
        return gate;
    }

    private handleGatePass(gate: Gate) {
        if (!this.gates.includes(gate)) return;
        if (this.hasRespondedToCurrentQuestion) return;
        this.hasRespondedToCurrentQuestion = true;
        const gatesToRemove = [...this.currentQuestionGates];

        if (this.currentLane === gate.lane) {
            if (gate.option.isCorrect) this.handleCorrectGate(gate);
            else this.handleWrongGate(gate);
        }

        this.time.delayedCall(500, () => {
            this.tweens.add({ targets: this.promptContainer, alpha: 0, duration: 200 });
            gatesToRemove.forEach(g => this.removeGate(g));
            this.prepareNextQuestion();
            this.currentLane = 1;
        });
    }

    private handleCorrectGate(gate: Gate) {
        const points = this.resolvedConfig.scoring.points_correct;
        this.score += points;
        this.correctCount++;
        this.streak++;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;

        this.soundManager.playSfx('collect', 0.6);
        this.soundManager.playSfx('correct', 0.4);

        const grTheme = getGameTheme('grammarRun');
        const checkIcon = this.add.image(gate.container.x, gate.container.y, 'ui_atlas', 'common-ui/fx/fx_check')
            .setScale(3).setTint((grTheme.colors as any).correctAnswer).setDepth(100);

        this.tweens.add({ targets: checkIcon, scale: 5, alpha: 0, duration: 500, onComplete: () => checkIcon.destroy() });
        this.cameras.main.shake(150, 0.003);
        showImpactParticles(this, gate.container.x, gate.container.y, (grTheme.colors as any).correctAnswer);

        const timeSpent = this.questionStartTime > 0 ? Math.round((Date.now() - this.questionStartTime) / 1000) : 0;
        if (this.sessionManager) {
            this.sessionManager.updateScore(points, true);
            this.sessionManager.recordItem({
                id: gate.question.questionId, text: gate.question.questionText, result: 'correct',
                user_input: gate.option.optionText, correct_answer: gate.question.correctOption,
                time_ms: timeSpent * 1000, meta: { is_correct: true, attempts: 1, time_seconds: timeSpent, streak: this.streak, points_earned: points }
            });
        }
        this.showFloatingText(gate.container.x, gate.container.y, `+${points}`, (grTheme.hex as any).correctAnswer);
        this.updateUI();
        if (this.correctCount + this.wrongCount >= this.resolvedConfig.items_limit) this.endGame('completed');
    }

    private handleWrongGate(gate: Gate) {
        const points = this.resolvedConfig.scoring.points_wrong;
        this.score = Math.max(0, this.score + points);
        const grTheme = getGameTheme('grammarRun');
        this.wrongCount++;
        this.streak = 0;
        this.cameras.main.shake(300, 0.015);
        this.soundManager.playSfx('obstacle_hit', 0.7);
        this.soundManager.playSfx('wrong', 0.6);
        showImpactParticles(this, gate.container.x, gate.container.y, (grTheme.colors as any).wrongAnswer);

        const crossIcon = this.add.image(gate.container.x, gate.container.y, 'ui_atlas', 'common-ui/fx/fx_cross')
            .setScale(3).setTint((grTheme.colors as any).wrongAnswer).setDepth(100);

        this.tweens.add({ targets: crossIcon, scale: 5, alpha: 0, duration: 500, onComplete: () => crossIcon.destroy() });
        this.updateUI();
        if (this.correctCount + this.wrongCount >= this.resolvedConfig.items_limit) this.endGame('completed');
    }

    private removeGate(gate: Gate) {
        const index = this.gates.indexOf(gate);
        if (index > -1) this.gates.splice(index, 1);
        const bunchIndex = this.currentQuestionGates.indexOf(gate);
        if (bunchIndex > -1) this.currentQuestionGates.splice(bunchIndex, 1);
        gate.container.destroy();
    }

    private showFloatingText(x: number, y: number, text: string, color: string) {
        const floatingText = this.add.text(x, y, text, { fontSize: '32px', color, fontFamily: 'Fredoka', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
        this.tweens.add({ targets: floatingText, y: y - 50, alpha: 0, duration: 1000, onComplete: () => floatingText.destroy() });
    }

    private updateUI() {
        if (this.hud) this.hud.update({ score: Math.max(0, this.score), timeRemaining: this.timeElapsed });
    }

    private generateReview() {
        return { strengths: [], improvements: [], recommended_practice: "Practice makes perfect!" };
    }

    private async endGame(reason: 'time' | 'lives' | 'completed' | 'all_questions' = 'completed') {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isPaused = true;
        this.soundManager.stopMusic();
        this.soundManager.playSfx('game_win');

        if (this.gameTimer) this.gameTimer.remove();
        if (this.speedIncreaseTimer) this.speedIncreaseTimer.remove();
        if (this.nextQuestionTimer) this.nextQuestionTimer.remove();

        const accuracy = Math.round((this.correctCount / (this.correctCount + this.wrongCount)) * 100) || 0;
        this.createMissionCompleteModal({ correct: this.correctCount, total: this.resolvedConfig.items_limit, accuracy, reason });
    }

    private createMissionCompleteModal(stats: any) {
        const { width, height } = this.cameras.main;
        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(19999).setInteractive().setScrollFactor(0);
        const container = this.add.container(width / 2, height / 2).setDepth(20000).setScrollFactor(0);
        const panelBg = createGrammarRunPanel(this, 540, 480);
        container.add(panelBg);

        const title = this.add.text(0, -180, 'MISSION COMPLETE', { ...GRAMMAR_RUN_THEME.textStyles.title, fontSize: '36px', color: GRAMMAR_RUN_THEME.hex.accent }).setOrigin(0.5);
        const sText = this.add.text(0, -80, `Sentences: ${stats.correct}/${stats.total}`, { ...GRAMMAR_RUN_THEME.textStyles.subtitle, fontSize: '26px' }).setOrigin(0.5);
        const aText = this.add.text(0, -30, `Accuracy: ${stats.accuracy}%`, { ...GRAMMAR_RUN_THEME.textStyles.subtitle, fontSize: '26px', color: GRAMMAR_RUN_THEME.hex.accent }).setOrigin(0.5);

        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', -130, 120, 'RESULTS', () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();
            this.game.events.emit('GAME_EXIT');
        }, { width: 190, height: 55 });
        const replayBtn = createButton(this, 'common-ui/buttons/btn_primary', 130, 120, 'REPEAT', () => {
            this.scene.restart(this.initData);
        }, { width: 220, height: 70 });

        container.add([title, sText, aText, exitBtn, replayBtn]);
        container.setScale(0);
        this.tweens.add({ targets: container, scale: 1, duration: 500, ease: 'Back.out' });
    }

    private handleMissedQuestion() {
        this.score = Math.max(0, this.score - 5);
        this.wrongCount++;
        this.streak = 0;
        this.showFloatingText(this.scale.width / 2, this.scale.height / 2, 'MISSED!', '#ef4444');
        this.cameras.main.shake(300, 0.005);
        this.updateUI();
        this.tweens.add({ targets: this.promptContainer, alpha: 0, duration: 200 });
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;
        this.distance += (this.currentSpeed * delta) / 1000;
        this.gates.forEach(gate => { if (gate.container.y > this.scale.height + 100) this.removeGate(gate); });
        this.obstacles = this.obstacles.filter(obs => { if (obs.y > this.scale.height + 100) { obs.destroy(); return false; } return true; });
        if (Math.floor(time / 100) % 5 === 0) { this.updateUI(); this.createGhost(); }
    }
}
