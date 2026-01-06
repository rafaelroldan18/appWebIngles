/**
 * CityExplorerScene - Interactive map exploration game
 * Players navigate a city to find locations and answer preposition questions
 */

import Phaser from 'phaser';
import { CITY_EXPLORER_CONFIG } from './cityExplorer.config';
import type { GameContent } from '@/types';
import type { GameSessionManager } from './GameSessionManager';

interface Building {
    sprite: Phaser.GameObjects.Rectangle;
    emoji: Phaser.GameObjects.Text;
    label: Phaser.GameObjects.Text;
    name: string;
    x: number;
    y: number;
    isTarget: boolean;
}

interface Question {
    text: string;
    options: string[];
    correctAnswer: number;
    location: string;
}

export class CityExplorerScene extends Phaser.Scene {
    private gameContent: GameContent[] = [];
    private sessionManager: GameSessionManager | null = null;

    // Game objects
    private player!: Phaser.GameObjects.Rectangle;
    private playerEmoji!: Phaser.GameObjects.Text;
    private buildings: Building[] = [];
    private currentTarget: Building | null = null;

    // Game state
    private score: number = 0;
    private timeRemaining: number = 0;
    private locationsFound: number = 0;
    private currentQuestion: Question | null = null;
    private isAnswering: boolean = false;
    private isGameOver: boolean = false;
    private correctAnswers: number = 0;
    private wrongAnswers: number = 0;

    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private objectiveText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private questionPanel!: Phaser.GameObjects.Container;

    // Controls
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

