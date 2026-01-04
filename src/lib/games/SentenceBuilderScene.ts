/**
 * SentenceBuilderScene - Drag and drop game for building sentences
 * Players drag words to build correct sentences
 */

import Phaser from 'phaser';
import { SENTENCE_BUILDER_CONFIG } from './sentenceBuilder.config';
import type { GameContent } from '@/types';
import type { GameSessionManager } from './GameSessionManager';

interface WordCard {
    sprite: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
    word: string;
    originalIndex: number;
    slotIndex: number | null;
}

interface Slot {
    sprite: Phaser.GameObjects.Rectangle;
    index: number;
    occupied: boolean;
    wordCard: WordCard | null;
}

export class SentenceBuilderScene extends Phaser.Scene {
    private gameContent: GameContent[] = [];
    private sessionManager: GameSessionManager | null = null;

    // Game state
    private currentSentenceIndex: number = 0;
    private currentSentence: string[] = [];
    private score: number = 0;
    private timeRemaining: number = 0;
    private sentenceTimeRemaining: number = 0;
    private hintsUsed: number = 0;
    private isCheckingAnswer: boolean = false;

    // Game objects
    private wordCards: WordCard[] = [];
    private slots: Slot[] = [];
    private checkButton!: Phaser.GameObjects.Rectangle;
    private checkButtonText!: Phaser.GameObjects.Text;
    private hintButton!: Phaser.GameObjects.Rectangle;
    private hintButtonText!: Phaser.GameObjects.Text;
    private nextButton!: Phaser.GameObjects.Rectangle;
    private nextButtonText!: Phaser.GameObjects.Text;

    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private sentenceTimerText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private instructionText!: Phaser.GameObjects.Text;
    private feedbackText!: Phaser.GameObjects.Text;

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;
    private sentenceTimer!: Phaser.Time.TimerEvent;

    private isGameOver: boolean = false;

    constructor() {
        super({ key: 'SentenceBuilderScene' });
    }

    init(data: { words: GameContent[]; sessionManager: GameSessionManager }) {
        this.gameContent = data.words || [];
        this.sessionManager = data.sessionManager || null;
        this.currentSentenceIndex = 0;
        this.score = 0;
        this.timeRemaining = SENTENCE_BUILDER_CONFIG.gameplay.gameDuration;
        this.isGameOver = false;
        this.wordCards = [];
        this.slots = [];
    }

    create() {
        console.log('[SentenceBuilder] Scene create() started');
        try {
            const { width, height } = this.cameras.main;

            // Set background
            this.cameras.main.setBackgroundColor(SENTENCE_BUILDER_CONFIG.visual.backgroundColor);

            // Create UI
            this.createUI();

            // Start timers
            this.startGameTimer();

            // Load first sentence
            this.loadNextSentence();

            console.log('[SentenceBuilder] Scene create() finished successfully');
            // Emitir un evento personalizado para confirmar creación
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[SentenceBuilder] Critical error in create():', error);
            this.add.text(400, 300, 'Error initializing game', { color: '#ff0000' }).setOrigin(0.5);
        }
    }

