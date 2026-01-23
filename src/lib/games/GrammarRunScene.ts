/**
 * GrammarRunScene - Endless runner game for grammar practice
 * Rediseñado con sistema de atlas profesional
 */

import * as Phaser from 'phaser';
import { GRAMMAR_RUN_CONFIG, resolveGrammarRunConfig } from './grammarRun.config';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { createPanel, createButton, showFeedback, showGlow, showBurst, showToast, showFullscreenRequest, showGameInstructions } from './UIKit';
import type { GameContent, MissionConfig, GrammarQuestion, GrammarOption } from '@/types';
import type { GameSessionManager } from './GameSessionManager';
import { loadGrammarRunContent, validateGrammarRunContent } from './gameLoader.utils';

interface Gate {
    container: Phaser.GameObjects.Container;
    sprite: Phaser.GameObjects.Image;
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
    private bg!: Phaser.GameObjects.TileSprite; // Scrolling background
    private ground!: Phaser.GameObjects.Rectangle;
    private gates: Gate[] = [];
    private obstacles: Phaser.GameObjects.Image[] = [];

    // UI Elements
    private hud!: GameHUD;
    private promptContainer!: Phaser.GameObjects.Container;
    private promptBg!: Phaser.GameObjects.Image;
    private promptText!: Phaser.GameObjects.Text;

    // Game state
    private score: number = 0;
    private timeElapsed: number = 0; // Changed from timeRemaining to timeElapsed (counts UP)
    private distance: number = 0;
    private currentLane: number = 1; // 0=left, 1=center, 2=right
    private isGameOver: boolean = false;
    private currentSpeed: number = 200;
    private contentIndex: number = 0;
    private streak: number = 0;
    private bestStreak: number = 0;
    private correctCount: number = 0;
    private wrongCount: number = 0;

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
        this.load.image('bg_grammar', '/assets/backgrounds/grammar-run/bg_trees.png');
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
        this.timeElapsed = 0; // Start at 0 and count UP
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
            // Petición de pantalla completa ANTES de iniciar los sistemas de juego
            this.isPaused = true;
            // Combine Fullscreen + Instructions
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

            const { width, height } = this.cameras.main;

            // Set background (Using tiled sprite for scrolling)
            this.bg = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_grammar');
            this.bg.setScrollFactor(0);
            this.bg.setDepth(-100);

            // Create ground
            this.createGround();

            // Create player
            this.createPlayer();

            // Create HUD
            this.createHUD();

            // Setup controls
            this.setupControls();

            // Start Countdown - Now handled by showGameInstructions callback
            // this.startCountdown();

            // Enable physics
            this.physics.world.setBounds(0, 0, width, height);