    // Timer
    private gameTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'CityExplorerScene' });
    }

    init(data: { words: GameContent[]; sessionManager: GameSessionManager }) {
        this.gameContent = data.words || [];
        this.sessionManager = data.sessionManager || null;
        this.score = 0;
        this.timeRemaining = CITY_EXPLORER_CONFIG.gameplay.gameDuration;
        this.locationsFound = 0;
        this.isGameOver = false;
        this.buildings = [];
        this.currentTarget = null;
        this.currentQuestion = null;
        this.isAnswering = false;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Set background
        this.cameras.main.setBackgroundColor(CITY_EXPLORER_CONFIG.visual.backgroundColor);

        // Create ground
        this.createGround();

        // Create city map
        this.createCity();

        // Create player
        this.createPlayer();

        // Create UI (Standard HUD)
        this.createStandardHUD();

        // Setup controls
        this.setupControls();

        // Start Countdown
        this.startCountdown();
    }

    private createStandardHUD() {
        const { width } = this.cameras.main;
        const topBarHeight = 80;

        // Background bar
        this.add.rectangle(width / 2, topBarHeight / 2, width, topBarHeight, 0x000000, 0.7).setDepth(100);

        // Score
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#10b981',
            fontStyle: 'bold'
        }).setDepth(101);

        // Time
        this.timerText = this.add.text(width / 2, 20, `TIME: ${this.timeRemaining}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(101);

        // Progress
        this.progressText = this.add.text(width - 20, 20, 'LOCATIONS: 0/6', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#fbbf24',
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(101);

        // Dynamic Objective
        this.objectiveText = this.add.text(width / 2, 50, 'FIND THE TARGET!', {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(101);

        // Question panel container
        this.createQuestionPanel();
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
        }).setOrigin(0.5).setDepth(200);

        const timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countText.setText(`${count}`);
                    this.cameras.main.shake(100, 0.01);
                } else if (count === 0) {
                    countText.setText('EXPLORE!');
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
        // Start timer
        this.startGameTimer();

        // Select first target
        this.selectNextTarget();
    }

    private createGround() {
        const { width, height } = this.cameras.main;
        const groundHeight = height - 100;

        this.add.rectangle(
            width / 2,
            height / 2 + 50,
            width,
            groundHeight,
            parseInt(CITY_EXPLORER_CONFIG.visual.groundColor.replace('#', '0x'))
        );
    }

    private createCity() {
        const { width, height } = this.cameras.main;
        const { buildingSize, buildingSpacing } = CITY_EXPLORER_CONFIG.map;

        // Define city layout (3x3 grid)
        const locations = [
            'bank', 'hospital', 'school',
            'park', 'restaurant', 'library',
            'museum', 'station', 'bank'
        ];

        const cols = 3;
        const rows = 3;
        const totalWidth = cols * (buildingSize + buildingSpacing) - buildingSpacing;
        const totalHeight = rows * (buildingSize + buildingSpacing) - buildingSpacing;
        const startX = (width - totalWidth) / 2 + buildingSize / 2;
        const startY = (height - totalHeight) / 2 + buildingSize / 2 - 20;

        locations.forEach((location, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * (buildingSize + buildingSpacing);
            const y = startY + row * (buildingSize + buildingSpacing);

            this.createBuilding(x, y, location);
        });
    }

    private createBuilding(x: number, y: number, name: string) {
        const { buildingSize } = CITY_EXPLORER_CONFIG.map;
        const colors = CITY_EXPLORER_CONFIG.visual.buildingColors;
        const color = colors[name as keyof typeof colors] || '#CCCCCC';

        // Building sprite
        const buildingSprite = this.add.rectangle(
            x, y, buildingSize, buildingSize,
            parseInt(color.replace('#', '0x'))
        ).setStrokeStyle(3, 0x000000);

        // Building emoji
        const emoji = CITY_EXPLORER_CONFIG.locationEmojis[name as keyof typeof CITY_EXPLORER_CONFIG.locationEmojis] || '🏢';
        const emojiText = this.add.text(x, y - 10, emoji, {
            fontSize: '40px',
        }).setOrigin(0.5);

        // Building label
        const labelText = this.add.text(x, y + 25, name.toUpperCase(), {
            fontSize: '12px',
            color: '#000000',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const building: Building = {
            sprite: buildingSprite,
            emoji: emojiText,
            label: labelText,
            name: name,
            x: x,
            y: y,
            isTarget: false,
        };

        this.buildings.push(building);
    }

    private createPlayer() {
        const { width, height } = this.cameras.main;
        const playerSize = 30;

        // Player sprite
        this.player = this.add.rectangle(
            width / 2,
            height - 80,
            playerSize,
            playerSize,
            parseInt(CITY_EXPLORER_CONFIG.visual.playerColor.replace('#', '0x'))
        );

        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);

        // Player emoji
        this.playerEmoji = this.add.text(
            this.player.x,
            this.player.y,
            '🚶',
            { fontSize: '24px' }
        ).setOrigin(0.5);
    }

    private createUI() {
        // Deprecated
    }

    private createQuestionPanel() {
        const { width, height } = this.cameras.main;

        this.questionPanel = this.add.container(width / 2, height / 2);
        this.questionPanel.setVisible(false);
        this.questionPanel.setDepth(100);
    }

    private setupControls() {
        // Arrow keys
        this.cursors = this.input.keyboard!.createCursorKeys();

        // WASD keys
        this.wasd = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
    }

    private startGameTimer() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeRemaining--;
                this.timerText.setText(`Time: ${this.timeRemaining}s`);

                if (this.timeRemaining <= 0) {
                    this.endGame();
                }
            },
            callbackScope: this,
            loop: true,
        });
    }

    private selectNextTarget() {
        if (this.locationsFound >= CITY_EXPLORER_CONFIG.gameplay.locationsToFind) {
            this.handleGameComplete();
            return;
        }

        // Clear previous target
        if (this.currentTarget) {
            this.currentTarget.sprite.setStrokeStyle(3, 0x000000);
            this.currentTarget.isTarget = false;
        }

        // Select random building that hasn't been visited
        const availableBuildings = this.buildings.filter(b => !b.isTarget);
        if (availableBuildings.length === 0) {
            this.handleGameComplete();
            return;
        }

        this.currentTarget = Phaser.Utils.Array.GetRandom(availableBuildings);
        this.currentTarget.isTarget = true;
        this.currentTarget.sprite.setStrokeStyle(5, 0xff0000);

        // Update objective
        this.objectiveText.setText(`Find the ${this.currentTarget.name.toUpperCase()}!`);
    }

    private checkPlayerAtTarget() {
        if (!this.currentTarget || this.isAnswering) return;

        const distance = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.currentTarget.x,
            this.currentTarget.y
        );

        if (distance < 60) {
            this.handleLocationFound();
        }
    }

    private handleLocationFound() {
        if (!this.currentTarget) return;

        // Award points for finding location
        const points = CITY_EXPLORER_CONFIG.scoring.locationFound;
        this.score += points;

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, true);
        }

        this.updateUI();

        // Show question
        this.showPrepositionQuestion();
    }

    private showPrepositionQuestion() {
        if (!this.currentTarget) return;

        this.isAnswering = true;

        // Generate question based on nearby buildings
        const question = this.generateQuestion(this.currentTarget);
        this.currentQuestion = question;

        // Clear previous question panel
        this.questionPanel.removeAll(true);

        const { width, height } = this.cameras.main;

        // Background
        const bg = this.add.rectangle(0, 0, 600, 300, 0x000000, 0.9);
        this.questionPanel.add(bg);

        // Question text
        const questionText = this.add.text(0, -100, question.text, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 550 },
        }).setOrigin(0.5);
        this.questionPanel.add(questionText);

        // Options
        question.options.forEach((option, index) => {
            const y = -30 + index * 50;

            const optionBg = this.add.rectangle(0, y, 400, 40, 0x3b82f6)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.handleAnswer(index))
                .on('pointerover', () => optionBg.setFillStyle(0x2563eb))
                .on('pointerout', () => optionBg.setFillStyle(0x3b82f6));

            const optionText = this.add.text(0, y, option, {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5);

            this.questionPanel.add(optionBg);
            this.questionPanel.add(optionText);
        });

        this.questionPanel.setVisible(true);
    }

    private generateQuestion(building: Building): Question {
        // Find nearby buildings for preposition questions
        const nearbyBuildings = this.buildings.filter(b =>
            b !== building &&
            Phaser.Math.Distance.Between(building.x, building.y, b.x, b.y) < 200
        );

        if (nearbyBuildings.length === 0) {
            // Fallback question
            return {
                text: `Where is the ${building.name}?`,
                options: ['In the city', 'On the map', 'Here', 'There'],
                correctAnswer: 0,
                location: building.name,
            };
        }

        const nearby = Phaser.Utils.Array.GetRandom(nearbyBuildings);

        // Determine preposition based on position
        const dx = nearby.x - building.x;
        const dy = nearby.y - building.y;

        let correctPrep = 'next to';
        if (Math.abs(dx) > Math.abs(dy)) {
            correctPrep = dx > 0 ? 'to the right of' : 'to the left of';
        } else {
            correctPrep = dy > 0 ? 'below' : 'above';
        }

        const wrongPreps = ['next to', 'across from', 'behind', 'in front of', 'near']
            .filter(p => p !== correctPrep);

        const options = Phaser.Utils.Array.Shuffle([
            correctPrep,
            ...Phaser.Utils.Array.Shuffle(wrongPreps).slice(0, 2)
        ]);

        return {
            text: `The ${building.name} is ___ the ${nearby.name}.`,
            options: options,
            correctAnswer: options.indexOf(correctPrep),
            location: building.name,
        };
    }

    private handleAnswer(answerIndex: number) {
        if (!this.currentQuestion) return;

        const isCorrect = answerIndex === this.currentQuestion.correctAnswer;

        if (isCorrect) {
            this.correctAnswers++;
            const points = CITY_EXPLORER_CONFIG.scoring.correctPreposition;
            this.score += points;

            if (this.sessionManager) {
                this.sessionManager.updateScore(points, true);
            }

            this.showFeedback('✓ Correct!', '#10b981');
        } else {
            this.wrongAnswers++;
            const penalty = CITY_EXPLORER_CONFIG.scoring.wrongAnswer;
            this.score += penalty;

            if (this.sessionManager) {
                this.sessionManager.updateScore(penalty, false);
            }

            this.showFeedback('✗ Wrong!', '#ef4444');
        }

        this.updateUI();

        // Hide question panel and continue
        this.time.delayedCall(1500, () => {
            this.questionPanel.setVisible(false);
            this.isAnswering = false;
            this.locationsFound++;
            this.updateUI();
            this.selectNextTarget();
        });
    }

    private showFeedback(text: string, color: string) {
        const feedbackText = this.add.text(0, 120, text, {
            fontSize: '28px',
            color: color,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.questionPanel.add(feedbackText);
    }

    private handleGameComplete() {
        // Speed bonus if completed early
        if (this.timeRemaining > 60) {
            this.score += CITY_EXPLORER_CONFIG.scoring.speedBonus;
        }

        this.updateUI();

        this.time.delayedCall(1000, () => {
            this.endGame();
        });
    }

    private updateUI() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.progressText.setText(`LOCATIONS: ${this.locationsFound}/${CITY_EXPLORER_CONFIG.gameplay.locationsToFind}`);
        this.timerText.setText(`TIME: ${this.timeRemaining}`);
    }

    private async endGame() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Stop timer
        if (this.gameTimer) this.gameTimer.remove();

        // End session
        if (this.sessionManager) {
            try {
                await this.sessionManager.endSession({
                    locationsFound: this.locationsFound,
                    correctAnswers: this.correctAnswers,
                    wrongAnswers: this.wrongAnswers,
                    questionsAnswered: this.correctAnswers + this.wrongAnswers,
                });
            } catch (error) {
                console.error('Error ending session:', error);
            }
        }

        // Show Mission Complete Overlay
        const { width, height } = this.cameras.main;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        this.add.text(width / 2, height / 2, 'MISSION COMPLETE!', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#10b981',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Emit event delayed
        this.time.delayedCall(2000, () => {
            this.events.emit('gameOver', {
                score: this.score,
                sessionData: this.sessionManager?.getSessionData(),
            });
        });
    }

    update(time: number, delta: number) {
        if (this.isGameOver || this.isAnswering) return;

        // Player movement
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        const speed = CITY_EXPLORER_CONFIG.gameplay.playerSpeed;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            body.setVelocityY(speed);
        }

        // Update player emoji position
        this.playerEmoji.setPosition(this.player.x, this.player.y);

        // Check if player reached target
        this.checkPlayerAtTarget();
    }
}
