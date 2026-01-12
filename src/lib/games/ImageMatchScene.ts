import Phaser from 'phaser';
import { IMAGE_MATCH_CONFIG, resolveImageMatchConfig } from './imageMatch.config';
import { preloadImageMatchAssets } from './assets.config';
import { AnswerTracker } from './answerTracker';
import type { ImageMatchCard } from './gameLoader.utils';
import type { GameContent, MissionConfig } from '@/types/game.types';
import type { GameSessionManager } from './GameSessionManager';

interface CardObject {
    container: Phaser.GameObjects.Container;
    backSprite: Phaser.GameObjects.Image;
    frontImage?: Phaser.GameObjects.Image;
    frontText?: Phaser.GameObjects.Text;
    frame?: Phaser.GameObjects.Image;
    cardData: ImageMatchCard;
    pairId: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export class ImageMatchScene extends Phaser.Scene {
    // Game data
    private cardsData: ImageMatchCard[] = [];
    private answerTracker!: AnswerTracker;

    // Game state
    private cards: CardObject[] = [];
    private firstPick: CardObject | null = null;
    private secondPick: CardObject | null = null;
    private isProcessing: boolean = false;

    private moves: number = 0;
    private matches: number = 0;
    private streak: number = 0;
    private bestStreak: number = 0;
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
    private pairsText!: Phaser.GameObjects.Text;
    private movesText!: Phaser.GameObjects.Text;
    private pauseOverlay!: Phaser.GameObjects.Container;

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;

    // Fallback Emojis
    private emojiMap: { [key: string]: string } = {
        'cat': '🐱', 'dog': '🐶', 'bird': '🐦', 'fish': '🐟',
        'elephant': '🐘', 'lion': '🦁', 'monkey': '🐵', 'tiger': '🐯',
        'apple': '🍎', 'banana': '🍌', 'pizza': '🍕', 'burger': '🍔',
        'cake': '🍰', 'cookie': '🍪', 'bread': '🍞', 'cheese': '🧀',
        'book': '📚', 'pen': '🖊️', 'phone': '📱', 'computer': '💻',
        'car': '🚗', 'house': '🏠', 'tree': '🌳', 'flower': '🌸',
        'sun': '☀️', 'rain': '🌧️', 'cloud': '☁️', 'snow': '❄️',
        'red': '🔴', 'blue': '🔵', 'green': '🟢', 'yellow': '🟡',
        'run': '🏃', 'walk': '🚶', 'jump': '🦘', 'swim': '🏊',
        'eat': '🍽️', 'drink': '🥤', 'sleep': '😴', 'study': '📖',
    };

    constructor() {
        super({ key: 'ImageMatchScene' });
    }

    init(data: {
        cards?: ImageMatchCard[];
        words?: GameContent[];
        sessionManager: GameSessionManager;
        missionTitle?: string;
        missionInstructions?: string;
        missionConfig?: MissionConfig;
    }) {
        this.cardsData = data.cards || [];
        this.sessionManager = data.sessionManager || null;
        this.missionTitle = data.missionTitle || 'IMAGE MATCH';
        this.missionInstructions = data.missionInstructions || 'Match the images with the correct words!';
        this.missionConfig = data.missionConfig || null;

        this.resolvedConfig = resolveImageMatchConfig(this.missionConfig);
        this.answerTracker = new AnswerTracker();

        this.score = 0;
        this.timeRemaining = this.resolvedConfig.time_limit_seconds || 90;
        this.moves = 0;
        this.matches = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isProcessing = false;
        this.cards = [];
        this.gameStartTime = Date.now();
    }

    preload() {
        const assetPack = this.resolvedConfig.asset_pack || 'kenney-ui-1';
        preloadImageMatchAssets(this, assetPack);

        // Preload content images
        this.cardsData.forEach(card => {
            if (card.kind === 'image' && card.imageUrl) {
                const key = `img_${card.pairId}`;
                if (!this.textures.exists(key)) {
                    this.load.image(key, card.imageUrl);
                }
            }
        });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 1. Background
        const bg = this.add.image(width / 2, height / 2, 'im-bg');
        if (bg.texture.key !== '__MISSING') {
            const scale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(scale).setScrollFactor(0);
        }

        // 2. HUD
        this.createStandardHUD();

        // 3. Cards/Board
        this.createBoard();

        // 4. Pause Overlay
        this.createPauseOverlay();

        // 5. Inputs
        this.input.keyboard?.on('keydown-P', () => this.togglePause());

        // 6. Countdown
        this.startCountdown();

        this.events.emit('scene-ready');
    }

    private createStandardHUD() {
        const { width } = this.cameras.main;
        const hudDepth = 1000;
        const padding = 20;

        const bannerBg = this.add.rectangle(width / 2, 45, width * 0.98, 80, 0x000000, 0.6)
            .setDepth(hudDepth)
            .setStrokeStyle(3, 0x3b82f6, 0.8);

        this.scoreText = this.add.text(padding + 20, 30, `SCORE: ${this.score}`, {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#60a5fa', stroke: '#000000', strokeThickness: 4
        }).setDepth(hudDepth + 1);

        this.movesText = this.add.text(padding + 20, 60, 'MOVES: 0', {
            fontSize: '18px', fontFamily: 'Arial Black', color: '#fbbf24', stroke: '#000000', strokeThickness: 3
        }).setDepth(hudDepth + 1);

        this.timerText = this.add.text(width / 2, 35, `${this.timeRemaining}`, {
            fontSize: '48px', fontFamily: 'Arial Black', color: '#fbbf24', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        this.add.text(width / 2, 70, this.missionTitle.toUpperCase(), {
            fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff', backgroundColor: '#3b82f6', padding: { x: 10, y: 3 }
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;
        this.pairsText = this.add.text(width - padding - 80, 45, `PAIRS: 0/${totalPairs}`, {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#34d399', stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0.5).setDepth(hudDepth + 1);

        const pauseBtn = this.add.image(width - padding - 30, 45, 'ui-icon-pause')
            .setDisplaySize(45, 45)
            .setDepth(hudDepth + 1)
            .setInteractive({ useHandCursor: true });
        pauseBtn.on('pointerdown', () => this.togglePause());

        if (this.resolvedConfig.hud_help_enabled) {
            const helpBtn = this.add.image(width - padding - 30, 85, 'ui-icon-help')
                .setDisplaySize(35, 35)
                .setOrigin(0.5)
                .setDepth(hudDepth + 1)
                .setInteractive({ useHandCursor: true });
            helpBtn.on('pointerdown', () => this.showHelpPanel());
        }
    }

    private createBoard() {
        const { width, height } = this.cameras.main;
        const { rows, cols, cardWidth, cardHeight, cardSpacing } = this.resolvedConfig.grid;

        const gridWidth = cols * cardWidth + (cols - 1) * cardSpacing;
        const gridHeight = rows * cardHeight + (rows - 1) * cardSpacing;
        const startX = (width - gridWidth) / 2 + cardWidth / 2;
        const startY = (height - gridHeight) / 2 + cardHeight / 2 + 40;

        this.cardsData.forEach((cardData, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * (cardWidth + cardSpacing);
            const y = startY + row * (cardHeight + cardSpacing);

            this.createCard(x, y, cardData, cardWidth, cardHeight);
        });
    }

    private createCard(x: number, y: number, cardData: ImageMatchCard, cardWidth: number, cardHeight: number) {
        const container = this.add.container(x, y).setSize(cardWidth, cardHeight);

        const back = this.add.image(0, 0, 'im-card-back').setDisplaySize(cardWidth, cardHeight);
        const frame = this.add.image(0, 0, 'im-card-front-frame').setDisplaySize(cardWidth, cardHeight).setVisible(false);

        let frontContent: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
        if (cardData.kind === 'image') {
            const key = `img_${cardData.pairId}`;
            if (this.textures.exists(key)) {
                frontContent = this.add.image(0, 0, key).setDisplaySize(cardWidth * 0.8, cardHeight * 0.8).setVisible(false);
            } else {
                const emoji = this.emojiMap[cardData.prompt.toLowerCase()] || '🖼️';
                frontContent = this.add.text(0, 0, emoji, { fontSize: '64px' }).setOrigin(0.5).setVisible(false);
            }
        } else {
            frontContent = this.add.text(0, 0, cardData.prompt.toUpperCase(), {
                fontSize: '18px', fontFamily: 'Arial Black', color: '#1e293b', align: 'center', wordWrap: { width: cardWidth - 10 }
            }).setOrigin(0.5).setVisible(false);
        }

        container.add([back, frame, frontContent]);
        container.setInteractive({ useHandCursor: true });

        const cardObj: CardObject = {
            container,
            backSprite: back,
            frontImage: cardData.kind === 'image' && frontContent instanceof Phaser.GameObjects.Image ? frontContent : undefined,
            frontText: cardData.kind === 'word' && frontContent instanceof Phaser.GameObjects.Text ? frontContent : undefined,
            frame,
            cardData,
            pairId: cardData.pairId,
            isFlipped: false,
            isMatched: false
        };

        this.cards.push(cardObj);
        container.on('pointerdown', () => this.handleCardClick(cardObj));

        // Hover effects
        container.on('pointerover', () => {
            if (!cardObj.isFlipped && !cardObj.isMatched && !this.isProcessing) {
                back.setTint(0xdddddd);
                container.setScale(1.05);
            }
        });
        container.on('pointerout', () => {
            back.clearTint();
            container.setScale(1);
        });
    }

    private handleCardClick(card: CardObject) {
        if (this.isProcessing || this.isPaused || this.isGameOver || card.isFlipped || card.isMatched) return;

        this.flipCard(card, true);

        if (!this.firstPick) {
            this.firstPick = card;
        } else {
            this.secondPick = card;
            this.isProcessing = true;
            this.moves++;
            this.movesText.setText(`MOVES: ${this.moves}`);

            this.time.delayedCall(this.resolvedConfig.reveal_delay_ms || 400, () => this.checkMatch());
        }

        if (this.resolvedConfig.max_moves && this.moves >= this.resolvedConfig.max_moves) {
            this.endGame();
        }
    }

    private flipCard(card: CardObject, faceUp: boolean) {
        this.tweens.add({
            targets: card.container,
            scaleX: 0,
            duration: 150,
            onComplete: () => {
                card.isFlipped = faceUp;
                card.backSprite.setVisible(!faceUp);
                if (card.frontImage) card.frontImage.setVisible(faceUp);
                if (card.frontText) card.frontText.setVisible(faceUp);
                if (card.frame) card.frame.setVisible(faceUp);

                this.tweens.add({
                    targets: card.container,
                    scaleX: 1,
                    duration: 150
                });
            }
        });
    }

    private checkMatch() {
        if (!this.firstPick || !this.secondPick) return;

        const p1 = this.firstPick;
        const p2 = this.secondPick;
        const isMatch = p1.pairId === p2.pairId && p1.cardData.kind !== p2.cardData.kind;

        const timeMs = Date.now() - this.gameStartTime;
        this.answerTracker.recordMatchAttempt({
            pairId: p1.pairId,
            contentId: p1.cardData.contentId,
            first: { kind: p1.cardData.kind, value: p1.cardData.kind === 'image' ? `img_${p1.pairId}` : p1.cardData.prompt },
            second: { kind: p2.cardData.kind, value: p2.cardData.kind === 'image' ? `img_${p2.pairId}` : p2.cardData.prompt },
            isCorrect: isMatch,
            moves: this.moves,
            timeMs: timeMs
        });

        if (isMatch) {
            this.handleMatch(p1, p2);
        } else {
            this.handleMismatch(p1, p2);
        }
    }

    private handleMatch(p1: CardObject, p2: CardObject) {
        p1.isMatched = true;
        p2.isMatched = true;
        this.matches++;
        this.streak++;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;

        const points = IMAGE_MATCH_CONFIG.scoring.matchFound;
        this.score += points;
        this.sessionManager?.updateScore(points, true);

        const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.pairsText.setText(`PAIRS: ${this.matches}/${totalPairs}`);

        // Glow effect
        const glow1 = this.add.image(p1.container.x, p1.container.y, 'im-card-match-glow').setDisplaySize(p1.container.width * 1.2, p1.container.height * 1.2).setAlpha(0);
        const glow2 = this.add.image(p2.container.x, p2.container.y, 'im-card-match-glow').setDisplaySize(p2.container.width * 1.2, p2.container.height * 1.2).setAlpha(0);

        this.tweens.add({
            targets: [glow1, glow2],
            alpha: 1,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                glow1.destroy();
                glow2.destroy();
                this.createParticles(p1.container.x, p1.container.y, 0x10b981);
                this.createParticles(p2.container.x, p2.container.y, 0x10b981);
                p1.container.setAlpha(0.6);
                p2.container.setAlpha(0.6);

                this.firstPick = null;
                this.secondPick = null;
                this.isProcessing = false;

                const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;
                if (this.matches === totalPairs) {
                    this.time.delayedCall(800, () => this.endGame());
                }
            }
        });
    }

    private handleMismatch(p1: CardObject, p2: CardObject) {
        this.streak = 0;
        const penalty = IMAGE_MATCH_CONFIG.scoring.wrongMatch;
        this.score += penalty;
        this.sessionManager?.updateScore(penalty, false);
        this.scoreText.setText(`SCORE: ${this.score}`);

        this.cameras.main.shake(150, 0.01);

        this.time.delayedCall(this.resolvedConfig.flip_back_delay_ms || 600, () => {
            this.flipCard(p1, false);
            this.flipCard(p2, false);
            this.firstPick = null;
            this.secondPick = null;
            this.isProcessing = false;
        });
    }

    private createParticles(x: number, y: number, tint: number) {
        const p = this.add.particles(x, y, 'im-particle', {
            speed: { min: 50, max: 150 }, scale: { start: 0.8, end: 0 }, lifespan: 500, quantity: 15, tint: tint
        });
        this.time.delayedCall(500, () => p.destroy());
    }

    private createPauseOverlay() {
        const { width, height } = this.cameras.main;
        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();
        const panel = this.add.image(width / 2, height / 2, 'ui-panel').setDisplaySize(400, 300);
        const title = this.add.text(width / 2, height / 2 - 60, 'PAUSE', { fontSize: '42px', fontFamily: 'Arial Black', color: '#ffffff' }).setOrigin(0.5);

        const resumeBtn = this.add.container(width / 2, height / 2 + 60);
        const btnBg = this.add.image(0, 0, 'ui-button').setDisplaySize(160, 50).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, 'RESUME', { fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff' }).setOrigin(0.5);
        resumeBtn.add([btnBg, btnText]);
        btnBg.on('pointerdown', () => this.togglePause());

        this.pauseOverlay.add([dim, panel, title, resumeBtn]);
    }

    private togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);
        if (this.gameTimer) this.gameTimer.paused = this.isPaused;
        if (this.isPaused) this.tweens.pauseAll(); else this.tweens.resumeAll();
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

        const instructions = this.add.text(width / 2, height / 2, this.missionInstructions, {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', align: 'center', wordWrap: { width: 400 }
        }).setOrigin(0.5);

        const closeBtn = this.add.container(width / 2, height / 2 + 130);
        const btnBg = this.add.image(0, 0, 'ui-button').setDisplaySize(140, 50).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, 'READY', { fontSize: '18px', fontFamily: 'Arial Black', color: '#ffffff' }).setOrigin(0.5);
        closeBtn.add([btnBg, btnText]);
        btnBg.on('pointerdown', () => {
            helpOverlay.destroy();
            if (!wasPaused) this.togglePause();
        });

        helpOverlay.add([dim, panel, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;
        const txt = this.add.text(width / 2, height / 2, '3', { fontSize: '120px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 10 }).setOrigin(0.5).setDepth(1500);

        this.time.addEvent({
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
        this.gameStartTime = Date.now();
        this.gameTimer = this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => {
                this.timeRemaining--;
                this.timerText.setText(`${this.timeRemaining}`);
                if (this.timeRemaining <= 0) this.endGame();
            }
        });
    }

    private endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isPaused = true;
        this.gameTimer?.remove();

        this.events.emit('gameOver', {
            scoreRaw: this.score,
            correctCount: this.matches,
            wrongCount: this.moves - this.matches,
            durationSeconds: Math.floor((Date.now() - this.gameStartTime) / 1000),
            answers: this.answerTracker.getAnswers(),
            meta: {
                moves: this.moves,
                totalPairs: new Set(this.cardsData.map(c => c.pairId)).size,
                matchedPairs: this.matches,
                bestStreak: this.bestStreak
            }
        });
    }
}
