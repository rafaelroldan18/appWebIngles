/**
 * CityExplorerScene - Interactive map exploration game
 * Rediseñado con sistema de atlas profesional
 */

import * as Phaser from 'phaser';
import { CITY_EXPLORER_CONFIG } from './cityExplorer.config';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { showModal, showFeedback, showGlow, createButton } from './UIKit';
import type { GameSessionManager } from './GameSessionManager';
import type { CityExplorerLocationItem } from './gameLoader.utils';
import type { MissionConfig } from '@/types';

interface Checkpoint {
    sprite: Phaser.GameObjects.Image; // Ahora usa sprites del atlas
    label: Phaser.GameObjects.Text;
    data: CityExplorerLocationItem;
    isTarget: boolean;
    isCompleted: boolean;
    container: Phaser.GameObjects.Container; // Para agrupar sprite + label
}

export class CityExplorerScene extends Phaser.Scene {
    private sessionManager: GameSessionManager | null = null;
    private mapData: { checkpoints: CityExplorerLocationItem[] } | null = null;
    private missionConfig: MissionConfig | undefined;

    // Game objects (ahora usan sprites del atlas)
    private player!: Phaser.GameObjects.Image; // Sprite del atlas
    private checkpoints: Checkpoint[] = [];
    private currentTarget: Checkpoint | null = null;
    private buildings: Phaser.GameObjects.Image[] = []; // Decoración del mapa

    // Game state
    private score: number = 0;
    private timeRemaining: number = 0;
    private locationsFound: number = 0;
    private failures: number = 0;
    private totalCheckpoints: number = 0;
    private requiredCheckpoints: number = 0;
    private isAnswering: boolean = false;
    private isGameOver: boolean = false;
    private hintsUsed: number = 0;
    private maxHints: number = 3;

    // Challenge UI State
    private challengeContainer: Phaser.GameObjects.Container | null = null;
    private challengeTimerEvent: Phaser.Time.TimerEvent | null = null;
    private currentAttempts: number = 0;

    // UI Elements (ahora usa GameHUD)
    private gameHUD!: GameHUD;
    private objectiveText!: Phaser.GameObjects.Text;

