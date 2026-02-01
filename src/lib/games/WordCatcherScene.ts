import * as Phaser from 'phaser';
import { WORD_CATCHER_CONFIG, resolveWordCatcherConfig } from './wordCatcher.config';
import { preloadCommonAndGame } from './assets/assetLoader';
import { ASSET_MANIFEST } from './assets/manifest';
import { GameHUD } from './GameHUD';
import { createButton, createPanel, showGlow, showImpactParticles, showFullscreenRequest, showGameInstructions } from './UIKit';
import { buildGameDataset, type PreparedGameItem, type GameDataset } from './gameLoader.utils';
import { AnswerTracker } from './answerTracker';
import { loadGameAudio } from './AudioLoader';
import { SoundManager } from './SoundManager';
import type { GameContent, MissionConfig } from '@/types/game.types';
import type { GameSessionManager } from './GameSessionManager';

interface WordSprite extends Phaser.GameObjects.Container {
    wordData: PreparedGameItem;
    baseSprite: Phaser.GameObjects.Image;
    wordText: Phaser.GameObjects.Text;
    isClicked?: boolean;
}

export class WordCatcherScene extends Phaser.Scene {
    // Game data
    private gameDataset!: GameDataset;
    private answerTracker!: AnswerTracker;
    private activeWords: WordSprite[] = [];
    private wordIndex: number = 0;
    private wordsCompleted: number = 0; // Track how many words have been caught or missed
    private soundManager!: SoundManager;

    // Game state
    private score: number = 0;
    private timeElapsed: number = 0; // Changed from timeRemaining to timeElapsed (counts UP)
    private isGameOver: boolean = false;
    private isPaused: boolean = false;
    private gameStartTime: number = 0;

    // Configuration
    private sessionManager: GameSessionManager | null = null;
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: MissionConfig | null = null;
    private resolvedConfig: any = null;
    private translations: any = null;

