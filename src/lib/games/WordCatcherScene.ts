/**
 * WordCatcherScene - Main Phaser 3 game scene for Word Catcher
 */

import Phaser from 'phaser';
import { WORD_CATCHER_CONFIG } from './wordCatcher.config';
import type { GameContent } from '@/types';
import type { GameSessionManager } from './GameSessionManager';

interface WordSprite extends Phaser.GameObjects.Text {
    wordData: GameContent;
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
    private wrongText!: Phaser.GameObjects.Text;

    // Game state
    private gameTimer!: Phaser.Time.TimerEvent;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private isGameOver: boolean = false;
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
        this.wordIndex = 0;
        this.activeWords = [];
    }

    create() {
        console.log('[WordCatcher] Scene create() started');
        try {
            // Set background
            this.cameras.main.setBackgroundColor(WORD_CATCHER_CONFIG.visual.backgroundColor);

            // Create UI
            this.createUI();

            // Start game timer
            this.startGameTimer();

            // Start word spawning
            this.startWordSpawning();

            // Enable input
            this.input.on('gameobjectdown', this.onWordClicked, this);

            console.log('[WordCatcher] Scene create() finished successfully');
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[WordCatcher] Critical error in create():', error);
            this.add.text(400, 300, 'Error initializing game', { color: '#ff0000' }).setOrigin(0.5);
        }
    }

    private createUI() {
        const { width, height } = this.cameras.main;
        const padding = 20;

        // Score display
        this.scoreText = this.add.text(padding, padding, 'Score: 0', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
        });

        // Timer display
        this.timerText = this.add.text(width - padding, padding, 'Time: 120', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
        }).setOrigin(1, 0);

        // Correct count
        this.correctText = this.add.text(padding, height - padding - 60, 'Correct: 0', {
            fontSize: '20px',
            color: WORD_CATCHER_CONFIG.visual.wordCorrectColor,
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
        });

        // Wrong count
        this.wrongText = this.add.text(padding, height - padding - 30, 'Wrong: 0', {
            fontSize: '20px',
            color: WORD_CATCHER_CONFIG.visual.wordIncorrectColor,
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
        });

        // Instructions
        this.add.text(width / 2, 60, 'Click the CORRECT words!', {
            fontSize: '24px',
            color: '#fbbf24',
            fontStyle: 'bold',
        }).setOrigin(0.5);
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

    private startWordSpawning() {
        this.spawnTimer = this.time.addEvent({
            delay: WORD_CATCHER_CONFIG.gameplay.wordSpawnInterval,
            callback: this.spawnWord,
            callbackScope: this,
            loop: true,
        });

        // Spawn first word immediately
        this.spawnWord();
    }

    private spawnWord() {
        if (this.isGameOver) return;

        // Check if we've used all words
        if (this.wordIndex >= this.words.length) {
            // Optionally reshuffle or end game
            return;
        }

        // Don't spawn if too many words on screen
        if (this.activeWords.length >= WORD_CATCHER_CONFIG.gameplay.maxWordsOnScreen) {
            return;
        }

        const wordData = this.words[this.wordIndex];
        this.wordIndex++;

        const { width } = this.cameras.main;
        const x = Phaser.Math.Between(50, width - 50);
        const y = -50;

        // Determine color based on correctness
        const color = wordData.is_correct
            ? WORD_CATCHER_CONFIG.visual.wordCorrectColor
            : WORD_CATCHER_CONFIG.visual.wordIncorrectColor;

        const wordText = this.add.text(x, y, wordData.content_text, {
            fontSize: `${WORD_CATCHER_CONFIG.visual.fontSize}px`,
            color: WORD_CATCHER_CONFIG.visual.wordNeutralColor,
            fontStyle: 'bold',
            backgroundColor: '#00000088',
            padding: { x: 12, y: 8 },
        }).setOrigin(0.5);

        // Make interactive
        wordText.setInteractive({ useHandCursor: true });

        // Store word data
        (wordText as WordSprite).wordData = wordData;
        (wordText as WordSprite).isClicked = false;

        // Add to active words
        this.activeWords.push(wordText as WordSprite);

        // Animate falling
        this.tweens.add({
            targets: wordText,
            y: this.cameras.main.height + 50,
            duration: (this.cameras.main.height + 100) / WORD_CATCHER_CONFIG.gameplay.wordFallSpeed * 1000,
            ease: 'Linear',
            onComplete: () => {
                this.onWordMissed(wordText as WordSprite);
            },
        });
    }

    private onWordClicked(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
        const wordSprite = gameObject as WordSprite;

        if (wordSprite.isClicked || this.isGameOver) return;

        wordSprite.isClicked = true;
        const wordData = wordSprite.wordData;

        // Check if correct
        if (wordData.is_correct) {
            this.handleCorrectCatch(wordSprite);
        } else {
            this.handleWrongCatch(wordSprite);
        }
    }

    private handleCorrectCatch(wordSprite: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.correctCatch;
        this.score += points;

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, true);
        }

        // Visual feedback
        this.tweens.add({
            targets: wordSprite,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.removeWord(wordSprite);
            },
        });

        // Show points
        this.showFloatingText(wordSprite.x, wordSprite.y, `+${points}`, '#10b981');

        this.updateUI();
    }

    private handleWrongCatch(wordSprite: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.wrongCatch;
        this.score += points; // Already negative

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, false);
        }

        // Visual feedback - shake and fade
        this.tweens.add({
            targets: wordSprite,
            x: wordSprite.x + 10,
            yoyo: true,
            repeat: 3,
            duration: 50,
        });

        this.tweens.add({
            targets: wordSprite,
            alpha: 0,
            duration: 300,
            delay: 200,
            onComplete: () => {
                this.removeWord(wordSprite);
            },
        });

        // Show points
        this.showFloatingText(wordSprite.x, wordSprite.y, `${points}`, '#ef4444');

        this.updateUI();
    }

    private onWordMissed(wordSprite: WordSprite) {
        if (wordSprite.isClicked) return;

        // Only penalize if it was a correct word that was missed
        if (wordSprite.wordData.is_correct) {
            const points = WORD_CATCHER_CONFIG.scoring.missedWord;
            this.score += points;

            if (this.sessionManager) {
                this.sessionManager.updateScore(points, false);
            }
        }

        this.removeWord(wordSprite);
        this.updateUI();
    }

    private removeWord(wordSprite: WordSprite) {
        const index = this.activeWords.indexOf(wordSprite);
        if (index > -1) {
            this.activeWords.splice(index, 1);
        }
        wordSprite.destroy();
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

        if (this.sessionManager) {
            const data = this.sessionManager.getSessionData();
            this.correctText.setText(`Correct: ${data.correctCount}`);
            this.wrongText.setText(`Wrong: ${data.wrongCount}`);
        }
    }

    private async endGame() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Stop timers
        if (this.gameTimer) this.gameTimer.remove();
        if (this.spawnTimer) this.spawnTimer.remove();

        // Clear active words
        this.activeWords.forEach(word => word.destroy());
        this.activeWords = [];

        // End session
        if (this.sessionManager) {
            try {
                await this.sessionManager.endSession({
                    wordsShown: this.wordIndex,
                    finalTime: WORD_CATCHER_CONFIG.gameplay.gameDuration - this.timeRemaining,
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

        // Emit event to notify parent component
        this.events.emit('gameOver', {
            score: this.score,
            sessionData: this.sessionManager?.getSessionData(),
        });
    }

    update(time: number, delta: number) {
        // Game loop updates if needed
    }
}
