/**
 * GrammarRunScene - Endless runner game for grammar practice
 * Rediseñado con sistema de atlas profesional
 */

import * as Phaser from 'phaser';
import { GRAMMAR_RUN_CONFIG, resolveGrammarRunConfig } from './grammarRun.config';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { createPanel, showFeedback, showGlow, showBurst, showToast } from './UIKit';
import type { GameContent, MissionConfig, GrammarQuestion, GrammarOption } from '@/types';
import type { GameSessionManager } from './GameSessionManager';
import { loadGrammarRunContent, validateGrammarRunContent } from './gameLoader.utils';

interface Gate {
    sprite: Phaser.GameObjects.Image; // Ahora usa sprites del atlas
    textObj: Phaser.GameObjects.Text;
    question: GrammarQuestion;
    option: GrammarOption;
    lane: number;
    container: Phaser.GameObjects.Container; // Para agrupar sprite + text
}

export class GrammarRunScene extends Phaser.Scene {
    private questions: GrammarQuestion[] = [];
    private sessionManager: GameSessionManager | null = null;
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: MissionConfig | null = null;
    private resolvedConfig: any = null;
    private isPaused: boolean = false;

    // Game objects (ahora usan sprites del atlas)
    private player!: Phaser.GameObjects.Sprite; // Sprite animado del atlas
    private ground!: Phaser.GameObjects.Rectangle;
    private gates: Gate[] = [];
    private obstacles: Phaser.GameObjects.Image[] = []; // Sprites del atlas

    // UI Elements (ahora usan GameHUD y UIKit)
    private gameHUD!: GameHUD;
    private distanceText!: Phaser.GameObjects.Text;
    private streakText!: Phaser.GameObjects.Text;
    private promptContainer!: Phaser.GameObjects.Container;
    private promptPanel!: Phaser.GameObjects.Image; // Panel del atlas
    private promptText!: Phaser.GameObjects.Text;

    // Game state
    private score: number = 0;
    private timeRemaining: number = 0;
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

    // Data for restart
    private initData: any = null;