            console.log('[GrammarRun] Scene create() finished successfully');
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[GrammarRun] Critical error in create():', error);
            this.add.text(400, 300, 'Error initializing game', { color: '#ff0000' }).setOrigin(0.5);
        }
    }

    private createHUD() {
        this.hud = new GameHUD(this, {
            showScore: true,
            showTimer: true,
            showLives: false,
            showProgress: false,
            showPauseButton: true,
            showHelpButton: this.resolvedConfig.hud_help_enabled
        });

        this.hud.onPause(() => this.togglePause());
        if (this.resolvedConfig.hud_help_enabled) {
            this.hud.onHelp(() => this.showHelpPanel());
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

        this.promptBg = this.add.image(0, 0, 'ui_atlas', 'common-ui/panels/panel_glass')
            .setDisplaySize(width * 0.85, 100);

        this.promptText = this.add.text(0, 0, 'GET READY...', {
            fontSize: '28px',
            fontFamily: 'Fredoka',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);

        this.promptContainer.add([this.promptBg, this.promptText]);
        this.promptContainer.setAlpha(0);
    }

    private togglePause() {
        if (this.isGameOver) return;

        // Evitar múltiples aperturas
        if (this.isPaused && !this.pauseOverlay) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.world.pause();
            if (this.gameTimer) this.gameTimer.paused = true;
            if (this.nextQuestionTimer) this.nextQuestionTimer.paused = true;
            if (this.speedIncreaseTimer) this.speedIncreaseTimer.paused = true;
            // this.tweens.pauseAll(); // Disable to allow UI animations
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

        // Background & Border from modals_atlas (glass effect)
        const pW = 520;
        const pH = 420;
        const panelBg = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Panel/panel-001.png', pW, pH, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Border/panel-border-001.png', pW, pH, 20, 20, 20, 20)
            .setTint(0x3b82f6);


        const title = this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
            fontSize: '48px', fontFamily: 'Fredoka', color: '#fbbf24', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        const resumeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 0, 'CONTINUAR', () => this.togglePause(), { width: 200, height: 60 });
        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', width / 2, height / 2 + 80, 'SALIR', () => {
            // Salir de pantalla completa
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }
            // Correct exit:
            this.game.events.emit('GAME_EXIT');
        }, { width: 200, height: 60 });

        this.pauseOverlay.add([dim, panelBg, panelBorder, title, resumeBtn, exitBtn]);
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

        // New standard modal style
        const pW = 550;
        const pH = 400;
        const bg = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Panel/panel-001.png', pW, pH, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const border = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Border/panel-border-001.png', pW, pH, 20, 20, 20, 20)
            .setTint(0x3b82f6);

        const title = this.add.text(width / 2, height / 2 - 140, 'INSTRUCCIONES', {
            fontSize: '32px', fontFamily: 'Fredoka', color: '#fbbf24', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2 - 20, this.missionInstructions || 'Sigue las reglas del juego.', {
            fontSize: '20px', color: '#e2e8f0', align: 'center', wordWrap: { width: 450 }, fontFamily: 'Fredoka'
        }).setOrigin(0.5);

        const closeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 120, 'ENTENDIDO', () => {
            panelContainer.destroy();
            if (!wasPaused) this.togglePause();
        }, { width: 200, height: 60 });

        panelContainer.add([dim, bg, border, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;

        let count = 3;
        const countText = this.add.text(width / 2, height / 2, `${count}`, {
            fontSize: '120px',
            fontFamily: 'Fredoka',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
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
                    countText.destroy();
                    timer.remove();
                    this.startGameplay();
                }
            },
            repeat: 3
        });
    }

    private startGameplay() {
        this.startGameTimer();
        this.startSpeedIncrease();
        this.time.delayedCall(1000, () => this.spawnGate());
        this.startDecorativeObstacles();
    }

    private createGround() {
        const { width, height } = this.scale;
        const groundHeight = height * 0.15;

        this.ground = this.add.rectangle(
            width / 2,
            height - groundHeight / 2,
            width,
            groundHeight,
            parseInt(GRAMMAR_RUN_CONFIG.visual.groundColor.replace('#', '0x'))
        );

        this.physics.add.existing(this.ground, true);
    }

    private createPlayer() {
        const { width, height } = this.scale;
        const groundHeight = height * 0.15;

        this.player = this.add.sprite(
            width / 2,
            height - groundHeight - 50,
            'gr_atlas',
            'grammar-run/player/player_run_01'
        );

        this.anims.create({
            key: 'run',
            frames: [
                { key: 'gr_atlas', frame: 'grammar-run/player/player_run_01' },
                { key: 'gr_atlas', frame: 'grammar-run/player/player_run_02' }
            ],
            frameRate: 7,
            repeat: -1
        });

        this.player.play('run');

        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setGravityY(GRAMMAR_RUN_CONFIG.physics.gravity);

        this.physics.add.collider(this.player, this.ground);
    }


    private setupControls() {
        // Keyboard controls
        this.input.keyboard?.on('keydown-LEFT', () => this.changeLane(-1));
        this.input.keyboard?.on('keydown-RIGHT', () => this.changeLane(1));
        this.input.keyboard?.on('keydown-A', () => this.changeLane(-1));
        this.input.keyboard?.on('keydown-D', () => this.changeLane(1));
    }

    private changeLane(direction: number) {
        if (this.isGameOver) return;

        const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
        if (newLane !== this.currentLane) {
            this.currentLane = newLane;
            this.movePlayerToLane();
            this.highlightSelectedGate();
        }
    }

    private movePlayerToLane() {
        const { width } = this.scale;
        const laneWidth = width / 3;
        const targetX = laneWidth * this.currentLane + laneWidth / 2;

        // Visual Jump effect
        this.player.stop(); // Pause run animation
        this.player.setFrame('grammar-run/player/player_jump'); // Show jump frame

        // Horizontal movement
        this.tweens.add({
            targets: this.player,
            x: targetX,
            duration: 200,
            ease: 'Power2',
        });

        // Vertical hop
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 25,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeOut',
            onComplete: () => {
                if (!this.isGameOver) {
                    this.player.play('run'); // Resume running
                }
            }
        });
    }

    private highlightSelectedGate() {
        this.currentQuestionGates.forEach(gate => {
            if (gate.lane === this.currentLane) {
                this.tweens.add({
                    targets: gate.container,
                    scale: 1.06,
                    duration: 150,
                    ease: 'Back.easeOut'
                });
            } else {
                this.tweens.add({
                    targets: gate.container,
                    scale: 1.0,
                    duration: 150
                });
            }
        });
    }

    private startGameTimer() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true,
        });
    }

    private updateTimer() {
        // Count UP instead of down - timer no longer ends the game
        this.timeElapsed++;
        if (this.hud) {
            this.hud.update({ timeRemaining: this.timeElapsed });
        }
    }

    private startSpeedIncrease() {
        this.speedIncreaseTimer = this.time.addEvent({
            delay: 10000,
            callback: () => {
                this.currentSpeed *= (1 + this.resolvedConfig.pacing.speed_increment);
            },
            callbackScope: this,
            loop: true,
        });
    }

    private startDecorativeObstacles() {
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (!this.isGameOver) {
                    this.spawnDecorativeObstacle();
                }
            },
            loop: true
        });
    }

    private spawnDecorativeObstacle() {
        const { width, height } = this.scale;
        const side = Phaser.Math.Between(0, 1);
        const x = side === 0 ? 50 : width - 50;
        const frame = Phaser.Math.Between(0, 1) === 0 ? 'grammar-run/obstacles/obs_box' : 'grammar-run/obstacles/obs_spike';

        const obstacle = this.add.image(x, -50, 'gr_atlas', frame)
            .setAlpha(0.6)
            .setScale(0.8);

        this.physics.add.existing(obstacle);
        const body = obstacle.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(this.currentSpeed * 0.8);

        this.obstacles.push(obstacle);
    }

    private spawnGate() {
        // Check if all questions completed - END THE GAME
        if (this.contentIndex >= this.questions.length) {
            console.log('[GrammarRun] All questions completed! Ending game.');
            if (!this.isGameOver) {
                // Delay to allow final gate animation
                this.time.delayedCall(2000, () => {
                    this.endGame('all_questions');
                });
            }
            return;
        }

        if (this.isGameOver) return;
        if (this.isWaitingForNextQuestion) return;

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
            console.error('[GrammarRun] No correct option found for question:', question.questionId);
            this.prepareNextQuestion();
            return;
        }

        let wrongOptions = question.options.filter(opt => !opt.isCorrect);
        Phaser.Utils.Array.Shuffle(wrongOptions);
        wrongOptions = wrongOptions.slice(0, 2);

        const roundOptions = [
            { option: correctOption, isCorrect: true },
            ...wrongOptions.map(opt => ({ option: opt, isCorrect: false }))
        ];
        Phaser.Utils.Array.Shuffle(roundOptions);

        roundOptions.forEach((optData, index) => {
            const gate = this.createGateInLane(index, y, gateWidth, gateHeight, question, optData.option);
            this.currentQuestionGates.push(gate);
        });
    }

    private prepareNextQuestion() {
        if (this.isGameOver) return;

        this.isWaitingForNextQuestion = false;
        this.currentQuestionGates = [];

        // Delay before next question to let the screen clear and give student a breather
        const delay = (this.resolvedConfig.pacing.spawn_rate * 1000);
        this.nextQuestionTimer = this.time.delayedCall(delay, () => this.spawnGate());
    }

    private updatePromptUI(text: string) {
        if (!this.promptText || !this.promptBg) return;

        // Animate transition
        this.tweens.add({
            targets: this.promptContainer,
            alpha: 0,
            y: 100,
            duration: 200,
            onComplete: () => {
                this.promptText.setText(text);
                this.promptBg.setDisplaySize(Math.max(this.scale.width * 0.7, this.promptText.width + 80), 100);

                this.tweens.add({
                    targets: this.promptContainer,
                    alpha: 1,
                    y: 120,
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            }
        });
    }

    private createGateInLane(
        lane: number,
        y: number,
        width: number,
        height: number,
        question: GrammarQuestion,
        option: GrammarOption
    ) {
        const { width: screenWidth } = this.scale;
        const laneWidth = screenWidth / 3;
        const x = laneWidth * lane + laneWidth / 2;

        const isCorrect = option.isCorrect;
        const gateFrame = lane === 0 ? 'grammar-run/gates/gate_left' :
            lane === 2 ? 'grammar-run/gates/gate_right' :
                'grammar-run/gates/gate_center';

        const container = this.add.container(x, y);

        const gateSprite = this.add.image(0, 0, 'gr_atlas', gateFrame)
            .setDisplaySize(width * 0.6, height * 0.6);
        // .setTint(isCorrect ? 0x10b981 : 0xef4444); // User requested to remove this hint

        const textObj = this.add.text(0, 0, option.optionText, {
            fontSize: '18px',
            fontFamily: 'Fredoka',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width * 0.75 },
            backgroundColor: '#00000088',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        container.add([gateSprite, textObj]);

        this.physics.add.existing(container);
        const body = container.body as Phaser.Physics.Arcade.Body;
        body.setSize(width * 0.85, height * 0.8);
        body.setVelocityY(this.currentSpeed);

        const gate: Gate = {
            container: container,
            sprite: gateSprite,
            textObj: textObj,
            question: question,
            option: option,
            lane: lane
        };

        this.gates.push(gate);

        this.physics.add.overlap(this.player, container, () => {
            this.handleGatePass(gate);
        });

        return gate;
    }

    private handleGatePass(gate: Gate) {
        if (!this.gates.includes(gate)) return;
        if (this.hasRespondedToCurrentQuestion) return;

        this.hasRespondedToCurrentQuestion = true;

        const gatesToRemove = [...this.currentQuestionGates];

        if (this.currentLane === gate.lane) {
            if (gate.option.isCorrect) {
                this.handleCorrectGate(gate);
            } else {
                this.handleWrongGate(gate);
            }
        }

        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: this.promptContainer,
                alpha: 0,
                duration: 200
            });

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

        // Tint green for feedback
        gate.sprite.setTint(0x10b981);

        const checkIcon = this.add.image(gate.container.x, gate.container.y, 'ui_atlas', 'common-ui/fx/fx_check')
            .setScale(3)
            .setDepth(100);

        this.tweens.add({
            targets: checkIcon,
            scale: 5,
            alpha: 0,
            duration: 500,
            onComplete: () => checkIcon.destroy()
        });

        this.cameras.main.flash(200, 16, 185, 129);

        const timeSpent = this.questionStartTime > 0
            ? Math.round((Date.now() - this.questionStartTime) / 1000)
            : 0;

        if (this.resolvedConfig.scoring.streak_bonus && this.streak >= 3) {
            const bonus = Math.floor(this.streak / 3) * 5;
            this.score += bonus;
            this.showFloatingText(gate.container.x, gate.container.y - 30, `STREAK +${bonus}!`, '#8b5cf6');
        }

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, true);

            this.sessionManager.recordItem({
                id: gate.question.questionId,
                text: gate.question.questionText,
                result: 'correct',
                user_input: gate.option.optionText,
                correct_answer: gate.question.correctOption,
                time_ms: timeSpent * 1000,
                meta: {
                    item_id: gate.question.questionId,
                    prompt: gate.question.questionText,
                    expected: gate.question.correctOption,
                    user_answer: gate.option.optionText,
                    is_correct: true,
                    attempts: 1,
                    time_seconds: timeSpent,
                    tags: gate.question.ruleTag ? [gate.question.ruleTag] : [],
                    rule_tag: gate.question.ruleTag,
                    feedback: "Correct!",
                    explanation: gate.question.explanation || null,
                    level: gate.question.level || null,
                    streak: this.streak,
                    points_earned: points
                }
            });
        }

        this.showFloatingText(gate.container.x, gate.container.y, `+${points}`, '#10b981');
        this.updateUI();

        if (this.correctCount + this.wrongCount >= this.resolvedConfig.items_limit) {
            this.time.delayedCall(500, () => this.endGame('completed'));
        } else if (this.contentIndex >= this.questions.length) {
            this.time.delayedCall(500, () => this.endGame('all_questions'));
        }
    }

    private handleWrongGate(gate: Gate) {
        const points = this.resolvedConfig.scoring.points_wrong;
        this.score += points;
        if (this.score < 0) this.score = 0; // Configured to never go below zero

        this.wrongCount++;
        this.streak = 0;

        const crossIcon = this.add.image(gate.container.x, gate.container.y, 'ui_atlas', 'common-ui/fx/fx_cross')
            .setScale(3)
            .setDepth(100);

        // Highlight the CORRECT gate to teach the player
        this.currentQuestionGates.forEach(g => {
            if (g.option.isCorrect) {
                // Tint green
                g.sprite.setTint(0x10b981);
                // Also show a checkmark on the correct one
                const correctCheck = this.add.image(g.container.x, g.container.y, 'ui_atlas', 'common-ui/fx/fx_check')
                    .setScale(2)
                    .setDepth(99);

                this.tweens.add({
                    targets: correctCheck,
                    scale: 3,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => correctCheck.destroy()
                });
            } else if (g === gate) {
                // Tint the wrong chosen one red
                g.sprite.setTint(0xef4444);
            }
        });

        this.tweens.add({
            targets: crossIcon,
            scale: 5,
            alpha: 0,
            duration: 500,
            onComplete: () => crossIcon.destroy()
        });

        this.cameras.main.flash(200, 239, 68, 68);
        this.cameras.main.shake(200, 0.005);

        const timeSpent = this.questionStartTime > 0
            ? Math.round((Date.now() - this.questionStartTime) / 1000)
            : 0;

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, false);

            this.sessionManager.recordItem({
                id: gate.question.questionId,
                text: gate.question.questionText,
                result: 'wrong',
                user_input: gate.option.optionText,
                correct_answer: gate.question.correctOption,
                time_ms: timeSpent * 1000,
                meta: {
                    item_id: gate.question.questionId,
                    prompt: gate.question.questionText,
                    expected: gate.question.correctOption,
                    user_answer: gate.option.optionText,
                    is_correct: false,
                    attempts: 1,
                    time_seconds: timeSpent,
                    tags: gate.question.ruleTag ? [gate.question.ruleTag] : [],
                    rule_tag: gate.question.ruleTag,
                    feedback: gate.question.explanation || "Incorrect. The correct answer is: " + gate.question.correctOption,
                    explanation: gate.question.explanation || null,
                    level: gate.question.level || null,
                    streak: 0,
                    points_earned: points,
                }
            });
        }

        this.showFloatingText(gate.container.x, gate.container.y, `${points}`, '#ef4444');
        this.updateUI();

        if (this.correctCount + this.wrongCount >= this.resolvedConfig.items_limit) {
            this.time.delayedCall(500, () => this.endGame('completed'));
        } else if (this.contentIndex >= this.questions.length) {
            this.time.delayedCall(500, () => this.endGame('all_questions'));
        }
    }

    private removeGate(gate: Gate) {
        const index = this.gates.indexOf(gate);
        if (index > -1) {
            this.gates.splice(index, 1);
        }

        const bunchIndex = this.currentQuestionGates.indexOf(gate);
        if (bunchIndex > -1) {
            this.currentQuestionGates.splice(bunchIndex, 1);
        }

        gate.container.destroy();
    }

    private showFloatingText(x: number, y: number, text: string, color: string) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '32px',
            color: color,
            fontFamily: 'Fredoka',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                floatingText.destroy();
            },
        });
    }

    private updateUI() {
        if (this.hud) {
            this.hud.update({
                score: Math.max(0, this.score),
                timeRemaining: this.timeElapsed
            });
        }
    }

    /**
     * Generate review based on attempts and tags
     */
    private generateReview() {
        const sessionData = this.sessionManager?.getSessionData();
        if (!sessionData || sessionData.items.length === 0) {
            return {
                strengths: [],
                improvements: [],
                recommended_practice: "Continue practicing grammar rules."
            };
        }

        // Analyze by tags
        const tagStats: Record<string, { correct: number; wrong: number; total: number }> = {};

        sessionData.items.forEach(item => {
            const tags = item.meta?.tags || [];
            const isCorrect = item.result === 'correct';

            tags.forEach((tag: string) => {
                if (!tagStats[tag]) {
                    tagStats[tag] = { correct: 0, wrong: 0, total: 0 };
                }
                tagStats[tag].total++;
                if (isCorrect) {
                    tagStats[tag].correct++;
                } else {
                    tagStats[tag].wrong++;
                }
            });
        });

        // Calculate accuracy per tag
        const tagAccuracy = Object.entries(tagStats).map(([tag, stats]) => ({
            tag,
            accuracy: (stats.correct / stats.total) * 100,
            correct: stats.correct,
            wrong: stats.wrong,
            total: stats.total
        }));

        // Sort by accuracy
        tagAccuracy.sort((a, b) => b.accuracy - a.accuracy);

        // Strengths: tags with >= 70% accuracy
        const strengths = tagAccuracy
            .filter(t => t.accuracy >= 70 && t.total >= 2)
            .slice(0, 3)
            .map(t => ({
                tag: t.tag,
                accuracy: Math.round(t.accuracy),
                message: `Great work with ${t.tag.replace(/_/g, ' ')}! (${t.correct}/${t.total} correct)`
            }));

        // Improvements: tags with < 70% accuracy
        const improvements = tagAccuracy
            .filter(t => t.accuracy < 70 && t.total >= 2)
            .slice(0, 3)
            .map(t => ({
                tag: t.tag,
                accuracy: Math.round(t.accuracy),
                message: `Practice more ${t.tag.replace(/_/g, ' ')} (${t.correct}/${t.total} correct)`
            }));

        // Recommended practice: worst performing tag
        const worstTag = tagAccuracy.find(t => t.accuracy < 70 && t.total >= 2);
        const recommended_practice = worstTag
            ? `Repasar: ${worstTag.tag.replace(/_/g, ' ')}`
            : "Continue practicing all grammar rules.";

        return {
            strengths,
            improvements,
            recommended_practice
        };
    }


    private async endGame(reason: 'time' | 'lives' | 'completed' | 'all_questions' = 'completed') {
        if (this.isGameOver) return;

        this.isGameOver = true;

        console.log(`[GrammarRun] Game ended. Reason: ${reason}`);

        // Stop timers
        if (this.gameTimer) this.gameTimer.remove();
        if (this.speedIncreaseTimer) this.speedIncreaseTimer.remove();
        if (this.nextQuestionTimer) this.nextQuestionTimer.remove();

        // Clear gates
        this.gates.forEach(gate => {
            gate.container.destroy();
        });
        this.gates = [];
        this.currentQuestionGates = [];

        // Generate review
        const review = this.generateReview();

        // Get session data
        const sessionData = this.sessionManager?.getSessionData();
        const duration = this.sessionManager?.getDuration() || 0;
        const accuracy = sessionData
            ? Math.round((sessionData.correctCount / (sessionData.correctCount + sessionData.wrongCount)) * 100) || 0
            : 0;

        // Perfect Flow Calculation (Bonus condition: No wrong answers and at least 5 correct)
        const perfectFlow = this.wrongCount === 0 && this.correctCount >= 5;

        // Build standardized details
        const details = {
            summary: {
                score_raw: this.score,
                score_final: this.score + (perfectFlow ? 500 : 0), // Bonus points
                duration_seconds: duration,
                correct_count: sessionData?.correctCount || 0,
                wrong_count: sessionData?.wrongCount || 0,
                accuracy: accuracy,
                completed: true,
                end_reason: reason,
                streak_best: this.bestStreak
            },
            breakdown: {
                attempts: sessionData?.items || [],
                total_questions: this.questions.length,
                questions_answered: (sessionData?.correctCount || 0) + (sessionData?.wrongCount || 0),
                time_per_question: duration > 0 && sessionData?.items.length
                    ? Math.round(duration / sessionData.items.length)
                    : 0
            },
            review: review
        };

        // Event Payload
        // Calcular score normalizado sobre 10 basado en precisión
        const normalizedScore = Math.round((accuracy / 100) * 10 * 10) / 10;

        const gameOverPayload = {
            score: normalizedScore,           // Nota sobre 10 (ej: 8.5/10)
            scoreRaw: this.score,             // Puntos brutos para estadísticas
            correctCount: sessionData?.correctCount || 0,
            wrongCount: sessionData?.wrongCount || 0,
            durationSeconds: duration,
            accuracy: accuracy,
            details: details,
            answers: sessionData?.items.map(item => ({
                item_id: item.id,
                prompt: item.text,
                student_answer: item.user_input || '',
                correct_answer: item.correct_answer || '',
                is_correct: item.result === 'correct',
                meta: { ...item.meta, time_ms: item.time_ms }
            })) || []
        };

        // Show Modal
        this.createMissionCompleteModal({
            correct: this.correctCount,
            total: this.resolvedConfig.items_limit,
            accuracy: accuracy,
            perfectFlow: perfectFlow,
            reason: reason,
            eventData: gameOverPayload
        });
    }

    private createMissionCompleteModal(stats: any) {
        console.log('[GrammarRun] Creating Mission Complete Modal', stats);
        const { width, height } = this.cameras.main;

        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setDepth(19999).setInteractive().setScrollFactor(0);

        const container = this.add.container(width / 2, height / 2).setDepth(20000).setScrollFactor(0);

        // Background & Border from modals_atlas (glass effect)
        const bgWidth = 540;
        const bgHeight = 440;
        const panelBg = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Panel/panel-001.png', bgWidth, bgHeight, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Border/panel-border-001.png', bgWidth, bgHeight, 20, 20, 20, 20)
            .setTint(0x3b82f6);

        container.add([panelBg, panelBorder]);

        // TITLE - Reduced and repositioned
        const title = this.add.text(0, -155, 'MISSION COMPLETE', {
            fontSize: '36px', fontFamily: 'Fredoka', color: '#fbbf24', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        // MAIN STATS (Centered) - Reduced and repositioned
        const sText = this.add.text(0, -30, `Sentences: ${stats.correct}/${stats.total}`, {
            fontSize: '26px', fontFamily: 'Fredoka', color: '#ffffff', align: 'center', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        const aText = this.add.text(0, 25, `Accuracy: ${stats.accuracy}%`, {
            fontSize: '26px', fontFamily: 'Fredoka', color: '#fbbf24', align: 'center', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        // RANK
        let rankLabel = 'NOVICE';
        let rankIcon = '🌱';
        if (stats.accuracy >= 90) { rankLabel = 'MASTER'; rankIcon = '👑'; }
        else if (stats.accuracy >= 70) { rankLabel = 'EXPERT'; rankIcon = '🎓'; }
        else if (stats.accuracy >= 50) { rankLabel = 'ROOKIE'; rankIcon = '⭐'; }

        const rText = this.add.text(0, 75, `RANK: ${rankIcon} ${rankLabel}`, {
            fontSize: '22px', fontFamily: 'Fredoka', color: '#ffffff', align: 'center', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        // BUTTONS - smaller
        const btnY = 135;

        // RESULTS
        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', -130, btnY, 'RESULTS', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }

            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error(e));
            }

            this.tweens.add({
                targets: container, scale: 0, duration: 300,
                onComplete: () => {
                    this.events.emit('gameOver', stats.eventData);
                    this.events.emit('game-over', stats.eventData);
                    this.events.emit('GAME_OVER', stats.eventData);
                    this.game.events.emit('gameOver', stats.eventData);
                    this.game.events.emit('game-over', stats.eventData);
                    this.game.events.emit('GAME_OVER', stats.eventData);
                }
            });
        }, { width: 190, height: 55 });

        // REPEAT
        const replayBtn = createButton(this, 'common-ui/buttons/btn_primary', 130, btnY, 'REPEAT', () => {
            this.tweens.add({
                targets: container,
                scale: 0,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.initData) {
                        this.scene.restart(this.initData);
                    } else {
                        this.scene.restart();
                    }
                }
            });
        }, { width: 220, height: 70 });

        container.add([title, sText, aText, rText, exitBtn, replayBtn]);

        container.setScale(0);
        this.tweens.add({ targets: container, scale: 1, duration: 500, ease: 'Back.out' });
    }





    private handleMissedQuestion() {
        if (!this.currentQuestionData) return;

        console.log('[GrammarRun] Round missed - No selection made');

        const points = this.resolvedConfig.scoring.points_wrong || -5;
        this.score += points;
        if (this.score < 0) this.score = 0;
        this.wrongCount++;
        this.streak = 0;

        // Visual feedback for missing
        this.showFloatingText(this.cameras.main.width / 2, this.cameras.main.height / 2, 'MISSED!', '#ef4444');
        this.cameras.main.shake(300, 0.005);

        // Record in session
        if (this.sessionManager) {
            this.sessionManager.updateScore(points, false);
            this.sessionManager.recordItem({
                id: this.currentQuestionData.questionId,
                text: this.currentQuestionData.questionText,
                result: 'wrong', // Counting miss as wrong
                user_input: '[TIMEOUT/MISSED]',
                correct_answer: this.currentQuestionData.correctOption,
                time_ms: (this.resolvedConfig.pacing.spawn_rate * 1000),
                meta: {
                    is_correct: false,
                    feedback: "Time up! You didn't select an option.",
                    points_earned: points
                }
            });
        }

        this.updateUI();

        // Hide prompt
        this.tweens.add({
            targets: this.promptContainer,
            alpha: 0,
            duration: 200
        });
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        // Update distance
        this.distance += (this.currentSpeed * delta) / 1000;

        // Update gates position and remove off-screen gates
        let gatesOffScreen = false;
        this.gates.forEach(gate => {
            if (gate.container.y > this.cameras.main.height + 100) {
                this.removeGate(gate);
                gatesOffScreen = true;
            }
        });

        this.obstacles = this.obstacles.filter(obs => {
            if (obs.y > this.cameras.main.height + 100) {
                obs.destroy();
                return false;
            }
            return true;
        });

        // If gates went off screen and we were waiting, trigger next question
        if (gatesOffScreen && this.currentQuestionGates.length === 0 && this.isWaitingForNextQuestion) {
            // If they didn't respond before gates left, it's a "Missed"
            if (!this.hasRespondedToCurrentQuestion) {
                this.handleMissedQuestion();
            }
            this.prepareNextQuestion();
        }

        // Update UI periodically
        if (Math.floor(time / 100) % 5 === 0) {
            this.updateUI();
        }
    }
}