    // Controls
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private gameTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'CityExplorerScene' });
    }

    init(data: any) {
        console.log('[CityExplorerScene] init:', data);
        this.sessionManager = data.sessionManager;
        this.mapData = data.map || { checkpoints: [] };
        this.missionConfig = data.missionConfig;

        // Config Defaults
        const ceConfig = this.missionConfig?.city_explorer;
        this.totalCheckpoints = this.mapData.checkpoints.length;
        this.requiredCheckpoints = Math.min(
            ceConfig?.checkpoints_to_complete || 6,
            this.totalCheckpoints // Prevent requiring more than available
        );

        this.score = 0;
        this.locationsFound = 0;
        this.failures = 0;
        this.timeRemaining = this.missionConfig?.time_limit_seconds || 300;
        this.isGameOver = false;
        this.isAnswering = false;
        this.checkpoints = [];
        this.currentTarget = null;
    }

    create() {
        // 1. Background
        this.cameras.main.setBackgroundColor(CITY_EXPLORER_CONFIG.visual.backgroundColor);
        this.createGround();

        // 2. Render Checkpoints from Map Data
        this.createMapMarkers();

        // 3. Create Player (Top-Down Square)
        this.createPlayer();

        // 4. UI
        this.createHUD();

        // 5. Controls
        this.setupControls();

        // 6. Start Logic
        this.startGameplay();

        // Notify readiness
        this.events.emit('scene-ready');
    }

    private createGround() {
        const { width, height } = this.cameras.main;
        // Simple grid
        this.add.grid(width / 2, height / 2, width, height, 50, 50, 0x000000, 0.1, 0xffffff, 0.1);
    }

    private createMapMarkers() {
        if (!this.mapData || !this.mapData.checkpoints) return;

        this.mapData.checkpoints.forEach(loc => {
            this.createCheckpointMarker(loc);
        });
    }

    private createCheckpointMarker(loc: CityExplorerLocationItem) {
        const size = 60;

        // Simple Square/Circle Marker
        const marker = this.add.circle(loc.x, loc.y, size / 2, 0x3b82f6)
            .setStrokeStyle(3, 0xffffff);

        // Emoji
        const emoji = this.add.text(loc.x, loc.y, loc.emoji || '📍', { fontSize: '32px' }).setOrigin(0.5);

        // Label (Truncated for clean UI)
        let displayName = loc.name;
        if (displayName.length > 20) displayName = displayName.substring(0, 17) + '...';

        const label = this.add.text(loc.x, loc.y + 40, displayName.toUpperCase(), {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 },
            wordWrap: { width: 150 }
        }).setOrigin(0.5);

        this.checkpoints.push({
            sprite: marker,
            emoji,
            label,
            data: loc,
            isTarget: false,
            isCompleted: false
        });
    }

    private createPlayer() {
        const { width, height } = this.cameras.main;

        // Player Square
        this.player = this.add.rectangle(width / 2, height / 2, 30, 30, 0x10b981);
        this.physics.add.existing(this.player);

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);

        // Emoji Overlay
        this.playerEmoji = this.add.text(this.player.x, this.player.y, '🚶', { fontSize: '20px' }).setOrigin(0.5);
    }

    private setupControls() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
    }

    private createHUD() {
        const { width } = this.cameras.main;

        // Top Bar (Expanded height for Dialogue)
        this.add.rectangle(width / 2, 60, width, 120, 0x1e293b).setOrigin(0.5);

        this.scoreText = this.add.text(20, 20, 'SCORE: 0', { fontSize: '20px', color: '#10b981', fontStyle: 'bold' });
        this.timerText = this.add.text(width / 2, 20, `TIME: ${this.timeRemaining}`, { fontSize: '24px', color: '#fff' }).setOrigin(0.5, 0);
        this.progressText = this.add.text(width - 20, 20, 'GOALS: 0/6', { fontSize: '20px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(1, 0);

        this.objectiveText = this.add.text(width / 2, 80, 'FIND THE TARGET!', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2,
            align: 'center',
            wordWrap: { width: width - 100 }
        }).setOrigin(0.5);
    }

    private startGameplay() {
        // Start Timer
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isGameOver) return;
                this.timeRemaining--;
                this.timerText.setText(`TIME: ${this.timeRemaining}`);
                if (this.timeRemaining <= 0) this.endGame(false, 'Time ran out!');
            },
            loop: true
        });

        this.selectNextTarget();
    }

    private selectNextTarget() {
        if (!this.checkpoints.length) return;

        // Clear old visual state
        if (this.currentTarget) {
            this.currentTarget.sprite.setStrokeStyle(3, 0xffffff);
            (this.currentTarget.sprite as Phaser.GameObjects.Arc).setFillStyle(0x3b82f6);
            this.currentTarget.isTarget = false;
        }

        // Filter out already completed checkpoints
        const availableCheckpoints = this.checkpoints.filter(cp => !cp.isCompleted);

        // If no available checkpoints but we still need to find more, something is wrong or we need to reuse.
        // For now, if all are completed, end the game.
        if (availableCheckpoints.length === 0) {
            this.endGame(false, 'No more checkpoints to find!');
            return;
        }

        // Randomly pick from available checkpoints
        let next = availableCheckpoints[Phaser.Math.Between(0, availableCheckpoints.length - 1)];

        // Ensure it's not the current target if there are other options
        if (next === this.currentTarget && availableCheckpoints.length > 1) {
            next = availableCheckpoints.find(c => c !== this.currentTarget) || next;
        }

        this.currentTarget = next;
        this.currentTarget.isTarget = true;

        // Highlight Visuals
        this.currentTarget.sprite.setStrokeStyle(4, 0xef4444);
        (this.currentTarget.sprite as Phaser.GameObjects.Arc).setFillStyle(0xef4444);

        // Update Text (Dialogue/Clue)
        // We show the challenge prompt (e.g. "Can I have a menu?") so player finds the place (e.g. "Restaurant")
        const clue = this.currentTarget.data.challenge?.prompt || this.currentTarget.data.name;

        // No truncation - rely on WordWrap
        this.objectiveText.setText(clue);
    }

    update(time: number, delta: number) {
        // 1. Pause if answering or Game Over
        if (this.isGameOver || this.isAnswering) {
            (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
            return;
        }

        // 2. Player Movement
        const speed = 200;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        if (this.cursors.left.isDown || this.wasd.A.isDown) body.setVelocityX(-speed);
        else if (this.cursors.right.isDown || this.wasd.D.isDown) body.setVelocityX(speed);

        if (this.cursors.up.isDown || this.wasd.W.isDown) body.setVelocityY(-speed);
        else if (this.cursors.down.isDown || this.wasd.S.isDown) body.setVelocityY(speed);

        // 3. Update Emoji pos
        this.playerEmoji.setPosition(this.player.x, this.player.y);

        // 4. Collision Check (Distance to ANY checkpoint)
        this.checkCollisions();
    }

    private checkCollisions() {
        if (this.isAnswering) return;

        // Check against ALL checkpoints
        for (const cp of this.checkpoints) {
            // Skip if completed
            if (cp.isCompleted) continue;

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                cp.data.x, cp.data.y
            );

            // Use radius from data (default 60)
            const hitRadius = cp.data.radius || 60;

            if (dist <= hitRadius) {
                this.handleCheckpointEnter(cp);
                break; // Trigger first hit only
            }
        }
    }

    private handleCheckpointEnter(cp: Checkpoint) {
        // CRITICAL: Only allow interaction with the TARGET checkpoint
        if (!cp.isTarget) {
            console.log('[CityExplorer] Wrong checkpoint! Looking for:', this.currentTarget?.data.name);

            // Visual feedback for wrong location
            this.cameras.main.shake(150, 0.003);

            // Optional: Show floating text
            this.showFloatingText(this.player.x, this.player.y - 30, 'Wrong Location!', 0xef4444);

            return; // Don't open modal
        }

        console.log('[CityExplorer] Correct checkpoint reached:', cp.data.name);

        // 1. Pause Movement and Input
        this.isAnswering = true;
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);

        // 2. Check if this is a simple "Collect" challenge (no real question)
        const challengeData = cp.data.challenge;

        if (!challengeData ||
            (challengeData.options?.length === 1 && challengeData.options[0].text === 'Collect')) {
            // Auto-complete without modal for simple collect challenges
            const points = CITY_EXPLORER_CONFIG.scoring?.correctPreposition || 100;
            this.showFloatingText(this.player.x, this.player.y, `+${points}`, 0x10b981);
            this.time.delayedCall(500, () => this.handleChallengeComplete(cp, true, points));
            return;
        }

        // 3. Open Challenge Modal (only for real questions)
        this.showChallengeModal(cp);
    }

    private showChallengeModal(cp: Checkpoint) {
        const { width, height } = this.cameras.main;
        const config = this.missionConfig?.city_explorer;

        // 1. Setup State
        this.currentAttempts = config?.attempts_per_challenge || 2;
        const challengeData = cp.data.challenge;

        if (!challengeData) {
            console.warn('No challenge data for checkpoint');
            this.handleChallengeComplete(cp, true, 0);
            return;
        }

        // 2. Create Container
        this.challengeContainer = this.add.container(width / 2, height / 2).setDepth(2000);

        // 3. Background / Dimmer
        const dimmer = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
        const panelBg = this.add.rectangle(0, 0, 600, 450, 0xffffff).setStrokeStyle(4, 0x3b82f6);
        this.challengeContainer.add([dimmer, panelBg]);

        // 4. Header (Prompt)
        const title = this.add.text(0, -180, 'CHALLENGE', {
            fontSize: '16px', color: '#64748b', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);

        const prompt = this.add.text(0, -120, challengeData.prompt || 'Answer the question:', {
            fontSize: '24px', color: '#1e293b', fontStyle: 'bold', align: 'center',
            wordWrap: { width: 550 }
        }).setOrigin(0.5);

        this.challengeContainer.add([title, prompt]);

        // 5. Build Interaction (MCQ vs Input)
        if (challengeData.options && challengeData.options.length > 0) {
            this.renderMCQ(challengeData.options, (index) => {
                this.submitAnswer(cp, challengeData, index, null);
            });
        } else {
            // Fallback for non-MCQ (Input not fully implemented in Phaser-only mode easily)
            this.renderMCQ(['Complete', 'Skip'], (index) => {
                this.submitAnswer(cp, challengeData, index === 0 ? 0 : -1, null);
            });
        }

        // 6. Attempts Indicator
        const attemptsText = this.add.text(-280, 200, `Lives: ${this.currentAttempts}`, {
            fontSize: '18px', color: '#ef4444', fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        this.challengeContainer.add(attemptsText);

        // 7. Timer (if Configured)
        const timeLimit = config?.challenge_time_seconds || 0;
        if (timeLimit > 0) {
            this.startChallengeTimer(timeLimit, cp);
            const timerDisplay = this.add.text(280, 200, `⏱ ${timeLimit}`, {
                fontSize: '18px', color: '#3b82f6', fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            this.challengeContainer.add(timerDisplay);
            this.challengeContainer.setData('timerText', timerDisplay);
        }

        // 8. Hint Button (Always show, with usage limit)
        const hintBtn = this.add.text(0, 200, `💡 HINT (${this.maxHints - this.hintsUsed} left)`, {
            fontSize: '16px',
            color: this.hintsUsed >= this.maxHints ? '#94a3b8' : '#f59e0b',
            backgroundColor: this.hintsUsed >= this.maxHints ? '#f1f5f9' : '#fff7ed',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: this.hintsUsed < this.maxHints });

        hintBtn.setStroke(this.hintsUsed >= this.maxHints ? '#cbd5e1' : '#f59e0b', 2);
        hintBtn.on('pointerdown', () => {
            if (this.hintsUsed >= this.maxHints) {
                this.cameras.main.shake(100, 0.003);
                return;
            }

            this.hintsUsed++;
            hintBtn.setText(`💡 HINT (${this.maxHints - this.hintsUsed} left)`);

            if (this.hintsUsed >= this.maxHints) {
                hintBtn.setColor('#94a3b8');
                hintBtn.setBackgroundColor('#f1f5f9');
                hintBtn.setStroke('#cbd5e1', 2);
            }

            // Show hint text
            const hintText = challengeData.explanation || 'Think about the context of the dialogue!';
            const hintDisplay = this.add.text(0, 150, `💡 ${hintText}`, {
                fontSize: '14px',
                color: '#0369a1',
                backgroundColor: '#e0f2fe',
                padding: { x: 12, y: 8 },
                wordWrap: { width: 500 },
                align: 'center'
            }).setOrigin(0.5);

            this.challengeContainer.add(hintDisplay);

            // Fade out after 3 seconds
            this.tweens.add({
                targets: hintDisplay,
                alpha: 0,
                delay: 3000,
                duration: 500,
                onComplete: () => hintDisplay.destroy()
            });

            // Small score penalty
            const penalty = CITY_EXPLORER_CONFIG.scoring?.wrongAnswer || -10;
            this.score += penalty;
            this.updateHUD();
        });
        this.challengeContainer.add(hintBtn);

        // Animation
        this.challengeContainer.setScale(0.8);
        this.tweens.add({ targets: this.challengeContainer, scale: 1, duration: 300, ease: 'Back.out' });
    }

    private renderMCQ(options: (string | any)[], onSelect: (index: number) => void) {
        if (!this.challengeContainer) return;

        const startY = -40;
        const gap = 60;

        options.forEach((opt, index) => {
            const text = typeof opt === 'string' ? opt : (opt.text || opt.label || 'Option');
            const y = startY + (index * gap);
            const btn = this.add.rectangle(0, y, 500, 50, 0xf1f5f9).setInteractive({ useHandCursor: true });
            const label = this.add.text(0, y, text, {
                fontSize: '20px', color: '#334155', fontStyle: 'bold'
            }).setOrigin(0.5);

            btn.on('pointerover', () => { btn.setFillStyle(0xe2e8f0); });
            btn.on('pointerout', () => { btn.setFillStyle(0xf1f5f9); });
            btn.on('pointerdown', () => {
                this.tweens.add({ targets: [btn, label], scale: 0.95, duration: 50, yoyo: true, onComplete: () => onSelect(index) });
            });

            this.challengeContainer.add([btn, label]);
        });
    }

    private startChallengeTimer(seconds: number, cp: Checkpoint) {
        let remaining = seconds;
        this.challengeTimerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                remaining--;
                const display = this.challengeContainer?.getData('timerText') as Phaser.GameObjects.Text;
                if (display) display.setText(`⏱ ${remaining}`);

                if (remaining <= 0) {
                    this.challengeTimerEvent?.remove();
                    this.handleChallengeFail(cp, 'Time Up!');
                }
            }
        });
    }

    private submitAnswer(cp: Checkpoint, challengeData: any, index: number, textInput: string | null) {
        // 1. Validation Logic
        let isCorrect = false;
        let userAnswerText = '';

        // Get selected option
        const selectedOption = challengeData.options?.[index];

        if (typeof selectedOption === 'string') {
            userAnswerText = selectedOption;
        } else if (selectedOption?.text) {
            userAnswerText = selectedOption.text;
        } else {
            userAnswerText = index.toString();
        }

        // Validate answer
        // Check if option has isCorrect flag (preferred)
        if (selectedOption?.isCorrect !== undefined) {
            isCorrect = selectedOption.isCorrect === true;
        }
        // Check against correctOptionId
        else if (challengeData.correctOptionId) {
            isCorrect = selectedOption?.id === challengeData.correctOptionId;
        }
        // Fallback: check against correct_answer string
        else if (challengeData.correct_answer) {
            isCorrect = userAnswerText.toLowerCase().trim() === challengeData.correct_answer.toLowerCase().trim();
        }
        // Default to true for simple "Collect" challenges
        else {
            isCorrect = true;
        }

        console.log('[CityExplorer] Validation:', {
            selectedOption,
            userAnswerText,
            isCorrect,
            correctOptionId: challengeData.correctOptionId
        });

        // 2. Metrics & Logs
        console.log(`[CityExplorer] Answer: ${userAnswerText} | Correct: ${isCorrect}`);

        // Extract tags for feedback generation
        const feedbackTags = challengeData.grammar_tag ? [challengeData.grammar_tag] : ['vocabulary', 'directions'];

        this.sessionManager?.recordItem({
            id: challengeData.id || cp.data.id,
            text: challengeData.prompt || 'Question',
            result: isCorrect ? 'correct' : 'wrong',
            user_input: userAnswerText,
            correct_answer: challengeData.correct_answer || 'unknown',
            time_ms: 0, // Could verify time since modal open
            meta: {
                attemptsLeft: this.currentAttempts,
                tags: feedbackTags,
                rule_tag: feedbackTags[0], // for compatibility
                question_type: 'city_explorer_challenge'
            }
        });

        // 3. Game Loop Decision
        if (isCorrect) {
            const points = CITY_EXPLORER_CONFIG.scoring?.correctPreposition || 100;
            this.showFeedbackAndClose(true, 'Correct!');
            this.time.delayedCall(1000, () => this.handleChallengeComplete(cp, true, points));
        } else {
            this.currentAttempts--;

            // Update UI
            const livesText = this.challengeContainer?.list.find(c => (c as any).text && (c as any).text.startsWith('Lives:')) as Phaser.GameObjects.Text;
            if (livesText) livesText.setText(`Lives: ${this.currentAttempts}`);
            this.cameras.main.shake(200, 0.005);

            if (this.currentAttempts <= 0) {
                // Failed - apply penalty
                const penalty = CITY_EXPLORER_CONFIG.scoring?.wrongAnswer || -10;
                this.showFeedbackAndClose(false, 'Failed');
                this.time.delayedCall(1000, () => this.handleChallengeComplete(cp, false, penalty));
            } else {
                // Retry
                const toast = this.add.text(0, 0, 'Try Again', { fontSize: '32px', color: '#ff0000', stroke: '#fff', strokeThickness: 4 }).setOrigin(0.5);
                this.challengeContainer?.add(toast);
                this.tweens.add({ targets: toast, alpha: 0, scale: 2, duration: 800, onComplete: () => toast.destroy() });
            }
        }
    }

    private showFeedbackAndClose(success: boolean, text: string) {
        if (!this.challengeContainer) return;
        this.challengeTimerEvent?.remove();

        // Remove interactive elements
        this.challengeContainer.each((child: any) => {
            if (child.disableInteractive) child.disableInteractive();
        });

        const color = success ? 0x10b981 : 0xef4444;
        const fbBg = this.add.rectangle(0, 0, 600, 450, color, 0.9);
        const fbText = this.add.text(0, 0, text, { fontSize: '48px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        this.challengeContainer.add([fbBg, fbText]);
    }

    private handleChallengeFail(cp: Checkpoint, reason: string) {
        this.showFeedbackAndClose(false, reason);
        this.time.delayedCall(1000, () => {
            // Logic for failure? Reset checkpoint? Lose Game?
            // Usually: Just close, maybe penalty, remain uncompleted.
            // Or allow retry later.
            this.challengeContainer?.destroy();
            this.isAnswering = false;
            // Cooldown?
            this.updateHUD();
        });
    }

    private handleChallengeComplete(cp: Checkpoint, success: boolean, points: number) {
        if (this.challengeContainer) this.challengeContainer.destroy();
        this.challengeTimerEvent?.remove();

        this.isAnswering = false;

        // Mark Completed
        cp.isCompleted = true;

        if (success) {
            (cp.sprite as Phaser.GameObjects.Arc).setFillStyle(0x10b981); // Green
            cp.emoji.setText('✅');
            this.showFloatingText(this.player.x, this.player.y, `+${points}`, 0x10b981);
            this.locationsFound++;
        } else {
            (cp.sprite as Phaser.GameObjects.Arc).setFillStyle(0x94a3b8); // Gray
            cp.emoji.setText('❌');
            this.showFloatingText(this.player.x, this.player.y, `${points}`, 0xef4444);
            this.failures++;
        }

        this.score += points;
        this.updateHUD();

        // Progression Check
        const remaining = this.totalCheckpoints - (this.locationsFound + this.failures);

        if (this.locationsFound >= this.requiredCheckpoints) {
            // WIN
            this.time.delayedCall(1000, () => this.endGame(true, 'Mission Complete!'));
        } else if (this.locationsFound + remaining < this.requiredCheckpoints) {
            // IMPOSSIBLE TO WIN (LOSS)
            this.time.delayedCall(1000, () => this.endGame(false, 'Not enough targets remaining!'));
        } else {
            // CONTINUE (If targets remain)
            this.selectNextTarget();
        }
    }

    private updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        // Option to hide progress if configured, but default shows it
        this.progressText.setText(`GOALS: ${this.locationsFound}/${this.requiredCheckpoints}`);
    }

    private showFloatingText(x: number, y: number, text: string, color: number) {
        const t = this.add.text(x, y - 40, text, { fontSize: '24px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: y - 80, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
    }

    private endGame(isWin: boolean = false, reason: string = '') {
        if (this.isGameOver) return;
        this.isGameOver = true;
        if (this.gameTimer) this.gameTimer.remove();

        console.log(`Game Over. Win: ${isWin} | Score: ${this.score} | Reason: ${reason}`);

        // Show Game Over Screen
        this.showGameOverScreen(isWin, reason);

        // Emit event after short delay to allow visual feedback
        this.time.delayedCall(2000, () => {
            this.events.emit('gameOver', {
                score: this.score,
                correctCount: this.locationsFound,
                wrongCount: this.failures,
                durationSeconds: (this.missionConfig?.time_limit_seconds || 300) - this.timeRemaining,
                isWin,
                reason
            });
        });
    }

    private showGameOverScreen(isWin: boolean, reason: string) {
        const { width, height } = this.cameras.main;

        // Dimmer
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
            .setDepth(3000);

        // Panel
        const panel = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1e293b)
            .setStrokeStyle(4, isWin ? 0x10b981 : 0xef4444)
            .setDepth(3001);

        // Title
        const title = this.add.text(width / 2, height / 2 - 120, isWin ? '🎉 MISSION COMPLETE!' : '⏰ TIME UP!', {
            fontSize: '32px',
            color: isWin ? '#10b981' : '#ef4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3002);

        // Stats
        const statsY = height / 2 - 40;
        const stats = [
            `Score: ${this.score}`,
            `Locations Found: ${this.locationsFound}/${this.requiredCheckpoints}`,
            `Failed: ${this.failures}`,
            `Time: ${(this.missionConfig?.time_limit_seconds || 300) - this.timeRemaining}s`
        ];

        stats.forEach((stat, i) => {
            this.add.text(width / 2, statsY + i * 35, stat, {
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(3002);
        });

        // Reason
        if (reason) {
            this.add.text(width / 2, height / 2 + 120, reason, {
                fontSize: '16px',
                color: '#94a3b8',
                fontStyle: 'italic'
            }).setOrigin(0.5).setDepth(3002);
        }

        // Loading indicator
        const loadingText = this.add.text(width / 2, height / 2 + 160, 'Loading results...', {
            fontSize: '14px',
            color: '#64748b'
        }).setOrigin(0.5).setDepth(3002);

        // Pulse animation
        this.tweens.add({
            targets: loadingText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
}
