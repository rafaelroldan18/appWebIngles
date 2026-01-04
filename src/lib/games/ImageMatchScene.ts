/**
 * ImageMatchScene - Memory/card matching game
 * Players flip cards to find matching pairs of images and words
 */

import Phaser from 'phaser';
import { IMAGE_MATCH_CONFIG } from './imageMatch.config';
import type { GameContent } from '@/types';
import type { GameSessionManager } from './GameSessionManager';

interface Card {
    sprite: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
    content: GameContent;
    index: number;
    isFlipped: boolean;
    isMatched: boolean;
    isImage: boolean; // true for emoji/image, false for word
}

export class ImageMatchScene extends Phaser.Scene {
    private gameContent: GameContent[] = [];
    private sessionManager: GameSessionManager | null = null;

    // Game state
    private cards: Card[] = [];
    private flippedCards: Card[] = [];
    private matchedPairs: number = 0;
    private totalPairs: number = 0;
    private score: number = 0;
    private timeRemaining: number = 0;
    private wrongMatches: number = 0;
    private isProcessing: boolean = false;

    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private pairsText!: Phaser.GameObjects.Text;
    private instructionText!: Phaser.GameObjects.Text;

    // Timer
    private gameTimer!: Phaser.Time.TimerEvent;

    private isGameOver: boolean = false;

    // Emoji mapping for vocabulary (can be replaced with actual images)
    private emojiMap: { [key: string]: string } = {
        // Animals
        'cat': '🐱', 'dog': '🐶', 'bird': '🐦', 'fish': '🐟',
        'elephant': '🐘', 'lion': '🦁', 'monkey': '🐵', 'tiger': '🐯',
        // Food
        'apple': '🍎', 'banana': '🍌', 'pizza': '🍕', 'burger': '🍔',
        'cake': '🍰', 'cookie': '🍪', 'bread': '🍞', 'cheese': '🧀',
        // Objects
        'book': '📚', 'pen': '🖊️', 'phone': '📱', 'computer': '💻',
        'car': '🚗', 'house': '🏠', 'tree': '🌳', 'flower': '🌸',
        // Weather
        'sun': '☀️', 'rain': '🌧️', 'cloud': '☁️', 'snow': '❄️',
        // Colors
        'red': '🔴', 'blue': '🔵', 'green': '🟢', 'yellow': '🟡',
        // Actions
        'run': '🏃', 'walk': '🚶', 'jump': '🦘', 'swim': '🏊',
        'eat': '🍽️', 'drink': '🥤', 'sleep': '😴', 'study': '📖',
    };

    constructor() {
        super({ key: 'ImageMatchScene' });
    }

    init(data: { words: GameContent[]; sessionManager: GameSessionManager }) {
        this.gameContent = data.words || [];
        this.sessionManager = data.sessionManager || null;
        this.matchedPairs = 0;
        this.score = 0;
        this.timeRemaining = IMAGE_MATCH_CONFIG.gameplay.gameDuration;
        this.wrongMatches = 0;
        this.isGameOver = false;
        this.cards = [];
        this.flippedCards = [];
        this.isProcessing = false;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Set background
        this.cameras.main.setBackgroundColor(IMAGE_MATCH_CONFIG.visual.backgroundColor);

        // Create UI
        this.createUI();

        // Create cards
        this.createCards();

        // Start timer
        this.startGameTimer();
    }

    private createUI() {
        const { width, height } = this.cameras.main;
        const padding = 20;

        // Score
        this.scoreText = this.add.text(padding, padding, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
        });

        // Timer
        this.timerText = this.add.text(width - padding, padding, `Time: ${this.timeRemaining}s`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(1, 0);

        // Pairs
        this.pairsText = this.add.text(width / 2, padding, 'Pairs: 0/0', {
            fontSize: '24px',
            color: '#fbbf24',
            fontStyle: 'bold',
        }).setOrigin(0.5, 0);

        // Instructions
        this.instructionText = this.add.text(width / 2, height - padding, 'Click cards to find matching pairs!', {
            fontSize: '18px',
            color: '#94a3b8',
            fontStyle: 'bold',
        }).setOrigin(0.5, 1);
    }

