import Phaser from 'phaser';
import { WORD_CATCHER_CONFIG } from './wordCatcher.config';
import type { GameContent } from '@/types';
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

    init(data: { words: GameContent[]; sessionManager: GameSessionManager }) {
        this.words = data.words || [];
        this.sessionManager = data.sessionManager || null;
        this.score = 0;
        this.timeRemaining = WORD_CATCHER_CONFIG.gameplay.gameDuration;
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

        // Banner Superior con transparencia
        const banner = this.add.image(width / 2, 40, 'hud_banner')
            .setDisplaySize(width * 0.95, 60)
            .setAlpha(0.85)
            .setDepth(hudDepth);

        // Marcadores con estilo Neón
        this.scoreText = this.add.text(width * 0.15, 40, 'SCORE: 0', {
            fontSize: '22px', fontFamily: 'Arial Black', color: '#00ffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        this.timerText = this.add.text(width / 2, 40, `TIME: ${this.timeRemaining}`, {
            fontSize: '30px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        this.correctText = this.add.text(width * 0.82, 40, 'CAUGHT: 0', {
            fontSize: '18px', fontFamily: 'Arial Black', color: '#fbbf24', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(hudDepth + 1);

        // Botón de Pausa Estilizado
        const pauseBtn = this.add.image(width - 45, 40, 'pause_icon')
            // Scale visual
            .setScale(0.8)
            .setTint(0x00ffff)
            .setDepth(hudDepth + 1);

        // Make interactive with explicit hit area larger than the icon
        pauseBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, pauseBtn.width, pauseBtn.height), Phaser.Geom.Rectangle.Contains);

        pauseBtn.on('pointerdown', () => {
            console.log('Pause button clicked');
            this.togglePause();
        });

        // Hover effects
        pauseBtn.on('pointerover', () => pauseBtn.setScale(0.9));
        pauseBtn.on('pointerout', () => pauseBtn.setScale(0.8));

        // Sub-banner de misión
        this.add.rectangle(width / 2, 85, 420, 30, 0x000000, 0.4).setOrigin(0.5).setDepth(hudDepth);
        this.add.text(width / 2, 85, 'MISSION: CATCH THE CORRECT WORDS!', {
            fontSize: '14px', fontFamily: 'Arial Black', color: '#ffffff'
        }).setOrigin(0.5).setDepth(hudDepth + 1);
    }

    private createPauseOverlay() {
        const { width, height } = this.cameras.main;
        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false);

        // Dark dimmer (consumes clicks to block game interaction)
        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
        dim.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        dim.on('pointerdown', () => {
            // Block click propagation
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

        // Resume Button
        const resumeBtn = this.createButton(width / 2, height / 2 + 80, 'RESUME', () => this.togglePause());

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

        // Explicit interactive area on the background image
        bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, bg.width, bg.height), Phaser.Geom.Rectangle.Contains);

        const label = this.add.text(0, 0, text, {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        container.add([bg, label]);

        // Event listeners on the background image directly
        bg.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        });

        bg.on('pointerover', () => bg.setTint(0xdddddd));
        bg.on('pointerout', () => bg.clearTint());

        // cursor
        bg.input!.cursor = 'pointer';

        return container;
    }

    private togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);

        if (this.isPaused) {
            this.gameTimer.paused = true;
            this.spawnTimer.paused = true;
            this.tweens.pauseAll();
        } else {
            this.gameTimer.paused = false;
            this.spawnTimer.paused = false;
            this.tweens.resumeAll();
        }
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;
        const countText = this.add.text(width / 2, height / 2, '3', {
            fontSize: '120px', fontFamily: 'Arial Black', color: '#00ffff', stroke: '#000000', strokeThickness: 12
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 1000, repeat: 3,
            callback: () => {
                count--;
                if (count > 0) {
                    countText.setText(count.toString());
                    this.cameras.main.shake(100, 0.01);
                } else if (count === 0) {
                    countText.setText('GO!').setColor('#10b981');
                } else {
                    countText.destroy();
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
        this.timerText.setText(`TIME: ${this.timeRemaining}`);
        if (this.timeRemaining <= 10) this.timerText.setScale(1.15).setColor('#ff0000');
        if (this.timeRemaining <= 0) this.endGame();
    }

    private spawnWord() {
        if (this.isGameOver || this.isPaused) return;

        const wordData = this.words[this.wordIndex % this.words.length];
        this.wordIndex++;

        const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
        const container = this.add.container(x, -70).setDepth(1);

        const texture = wordData.is_correct ? 'item_correct' : 'item_wrong';
        const sprite = this.add.sprite(0, 0, texture).setScale(1.4) as WordSprite;

        const wordText = this.add.text(0, -10, wordData.content_text, {
            fontSize: '22px', fontFamily: 'Arial Black', color: '#000000'
        }).setOrigin(0.5);

        container.add([sprite, wordText]);
        sprite.setInteractive({ useHandCursor: true });
        sprite.wordData = wordData;
        sprite.parentContainer = container;

        // Fall animation
        this.tweens.add({
            targets: container,
            y: this.cameras.main.height + 100,
            angle: { from: -5, to: 5 }, // Reduced rotation for cleaner look
            duration: 6000 / WORD_CATCHER_CONFIG.gameplay.wordFallSpeed,
            ease: 'Linear',
            onComplete: () => {
                if (!this.isGameOver && container.active) {
                    this.onWordMissed(sprite);
                    container.destroy();
                }
            }
        });

        // Sway animation (Wind effect)
        this.tweens.add({
            targets: container,
            x: container.x + Phaser.Math.Between(-40, 40),
            duration: Phaser.Math.Between(2000, 3000),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
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

        const container = sprite.parentContainer;

        // Partículas Neón
        const emitter = this.add.particles(container.x, container.y, 'spark', {
            speed: { min: -200, max: 200 }, scale: { start: 1.5, end: 0 }, lifespan: 600, quantity: 25, blendMode: 'ADD'
        });
        this.time.delayedCall(500, () => emitter.destroy());

        this.tweens.add({
            targets: container, scale: 2, alpha: 0, duration: 250, ease: 'Back.easeOut',
            onComplete: () => { this.removeWord(sprite); container.destroy(); }
        });

        this.showFloatingText(container.x, container.y, `+${points}`, '#00ff00');
        this.updateUI_Stats();
    }

    private handleWrongCatch(sprite: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.wrongCatch;
        this.score += points;
        this.sessionManager?.updateScore(points, false);

        const container = sprite.parentContainer;
        this.cameras.main.shake(150, 0.008);
        sprite.setTint(0xff0000);

        this.tweens.add({
            targets: container, x: container.x + 15, yoyo: true, repeat: 4, duration: 40,
            onComplete: () => {
                this.tweens.add({
                    targets: container, alpha: 0, scale: 0.4, duration: 200,
                    onComplete: () => { this.removeWord(sprite); container.destroy(); }
                });
            }
        });

        this.showFloatingText(container.x, container.y, `${points}`, '#ff0000');
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
        const fText = this.add.text(x, y, text, {
            fontSize: '36px', fontFamily: 'Arial Black', color, stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: fText, y: y - 100, alpha: 0, duration: 1200, onComplete: () => fText.destroy() });
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
        if (this.sessionManager) {
            await this.sessionManager.endSession({
                wordsShown: this.wordIndex,
                finalTime: WORD_CATCHER_CONFIG.gameplay.gameDuration - this.timeRemaining,
            });
        }

        const { width, height } = this.cameras.main;

        // 1. Dark Overlay Fade In
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0).setDepth(3000);
        this.tweens.add({ targets: overlay, alpha: 0.7, duration: 500 });

        // 2. Scoreboard Panel (Kenney Style)
        const panelContainer = this.add.container(width / 2, height / 2).setDepth(3001).setScale(0);

        const board = this.add.image(0, 0, 'ui_panel').setDisplaySize(500, 400);
        // Note: ui_panel is blue. White text works well with shadow/stroke.

        const title = this.add.text(0, -150, 'MISSION COMPLETE', {
            fontSize: '36px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        // Stats
        const scoreLabel = this.add.text(0, -60, `FINAL SCORE`, {
            fontSize: '20px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        const scoreValue = this.add.text(0, -10, `${this.score}`, {
            fontSize: '56px', color: '#ffd700', fontFamily: 'Arial Black', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        const correctLabel = this.add.text(-100, 80, `Correct: ${sessionData.correctCount}`, { fontSize: '20px', color: '#ffffff', fontFamily: 'Arial Black', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        const wrongLabel = this.add.text(100, 80, `Missed: ${sessionData.wrongCount}`, { fontSize: '20px', color: '#ffffff', fontFamily: 'Arial Black', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);

        panelContainer.add([board, title, scoreLabel, scoreValue, correctLabel, wrongLabel]);

        // Animation
        this.tweens.add({
            targets: panelContainer,
            scale: 1,
            duration: 600,
            ease: 'Back.out'
        });

        // 3. Confetti Effect
        const emitter = this.add.particles(0, -200, 'spark', {
            x: width / 2, y: height / 2,
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 2000,
            quantity: 50,
            blendMode: 'ADD',
        });
        emitter.setDepth(3000);

        // 4. Emit Event Delay
        this.time.delayedCall(3000, () => {
            this.events.emit('gameOver', {
                score: this.score,
                sessionData: this.sessionManager?.getSessionData(),
            });
        });
    }
}