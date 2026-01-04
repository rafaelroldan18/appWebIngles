/**
 * GrammarRunScene - Endless runner game for grammar practice
 * Player runs and selects correct grammar structures through gates
 */

import Phaser from 'phaser';
import { GRAMMAR_RUN_CONFIG } from './grammarRun.config';
import type { GameContent } from '@/types';
import type { GameSessionManager } from './GameSessionManager';

interface Gate {
    sprite: Phaser.GameObjects.Rectangle;
    textObj: Phaser.GameObjects.Text;
    content: GameContent;
    lane: number;
    isCorrect: boolean;
}

export class GrammarRunScene extends Phaser.Scene {
    private gameContent: GameContent[] = [];
    private sessionManager: GameSessionManager | null = null;

    // Game objects
    private player!: Phaser.GameObjects.Rectangle;
    private ground!: Phaser.GameObjects.Rectangle;
    private gates: Gate[] = [];
    private obstacles: Phaser.GameObjects.Rectangle[] = [];

    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private livesText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private distanceText!: Phaser.GameObjects.Text;

    // Game state
    private score: number = 0;
    private lives: number = GRAMMAR_RUN_CONFIG.gameplay.maxLives;
    private timeRemaining: number = 0;
    private distance: number = 0;
    private currentLane: number = 1; // 0=left, 1=center, 2=right
    private isGameOver: boolean = false;
    private currentSpeed: number = GRAMMAR_RUN_CONFIG.gameplay.runnerSpeed;
    private contentIndex: number = 0;

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;
    private gateSpawnTimer!: Phaser.Time.TimerEvent;
    private speedIncreaseTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'GrammarRunScene' });
    }

    init(data: { words: GameContent[]; sessionManager: GameSessionManager }) {
        this.gameContent = data.words || [];
        this.sessionManager = data.sessionManager || null;
        this.score = 0;
        this.lives = GRAMMAR_RUN_CONFIG.gameplay.maxLives;
        this.timeRemaining = GRAMMAR_RUN_CONFIG.gameplay.gameDuration;
        this.distance = 0;
        this.currentLane = 1;
        this.isGameOver = false;
        this.currentSpeed = GRAMMAR_RUN_CONFIG.gameplay.runnerSpeed;
        this.contentIndex = 0;
        this.gates = [];
        this.obstacles = [];
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

            // Create UI
            this.createUI();

            // Setup controls
            this.setupControls();

            // Start timers
            this.startGameTimer();
            this.startGateSpawning();
            this.startSpeedIncrease();

            // Enable physics
            this.physics.world.setBounds(0, 0, width, height);

            console.log('[GrammarRun] Scene create() finished successfully');
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[GrammarRun] Critical error in create():', error);
            this.add.text(400, 300, 'Error initializing game', { color: '#ff0000' }).setOrigin(0.5);
        }
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
        this.scoreText = this.add.text(padding, padding, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
        });

        // Lives
        this.livesText = this.add.text(width - padding, padding, `Lives: ${this.lives}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
        }).setOrigin(1, 0);

        // Timer
        this.timerText = this.add.text(width / 2, padding, `Time: ${this.timeRemaining}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
        }).setOrigin(0.5, 0);

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
        this.timeRemaining--;
        this.timerText.setText(`Time: ${this.timeRemaining}`);

        if (this.timeRemaining <= 0) {
            this.endGame();
        }
    }

    private startGateSpawning() {
        this.gateSpawnTimer = this.time.addEvent({
            delay: GRAMMAR_RUN_CONFIG.gameplay.gateSpawnInterval,
            callback: this.spawnGate,
            callbackScope: this,
            loop: true,
        });

        // Spawn first gate immediately
        this.time.delayedCall(500, () => this.spawnGate());
    }

    private startSpeedIncrease() {
        this.speedIncreaseTimer = this.time.addEvent({
            delay: 10000, // Every 10 seconds
            callback: () => {
                this.currentSpeed *= GRAMMAR_RUN_CONFIG.gameplay.speedIncreaseRate;
            },
            callbackScope: this,
            loop: true,
        });
    }

    private spawnGate() {
        if (this.isGameOver || this.contentIndex >= this.gameContent.length) return;

        const { width } = this.cameras.main;
        const laneWidth = width / 3;
        const gateHeight = 150;
        const gateWidth = laneWidth - 40;
        const y = -gateHeight;

        // Get correct and wrong content
        const correctContent = this.gameContent[this.contentIndex];
        this.contentIndex++;

        const wrongOptions = this.gameContent.filter(c => !c.is_correct && c.content_id !== correctContent.content_id);
        let wrongContent = Phaser.Utils.Array.GetRandom(wrongOptions);

        // Fallback if no wrong options exist
        if (!wrongContent) {
            wrongContent = {
                content_id: 'fallback-wrong',
                topic_id: correctContent.topic_id,
                content_type: correctContent.content_type,
                content_text: '---', // Or something filler
                is_correct: false,
                created_at: new Date().toISOString()
            } as GameContent;
        }

        // Randomly assign to lanes
        const correctLane = Phaser.Math.Between(0, 2);
        const wrongLane = correctLane === 0 ? 1 : (correctLane === 2 ? 1 : Phaser.Math.Between(0, 1) * 2);

        // Create gates
        this.createGateInLane(correctLane, y, gateWidth, gateHeight, correctContent, true);
        this.createGateInLane(wrongLane, y, gateWidth, gateHeight, wrongContent, false);
    }

    private createGateInLane(
        lane: number,
        y: number,
        width: number,
        height: number,
        content: GameContent,
        isCorrect: boolean
    ) {
        const { width: screenWidth } = this.cameras.main;
        const laneWidth = screenWidth / 3;
        const x = laneWidth * lane + laneWidth / 2;

        const color = isCorrect
            ? parseInt(GRAMMAR_RUN_CONFIG.visual.correctGateColor.replace('#', '0x'))
            : parseInt(GRAMMAR_RUN_CONFIG.visual.wrongGateColor.replace('#', '0x'));

        const gateSprite = this.add.rectangle(x, y, width, height, color, 0.3);
        gateSprite.setStrokeStyle(4, color);

        this.physics.add.existing(gateSprite);
        const body = gateSprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(this.currentSpeed);

        // Add text
        const textObj = this.add.text(x, y, content.content_text, {
            fontSize: `${GRAMMAR_RUN_CONFIG.visual.fontSize}px`,
            color: isCorrect ? '#10b981' : '#ef4444',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 20 },
        }).setOrigin(0.5);

        const gate: Gate = {
            sprite: gateSprite,
            textObj: textObj,
            content: content,
            lane: lane,
            isCorrect: isCorrect,
        };

        this.gates.push(gate);

        // Setup overlap detection
        this.physics.add.overlap(this.player, gateSprite, () => {
            this.handleGatePass(gate);
        });
    }

    private handleGatePass(gate: Gate) {
        if (!this.gates.includes(gate)) return; // Already processed

        // Check if player is in the same lane
        if (this.currentLane === gate.lane) {
            if (gate.isCorrect) {
                this.handleCorrectGate(gate);
            } else {
                this.handleWrongGate(gate);
            }
        }

        // Remove gate
        this.removeGate(gate);
    }

    private handleCorrectGate(gate: Gate) {
        const points = GRAMMAR_RUN_CONFIG.scoring.correctGate;
        this.score += points;

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, true);
        }

        // Visual feedback
        this.showFloatingText(gate.sprite.x, gate.sprite.y, `+${points}`, '#10b981');
        this.updateUI();
    }

    private handleWrongGate(gate: Gate) {
        const points = GRAMMAR_RUN_CONFIG.scoring.wrongGate;
        this.score += points;
        this.lives--;

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, false);
        }

        // Visual feedback
        this.showFloatingText(gate.sprite.x, gate.sprite.y, `${points}`, '#ef4444');
        this.cameras.main.shake(200, 0.005);

        this.updateUI();

        if (this.lives <= 0) {
            this.endGame();
        }
    }

    private removeGate(gate: Gate) {
        const index = this.gates.indexOf(gate);
        if (index > -1) {
            this.gates.splice(index, 1);
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
        this.scoreText.setText(`Score: ${this.score}`);
        this.livesText.setText(`Lives: ${this.lives}`);
        this.distanceText.setText(`Distance: ${Math.floor(this.distance)}m`);
    }

    private async endGame() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Stop timers
        if (this.gameTimer) this.gameTimer.remove();
        if (this.gateSpawnTimer) this.gateSpawnTimer.remove();
        if (this.speedIncreaseTimer) this.speedIncreaseTimer.remove();

        // Clear gates
        this.gates.forEach(gate => {
            gate.sprite.destroy();
            gate.textObj.destroy();
        });
        this.gates = [];

        // End session
        if (this.sessionManager) {
            try {
                await this.sessionManager.endSession({
                    gatesShown: this.contentIndex,
                    finalDistance: Math.floor(this.distance),
                    finalSpeed: this.currentSpeed,
                });
            } catch (error) {
                console.error('Error ending session:', error);
            }
        }

        // Show game over screen
        this.showGameOver();
    }

    private showGameOver() {
        const { width, height } = this.cameras.main;

        // Semi-transparent overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        overlay.setOrigin(0);

        // Game Over text
        this.add.text(width / 2, height / 2 - 80, 'GAME OVER!', {
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Final score
        this.add.text(width / 2, height / 2, `Final Score: ${this.score}`, {
            fontSize: '36px',
            color: '#fbbf24',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Stats
        if (this.sessionManager) {
            const data = this.sessionManager.getSessionData();
            const accuracy = data.correctCount + data.wrongCount > 0
                ? Math.round((data.correctCount / (data.correctCount + data.wrongCount)) * 100)
                : 0;

            this.add.text(width / 2, height / 2 + 60,
                `Correct: ${data.correctCount} | Wrong: ${data.wrongCount} | Accuracy: ${accuracy}%`, {
                fontSize: '24px',
                color: '#ffffff',
            }).setOrigin(0.5);
        }

        // Emit event
        this.events.emit('gameOver', {
            score: this.score,
            sessionData: this.sessionManager?.getSessionData(),
        });
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        // Update distance
        this.distance += (this.currentSpeed * delta) / 1000;
        this.score += Math.floor(GRAMMAR_RUN_CONFIG.scoring.distancePoint * delta / 1000);

        // Update gates position and remove off-screen gates
        this.gates.forEach(gate => {
            gate.textObj.y = gate.sprite.y;

            if (gate.sprite.y > this.cameras.main.height + 100) {
                this.removeGate(gate);
            }
        });

        // Update UI periodically
        if (Math.floor(time / 100) % 5 === 0) {
            this.updateUI();
        }
    }
}