    private createUI() {
        const { width, height } = this.cameras.main;
        const padding = 20;

        // Score
        this.scoreText = this.add.text(padding, padding, 'Score: 0', {
            fontSize: '24px',
            color: '#1e293b',
            fontStyle: 'bold',
        });

        // Timer
        this.timerText = this.add.text(width - padding, padding, `Time: ${this.timeRemaining}s`, {
            fontSize: '24px',
            color: '#1e293b',
            fontStyle: 'bold',
        }).setOrigin(1, 0);

        // Sentence timer
        this.sentenceTimerText = this.add.text(width / 2, padding, '', {
            fontSize: '20px',
            color: '#f59e0b',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0);

        // Progress
        this.progressText = this.add.text(width / 2, padding + 30, '', {
            fontSize: '18px',
            color: '#64748b',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0);

        // Instructions
        this.instructionText = this.add.text(width / 2, 100, 'Drag words to build the sentence', {
            fontSize: '22px',
            color: '#334155',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Feedback (hidden initially)
        this.feedbackText = this.add.text(width / 2, 140, '', {
            fontSize: '20px',
            color: '#10b981',
            fontStyle: 'bold',
        }).setOrigin(0.5).setVisible(false);

        // Check button
        this.createCheckButton();

        // Hint button
        this.createHintButton();

        // Next button (hidden initially)
        this.createNextButton();
    }

    private createCheckButton() {
        const { width } = this.cameras.main;
        const buttonWidth = 150;
        const buttonHeight = 50;
        const x = width / 2 - 80;
        const y = 520;

        this.checkButton = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x3b82f6)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.checkAnswer())
            .on('pointerover', () => this.checkButton.setFillStyle(0x2563eb))
            .on('pointerout', () => this.checkButton.setFillStyle(0x3b82f6));

        this.checkButtonText = this.add.text(x, y, 'Check', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
    }

    private createHintButton() {
        const { width } = this.cameras.main;
        const buttonWidth = 120;
        const buttonHeight = 50;
        const x = width / 2 + 80;
        const y = 520;

        this.hintButton = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0xf59e0b)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showHint())
            .on('pointerover', () => this.hintButton.setFillStyle(0xd97706))
            .on('pointerout', () => this.hintButton.setFillStyle(0xf59e0b));

        this.hintButtonText = this.add.text(x, y, 'Hint', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
    }

    private createNextButton() {
        const { width } = this.cameras.main;
        const buttonWidth = 150;
        const buttonHeight = 50;
        const x = width / 2;
        const y = 520;

        this.nextButton = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x10b981)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadNextSentence())
            .on('pointerover', () => this.nextButton.setFillStyle(0x059669))
            .on('pointerout', () => this.nextButton.setFillStyle(0x10b981))
            .setVisible(false);

        this.nextButtonText = this.add.text(x, y, 'Next', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setVisible(false);
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

    private startSentenceTimer() {
        this.sentenceTimeRemaining = SENTENCE_BUILDER_CONFIG.gameplay.timePerSentence;

        if (this.sentenceTimer) {
            this.sentenceTimer.remove();
        }

        this.sentenceTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.sentenceTimeRemaining--;
                this.sentenceTimerText.setText(`Sentence time: ${this.sentenceTimeRemaining}s`);

                if (this.sentenceTimeRemaining <= 0) {
                    this.handleTimeout();
                }
            },
            callbackScope: this,
            loop: true,
        });
    }

    private loadNextSentence() {
        if (this.isGameOver) return;

        console.log(`[SentenceBuilder] Loading sentence index: ${this.currentSentenceIndex}`);

        // Check if we've completed all sentences
        if (this.currentSentenceIndex >= SENTENCE_BUILDER_CONFIG.gameplay.sentencesPerGame) {
            console.log('[SentenceBuilder] Reached max sentences per game');
            this.endGame();
            return;
        }

        // Check if we have content
        if (this.currentSentenceIndex >= this.gameContent.length) {
            this.endGame();
            return;
        }

        // Clear previous sentence
        this.clearSentence();

        // Get sentence
        const content = this.gameContent[this.currentSentenceIndex];

        if (!content || !content.content_text) {
            console.warn(`[SentenceBuilder] Invalid content at index ${this.currentSentenceIndex}. Using fallback.`);
            this.currentSentence = ['The', 'sentence', 'is', 'missing'];
        } else {
            this.currentSentence = content.content_text.trim().split(' ').filter(s => s !== '');
            if (this.currentSentence.length === 0) {
                this.currentSentence = ['Empty', 'sentence', 'found'];
            }
        }

        // Update progress
        this.progressText.setText(`Sentence ${this.currentSentenceIndex + 1} of ${Math.min(SENTENCE_BUILDER_CONFIG.gameplay.sentencesPerGame, this.gameContent.length)}`);

        // Reset hints
        this.hintsUsed = 0;
        this.updateHintButton();

        // Hide feedback and next button
        this.feedbackText.setVisible(false);
        this.nextButton.setVisible(false);
        this.nextButtonText.setVisible(false);
        this.checkButton.setVisible(true);
        this.checkButtonText.setVisible(true);
        this.hintButton.setVisible(true);
        this.hintButtonText.setVisible(true);

        // Create slots
        this.createSlots();

        // Create word cards
        this.createWordCards();

        // Start sentence timer
        this.startSentenceTimer();

        this.currentSentenceIndex++;
    }

    private clearSentence() {
        // Destroy word cards
        this.wordCards.forEach(card => {
            card.sprite.destroy();
            card.text.destroy();
        });
        this.wordCards = [];

        // Destroy slots
        this.slots.forEach(slot => {
            slot.sprite.destroy();
        });
        this.slots = [];
    }

    private createSlots() {
        const { width } = this.cameras.main;
        const slotWidth = SENTENCE_BUILDER_CONFIG.layout.wordCardWidth;
        const slotHeight = SENTENCE_BUILDER_CONFIG.layout.wordCardHeight;
        const spacing = SENTENCE_BUILDER_CONFIG.layout.slotSpacing;
        const y = SENTENCE_BUILDER_CONFIG.layout.buildAreaY;

        const totalWidth = (slotWidth + spacing) * this.currentSentence.length - spacing;
        const startX = (width - totalWidth) / 2 + slotWidth / 2;

        for (let i = 0; i < this.currentSentence.length; i++) {
            const x = startX + i * (slotWidth + spacing);

            const slotSprite = this.add.rectangle(
                x, y, slotWidth, slotHeight,
                parseInt(SENTENCE_BUILDER_CONFIG.visual.slotColor.replace('#', '0x'))
            ).setStrokeStyle(2, 0x94a3b8);

            this.slots.push({
                sprite: slotSprite,
                index: i,
                occupied: false,
                wordCard: null,
            });
        }
    }

    private createWordCards() {
        const { width } = this.cameras.main;
        const cardWidth = SENTENCE_BUILDER_CONFIG.layout.wordCardWidth;
        const cardHeight = SENTENCE_BUILDER_CONFIG.layout.wordCardHeight;
        const spacing = SENTENCE_BUILDER_CONFIG.layout.wordCardSpacing;
        const y = SENTENCE_BUILDER_CONFIG.layout.wordBankY;

        // Shuffle words
        const words = [...this.currentSentence];
        if (SENTENCE_BUILDER_CONFIG.gameplay.shuffleWords) {
            Phaser.Utils.Array.Shuffle(words);
        }

        const totalWidth = (cardWidth + spacing) * words.length - spacing;
        const startX = (width - totalWidth) / 2 + cardWidth / 2;

        words.forEach((word, index) => {
            const x = startX + index * (cardWidth + spacing);

            const cardSprite = this.add.rectangle(
                x, y, cardWidth, cardHeight,
                parseInt(SENTENCE_BUILDER_CONFIG.visual.wordCardColor.replace('#', '0x'))
            ).setInteractive({ useHandCursor: true, draggable: true });

            const cardText = this.add.text(x, y, word, {
                fontSize: `${SENTENCE_BUILDER_CONFIG.visual.fontSize}px`,
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5);

            const originalIndex = this.currentSentence.indexOf(word);

            const wordCard: WordCard = {
                sprite: cardSprite,
                text: cardText,
                word: word,
                originalIndex: originalIndex,
                slotIndex: null,
            };

            this.wordCards.push(wordCard);

            // Setup drag events
            this.setupDragEvents(wordCard);
        });
    }

    private setupDragEvents(wordCard: WordCard) {
        wordCard.sprite.on('dragstart', () => {
            wordCard.sprite.setFillStyle(parseInt(SENTENCE_BUILDER_CONFIG.visual.wordCardHoverColor.replace('#', '0x')));

            // If card was in a slot, free the slot
            if (wordCard.slotIndex !== null) {
                const slot = this.slots[wordCard.slotIndex];
                slot.occupied = false;
                slot.wordCard = null;
                slot.sprite.setFillStyle(parseInt(SENTENCE_BUILDER_CONFIG.visual.slotColor.replace('#', '0x')));
                wordCard.slotIndex = null;
            }
        });

        wordCard.sprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            wordCard.sprite.x = dragX;
            wordCard.sprite.y = dragY;
            wordCard.text.x = dragX;
            wordCard.text.y = dragY;
        });

        wordCard.sprite.on('dragend', () => {
            wordCard.sprite.setFillStyle(parseInt(SENTENCE_BUILDER_CONFIG.visual.wordCardColor.replace('#', '0x')));

            // Check if dropped on a slot
            const slot = this.findSlotUnderCard(wordCard);

            if (slot && !slot.occupied) {
                // Place card in slot
                this.placeCardInSlot(wordCard, slot);
            } else {
                // Return to word bank
                this.returnCardToBank(wordCard);
            }
        });
    }

    private findSlotUnderCard(wordCard: WordCard): Slot | null {
        for (const slot of this.slots) {
            const distance = Phaser.Math.Distance.Between(
                wordCard.sprite.x, wordCard.sprite.y,
                slot.sprite.x, slot.sprite.y
            );

            if (distance < 60) {
                return slot;
            }
        }
        return null;
    }

    private placeCardInSlot(wordCard: WordCard, slot: Slot) {
        wordCard.sprite.x = slot.sprite.x;
        wordCard.sprite.y = slot.sprite.y;
        wordCard.text.x = slot.sprite.x;
        wordCard.text.y = slot.sprite.y;
        wordCard.slotIndex = slot.index;

        slot.occupied = true;
        slot.wordCard = wordCard;
        slot.sprite.setFillStyle(parseInt(SENTENCE_BUILDER_CONFIG.visual.slotFilledColor.replace('#', '0x')));
    }

    private returnCardToBank(wordCard: WordCard) {
        const index = this.wordCards.indexOf(wordCard);
        const { width } = this.cameras.main;
        const cardWidth = SENTENCE_BUILDER_CONFIG.layout.wordCardWidth;
        const spacing = SENTENCE_BUILDER_CONFIG.layout.wordCardSpacing;
        const y = SENTENCE_BUILDER_CONFIG.layout.wordBankY;
        const totalWidth = (cardWidth + spacing) * this.wordCards.length - spacing;
        const startX = (width - totalWidth) / 2 + cardWidth / 2;
        const x = startX + index * (cardWidth + spacing);

        this.tweens.add({
            targets: [wordCard.sprite, wordCard.text],
            x: x,
            y: y,
            duration: 200,
            ease: 'Power2',
        });
    }

    private checkAnswer() {
        if (this.isCheckingAnswer) return;

        this.isCheckingAnswer = true;

        // Build current sentence from slots
        const builtSentence: string[] = [];
        for (const slot of this.slots) {
            if (slot.wordCard) {
                builtSentence.push(slot.wordCard.word);
            } else {
                builtSentence.push('_'); // Empty slot
            }
        }

        // Check if all slots are filled
        if (builtSentence.includes('_')) {
            this.feedbackText.setText('Please fill all slots!').setColor('#f59e0b').setVisible(true);
            this.time.delayedCall(2000, () => {
                this.feedbackText.setVisible(false);
                this.isCheckingAnswer = false;
            });
            return;
        }

        // Check correctness
        const isCorrect = builtSentence.join(' ') === this.currentSentence.join(' ');

        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }

    private handleCorrectAnswer() {
        const timeBonus = Math.floor(this.sentenceTimeRemaining / 5) * SENTENCE_BUILDER_CONFIG.scoring.timeBonus;
        const points = SENTENCE_BUILDER_CONFIG.scoring.perfectSentence + timeBonus;

        this.score += points;

        if (this.sessionManager) {
            this.sessionManager.updateScore(points, true);
        }

        // Visual feedback
        this.feedbackText.setText(`✓ Correct! +${points} points`).setColor('#10b981').setVisible(true);
        this.slots.forEach(slot => {
            slot.sprite.setFillStyle(parseInt(SENTENCE_BUILDER_CONFIG.visual.correctColor.replace('#', '0x')));
        });

        this.updateUI();
        this.showNextButton();
    }

    private handleIncorrectAnswer() {
        if (this.sessionManager) {
            this.sessionManager.updateScore(0, false);
        }

        // Visual feedback
        this.feedbackText.setText('✗ Incorrect. Try again!').setColor('#ef4444').setVisible(true);
        this.slots.forEach(slot => {
            slot.sprite.setFillStyle(parseInt(SENTENCE_BUILDER_CONFIG.visual.incorrectColor.replace('#', '0x')));
        });

        this.time.delayedCall(1500, () => {
            this.feedbackText.setVisible(false);
            this.slots.forEach(slot => {
                slot.sprite.setFillStyle(parseInt(SENTENCE_BUILDER_CONFIG.visual.slotColor.replace('#', '0x')));
            });
            this.isCheckingAnswer = false;
        });
    }

    private handleTimeout() {
        if (this.sentenceTimer) {
            this.sentenceTimer.remove();
        }

        this.feedbackText.setText('⏱ Time\'s up!').setColor('#f59e0b').setVisible(true);

        if (this.sessionManager) {
            this.sessionManager.updateScore(0, false);
        }

        this.showNextButton();
    }

    private showHint() {
        if (this.hintsUsed >= SENTENCE_BUILDER_CONFIG.gameplay.maxHintsPerSentence) {
            this.feedbackText.setText('No more hints available!').setColor('#f59e0b').setVisible(true);
            this.time.delayedCall(2000, () => this.feedbackText.setVisible(false));
            return;
        }

        // Find first empty slot
        const emptySlot = this.slots.find(slot => !slot.occupied);
        if (!emptySlot) return;

        // Find correct word for this slot
        const correctWord = this.currentSentence[emptySlot.index];
        const wordCard = this.wordCards.find(card => card.word === correctWord && card.slotIndex === null);

        if (wordCard) {
            this.placeCardInSlot(wordCard, emptySlot);
            this.hintsUsed++;
            this.score += SENTENCE_BUILDER_CONFIG.scoring.hintPenalty;
            this.updateHintButton();
            this.updateUI();
        }
    }

    private updateHintButton() {
        const remaining = SENTENCE_BUILDER_CONFIG.gameplay.maxHintsPerSentence - this.hintsUsed;
        this.hintButtonText.setText(`Hint (${remaining})`);
    }

    private showNextButton() {
        this.checkButton.setVisible(false);
        this.checkButtonText.setVisible(false);
        this.hintButton.setVisible(false);
        this.hintButtonText.setVisible(false);
        this.nextButton.setVisible(true);
        this.nextButtonText.setVisible(true);

        if (this.sentenceTimer) {
            this.sentenceTimer.remove();
        }
    }

    private updateUI() {
        this.scoreText.setText(`Score: ${this.score}`);
    }

    private async endGame() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Stop timers
        if (this.gameTimer) this.gameTimer.remove();
        if (this.sentenceTimer) this.sentenceTimer.remove();

        // Clear sentence
        this.clearSentence();

        // End session
        if (this.sessionManager) {
            try {
                await this.sessionManager.endSession({
                    sentencesCompleted: this.currentSentenceIndex - 1,
                    hintsUsed: this.hintsUsed,
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
        // Game loop updates if needed
    }
}