    private createCards() {
        // Select pairs from content
        const correctWords = this.gameContent.filter(c => c.is_correct);
        let pairsToUse = Math.min(IMAGE_MATCH_CONFIG.gameplay.pairsCount, correctWords.length);

        // Fallback content if no correct words
        let selectedContent = [];
        if (pairsToUse === 0) {
            console.warn('[ImageMatch] No correct words found. Using fallback pairs.');
            selectedContent = [
                { content_id: 'f1', content_text: 'cat', is_correct: true },
                { content_id: 'f2', content_text: 'dog', is_correct: true }
            ] as GameContent[];
            pairsToUse = 2;
        } else {
            selectedContent = Phaser.Utils.Array.Shuffle([...correctWords]).slice(0, pairsToUse);
        }

        this.totalPairs = pairsToUse;

        // Create card data (each word gets 2 cards: one with emoji, one with text)
        const cardData: { content: GameContent; isImage: boolean }[] = [];

        selectedContent.forEach(content => {
            cardData.push({ content, isImage: true });  // Emoji card
            cardData.push({ content, isImage: false }); // Word card
        });

        // Shuffle cards
        Phaser.Utils.Array.Shuffle(cardData);

        // Calculate grid position
        const { width, height } = this.cameras.main;
        const { rows, cols, cardWidth, cardHeight, cardSpacing } = IMAGE_MATCH_CONFIG.grid;

        const gridWidth = cols * cardWidth + (cols - 1) * cardSpacing;
        const gridHeight = rows * cardHeight + (rows - 1) * cardSpacing;
        const startX = (width - gridWidth) / 2 + cardWidth / 2;
        const startY = (height - gridHeight) / 2 + cardHeight / 2 + 30;

        // Create cards
        cardData.forEach((data, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * (cardWidth + cardSpacing);
            const y = startY + row * (cardHeight + cardSpacing);

            this.createCard(x, y, data.content, index, data.isImage);
        });

        // Update pairs text
        this.pairsText.setText(`Pairs: 0/${this.totalPairs}`);
    }

    private createCard(x: number, y: number, content: GameContent, index: number, isImage: boolean) {
        const { cardWidth, cardHeight } = IMAGE_MATCH_CONFIG.grid;

        // Card back (blue)
        const cardSprite = this.add.rectangle(
            x, y, cardWidth, cardHeight,
            parseInt(IMAGE_MATCH_CONFIG.visual.cardBackColor.replace('#', '0x'))
        ).setInteractive({ useHandCursor: true });

        // Add rounded corners effect with stroke
        cardSprite.setStrokeStyle(3, 0x1e40af);

        // Card text (hidden initially)
        const displayText = isImage
            ? this.getEmojiForWord(content.content_text)
            : content.content_text;

        const cardText = this.add.text(x, y, displayText, {
            fontSize: isImage ? '48px' : `${IMAGE_MATCH_CONFIG.visual.fontSize}px`,
            color: '#1e293b',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: cardWidth - 20 },
        }).setOrigin(0.5).setVisible(false);

        const card: Card = {
            sprite: cardSprite,
            text: cardText,
            content: content,
            index: index,
            isFlipped: false,
            isMatched: false,
            isImage: isImage,
        };

        this.cards.push(card);