    // UI Elements
    private gameHUD!: GameHUD;
    private correctText!: Phaser.GameObjects.Text;
    private caughtPanel!: Phaser.GameObjects.GameObject;
    private pauseOverlay!: Phaser.GameObjects.Container;

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;
    private spawnTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'WordCatcherScene' });
    }

    // Data for restart
    private initData: any = null;

    init(data: {
        words: GameContent[];
        sessionManager: GameSessionManager;
        missionTitle?: string;
        missionInstructions?: string;
        missionConfig?: MissionConfig;
        translations?: any;
    }) {
        this.initData = data;
        this.translations = data.translations || null;
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
        this.timeElapsed = 0; // Start at 0 and count UP
        this.isGameOver = false;
        this.isPaused = false;
        this.wordIndex = 0;
        this.wordsCompleted = 0;
        this.activeWords = [];
        this.gameStartTime = Date.now();
    }

    preload() {
        preloadCommonAndGame(this, 'word-catcher', ASSET_MANIFEST);
        loadGameAudio(this, 'wc');
        this.load.image('wc_bg_fixed', '/assets/backgrounds/word-catcher/bg_soft.png');
    }

    create() {
        try {
            const { width, height } = this.cameras.main;
            this.soundManager = new SoundManager(this);

            // 1) Fondo
            const bg = this.add.image(width / 2, height / 2, 'wc_bg_fixed');
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            bg.setScale(Math.max(scaleX, scaleY)).setScrollFactor(0);

            // 2) HUD
            this.configureHUD();

            // 3) Pausa
            this.createPauseOverlay();

            // 4) Inputs
            this.input.on('gameobjectdown', this.onWordClicked, this);
            this.input.keyboard?.on('keydown-P', () => this.togglePause());

            // 5) Tutorial + Start Flow (Combines Fullscreen + Instructions)
            this.isPaused = true;
            showGameInstructions(this, {
                title: 'Word Catcher',
                instructions: this.missionInstructions || 'Catch the correct words falling from the sky! Each correct word adds 10 points.',
                controls: 'Click or Tap on falling items to catch them.\n\n• PAUSE (⏸): Pause the game\n• HELP (?): View instructions',
                controlIcons: ['mouse'],
                requestFullscreen: true,
                buttonLabel: 'START PLAYING',
                onStart: () => {
                    this.isPaused = false;
                    this.startCountdown();
                }
            });

            // 6) Textura para partículas
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('generic-particle', 8, 8);

            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[WordCatcher] Error en Create:', error);
        }
    }

    private configureHUD() {
        const V = WORD_CATCHER_CONFIG.visual;

        this.gameHUD = new GameHUD(this, {
            showTimer: true,
            showLives: false,
            showProgress: false,
            showHelpButton: this.resolvedConfig.hud_help_enabled,
            showPauseButton: true,
            showScore: true
        }, this.soundManager);

        this.gameHUD.onPause(() => this.togglePause());
        this.gameHUD.onHelp(() => this.showHelpPanel());

        this.gameHUD.update({
            score: this.score,
            timeRemaining: this.timeElapsed
        });

        // ---- UI-only: CAUGHT en panel card, anclado bajo HUD (responsive)
        const { width } = this.cameras.main;

        const hudTop = 12;
        const hudHeight = 60; // HUD compacto
        const y = hudTop + hudHeight + 22;

        const panelW = Phaser.Math.Clamp(Math.round(width * 0.26), 200, 280);
        const panelH = 54;

        // Panel
        const panelX = 24 + panelW / 2;
        this.caughtPanel = createPanel(this, 'common-ui/panels/panel_card', panelX, y, panelW, panelH)
            .setDepth(1000)
            .setScrollFactor(0);

        // Texto CAUGHT
        this.correctText = this.add.text(panelX, y, 'CAUGHT: 0', {
            fontSize: '20px',
            fontFamily: 'Nunito',
            color: V.correctCountColor,
            stroke: V.textShadow,
            strokeThickness: 1
        }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

        // Sombra sutil (UI-only)
        this.correctText.setShadow(0, 2, V.textShadow, 4, true, true);
    }

    private buildGamePayload() {
        const stats = this.answerTracker.getStats();
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);

        const totalInteractions = stats.caught + stats.missed + stats.wrong;
        const accuracy = totalInteractions > 0
            ? Math.round((stats.caught / totalInteractions) * 100)
            : 0;

        const perfectCatch = stats.wrong === 0 && stats.caught >= 5;

        // Calcular score normalizado sobre 10 basado en precisión
        // Fórmula: (accuracy / 100) * 10 = nota sobre 10
        const normalizedScore = Math.round((accuracy / 100) * 10 * 10) / 10; // Con 1 decimal

        return {
            score: normalizedScore,           // Nota sobre 10 (ej: 8.5/10)
            scoreRaw: this.score + (perfectCatch ? 500 : 0),  // Puntos brutos (ej: 110 puntos)
            correctCount: stats.caught,
            wrongCount: stats.wrong,
            durationSeconds: duration,
            accuracy: accuracy,
            answers: this.answerTracker.getAnswers().map(ans => ({
                ...ans,
                is_correct: ans.is_correct || (ans as any).result === 'correct'
            })),
            perfectCatch: perfectCatch,
            totalInteractions: totalInteractions
        };
    }

    private endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isPaused = true;
        this.spawnTimer?.remove();
        this.gameTimer?.remove();
        this.soundManager.stopMusic();
        this.soundManager.playSfx('game_win');

        const payload = this.buildGamePayload();

        this.createMissionCompleteModal({
            caught: payload.correctCount,
            totalInteractions: payload.totalInteractions,
            accuracy: payload.accuracy,
            perfectCatch: payload.perfectCatch,
            eventData: payload
        });
    }

    private createPauseOverlay() {
        const { width, height } = this.cameras.main;
        const V = WORD_CATCHER_CONFIG.visual;

        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        // UI-only: panel responsive
        const panelW = Math.min(520, Math.round(width * 0.86));
        const panelH = Math.min(420, Math.round(height * 0.70));

        // Background & Border from modals_atlas (glass effect)
        const panelBg = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Panel/panel-001.png', panelW, panelH, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Border/panel-border-001.png', panelW, panelH, 20, 20, 20, 20)
            .setTint(0x3b82f6);

        const title = this.add.text(width / 2, height / 2 - panelH * 0.30, 'PAUSED', {
            fontSize: '48px', fontFamily: 'Nunito', color: V.timerColor, stroke: V.textShadow, strokeThickness: 2
        }).setOrigin(0.5);

        const resumeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 0, 'RESUME', () => {
            this.togglePause();
        }, { width: 200, height: 60 });

        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', width / 2, height / 2 + 80, 'EXIT', () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();

            const payload = this.buildGamePayload();

            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error(e));
            }

            this.events.emit('exit', payload);
            this.events.emit('game-exit', payload);
            this.game.events.emit('exit', payload);
            this.game.events.emit('game-exit', payload);
        }, { width: 200, height: 60 });

        this.pauseOverlay.add([dim, panelBg, panelBorder, title, resumeBtn, exitBtn]);
    }

    private createMissionCompleteModal(stats: any) {
        const { width, height } = this.cameras.main;
        const V = WORD_CATCHER_CONFIG.visual;

        const container = this.add.container(width / 2, height / 2).setDepth(2000).setScrollFactor(0);

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setDepth(1999).setInteractive().setScrollFactor(0);

        // UI-only: panel responsive
        const panelW = Math.min(560, Math.round(width * 0.90));
        const panelH = Math.min(460, Math.round(height * 0.76));

        // Background & Border from modals_atlas (glass effect)
        const panelBg = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Panel/panel-001.png', panelW, panelH, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Border/panel-border-001.png', panelW, panelH, 20, 20, 20, 20)
            .setTint(0x3b82f6);

        container.add([panelBg, panelBorder]);

        const title = this.add.text(0, -panelH * 0.36, 'MISSION COMPLETE', {
            fontSize: '36px',
            fontFamily: 'Nunito',
            color: V.timerColor,
            align: 'center',
            stroke: V.textShadow,
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(title);

        const trophy = this.add.image(0, -panelH * 0.18, 'ui_atlas', 'common-ui/rewards/trophy');
        trophy.setScale(0.6);
        container.add(trophy);

        const statsStartY = 0;
        const lineHeight = 40;

        const caughtText = this.add.text(0, statsStartY, `WORDS CAUGHT: ${stats.caught}`, {
            fontSize: '22px', fontFamily: 'Nunito', color: '#ffffff', stroke: V.textShadow, strokeThickness: 1
        }).setOrigin(0.5);
        container.add(caughtText);

        const bonusStatus = stats.perfectCatch ? 'ACTIVE (+500)' : 'INACTIVE';
        const bonusColor = stats.perfectCatch ? V.wordCorrectColor : '#94a3b8';
        const bonusText = this.add.text(0, statsStartY + lineHeight, `PERFECT CATCH: ${bonusStatus}`, {
            fontSize: '18px', fontFamily: 'Nunito', color: bonusColor, stroke: V.textShadow, strokeThickness: 1
        }).setOrigin(0.5);
        container.add(bonusText);

        let rank = 'NOVICE';
        let icon = '🌱';
        if (stats.accuracy >= 90) { rank = 'MASTER'; icon = '👑'; }
        else if (stats.accuracy >= 70) { rank = 'EXPERT'; icon = '🎓'; }
        else if (stats.accuracy >= 50) { rank = 'ROOKIE'; icon = '⭐'; }

        const rankText = this.add.text(0, statsStartY + lineHeight * 2, `RANK: ${icon} ${rank}`, {
            fontSize: '26px', fontFamily: 'Nunito', color: V.timerColor, stroke: V.textShadow, strokeThickness: 2
        }).setOrigin(0.5);
        container.add(rankText);

        const btnY = panelH * 0.32;

        const summaryBtn = createButton(this, 'common-ui/buttons/btn_secondary', -130, btnY, 'RESULTS', () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();

            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error('End session error', e));
            }

            this.tweens.add({
                targets: container, scale: 0, duration: 300,
                onComplete: () => {
                    this.events.emit('gameOver', stats.eventData);
                    this.events.emit('game-over', stats.eventData);
                    this.events.emit('GAME_OVER', stats.eventData);
                    this.game.events.emit('gameOver', stats.eventData);
                    this.game.events.emit('game-over', stats.eventData);
                    this.game.events.emit('GAME_OVER', stats.eventData);
                }
            });
        }, { width: 190, height: 55 });
        container.add(summaryBtn);

        const repeatBtn = createButton(this, 'common-ui/buttons/btn_primary', 130, btnY, 'REPEAT', () => {
            this.tweens.add({
                targets: container, scale: 0, duration: 300,
                onComplete: () => {
                    this.spawnTimer?.remove();
                    this.gameTimer?.remove();
                    this.activeWords.forEach(w => w.destroy());
                    this.activeWords = [];

                    if (this.initData) this.scene.restart(this.initData);
                    else this.scene.restart();
                }
            });
        }, { width: 190, height: 55 });
        container.add(repeatBtn);

        container.setScale(0);
        this.tweens.add({
            targets: container,
            scale: 1,
            ease: 'Back.out',
            duration: 600
        });
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
        const V = WORD_CATCHER_CONFIG.visual;

        const helpOverlay = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);
        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        const panelW = Math.min(560, Math.round(width * 0.90));
        const panelH = Math.min(460, Math.round(height * 0.78));

        // Use modals_atlas with glass effect
        const panelBg = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Panel/panel-001.png', panelW, panelH, 32, 32, 32, 32)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Border/panel-border-001.png', panelW, panelH, 32, 32, 32, 32)
            .setTint(0x3b82f6);

        const title = this.add.text(width / 2, height / 2 - panelH * 0.35, 'INSTRUCTIONS', {
            fontSize: '28px', fontFamily: 'Nunito', color: '#ffffff', stroke: V.textShadow, strokeThickness: 1
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2, this.missionInstructions || 'Catch the correct items!', {
            fontSize: '20px', fontFamily: 'Nunito', color: '#ffffff', align: 'center',
            wordWrap: { width: Math.min(420, panelW - 80) },
            stroke: V.textShadow, strokeThickness: 1
        }).setOrigin(0.5);

        const closeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + panelH * 0.34, 'READY!', () => {
            helpOverlay.destroy();
            if (!wasPaused) this.togglePause();
        }, { width: 180, height: 50 });

        helpOverlay.add([dim, panelBg, panelBorder, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;
        const txt = this.add.text(width / 2, height / 2, '3', {
            fontSize: '120px', fontFamily: 'Arial Black', color: '#ffffff', stroke: '#000000', strokeThickness: 10
        }).setOrigin(0.5).setDepth(1500);

        this.time.addEvent({
            delay: 1000, repeat: 3,
            callback: () => {
                count--;
                if (count > 0) txt.setText(count.toString());
                else if (count === 0) {
                    txt.setText('GO!').setColor('#10b981');
                    this.soundManager.playSfx('game_start');
                } else {
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
        this.soundManager.playMusic('bg_music', 0.4);
    }

    private updateTimer() {
        if (this.isPaused) return;
        this.timeElapsed++; // Count UP instead of down
        this.gameHUD.update({ timeRemaining: this.timeElapsed });
    }

    private spawnWord() {
        if (this.isGameOver || this.isPaused) return;

        if (this.wordIndex >= this.gameDataset.totalCount) {
            if (this.spawnTimer) this.spawnTimer.remove();
            return;
        }

        const wordData = this.gameDataset.items[this.wordIndex % this.gameDataset.items.length];
        this.wordIndex++;
        this.soundManager.playSfx('item_spawn', 0.3);

        const { width, height } = this.cameras.main;
        const x = Phaser.Math.Between(80, width - 80);

        const container = this.add.container(x, -100).setDepth(1) as unknown as WordSprite;
        const baseFrame = Phaser.Math.Between(0, 100) > 85 ? 'word-catcher/tokens/token_bonus' : 'word-catcher/tokens/token_base';

        const tints = [0xbae6fd, 0xfed7aa, 0xc7d2fe, 0xfecaca, 0xd9f99d, 0xffffff, 0xe2e8f0];
        const randomTint = Phaser.Utils.Array.GetRandom(tints);
        const tokenSize = Phaser.Math.Clamp(Math.round(width * 0.12), 90, 130);

        const sprite = this.add.image(0, 0, 'wc_atlas', baseFrame)
            .setDisplaySize(tokenSize, tokenSize)
            .setTint(randomTint);

        const fontSize = Phaser.Math.Clamp(Math.round(tokenSize * 0.20), 16, 24);
        const wordText = this.add.text(0, 0, wordData.content_text.toUpperCase(), {
            fontSize: `${fontSize}px`, fontFamily: 'Nunito', color: '#1e293b', align: 'center',
            wordWrap: { width: tokenSize - 18 }, stroke: '#ffffff', strokeThickness: 1
        }).setOrigin(0.5);

        wordText.setShadow(0, 2, WORD_CATCHER_CONFIG.visual.textShadow, 4, true, true);
        container.add([sprite, wordText]);
        container.setScale(0.86);
        this.tweens.add({ targets: container, scale: 1.0, duration: 260, ease: 'Back.out' });

        sprite.setInteractive({ useHandCursor: true });
        container.wordData = wordData;
        container.baseSprite = sprite;
        container.wordText = wordText;

        sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onWordClicked(pointer, container));

        const fallSpeed = this.resolvedConfig.fall_speed;
        const fallDuration = (height + 200) / (fallSpeed / 1000);

        this.tweens.add({
            targets: container, y: height + 150, duration: fallDuration, ease: 'Linear',
            onComplete: () => {
                if (container.active) {
                    this.onWordMissed(container);
                    container.destroy();
                }
            }
        });

        this.activeWords.push(container);
    }

    private onWordClicked(pointer: Phaser.Input.Pointer, gameObject: any) {
        if (this.isPaused || this.isGameOver) return;
        const wordContainer = gameObject as WordSprite;
        if (!wordContainer.wordData || wordContainer.isClicked) return;

        wordContainer.isClicked = true;
        this.tweens.killTweensOf(wordContainer); // Stop the falling tween
        if (wordContainer.wordData.is_correct) this.handleCorrectCatch(wordContainer);
        else this.handleWrongCatch(wordContainer);
    }

    private handleCorrectCatch(container: WordSprite) {
        const V = WORD_CATCHER_CONFIG.visual;
        const points = WORD_CATCHER_CONFIG.scoring.points_correct;
        this.score += points;

        this.answerTracker.recordCorrectCatch(
            container.wordData.content_id, container.wordData.content_text,
            { x: container.x, y: container.y },
            container.wordData.metadata?.rule_tag ? [container.wordData.metadata.rule_tag] : []
        );

        this.sessionManager?.updateScore(points, true);
        this.soundManager.playSfx('catch_correct', 0.7);
        this.soundManager.playSfx('correct', 0.4);

        container.baseSprite.setFrame('word-catcher/tokens/token_correct').clearTint();
        container.wordText.setColor('#ffffff').setStroke(V.textShadow, 3);

        const { x, y } = container;
        showGlow(this, x, y, 0x10B981, 400);
        showImpactParticles(this, x, y, 0x10B981);
        this.cameras.main.shake(100, 0.002);

        this.tweens.add({
            targets: container, scale: 1.15, duration: 240, yoyo: true, ease: 'Sine.easeInOut',
            onComplete: () => {
                this.tweens.add({
                    targets: container, y: y - 80, alpha: 0, duration: 520, ease: 'Power2.easeOut',
                    onComplete: () => {
                        container.destroy();
                        this.wordsCompleted++;
                        this.checkGameCompletion();
                    }
                });
            }
        });

        this.updateUI_Stats();
    }

    private handleWrongCatch(container: WordSprite) {
        const V = WORD_CATCHER_CONFIG.visual;
        const points = WORD_CATCHER_CONFIG.scoring.points_wrong;
        this.score = Math.max(0, this.score + points);

        this.answerTracker.recordDistractorCatch(
            container.wordData.content_id, container.wordData.content_text,
            { x: container.x, y: container.y },
            container.wordData.metadata?.rule_tag ? [container.wordData.metadata.rule_tag] : []
        );

        this.sessionManager?.updateScore(points, false);
        this.soundManager.playSfx('catch_wrong', 0.8);
        this.soundManager.playSfx('wrong', 0.5);

        container.baseSprite.setFrame('word-catcher/tokens/token_wrong').clearTint();
        container.wordText.setColor('#ffffff').setStroke(V.textShadow, 3);

        this.cameras.main.shake(250, 0.012);
        showImpactParticles(this, container.x, container.y, 0xEF4444);

        this.tweens.add({
            targets: container, x: '+=5', duration: 50, yoyo: true, repeat: 4,
            onComplete: () => {
                this.tweens.add({
                    targets: container, y: container.y + 50, scale: 0.9, alpha: 0, duration: 520, ease: 'Power2.easeOut',
                    onComplete: () => {
                        container.destroy();
                        this.wordsCompleted++;
                        this.checkGameCompletion();
                    }
                });
            }
        });

        this.updateUI_Stats();
    }

    private onWordMissed(sprite: WordSprite) {
        if (sprite.isClicked) return;

        if (sprite.wordData.is_correct) {
            if (this.resolvedConfig.miss_penalty_enabled) {
                const penalty = WORD_CATCHER_CONFIG.scoring.points_wrong;
                this.score = Math.max(0, this.score + penalty);
                this.sessionManager?.updateScore(penalty, false);
            }
            this.answerTracker.recordMissedWord(
                sprite.wordData.content_id, sprite.wordData.content_text,
                { x: sprite.x, y: sprite.y },
                sprite.wordData.metadata?.rule_tag ? [sprite.wordData.metadata.rule_tag] : []
            );
        } else {
            this.answerTracker.recordAvoidedDistractor(sprite.wordData.content_id, sprite.wordData.content_text);
        }

        this.updateUI_Stats();
        this.wordsCompleted++;
        this.checkGameCompletion();
    }

    private checkGameCompletion() {
        if (this.wordsCompleted >= this.gameDataset.totalCount) {
            this.endGame();
        }
    }

    private updateUI_Stats() {
        this.gameHUD.update({ score: this.score });
        const stats = this.answerTracker.getStats();
        this.correctText.setText(`CAUGHT: ${stats.caught}`);
    }
}