    init(data: {
        words: GameContent[];
        sessionManager: GameSessionManager;
        missionTitle?: string;
        missionInstructions?: string;
        missionConfig?: MissionConfig;
    }) {
        this.initData = data;
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
        this.timeRemaining = this.resolvedConfig.time_limit_seconds;
        this.distance = 0;
        this.currentLane = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.currentSpeed = this.resolvedConfig.pacing.speed_base * 200; // Refined base speed (was 300)
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
            const { width, height } = this.cameras.main;

            // Set background
            this.cameras.main.setBackgroundColor(GRAMMAR_RUN_CONFIG.visual.backgroundColor);

            // Create ground
            this.createGround();

            // Create player
            this.createPlayer();

            // Create UI (Standard HUD)
            this.createStandardHUD();

            // Setup controls
            this.setupControls();

            // Start Countdown
            this.startCountdown();

            // Enable physics
            this.physics.world.setBounds(0, 0, width, height);

            console.log('[GrammarRun] Scene create() finished successfully');
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[GrammarRun] Critical error in create():', error);
            this.add.text(400, 300, 'Error initializing game', { color: '#ff0000' }).setOrigin(0.5);
        }
    }

    private createStandardHUD() {
        const { width } = this.cameras.main;
        const topBarHeight = 60;

        // Background bar
        this.add.rectangle(width / 2, topBarHeight / 2, width, topBarHeight, 0x000000, 0.7);

        // Score
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#10b981',
            fontStyle: 'bold'
        });

        // Time
        this.timerText = this.add.text(width / 2, 20, `TIME: ${this.timeRemaining}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // Distance
        this.distanceText = this.add.text(width - 20, 20, '0m', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#fbbf24',
            fontStyle: 'bold'
        }).setOrigin(1, 0);

        // Instruction below HUD
        this.add.text(width / 2, topBarHeight + 20, 'ARROWS: SELECT CORRECT GRAMMAR', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fbbf24',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Streak (if enabled)
        if (this.resolvedConfig.ui.show_streak) {
            this.streakText = this.add.text(20, 45, 'STREAK: 0', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#8b5cf6',
                fontStyle: 'bold'
            });
        }

        // Progress (if enabled)
        if (this.resolvedConfig.ui.show_progress) {
            this.progressText = this.add.text(width / 2, 50, `0/${this.questions.length}`, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#94a3b8',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);
        }

        // --- PROMPT PANEL (The "Why" of the game) ---
        this.createPromptPanel();

        // Help Button
        if (this.resolvedConfig.hud_help_enabled) {
            const helpBtnX = width - 150;
            const helpBtnBg = this.add.circle(helpBtnX, 30, 20, 0x1e293b, 0.8)
                .setDepth(100)
                .setStrokeStyle(2, 0x8b5cf6, 0.5);

            const helpText = this.add.text(helpBtnX, 30, '?', {
                fontSize: '18px',
                fontFamily: 'Arial Black',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

            helpText.on('pointerdown', () => this.showHelpPanel());
        }
    }

    private createPromptPanel() {
        const { width } = this.cameras.main;
        const panelY = 120; // Positioned below HUD and initial instructions

        this.promptContainer = this.add.container(width / 2, panelY).setDepth(50);

        // Premium background for the prompt
        this.promptBg = this.add.rectangle(0, 0, width * 0.8, 60, 0x1e293b, 0.9)
            .setStrokeStyle(3, 0x10b981);

        this.promptText = this.add.text(0, 0, 'GET READY...', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#fbbf24', // Use gold/yellow for prompt
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width * 0.75 }
        }).setOrigin(0.5);

        // Add a "PROMPT:" label above the text
        const promptLabel = this.add.text(0, -35, 'COMPLETE THE SENTENCE:', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#94a3b8',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.promptContainer.add([this.promptBg, promptLabel, this.promptText]);

        // Initial state: hidden until first spawn
        this.promptContainer.setAlpha(0);
    }

    private togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.world.pause();
            if (this.gameTimer) this.gameTimer.paused = true;
            if (this.nextQuestionTimer) this.nextQuestionTimer.paused = true;
            if (this.speedIncreaseTimer) this.speedIncreaseTimer.paused = true;
            this.tweens.pauseAll();
        } else {
            this.physics.world.resume();
            if (this.gameTimer) this.gameTimer.paused = false;
            if (this.nextQuestionTimer) this.nextQuestionTimer.paused = false;
            if (this.speedIncreaseTimer) this.speedIncreaseTimer.paused = false;
            this.tweens.resumeAll();
        }
    }

    private showHelpPanel() {
        if (this.isGameOver) return;
        const wasPaused = this.isPaused;
        if (!wasPaused) this.togglePause();

        const { width, height } = this.cameras.main;
        const panel = this.add.container(0, 0).setDepth(1000);

        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        const bg = this.add.rectangle(width / 2, height / 2, 450, 300, 0x1e293b).setStrokeStyle(2, 0x3b82f6);

        const title = this.add.text(width / 2, height / 2 - 100, 'INSTRUCCIONES', {
            fontSize: '24px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2, this.missionInstructions || 'Sigue las reglas del juego.', {
            fontSize: '16px', color: '#e2e8f0', align: 'center', wordWrap: { width: 380 }
        }).setOrigin(0.5);

        const closeBtnBg = this.add.rectangle(width / 2, height / 2 + 100, 150, 40, 0x3b82f6)
            .setInteractive({ useHandCursor: true });

        const closeBtnText = this.add.text(width / 2, height / 2 + 100, 'CERRAR', {
            fontSize: '16px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        closeBtnBg.on('pointerdown', () => {
            panel.destroy();
            if (!wasPaused) this.togglePause();
        });

        panel.add([dim, bg, title, instructions, closeBtnBg, closeBtnText]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;

        let count = 3;
        const countText = this.add.text(width / 2, height / 2, `${count}`, {
            fontSize: '120px',
            fontFamily: 'Arial',
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
        // Start timers
        this.startGameTimer();
        this.startSpeedIncrease();

        // Spawn first question after a small delay
        this.time.delayedCall(1000, () => this.spawnGate());
    }

    private createGround() {
        const { width, height } = this.cameras.main;
        const groundHeight = 100;

        this.ground = this.add.rectangle(
            width / 2,
            height - groundHeight / 2,
            width,
            groundHeight,
            parseInt(GRAMMAR_RUN_CONFIG.visual.groundColor.replace('#', '0x'))
        );

        this.physics.add.existing(this.ground, true); // Static body
    }

    private createPlayer() {
        const { width, height } = this.cameras.main;
        const playerSize = 40;
        const groundHeight = 100;

        this.player = this.add.rectangle(
            width / 2,
            height - groundHeight - playerSize / 2,
            playerSize,
            playerSize,
            parseInt(GRAMMAR_RUN_CONFIG.visual.playerColor.replace('#', '0x'))
        );

        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setGravityY(GRAMMAR_RUN_CONFIG.physics.gravity);

        // Collision with ground
        this.physics.add.collider(this.player, this.ground);
    }

    private createUI() {
        const { width, height } = this.cameras.main;
        const padding = 20;

        // Score
        this.scoreText = this.add.text(padding, padding, 'SCORE: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 },
        }).setDepth(100);

        // Timer
        this.timerText = this.add.text(width - padding, padding, `TIME: ${this.timeRemaining}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
        }).setOrigin(1, 0).setDepth(100);

        // Distance
        this.distanceText = this.add.text(padding, height - padding - 30, 'Distance: 0m', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
        });

        // Instructions
        this.add.text(width / 2, 80, 'Use ← → to change lanes | Select correct grammar!', {
            fontSize: '18px',
            color: '#fbbf24',
            fontStyle: 'bold',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 },
        }).setOrigin(0.5);
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
        }
    }

    private movePlayerToLane() {
        const { width } = this.cameras.main;
        const laneWidth = width / 3;
        const targetX = laneWidth * this.currentLane + laneWidth / 2;

        this.tweens.add({
            targets: this.player,
            x: targetX,
            duration: 200,
            ease: 'Power2',
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
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.timerText.setText(`TIME: ${this.timeRemaining}`);
        } else {
            this.timerText.setText(`TIME: 0`);
            // Optional: You could stop the timer here, but don't end the game
            if (this.gameTimer) this.gameTimer.remove();
        }
    }

    private startSpeedIncrease() {
        this.speedIncreaseTimer = this.time.addEvent({
            delay: 10000, // Every 10 seconds
            callback: () => {
                this.currentSpeed *= (1 + this.resolvedConfig.pacing.speed_increment);
            },
            callbackScope: this,
            loop: true,
        });
    }

    private spawnGate() {
        if (this.isGameOver || this.contentIndex >= this.questions.length) return;
        if (this.isWaitingForNextQuestion) return;

        const { width } = this.cameras.main;
        const laneWidth = width / 3;
        const gateHeight = 150;
        const gateWidth = laneWidth - 40;
        const y = -gateHeight;

        // Get current question
        const question = this.questions[this.contentIndex];
        this.contentIndex++;
        this.isWaitingForNextQuestion = true;
        this.currentQuestionGates = [];

        // Update Prompt UI
        this.updatePromptUI(question.questionText);
        this.currentQuestionData = question;
        this.hasRespondedToCurrentQuestion = false;

        // Start timing this question
        this.questionStartTime = Date.now();

        // 1. Get correct option
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (!correctOption) {
            console.error('[GrammarRun] No correct option found for question:', question.questionId);
            this.prepareNextQuestion();
            return;
        }

        // 2. Get wrong options (up to 2)
        let wrongOptions = question.options.filter(opt => !opt.isCorrect);
        Phaser.Utils.Array.Shuffle(wrongOptions);
        wrongOptions = wrongOptions.slice(0, 2);

        // 3. Combine and shuffle options for lanes
        const roundOptions = [
            { option: correctOption, isCorrect: true },
            ...wrongOptions.map(opt => ({ option: opt, isCorrect: false }))
        ];
        Phaser.Utils.Array.Shuffle(roundOptions);

        // 4. Create gates in lanes (one for each option)
        roundOptions.forEach((optData, index) => {
            // If we have 2 options, we can put them in index 0 and 2, or random
            // For simplicity, we use consecutive lanes starting from a random point or just 0,1,2
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
                this.promptText.setText(text.toUpperCase());

                // Adjust BG width based on text if needed
                const textWidth = this.promptText.width;
                this.promptBg.width = Math.max(this.cameras.main.width * 0.6, textWidth + 60);

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
        const { width: screenWidth } = this.cameras.main;
        const laneWidth = screenWidth / 3;
        const x = laneWidth * lane + laneWidth / 2;

        const isCorrect = option.isCorrect;
        const color = isCorrect
            ? parseInt(GRAMMAR_RUN_CONFIG.visual.correctGateColor.replace('#', '0x'))
            : parseInt(GRAMMAR_RUN_CONFIG.visual.wrongGateColor.replace('#', '0x'));

        const gateSprite = this.add.rectangle(x, y, width, height, color, 0.3);
        gateSprite.setStrokeStyle(4, color);

        this.physics.add.existing(gateSprite);
        const body = gateSprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(this.currentSpeed);

        // Add text (show the option text)
        const textObj = this.add.text(x, y, option.optionText, {
            fontSize: `${GRAMMAR_RUN_CONFIG.visual.fontSize}px`,
            color: isCorrect ? '#10b981' : '#ef4444',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 20 },
        }).setOrigin(0.5);

        const gate: Gate = {
            sprite: gateSprite,
            textObj: textObj,
            question: question,
            option: option,
            lane: lane,
        };

        this.gates.push(gate);

        // Setup overlap detection
        this.physics.add.overlap(this.player, gateSprite, () => {
            this.handleGatePass(gate);
        });

        return gate;
    }

    private handleGatePass(gate: Gate) {
        if (!this.gates.includes(gate)) return; // Already processed
        if (this.hasRespondedToCurrentQuestion) return; // Round already resolved

        this.hasRespondedToCurrentQuestion = true;

        // Resolve round logic: clear ALL gates of this question bunch
        // (This prevents hitting multiple gates in one round)
        const gatesToRemove = [...this.currentQuestionGates];

        // Check if player is in the same lane
        if (this.currentLane === gate.lane) {
            if (gate.option.isCorrect) {
                this.handleCorrectGate(gate);
            } else {
                this.handleWrongGate(gate);
            }
        }

        // Hide prompt immediately after response
        this.tweens.add({
            targets: this.promptContainer,
            alpha: 0,
            duration: 200
        });

        // Remove all gates in this bunch
        gatesToRemove.forEach(g => this.removeGate(g));

        // Trigger next spawn
        this.prepareNextQuestion();
    }

    private handleCorrectGate(gate: Gate) {
        const points = this.resolvedConfig.scoring.points_correct;
        this.score += points;
        this.correctCount++;
        this.streak++;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;

        // Calculate time spent on this question
        const timeSpent = this.questionStartTime > 0
            ? Math.round((Date.now() - this.questionStartTime) / 1000)
            : 0;

        // Streak bonus
        if (this.resolvedConfig.scoring.streak_bonus && this.streak >= 3) {
            const bonus = Math.floor(this.streak / 3) * 5;
            this.score += bonus;
            this.showFloatingText(gate.sprite.x, gate.sprite.y - 30, `STREAK +${bonus}!`, '#8b5cf6');
        }

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, true);

            // Rich breakdown record
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

        // Visual feedback
        this.showFloatingText(gate.sprite.x, gate.sprite.y, `+${points}`, '#10b981');
        this.updateUI();

        // Check if completed all items
        if (this.correctCount + this.wrongCount >= this.resolvedConfig.items_limit) {
            this.time.delayedCall(500, () => this.endGame('completed'));
        } else if (this.contentIndex >= this.questions.length) {
            // All questions answered
            this.time.delayedCall(500, () => this.endGame('all_questions'));
        }
    }

    private handleWrongGate(gate: Gate) {
        const points = this.resolvedConfig.scoring.points_wrong;
        this.score += points;
        this.wrongCount++;
        this.streak = 0; // Reset streak

        // Calculate time spent on this question
        const timeSpent = this.questionStartTime > 0
            ? Math.round((Date.now() - this.questionStartTime) / 1000)
            : 0;

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, false);

            // Rich breakdown record
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

        // Visual feedback
        this.showFloatingText(gate.sprite.x, gate.sprite.y, `${points}`, '#ef4444');
        this.cameras.main.shake(200, 0.005);

        this.updateUI();

        // Check if completed all items
        if (this.correctCount + this.wrongCount >= this.resolvedConfig.items_limit) {
            this.time.delayedCall(500, () => this.endGame('completed'));
        } else if (this.contentIndex >= this.questions.length) {
            // All questions answered
            this.time.delayedCall(500, () => this.endGame('all_questions'));
        }
    }

    private removeGate(gate: Gate) {
        const index = this.gates.indexOf(gate);
        if (index > -1) {
            this.gates.splice(index, 1);
        }

        // Also remove from current bunch tracker
        const bunchIndex = this.currentQuestionGates.indexOf(gate);
        if (bunchIndex > -1) {
            this.currentQuestionGates.splice(bunchIndex, 1);
        }

        gate.sprite.destroy();
        gate.textObj.destroy();
    }

    private showFloatingText(x: number, y: number, text: string, color: string) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '32px',
            color: color,
            fontStyle: 'bold',
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
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.distanceText.setText(`${Math.floor(this.distance)}m`);
        if (this.resolvedConfig.ui.show_streak && this.streakText) {
            this.streakText.setText(`STREAK: ${this.streak}`);
        }
        if (this.resolvedConfig.ui.show_progress && this.progressText) {
            this.progressText.setText(`${this.correctCount + this.wrongCount}/${this.questions.length}`);
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
            gate.sprite.destroy();
            gate.textObj.destroy();
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
        const gameOverPayload = {
            scoreRaw: this.score,
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
        const { width, height } = this.cameras.main;
        const container = this.add.container(width / 2, height / 2)
            .setDepth(2000)
            .setScrollFactor(0);

        // 1. DIMMER (Interactive to block clicks)
        const dimmer = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setInteractive()
            .setDepth(1999)
            .setScrollFactor(0);

        // 2. MODAL BACKGROUND (Box)
        const bgWidth = 600;
        const bgHeight = 500;

        const bg = this.add.rectangle(0, 0, bgWidth, bgHeight, 0x1e293b) // Slate 800
            .setStrokeStyle(4, 0xfbbf24); // Gold border

        // 3. TITLE
        const titleText = stats.reason === 'completed' || stats.reason === 'all_questions'
            ? 'MISSION COMPLETE'
            : 'GAME OVER';

        const title = this.add.text(0, -bgHeight / 2 + 60, titleText, {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#fbbf24', // Gold
            align: 'center',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        // Separator line
        const separator = this.add.rectangle(0, -bgHeight / 2 + 100, 300, 2, 0xfbbf24, 0.5);

        // 4. STATS
        const statsStartY = -50;
        const lineHeight = 50;

        // Sentences
        const sentencesText = this.add.text(0, statsStartY, `SENTENCES: ${stats.correct}/${stats.total}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Perfect Flow
        const flowStatus = stats.perfectFlow ? 'ACTIVE' : 'INACTIVE';
        const flowColor = stats.perfectFlow ? '#10b981' : '#94a3b8'; // Green or Slate
        const flowText = this.add.text(0, statsStartY + lineHeight, `PERFECT FLOW BONUS: ${flowStatus}`, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: flowColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Rank Calculation
        let rank = 'NOVICE';
        let icon = '🌱';
        if (stats.accuracy >= 100) { rank = 'SCHOLAR'; icon = '✒️'; }
        else if (stats.accuracy >= 80) { rank = 'EXPERT'; icon = '🎓'; }
        else if (stats.accuracy >= 50) { rank = 'APPRENTICE'; icon = '📚'; }

        const rankText = this.add.text(0, statsStartY + lineHeight * 2, `RANK: ${icon} ${rank}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#fbbf24',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // 5. BUTTONS
        const btnY = bgHeight / 2 - 80;

        // Summary Button (Left)
        const summaryBtn = this.createButton(-140, btnY, 'SUMMARY', 0x3b82f6, () => {
            // Animate out
            this.tweens.add({
                targets: container,
                scale: 0,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.events.emit('gameOver', stats.eventData);
                }
            });
        });

        // Repeat Button (Right)
        const repeatBtn = this.createButton(140, btnY, 'REPEAT', 0x10b981, () => {
            this.tweens.add({
                targets: container,
                scale: 0,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.initData) {
                        this.scene.restart(this.initData);
                    } else {
                        // Fallback
                        this.scene.restart();
                    }
                }
            });
        });

        container.add([bg, title, separator, sentencesText, flowText, rankText, ...summaryBtn, ...repeatBtn]);

        // Appear animation
        container.setScale(0);
        container.setAlpha(0);

        this.tweens.add({
            targets: container,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.out'
        });
    }

    private createButton(x: number, y: number, text: string, color: number, callback: () => void) {
        const width = 180;
        const height = 60;

        const bg = this.add.rectangle(x, y, width, height, color)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(3, 0xffffff);

        const shadow = this.add.rectangle(x + 5, y + 5, width, height, 0x000000, 0.3);

        const label = this.add.text(x, y, text, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        label.setInteractive({ useHandCursor: true });

        const onClick = () => {
            this.tweens.add({
                targets: [bg, label, shadow],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        };

        const onOver = () => {
            bg.setFillStyle(color, 0.8);
            this.tweens.add({
                targets: [bg, label, shadow],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        };

        const onOut = () => {
            bg.setFillStyle(color, 1);
            this.tweens.add({
                targets: [bg, label, shadow],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        };

        bg.on('pointerdown', onClick);
        label.on('pointerdown', onClick);

        bg.on('pointerover', onOver);
        bg.on('pointerout', onOut);

        label.on('pointerover', onOver);
        label.on('pointerout', onOut);

        return [shadow, bg, label];
    }




    private handleMissedQuestion() {
        if (!this.currentQuestionData) return;

        console.log('[GrammarRun] Round missed - No selection made');

        const points = this.resolvedConfig.scoring.points_wrong || -5;
        this.score += points;
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
            gate.textObj.y = gate.sprite.y;

            if (gate.sprite.y > this.cameras.main.height + 100) {
                this.removeGate(gate);
                gatesOffScreen = true;
            }
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