        // Setup click event
        cardSprite.on('pointerdown', () => this.onCardClick(card));
        cardSprite.on('pointerover', () => {
            if (!card.isFlipped && !card.isMatched && !this.isProcessing) {
                cardSprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardHoverColor.replace('#', '0x')));
            }
        });
        cardSprite.on('pointerout', () => {
            if (!card.isFlipped && !card.isMatched) {
                cardSprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardBackColor.replace('#', '0x')));
            }
        });
    }

    private getEmojiForWord(word: string): string {
        const normalized = word.toLowerCase().trim();
        return this.emojiMap[normalized] || '❓';
    }

    private onCardClick(card: Card) {
        if (this.isProcessing || card.isFlipped || card.isMatched || this.isGameOver) {
            return;
        }

        // Flip card
        this.flipCard(card, true);

        // Add to flipped cards
        this.flippedCards.push(card);

        // Check if we have 2 flipped cards
        if (this.flippedCards.length === 2) {
            this.isProcessing = true;
            this.checkMatch();
        }
    }

    private flipCard(card: Card, faceUp: boolean) {
        card.isFlipped = faceUp;

        if (faceUp) {
            // Show front (white with text)
            card.sprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardFrontColor.replace('#', '0x')));
            card.text.setVisible(true);
        } else {
            // Show back (blue)
            card.sprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardBackColor.replace('#', '0x')));
            card.text.setVisible(false);
        }
    }

    private checkMatch() {
        const [card1, card2] = this.flippedCards;

        // Check if cards match (same content_id but different card types)
        const isMatch = card1.content.content_id === card2.content.content_id &&
            card1.isImage !== card2.isImage;

        if (isMatch) {
            this.handleMatch(card1, card2);
        } else {
            this.handleMismatch(card1, card2);
        }
    }

    private handleMatch(card1: Card, card2: Card) {
        // Mark as matched
        card1.isMatched = true;
        card2.isMatched = true;

        // Change color to green
        this.time.delayedCall(IMAGE_MATCH_CONFIG.gameplay.matchDelay, () => {
            card1.sprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardMatchedColor.replace('#', '0x')));
            card2.sprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardMatchedColor.replace('#', '0x')));
            card1.sprite.setStrokeStyle(3, 0x059669);
            card2.sprite.setStrokeStyle(3, 0x059669);

            // Update score
            const points = IMAGE_MATCH_CONFIG.scoring.matchFound;
            this.score += points;

            if (this.sessionManager) {
                this.sessionManager.updateScore(points, true);
            }

            // Update pairs count
            this.matchedPairs++;
            this.updateUI();

            // Clear flipped cards
            this.flippedCards = [];
            this.isProcessing = false;

            // Check if game is complete
            if (this.matchedPairs === this.totalPairs) {
                this.handleGameComplete();
            }
        });
    }

    private handleMismatch(card1: Card, card2: Card) {
        // Show wrong color briefly
        card1.sprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardWrongColor.replace('#', '0x')));
        card2.sprite.setFillStyle(parseInt(IMAGE_MATCH_CONFIG.visual.cardWrongColor.replace('#', '0x')));

        this.wrongMatches++;

        // Penalty
        const penalty = IMAGE_MATCH_CONFIG.scoring.wrongMatch;
        this.score += penalty;

        if (this.sessionManager) {
            this.sessionManager.updateScore(penalty, false);
        }

        // Flip back after delay
        this.time.delayedCall(IMAGE_MATCH_CONFIG.gameplay.flipBackDelay, () => {
            this.flipCard(card1, false);
            this.flipCard(card2, false);

            this.flippedCards = [];
            this.isProcessing = false;
        });

        this.updateUI();
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

    private handleGameComplete() {
        // Perfect game bonus
        if (this.wrongMatches === 0) {
            this.score += IMAGE_MATCH_CONFIG.scoring.perfectGame;
        }

        // Time bonus
        const timeBonus = Math.floor(this.timeRemaining / 10) * IMAGE_MATCH_CONFIG.scoring.timeBonus;
        this.score += timeBonus;

        this.updateUI();

        // End game after short delay
        this.time.delayedCall(1500, () => {
            this.endGame();
        });
    }

    private updateUI() {
        this.scoreText.setText(`Score: ${this.score}`);
        this.pairsText.setText(`Pairs: ${this.matchedPairs}/${this.totalPairs}`);
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
                    pairsMatched: this.matchedPairs,
                    totalPairs: this.totalPairs,
                    wrongMatches: this.wrongMatches,
                    perfectGame: this.wrongMatches === 0,
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
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
        overlay.setOrigin(0);

        // Game Over text
        const gameOverText = this.matchedPairs === this.totalPairs ? 'COMPLETE!' : 'GAME OVER!';
        const gameOverColor = this.matchedPairs === this.totalPairs ? '#10b981' : '#fbbf24';

        this.add.text(width / 2, height / 2 - 100, gameOverText, {
            fontSize: '64px',
            color: gameOverColor,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Final score
        this.add.text(width / 2, height / 2 - 20, `Final Score: ${this.score}`, {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Stats
        this.add.text(width / 2, height / 2 + 30, `Pairs Matched: ${this.matchedPairs}/${this.totalPairs}`, {
            fontSize: '24px',
            color: '#94a3b8',
        }).setOrigin(0.5);

        if (this.wrongMatches === 0 && this.matchedPairs === this.totalPairs) {
            this.add.text(width / 2, height / 2 + 70, '🌟 PERFECT GAME! 🌟', {
                fontSize: '28px',
                color: '#fbbf24',
                fontStyle: 'bold',
            }).setOrigin(0.5);
        }

        // Accuracy
        if (this.sessionManager) {
            const data = this.sessionManager.getSessionData();
            const accuracy = data.correctCount + data.wrongCount > 0
                ? Math.round((data.correctCount / (data.correctCount + data.wrongCount)) * 100)
                : 0;

            this.add.text(width / 2, height / 2 + 110,
                `Accuracy: ${accuracy}%`, {
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
