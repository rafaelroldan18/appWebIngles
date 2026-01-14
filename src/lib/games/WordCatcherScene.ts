import * as Phaser from 'phaser';
import { WORD_CATCHER_CONFIG, resolveWordCatcherConfig } from './wordCatcher.config';
import { preloadCommonAndGame } from './assets/assetLoader';
import { ASSET_MANIFEST } from './assets/manifest';
import { GameHUD } from './GameHUD'; // Usar el nuevo GameHUD
import { createButton, createPanel, showFeedback, showBurst, showGlow, showFullscreenRequest } from './UIKit'; // UIKit completo
import { buildGameDataset, type PreparedGameItem, type GameDataset } from './gameLoader.utils';
import { AnswerTracker } from './answerTracker';
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
    private gameHUD!: GameHUD; // Usar GameHUD
    private correctText!: Phaser.GameObjects.Text;
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
    }) {
        this.initData = data;
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
        // Cargar atlas común (UI) + atlas específico de Word Catcher
        preloadCommonAndGame(this, 'word-catcher', ASSET_MANIFEST);
    }

    create() {
        try {
            const { width, height } = this.cameras.main;

            // 1. Fondo (Fijo y limpio) - Usar wc_bg_soft (match manifest)
            // Asegurar que cubra toda la pantalla
            const bg = this.add.image(width / 2, height / 2, 'wc_bg_soft');
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale).setScrollFactor(0);

            // 2. HUD
            this.configureHUD();

            // 3. Pausa
            this.createPauseOverlay();

            // 4. Inputs
            this.input.on('gameobjectdown', this.onWordClicked, this);
            this.input.keyboard?.on('keydown-P', () => this.togglePause());

            // 5. Countdown (Moved after fullscreen request)
            this.isPaused = true;
            showFullscreenRequest(this, () => {
                this.isPaused = false;
                this.startCountdown();
            });

            // 6. Generar textura para partículas (Fix missing asset, resolved lint error)
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
        // Crear HUD usando GameHUD compacto
        this.gameHUD = new GameHUD(this, {
            showTimer: true,
            showLives: false,
            showProgress: false,
            showHelpButton: this.resolvedConfig.hud_help_enabled,
            showPauseButton: true,
            showScore: true
        });

        // Configurar callbacks
        this.gameHUD.onPause(() => this.togglePause());
        this.gameHUD.onHelp(() => this.showHelpPanel());

        // Inicializar valores
        this.gameHUD.update({
            score: this.score,
            timeRemaining: this.timeRemaining
        });

        // Texto adicional para "CAUGHT" (específico de Word Catcher)
        // Alineado debajo de la barra HUD de 60px
        const { width } = this.cameras.main;
        this.correctText = this.add.text(40, 65, 'CAUGHT: 0', {
            fontSize: '20px',
            fontFamily: 'Fredoka',
            color: '#fbbf24', // Amarillo dorado para consistencia
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(1001).setScrollFactor(0);
    }

    private buildGamePayload() {
        const stats = this.answerTracker.getStats();
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);

        // Calculate Accuracy
        const totalInteractions = stats.caught + stats.missed + stats.wrong;
        const accuracy = totalInteractions > 0
            ? Math.round((stats.caught / totalInteractions) * 100)
            : 0;

        // Perfect Catch Bonus
        const perfectCatch = stats.wrong === 0 && stats.caught >= 5;

        return {
            scoreRaw: this.score + (perfectCatch ? 500 : 0),
            correctCount: stats.caught,
            wrongCount: stats.wrong,
            durationSeconds: duration,
            accuracy: accuracy,
            answers: this.answerTracker.getAnswers().map(ans => ({
                ...ans,
                is_correct: ans.is_correct || (ans as any).result === 'correct'
            })),
            // Metadata extra
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

        const payload = this.buildGamePayload();

        // Show Modal
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
        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        // Panel estilo moderno
        const panel = createPanel(this, 'common-ui/panels/panel_modal', width / 2, height / 2, 500, 400);

        const title = this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
            fontSize: '48px', fontFamily: 'Fredoka', color: '#fbbf24', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        const resumeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 0, 'RESUME', () => {
            this.togglePause();
        }, { width: 200, height: 60 });

        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', width / 2, height / 2 + 80, 'EXIT', () => {
            // Salir de pantalla completa
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }

            // Emitir variantes de evento de salida para asegurar compatibilidad
            const payload = this.buildGamePayload();

            // Intentar finalizar sesión si se sale prematuramente con datos parciales
            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error(e));
            }

            // Scene events
            this.events.emit('exit', payload);
            this.events.emit('game-exit', payload);

            // Global events
            this.game.events.emit('exit', payload);
            this.game.events.emit('game-exit', payload);
        }, { width: 200, height: 60 });

        this.pauseOverlay.add([dim, panel, title, resumeBtn, exitBtn]);
    }

    private createMissionCompleteModal(stats: any) {
        const { width, height } = this.cameras.main;
        const container = this.add.container(width / 2, height / 2).setDepth(2000).setScrollFactor(0);

        // 1. DIMMER
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setDepth(1999).setInteractive().setScrollFactor(0);

        // 2. MODAL BACKGROUND
        const panel = createPanel(this, 'common-ui/panels/panel_modal', 0, 0, 600, 500);
        container.add(panel);

        // 3. TITLE
        const title = this.add.text(0, -200, 'MISSION COMPLETE', {
            fontSize: '48px',
            fontFamily: 'Fredoka',
            color: '#fbbf24',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        container.add(title);

        // EXTRA: Trofeo de recompensa
        const trophy = this.add.image(0, -110, 'ui_atlas', 'common-ui/rewards/trophy');
        trophy.setScale(0.8);
        container.add(trophy);

        // 4. STATS with icons
        const statsStartY = 10; // Bajado para dar espacio al trofeo
        const lineHeight = 50;

        // Caught
        const caughtText = this.add.text(0, statsStartY, `WORDS CAUGHT: ${stats.caught}`, {
            fontSize: '28px', fontFamily: 'Fredoka', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        container.add(caughtText);

        // Perfect Catch
        const bonusStatus = stats.perfectCatch ? 'ACTIVE (+500)' : 'INACTIVE';
        const bonusColor = stats.perfectCatch ? '#10b981' : '#94a3b8';
        const bonusText = this.add.text(0, statsStartY + lineHeight, `PERFECT CATCH: ${bonusStatus}`, {
            fontSize: '22px', fontFamily: 'Fredoka', color: bonusColor, stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        container.add(bonusText);

        // Rank
        let rank = 'NOVICE';
        let icon = '🌱';
        if (stats.accuracy >= 90) { rank = 'MASTER'; icon = '👑'; }
        else if (stats.accuracy >= 70) { rank = 'EXPERT'; icon = '🎓'; }
        else if (stats.accuracy >= 50) { rank = 'ROOKIE'; icon = '⭐'; }

        const rankText = this.add.text(0, statsStartY + lineHeight * 2, `RANK: ${icon} ${rank}`, {
            fontSize: '32px', fontFamily: 'Fredoka', color: '#fbbf24', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        container.add(rankText);

        // 5. BUTTONS
        const btnY = 180;

        const summaryBtn = createButton(this, 'common-ui/buttons/btn_secondary', -150, btnY, 'RESULTS', () => {
            // Salir de pantalla completa
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }

            // Intentar finalizar sesión (fire and forget)
            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error('End session error', e));
            }

            this.tweens.add({
                targets: container, scale: 0, duration: 300,
                onComplete: () => {
                    // Emit en ESCENA
                    this.events.emit('gameOver', stats.eventData);
                    this.events.emit('game-over', stats.eventData);
                    this.events.emit('GAME_OVER', stats.eventData);

                    // Emitir en JUEGO GLOBAL (Fix para React wrappers que escuchan game.events)
                    this.game.events.emit('gameOver', stats.eventData);
                    this.game.events.emit('game-over', stats.eventData);
                    this.game.events.emit('GAME_OVER', stats.eventData);
                }
            });
        }, { width: 220, height: 60 });
        container.add(summaryBtn);

        const repeatBtn = createButton(this, 'common-ui/buttons/btn_primary', 150, btnY, 'REPEAT', () => {
            this.tweens.add({
                targets: container, scale: 0, duration: 300,
                onComplete: () => {
                    // Limpiar timers explícitamente antes de reiniciar
                    this.spawnTimer?.remove();
                    this.gameTimer?.remove();
                    this.activeWords.forEach(w => w.destroy());
                    this.activeWords = [];

                    if (this.initData) this.scene.restart(this.initData);
                    else this.scene.restart();
                }
            });
        }, { width: 220, height: 60 });
        container.add(repeatBtn);

        // Animación de entrada
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
        const helpOverlay = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);
        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        const panel = createPanel(this, 'common-ui/panels/panel_modal', width / 2, height / 2, 500, 420);

        const title = this.add.text(width / 2, height / 2 - 140, 'INSTRUCTIONS', {
            fontSize: '28px', fontFamily: 'Fredoka', color: '#fbbf24', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2, this.missionInstructions || 'Catch the correct items!', {
            fontSize: '20px', fontFamily: 'Fredoka', color: '#ffffff', align: 'center', wordWrap: { width: 400 },
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        const closeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 140, 'READY!', () => {
            helpOverlay.destroy();
            if (!wasPaused) this.togglePause();
        }, { width: 180, height: 50 });

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
        this.gameHUD.update({ timeRemaining: this.timeRemaining });
        if (this.timeRemaining <= 0) this.endGame();
    }

    private spawnWord() {
        if (this.isGameOver || this.isPaused) return;

        const wordData = this.gameDataset.items[this.wordIndex % this.gameDataset.items.length];
        this.wordIndex++;

        const { width } = this.cameras.main;
        const x = Phaser.Math.Between(80, width - 80);

        // Crear Container para la palabra
        const container = this.add.container(x, -100).setDepth(1) as unknown as WordSprite;

        // Usar wc_atlas para el token
        // Asumiendo que token_base es el frame correcto en wc_atlas
        // Si no existe, usar un frame del ui_atlas como fallback o imagen. Asumiendo que existe por instrucciones.
        const baseTexture = 'wc_atlas';

        // VARIACIÓN VISUAL: 
        // 1. Alternar entre token_base y token_bonus (raro) para variedad de forma
        // 2. Usar tints para variedad de color
        const isBonusShape = Phaser.Math.Between(0, 100) > 85; // 15% chance de usar la forma "bonus"
        const baseFrame = isBonusShape ? 'word-catcher/tokens/token_bonus' : 'word-catcher/tokens/token_base';

        // Tinte aleatorio pastel
        const tints = [
            0xbae6fd, // Sky
            0xfed7aa, // Orange
            0xc7d2fe, // Indigo
            0xfecaca, // Red
            0xd9f99d, // Lime
            0xffffff, // White
            0xe2e8f0  // Slate 200
        ];
        const randomTint = Phaser.Utils.Array.GetRandom(tints);

        const sprite = this.add.image(0, 0, baseTexture, baseFrame).setDisplaySize(120, 120);
        sprite.setTint(randomTint);

        // Estilo de texto: Fredoka 22px, oscuro con borde blanco para máxima legibilidad
        const wordText = this.add.text(0, 0, wordData.content_text.toUpperCase(), {
            fontSize: isBonusShape ? '18px' : '22px', // Ajustar si es bonus (es más chico nativamente)
            fontFamily: 'Fredoka',
            color: '#1e293b', // Texto oscuro
            align: 'center',
            wordWrap: { width: 100 },
            stroke: '#ffffff',
            strokeThickness: 5
        }).setOrigin(0.5);

        container.add([sprite, wordText]);

        // Animación de entrada "Pop suave" (Pro)
        container.setScale(0.8);
        this.tweens.add({
            targets: container,
            scale: 1.0,
            duration: 300,
            ease: 'Back.out'
        });

        // Hacer interactivo el sprite base
        sprite.setInteractive({ useHandCursor: true });

        // Asociar data al container
        container.wordData = wordData;
        container.baseSprite = sprite;
        container.wordText = wordText;

        // Eventos en el sprite base que controlan el container
        sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.onWordClicked(pointer, container);
        });

        // VELOCIDAD: Reducida un 50% (0.5) para que sea MUY LENTO y relajado
        const fallSpeed = this.resolvedConfig.fall_speed * 0.5;
        const fallDuration = (this.cameras.main.height + 200) / (fallSpeed / 1000);

        this.tweens.add({
            targets: container,
            y: this.cameras.main.height + 150,
            duration: fallDuration,
            ease: 'Linear',
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
        if (wordContainer.wordData.is_correct) this.handleCorrectCatch(wordContainer);
        else this.handleWrongCatch(wordContainer);
    }

    private handleCorrectCatch(container: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.correctCatch;
        this.score += points;
        this.answerTracker.recordCorrectCatch(container.wordData.content_id, container.wordData.content_text, { x: container.x, y: container.y }, container.wordData.metadata?.rule_tag ? [container.wordData.metadata.rule_tag] : []);
        this.sessionManager?.updateScore(points, true);

        // 1. Estado visual del token: Correcto
        container.baseSprite.setFrame('word-catcher/tokens/token_correct');
        container.baseSprite.clearTint(); // Quitar tinte aleatorio para mostrar verde puro
        container.wordText.setColor('#ffffff').setStroke('#000000', 3);

        const x = container.x;
        const y = container.y;

        // 2. FX Específicos: Hit OK + Pop (nombres completos)
        this.playHitFX(x, y, 'word-catcher/fx/fx_hit_ok', 1.2);
        this.playHitFX(x, y, 'word-catcher/fx/fx_pop', 1.5);

        // 3. Feedback adicional sutil
        showGlow(this, x, y, 0x10B981, 400); // Glow rápido
        this.createParticles(x, y, 0x10b981); // Partículas verdes

        // 4. SECUENCIA "DESPACIO": 
        // Paso A: MANTENERSE visible un momento para ver el verde (Confirmación)
        this.tweens.add({
            targets: container,
            scale: 1.15, // Pequeño latido "bump" para indicar éxito
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Paso B: Desaparición suave DESPUÉS de ver el color
                this.tweens.add({
                    targets: container,
                    y: y - 80, // Flotar
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2.easeOut',
                    onComplete: () => container.destroy()
                });
            }
        });

        this.updateUI_Stats();
    }

    private handleWrongCatch(container: WordSprite) {
        const points = WORD_CATCHER_CONFIG.scoring.wrongCatch;
        this.score += points;
        this.answerTracker.recordDistractorCatch(container.wordData.content_id, container.wordData.content_text, { x: container.x, y: container.y }, container.wordData.metadata?.rule_tag ? [container.wordData.metadata.rule_tag] : []);
        this.sessionManager?.updateScore(points, false);

        // 1. Estado visual del token: Incorrecto (ROJO)
        container.baseSprite.setFrame('word-catcher/tokens/token_wrong');
        container.baseSprite.clearTint();
        container.wordText.setColor('#ffffff').setStroke('#000000', 3);

        const x = container.x;
        const y = container.y;

        // 2. FX Específico: Hit Bad
        this.playHitFX(x, y, 'word-catcher/fx/fx_hit_bad', 1.2);

        // 3. Shake muy suave
        this.cameras.main.shake(150, 0.005);
        this.createParticles(x, y, 0xef4444);

        // 4. SECUENCIA "DESPACIO":
        // Paso A: Quedarse rojo un momento (Error visible)
        // Hacemos que vibre un poco en su lugar (negación visual)
        this.tweens.add({
            targets: container,
            x: '+=5',
            duration: 50,
            yoyo: true,
            repeat: 4, // Vibración corta (~250ms)
            onComplete: () => {
                // Paso B: Desvanecerse lentamente (caída triste)
                this.tweens.add({
                    targets: container,
                    y: y + 50,
                    scale: 0.9,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2.easeOut',
                    onComplete: () => container.destroy()
                });
            }
        });

        this.updateUI_Stats();
    }

    /**
     * Muestra un efecto visual puntual del wc_atlas
     */
    private playHitFX(x: number, y: number, frame: string, scale: number = 1) {
        const fx = this.add.image(x, y, 'wc_atlas', frame).setDepth(10).setScale(0);

        this.tweens.add({
            targets: fx,
            scale: scale,
            alpha: 0,
            duration: 800, // FX también dura más
            ease: 'Power2.easeOut',
            onComplete: () => fx.destroy()
        });
    }

    private onWordMissed(sprite: WordSprite) {
        if (sprite.isClicked) return;
        if (sprite.wordData.is_correct) {
            if (this.resolvedConfig.miss_penalty_enabled) {
                this.score += WORD_CATCHER_CONFIG.scoring.missedWord;
                this.sessionManager?.updateScore(WORD_CATCHER_CONFIG.scoring.missedWord, false);
            }
            this.answerTracker.recordMissedWord(sprite.wordData.content_id, sprite.wordData.content_text, { x: sprite.x, y: sprite.y }, sprite.wordData.metadata?.rule_tag ? [sprite.wordData.metadata.rule_tag] : []);
        } else {
            this.answerTracker.recordAvoidedDistractor(sprite.wordData.content_id, sprite.wordData.content_text);
        }
        this.updateUI_Stats();
    }

    private createParticles(x: number, y: number, tint: number) {
        // Usar la textura generada 'generic-particle'
        const p = this.add.particles(x, y, 'generic-particle', {
            speed: { min: 50, max: 150 }, scale: { start: 0.8, end: 0 }, lifespan: 500, quantity: 10, tint: tint
        });
        this.time.delayedCall(500, () => p.destroy());
    }

    private updateUI_Stats() {
        this.gameHUD.update({ score: this.score });
        const stats = this.answerTracker.getStats();
        this.correctText.setText(`CAUGHT: ${stats.caught}`);
    }

}
