import Phaser from 'phaser';
import { WORD_CATCHER_CONFIG, resolveWordCatcherConfig } from './wordCatcher.config';
import { preloadWordCatcherAssets } from './assets.config';
import { buildGameDataset, type PreparedGameItem, type GameDataset } from './gameLoader.utils';
import { AnswerTracker } from './answerTracker';
import type { GameContent, MissionConfig } from '@/types/game.types';
import type { GameSessionManager } from './GameSessionManager';

interface WordSprite extends Phaser.GameObjects.Sprite {
    wordData: PreparedGameItem;
    parentContainer: Phaser.GameObjects.Container;
    isClicked?: boolean;
}

export class WordCatcherScene extends Phaser.Scene {
    // Game data
    private gameDataset!: GameDataset;
    private answerTracker!: AnswerTracker;
    private activeWords: WordSprite[] = [];
    private wordIndex: number = 0;

    // Game state
    private score: number = 0;
    private timeRemaining: number = 0;
    private isGameOver: boolean = false;
    private isPaused: boolean = false;
    private gameStartTime: number = 0;

    // Configuration
    private sessionManager: GameSessionManager | null = null;
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: MissionConfig | null = null;
    private resolvedConfig: any = null;

    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private correctText!: Phaser.GameObjects.Text;
    private pauseOverlay!: Phaser.GameObjects.Container;

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;
    private spawnTimer!: Phaser.Time.TimerEvent;

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
        this.timeRemaining = this.resolvedConfig.time_limit_seconds;
        this.isGameOver = false;
        this.isPaused = false;
        this.wordIndex = 0;
        this.activeWords = [];
        this.gameStartTime = Date.now();
    }

    preload() {
        const assetPack = this.resolvedConfig.asset_pack || 'kenney-ui-1';
        preloadWordCatcherAssets(this, assetPack);
    }

    create() {
        try {
            const { width, height } = this.cameras.main;

            // 1. Fondo (Fijo y limpio)
            const bg = this.add.image(width / 2, height / 2, 'wc-bg');
            const scale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(scale).setScrollFactor(0);

            // 2. HUD
            this.createStandardHUD();

            // 3. Pausa
            this.createPauseOverlay();

            // 4. Inputs
            this.input.on('gameobjectdown', this.onWordClicked, this);
            this.input.keyboard?.on('keydown-P', () => this.togglePause());

            // 5. Countdown
            this.startCountdown();

            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[WordCatcher] Error en Create:', error);
        }
    }

    private createStandardHUD() {
        const { width } = this.cameras.main;
        const hudDepth = 1000;
        const padding = 20;

        // Banner Superior LIMPID (Más profesional)
        const bannerBg = this.add.rectangle(width / 2, 45, width * 0.98, 80, 0x000000, 0.6)
            .setDepth(hudDepth)
            .setStrokeStyle(3, 0x3b82f6, 0.8);

        // IZQUIERDA: Score
        this.scoreText = this.add.text(padding + 20, 30, `SCORE: ${this.score}`, {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#60a5fa', stroke: '#000000', strokeThickness: 4
        }).setDepth(hudDepth + 1);

        this.correctText = this.add.text(padding + 20, 60, 'CAUGHT: 0', {
            fontSize: '18px', fontFamily: 'Arial Black', color: '#34d399', stroke: '#000000', strokeThickness: 3
        }).setDepth(hudDepth + 1);

        // CENTRO: Timer y Misión
        const timerLabel = this.add.text(width / 2, 35, `${this.timeRemaining}`, {
            fontSize: '48px', fontFamily: 'Arial Black', color: '#fbbf24', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(hudDepth + 1);
        this.timerText = timerLabel;

        const missionText = this.add.text(width / 2, 70, this.missionTitle.toUpperCase(), {
            fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff', backgroundColor: '#3b82f6', padding: { x: 10, y: 3 }
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        // DERECHA: Botones (Pausa y Ayuda)
        let btnX = width - padding - 25;

        const pauseBtn = this.add.image(btnX, 45, 'ui-icon-pause')
            .setDisplaySize(45, 45)
            .setDepth(hudDepth + 1)
            .setInteractive({ useHandCursor: true });
        pauseBtn.on('pointerdown', () => this.togglePause());

        if (this.resolvedConfig.hud_help_enabled) {
            btnX -= 55;
            const helpBtn = this.add.image(btnX, 45, 'ui-icon-help')
                .setDisplaySize(45, 45)
                .setDepth(hudDepth + 1)
                .setInteractive({ useHandCursor: true });
            helpBtn.on('pointerdown', () => this.showHelpPanel());
        }
    }

    private createPauseOverlay() {
        const { width, height } = this.cameras.main;
        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
        dim.setInteractive();

        const panel = this.add.image(width / 2, height / 2, 'ui-panel')
            .setDisplaySize(400, 300);

        const title = this.add.text(width / 2, height / 2 - 60, 'PAUSE', {
            fontSize: '42px', fontFamily: 'Arial Black', color: '#ffffff'
        }).setOrigin(0.5);

        const resumeBtn = this.createButton(width / 2, height / 2 + 60, 'RESUME', () => {
            this.togglePause();
        });

        this.pauseOverlay.add([dim, panel, title, resumeBtn]);
    }

    private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        const bg = this.add.image(0, 0, 'ui-button').setDisplaySize(160, 50).setInteractive({ useHandCursor: true });
        const label = this.add.text(0, 0, text, { fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff' }).setOrigin(0.5);
        container.add([bg, label]);
        bg.on('pointerdown', () => callback());
        bg.on('pointerover', () => bg.setTint(0xdddddd));
        bg.on('pointerout', () => bg.clearTint());
        return container;
    }

    private togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);
        if (this.isPaused) {
            if (this.gameTimer) this.gameTimer.paused = true;
            if (this.spawnTimer) this.spawnTimer.paused = true;
            this.tweens.pauseAll();
        } else {
            if (this.gameTimer) this.gameTimer.paused = false;
            if (this.spawnTimer) this.spawnTimer.paused = false;
            this.tweens.resumeAll();
        }
    }

    private showHelpPanel() {
        const wasPaused = this.isPaused;
        if (!wasPaused) this.togglePause();

        const { width, height } = this.cameras.main;
        const helpOverlay = this.add.container(0, 0).setDepth(3000);
        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();
        const panel = this.add.image(width / 2, height / 2, 'ui-panel').setDisplaySize(500, 400);

        const title = this.add.text(width / 2, height / 2 - 130, 'INSTRUCTIONS', {
            fontSize: '28px', fontFamily: 'Arial Black', color: '#ffffff'
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2, this.missionInstructions || 'Catch the correct items!', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', align: 'center', wordWrap: { width: 400 }
        }).setOrigin(0.5);

        const closeBtn = this.createButton(width / 2, height / 2 + 130, 'READY', () => {
            helpOverlay.destroy();
            if (!wasPaused) this.togglePause();
        });

        helpOverlay.add([dim, panel, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;
        const txt = this.add.text(width / 2, height / 2, '3', {
            fontSize: '120px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 10
        }).setOrigin(0.5).setDepth(1500);

        const timer = this.time.addEvent({
            delay: 1000, repeat: 3,
            callback: () => {
                count--;
                if (count > 0) txt.setText(count.toString());
                else if (count === 0) txt.setText('GO!').setColor('#10b981');
                else {
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
    }

    private updateTimer() {
        if (this.isPaused) return;
        this.timeRemaining--;
        this.timerText.setText(`${this.timeRemaining}`);
        if (this.timeRemaining <= 0) this.endGame();
    }

    private spawnWord() {
        if (this.isGameOver || this.isPaused) return;

        const wordData = this.gameDataset.items[this.wordIndex % this.gameDataset.items.length];
        this.wordIndex++;

        const { width } = this.cameras.main;
        const x = Phaser.Math.Between(80, width - 80);
        const container = this.add.container(x, -100).setDepth(1);

        const texture = wordData.is_correct ? 'wc-token' : 'wc-token-bad';
        // FORZAR TAMAÑO 70x70 para que no se vea gigante
        const sprite = this.add.sprite(0, 0, texture).setDisplaySize(75, 75) as WordSprite;

        const wordText = this.add.text(0, 0, wordData.content_text.toUpperCase(), {
            fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(2);

        container.add([sprite, wordText]);
        sprite.setInteractive({ useHandCursor: true });
        sprite.wordData = wordData;
        sprite.parentContainer = container;

        const fallSpeed = this.resolvedConfig.fall_speed;
        const fallDuration = (this.cameras.main.height + 200) / (fallSpeed / 1000);

        this.tweens.add({
            targets: container,
            y: this.cameras.main.height + 150,
            duration: fallDuration,
            ease: 'Linear',
            onComplete: () => {
                if (container.active) {
                    this.onWordMissed(sprite);
                    container.destroy();
                }
            }
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
        this.answerTracker.recordCorrectCatch(sprite.wordData.content_id, sprite.wordData.content_text);
        this.sessionManager?.updateScore(points, true);
        this.createParticles(sprite.parentContainer.x, sprite.parentContainer.y, 0x10b981);
        sprite.parentContainer.destroy();
        this.updateUI_Stats();
    }

    private handleWrongCatch(sprite: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.wrongCatch;
        this.score += points;
        this.answerTracker.recordDistractorCatch(sprite.wordData.content_id, sprite.wordData.content_text);
        this.sessionManager?.updateScore(points, false);
        this.cameras.main.shake(150, 0.01);
        this.createParticles(sprite.parentContainer.x, sprite.parentContainer.y, 0xef4444);
        sprite.parentContainer.destroy();
        this.updateUI_Stats();
    }

    private onWordMissed(sprite: WordSprite) {
        if (sprite.isClicked) return;
        if (sprite.wordData.is_correct) {
            if (this.resolvedConfig.miss_penalty_enabled) {
                this.score += WORD_CATCHER_CONFIG.scoring.missedWord;
                this.sessionManager?.updateScore(WORD_CATCHER_CONFIG.scoring.missedWord, false);
            }
            this.answerTracker.recordMissedWord(sprite.wordData.content_id, sprite.wordData.content_text);
        } else {
            this.answerTracker.recordAvoidedDistractor(sprite.wordData.content_id, sprite.wordData.content_text);
        }
        this.updateUI_Stats();
    }

    private createParticles(x: number, y: number, tint: number) {
        const p = this.add.particles(x, y, 'wc-particle', {
            speed: { min: 50, max: 150 }, scale: { start: 0.8, end: 0 }, lifespan: 500, quantity: 10, tint: tint
        });
        this.time.delayedCall(500, () => p.destroy());
    }

    private updateUI_Stats() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        const stats = this.answerTracker.getStats();
        this.correctText.setText(`CAUGHT: ${stats.caught}`);
    }

    private endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isPaused = true;
        this.spawnTimer?.remove();
        this.gameTimer?.remove();
        const stats = this.answerTracker.getStats();
        this.events.emit('gameOver', {
            scoreRaw: this.score,
            correctCount: stats.correct,
            wrongCount: stats.wrong,
            durationSeconds: Math.floor((Date.now() - this.gameStartTime) / 1000),
            answers: this.answerTracker.getAnswers()
        });
    }
}