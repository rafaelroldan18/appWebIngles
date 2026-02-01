import * as Phaser from 'phaser';
import { IMAGE_MATCH_CONFIG, resolveImageMatchConfig } from './imageMatch.config';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { showFeedback, showGlow, showImpactParticles, showBurst, createButton, createPanel, showFullscreenRequest, showGameInstructions } from './UIKit';
import { AnswerTracker } from './answerTracker';
import { loadGameAudio } from './AudioLoader';
import { SoundManager } from './SoundManager';
import type { ImageMatchCard } from './gameLoader.utils';
import type { GameContent, MissionConfig } from '@/types/game.types';
import type { GameSessionManager } from './GameSessionManager';

interface CardObject {
    container: Phaser.GameObjects.Container;
    shadowSprite?: Phaser.GameObjects.Image;
    backSprite: Phaser.GameObjects.Image;
    frontImage?: Phaser.GameObjects.Image;
    frontText?: Phaser.GameObjects.Text;
    frameSprite: Phaser.GameObjects.Image;
    glowSprite: Phaser.GameObjects.Image;
    cardData: ImageMatchCard;
    pairId: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export class ImageMatchScene extends Phaser.Scene {
    // Game data
    private cardsData: ImageMatchCard[] = [];
    private answerTracker!: AnswerTracker;
    private soundManager!: SoundManager;

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

    // Data for restart
    private initData: any = null;

    init(data: {
        cards?: ImageMatchCard[];
        words?: GameContent[];
        sessionManager: GameSessionManager;
        missionTitle?: string;
        missionInstructions?: string;
        missionConfig?: MissionConfig;
        translations?: any;
    }) {
        this.initData = data;
        this.translations = data.translations || null;
        this.cardsData = data.cards || [];
        this.sessionManager = data.sessionManager || null;
        this.missionTitle = data.missionTitle || 'IMAGE MATCH';
        this.missionInstructions = data.missionInstructions || 'Match the images with the correct words!';
        this.missionConfig = data.missionConfig || null;

        this.resolvedConfig = resolveImageMatchConfig(this.missionConfig);
        this.answerTracker = new AnswerTracker();

        this.score = 0;
        this.timeElapsed = 0; // Start at 0 and count UP
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
        // Cargar atlas común (UI) + atlas específico de Image Match
        // Cargar atlas común (UI) + Modales + atlas específico de Image Match
        loadGameAtlases(this, 'im');
        loadGameAudio(this, 'im');
        this.load.image('im_bg_table', '/assets/backgrounds/image-match/bg_table.png');

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
        this.soundManager = new SoundManager(this);

        // Petición de pantalla completa ANTES de iniciar los sistemas de juego
        // Combined Fullscreen + Instructions Flow
        this.isPaused = true;
        showGameInstructions(this, {
            title: 'Image Match',
            instructions: this.missionInstructions || 'Find all the matching pairs of images and words as fast as you can to earn a high rank!',
            controls: 'Click on cards to flip them and find matches.\n\n• PAUSE (⏸): Pause the game\n• HELP (?): View instructions',
            controlIcons: ['mouse'],
            requestFullscreen: true,
            buttonLabel: 'START MATCHING',
            onStart: () => {
                this.isProcessing = false;
                this.isPaused = false;
                this.startCountdown();
            }
        });

        // 1. Fondo de mesa
        const bg = this.add.image(width / 2, height / 2, 'im_bg_table');
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);


        // 2. HUD
        this.createStandardHUD();

        // 3. Cards/Board
        this.createBoard();

        // 4. Pause Overlay
        this.createPauseOverlay();

        // 5. Inputs
        this.input.keyboard?.on('keydown-P', () => this.togglePause());

        // 6. Countdown - Now handled by showGameInstructions callback
        // this.startCountdown();

        this.events.emit('scene-ready');
    }

    private createStandardHUD() {
        const { width } = this.cameras.main;

        // Crear HUD usando el sistema común
        this.gameHUD = new GameHUD(this, {
            showScore: true,
            showTimer: true,
            showLives: false,
            showProgress: false,
            showPauseButton: true,
            showHelpButton: this.resolvedConfig.hud_help_enabled
        }, this.soundManager);

        // Configurar callbacks
        this.gameHUD.onPause(() => this.togglePause());
        this.gameHUD.onHelp(() => this.showHelpPanel());

        // Inicializar con valores actuales
        this.gameHUD.update({
            score: this.score,
            timeRemaining: this.timeElapsed
        });

        // Textos adicionales específicos de Image Match
        const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;

        this.pairsText = this.add.text(width - 40, 65, `PAIRS: 0/${totalPairs}`, {
            fontSize: '18px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(1001).setScrollFactor(0).setOrigin(1, 0);

        this.movesText = this.add.text(40, 65, 'MOVES: 0', {
            fontSize: '18px',
            fontFamily: 'Nunito',
            color: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(1001).setScrollFactor(0).setOrigin(0, 0);
    }

    private createBoard() {
        const { width, height } = this.scale;
        let { rows, cols, cardSpacing } = this.resolvedConfig.grid;

        // Márgenes mínimos para maximizar el espacio
        const marginX = 20;
        const marginTop = 95; // Justo debajo de HUD y textos de estado
        const marginBottom = 20; // Pegado casi al borde inferior

        const availableWidth = width - (marginX * 2);
        const availableHeight = height - marginTop - marginBottom;

        // Calcular el tamaño máximo de celda posible
        const cellW = (availableWidth - (cols - 1) * cardSpacing) / cols;
        const cellH = (availableHeight - (rows - 1) * cardSpacing) / rows;

        // Tarjetas cuadradas maximizadas
        const cardSize = Math.min(cellW, cellH);

        const finalCardWidth = cardSize;
        const finalCardHeight = cardSize;

        // Tamaño total del grid para el centrado
        const gridWidth = cols * finalCardWidth + (cols - 1) * cardSpacing;
        const gridHeight = rows * finalCardHeight + (rows - 1) * cardSpacing;

        // Centrado en el área disponible
        const startX = (width - gridWidth) / 2 + finalCardWidth / 2;
        const startY = marginTop + (availableHeight - gridHeight) / 2 + finalCardHeight / 2;

        this.cardsData.forEach((cardData, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * (finalCardWidth + cardSpacing);
            const y = startY + row * (finalCardHeight + cardSpacing);

            this.createCard(x, y, cardData, finalCardWidth, finalCardHeight);
        });
    }

    private createCard(x: number, y: number, cardData: ImageMatchCard, cardWidth: number, cardHeight: number) {
        const container = this.add.container(x, y).setSize(cardWidth, cardHeight);

        // LAYER 1: Shadow (bottom, slightly offset)
        const shadow = this.add.image(3, 3, 'im_atlas', 'image-match/cards/card_shadow')
            .setDisplaySize(cardWidth, cardHeight)
            .setAlpha(0.4);

        // LAYER 2: Back sprite (visible initially)
        const back = this.add.image(0, 0, 'im_atlas', 'image-match/cards/card_back')
            .setDisplaySize(cardWidth, cardHeight);

        // LAYER 3: Front content (hidden initially)
        let frontContent: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
        if (cardData.kind === 'image') {
            const key = `img_${cardData.pairId}`;
            if (this.textures.exists(key)) {
                frontContent = this.add.image(0, 0, key)
                    .setDisplaySize(cardWidth * 0.7, cardHeight * 0.7)
                    .setVisible(false);
            } else {
                const emoji = this.emojiMap[cardData.prompt.toLowerCase()] || '🖼️';
                frontContent = this.add.text(0, 0, emoji, {
                    fontSize: '64px'
                }).setOrigin(0.5).setVisible(false);
            }
        } else {
            const text = cardData.prompt.toUpperCase();
            // Fuente proporcional al alto de la tarjeta
            let baseFontSize = Math.floor(cardHeight * 0.18);
            baseFontSize = Phaser.Math.Clamp(baseFontSize, 14, 26);

            frontContent = this.add.text(0, 0, text, {
                fontSize: `${baseFontSize}px`,
                fontFamily: 'Nunito',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: cardWidth - 10 },
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5).setVisible(false);

            // Forzar actualización para obtener el ancho real inmediatamente
            (frontContent as any).updateText();

            // Ajuste agresivo de escala para palabras extra-largas
            const maxWidth = cardWidth - 12;
            if (frontContent.width > maxWidth) {
                frontContent.setScale(maxWidth / frontContent.width);
            }
        }

        // LAYER 4: Frame (border, goes before content so content is visible)
        const frame = this.add.image(0, 0, 'im_atlas', 'image-match/cards/card_frame')
            .setDisplaySize(cardWidth, cardHeight);

        // LAYER 5: Glow effect (for matches, alpha 0 initially)
        const glow = this.add.image(0, 0, 'im_atlas', 'image-match/fx/fx_glow')
            .setDisplaySize(cardWidth * 1.2, cardHeight * 1.2)
            .setAlpha(0);

        // Add all layers to container in correct order
        // Order: shadow (bottom) → back → frame → frontContent (top, visible when flipped) → glow (effects)
        container.add([shadow, back, frame, frontContent, glow]);
        container.setInteractive({ useHandCursor: true });

        const cardObj: CardObject = {
            container,
            shadowSprite: shadow,
            backSprite: back,
            frontImage: cardData.kind === 'image' && frontContent instanceof Phaser.GameObjects.Image ? frontContent : undefined,
            frontText: cardData.kind === 'word' && frontContent instanceof Phaser.GameObjects.Text ? frontContent : undefined,
            frameSprite: frame,
            glowSprite: glow,
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

        this.soundManager.playSfx('card_flip');
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
                // Frame is always visible, no need to toggle

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
            first: {
                kind: p1.cardData.kind,
                value: p1.cardData.prompt,
                imageUrl: p1.cardData.imageUrl || null
            },
            second: {
                kind: p2.cardData.kind,
                value: p2.cardData.prompt,
                imageUrl: p2.cardData.imageUrl || null
            },
            isCorrect: isMatch,
            moves: this.moves,
            timeMs: timeMs,
            ruleTag: p1.cardData.ruleTag
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

        this.soundManager.playSfx('match', 0.8);
        this.soundManager.playSfx('correct', 0.5);

        const points = IMAGE_MATCH_CONFIG.scoring.points_correct;
        this.score = Math.max(0, this.score + points);
        this.sessionManager?.updateScore(points, true);

        const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;
        this.gameHUD.update({ score: Math.max(0, this.score) });
        this.pairsText.setText(`PAIRS: ${this.matches}/${totalPairs}`);

        const x1 = p1.container.x;
        const y1 = p1.container.y;
        const x2 = p2.container.x;
        const y2 = p2.container.y;

        // 1. Activar glow de las cartas (alpha 0→1→0)
        this.tweens.add({
            targets: [p1.glowSprite, p2.glowSprite],
            alpha: 1,
            duration: 1000,  // Aumentado a 1000ms para que dure más
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        // 2. Mostrar íconos de check clarísimos
        const check1 = this.add.image(x1, y1, 'ui_atlas', 'common-ui/fx/fx_check')
            .setScale(0)
            .setDepth(7000);

        const check2 = this.add.image(x2, y2, 'ui_atlas', 'common-ui/fx/fx_check')
            .setScale(0)
            .setDepth(7000);

        this.tweens.add({
            targets: [check1, check2],
            scale: 3,
            alpha: { from: 1, to: 0 },
            duration: 1500,  // Aumentado a 1500ms para que se vea más tiempo
            ease: 'Back.easeOut',
            onComplete: () => {
                check1.destroy();
                check2.destroy();
            }
        });

        // 3. Flash verde de celebración
        this.cameras.main.flash(200, 16, 185, 129);

        // 4. Partículas de celebración
        this.time.delayedCall(200, () => {
            showImpactParticles(this, x1, y1, 0x10b981);
            showImpactParticles(this, x2, y2, 0x10b981);
        });

        // 5. Marcar las cartas emparejadas con tinte verde suave (en lugar de oscurecerlas)
        this.tweens.add({
            targets: [p1.container, p2.container],
            alpha: 0.85,  // Solo un poco transparente
            duration: 400,
            delay: 300
        });

        // Añadir tinte verde a los frames para indicar que están emparejadas
        p1.frameSprite.setTint(0x10b981);  // Verde éxito
        p2.frameSprite.setTint(0x10b981);

        // 6. Limpiar estado
        this.time.delayedCall(600, () => {
            this.firstPick = null;
            this.secondPick = null;
            this.isProcessing = false;

            // Check si completó el juego
            if (this.matches === totalPairs) {
                this.time.delayedCall(500, () => this.endGame());
            }
        });
    }

    private handleMismatch(p1: CardObject, p2: CardObject) {
        this.streak = 0;
        const penalty = IMAGE_MATCH_CONFIG.scoring.points_wrong;
        this.score = Math.max(0, this.score + penalty);
        this.sessionManager?.updateScore(penalty, false);
        this.gameHUD.update({ score: Math.max(0, this.score) });

        const x1 = p1.container.x;
        const y1 = p1.container.y;
        const x2 = p2.container.x;
        const y2 = p2.container.y;

        this.soundManager.playSfx('wrong', 0.6);

        // 1. Mostrar íconos de cruz (error)
        const cross1 = this.add.image(x1, y1, 'ui_atlas', 'common-ui/fx/fx_cross')
            .setScale(0)
            .setDepth(7000);

        const cross2 = this.add.image(x2, y2, 'ui_atlas', 'common-ui/fx/fx_cross')
            .setScale(0)
            .setDepth(7000);
        this.tweens.add({
            targets: [cross1, cross2],
            scale: 2.5,
            alpha: { from: 1, to: 0 },
            duration: 1200,  // Aumentado a 1200ms para que se vea más tiempo
            ease: 'Back.easeOut',
            onComplete: () => {
                cross1.destroy();
                cross2.destroy();
            }
        });

        showImpactParticles(this, x1, y1, 0xEF4444);
        showImpactParticles(this, x2, y2, 0xEF4444);

        // 2. Shake suave de las cartas (vibración educativa)
        const p1OriginalX = p1.container.x;
        const p2OriginalX = p2.container.x;

        this.tweens.add({
            targets: [p1.container, p2.container],
            x: '+=5',
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Restaurar posiciones originales explícitamente
                p1.container.x = p1OriginalX;
                p2.container.x = p2OriginalX;
            }
        });

        // 3. Shake de cámara sutil
        this.cameras.main.shake(150, 0.005);

        // 4. Flip back después del delay (aumentado para dar más tiempo)
        this.time.delayedCall(1000, () => {  // Aumentado de 600ms a 1000ms
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
        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        // Background & Border from modals_atlas (glass effect)
        const pW = 520;
        const pH = 420;
        const panelBg = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Panel/panel-001.png', pW, pH, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Border/panel-border-001.png', pW, pH, 20, 20, 20, 20)
            .setTint(0x3b82f6);

        const title = this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
            fontSize: '48px', fontFamily: 'Nunito', color: '#fbbf24', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        const resumeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 0, 'CONTINUAR', () => this.togglePause(), { width: 200, height: 60 });
        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', width / 2, height / 2 + 80, 'SALIR', () => {
            // Salir de pantalla completa
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }
            // Preparar datos del juego para enviar
            const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;
            const attempts = this.moves;
            const matches = this.matches;
            const accuracy = attempts > 0 ? Math.round((matches / attempts) * 100) : 0;
            const perfectMatch = matches > 0 && matches === attempts;

            const gameExitPayload = {
                scoreRaw: this.score + (perfectMatch ? 500 : 0),
                correctCount: matches,
                wrongCount: attempts - matches,
                durationSeconds: duration,
                answers: this.answerTracker.getAnswers().map(ans => ({
                    ...ans,
                    is_correct: ans.is_correct || (ans as any).result === 'correct'
                })),
                meta: {
                    moves: this.moves,
                    totalPairs: totalPairs,
                    matchedPairs: matches,
                    bestStreak: this.bestStreak,
                    exitedEarly: true
                }
            };

            console.log('[ImageMatchScene] Exiting from pause menu with data:', gameExitPayload);
            console.log('[ImageMatchScene] answers count:', gameExitPayload.answers?.length);

            this.game.events.emit('GAME_EXIT', gameExitPayload);
        }, { width: 200, height: 60 });

        this.pauseOverlay.add([dim, panelBg, panelBorder, title, resumeBtn, exitBtn]);
    }

    private togglePause() {
        if (this.isGameOver) return;

        // Evitar múltiples aperturas
        if (this.isPaused && !this.pauseOverlay?.visible) {
            this.isPaused = false; // Reset if overlay is somehow gone
        }

        this.isPaused = !this.isPaused;
        this.pauseOverlay.setVisible(this.isPaused);

        if (this.isPaused) {
            this.physics.pause();
            if (this.gameTimer) this.gameTimer.paused = true;
            // this.tweens.pauseAll(); 
        } else {
            this.physics.resume();
            if (this.gameTimer) this.gameTimer.paused = false;
            // this.tweens.resumeAll();
        }
    }

    private showHelpPanel() {
        const wasPaused = this.isPaused;
        if (!wasPaused) this.togglePause();

        const { width, height } = this.cameras.main;
        const helpOverlay = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        const panelW = Math.min(560, Math.round(width * 0.90));
        const panelH = Math.min(460, Math.round(height * 0.78));

        // Use modals_atlas with glass effect
        const panelBg = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Panel/panel-001.png', panelW, panelH, 32, 32, 32, 32)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(width / 2, height / 2, 'modals_atlas', 'Default/Border/panel-border-001.png', panelW, panelH, 32, 32, 32, 32)
            .setTint(0x3b82f6);

        const title = this.add.text(width / 2, height / 2 - panelH * 0.35, 'INSTRUCCIONES', {
            fontSize: '28px', fontFamily: 'Nunito', color: '#ffffff', stroke: '#000000', strokeThickness: 1
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2, this.missionInstructions, {
            fontSize: '18px', fontFamily: 'Nunito', color: '#ffffff', align: 'center', wordWrap: { width: Math.min(420, panelW - 80) },
            stroke: '#000000', strokeThickness: 1
        }).setOrigin(0.5);

        const closeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + panelH * 0.34, 'ENTENDIDO', () => {
            helpOverlay.destroy();
            if (!wasPaused) this.togglePause();
        }, { width: 180, height: 50 });

        helpOverlay.add([dim, panelBg, panelBorder, title, instructions, closeBtn]);
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;
        const txt = this.add.text(width / 2, height / 2, '3', {
            fontSize: '120px', fontFamily: 'Nunito', color: '#ffffff', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(1500).setScrollFactor(0);

        this.time.addEvent({
            delay: 1000, repeat: 3,
            callback: () => {
                count--;
                if (count > 0) txt.setText(count.toString());
                else if (count === 0) {
                    txt.setText('GO!').setColor('#10b981');
                    this.soundManager.playSfx('game_start');
                }
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
                this.timeElapsed++; // Count UP instead of down
                this.gameHUD.update({ timeRemaining: this.timeElapsed });
                // Timer no longer ends the game - only finding all pairs does
            }
        });

        this.soundManager.playMusic('bg_music', 0.4);
    }

    private endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isPaused = true;
        this.gameTimer?.remove();
        this.soundManager.stopMusic();
        this.soundManager.playSfx('game_win');

        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;

        // Stats
        const attempts = this.moves;
        const matches = this.matches;
        const accuracy = attempts > 0 ? Math.round((matches / attempts) * 100) : 0;
        const perfectMatch = matches > 0 && matches === attempts;

        // Calcular score normalizado sobre 10 basado en precisión
        const normalizedScore = Math.round((accuracy / 100) * 10 * 10) / 10;

        // Event Payload
        const gameOverPayload = {
            score: normalizedScore,           // Nota sobre 10 (ej: 8.5/10)
            scoreRaw: this.score + (perfectMatch ? 500 : 0),  // Puntos brutos para estadísticas
            correctCount: matches,
            wrongCount: attempts - matches,
            durationSeconds: duration,
            answers: this.answerTracker.getAnswers().map(ans => ({
                ...ans,
                is_correct: ans.is_correct || (ans as any).result === 'correct'
            })),
            meta: {
                moves: this.moves,
                totalPairs: totalPairs,
                matchedPairs: matches,
                bestStreak: this.bestStreak
            }
        };

        this.createMissionCompleteModal({
            pairs: matches,
            totalPairs: totalPairs,
            accuracy: accuracy,
            perfectMatch: perfectMatch,
            eventData: gameOverPayload
        });
    }

    private createMissionCompleteModal(stats: any) {
        const { width, height } = this.cameras.main;

        const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setDepth(6000).setInteractive().setScrollFactor(0);

        const container = this.add.container(width / 2, height / 2).setDepth(6001).setScrollFactor(0);

        // Background & Border from modals_atlas (glass effect)
        const bgWidth = 540;
        const bgHeight = 440;
        const panelBg = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Panel/panel-001.png', bgWidth, bgHeight, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Border/panel-border-001.png', bgWidth, bgHeight, 20, 20, 20, 20)
            .setTint(0x3b82f6);

        container.add([panelBg, panelBorder]);

        // TITLE - Reduced and repositioned
        const title = this.add.text(0, -155, 'MISSION COMPLETE', {
            fontSize: '36px', fontFamily: 'Nunito', color: '#fbbf24', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        // STATS - Reduced and repositioned
        const pairsText = this.add.text(0, -30, `PAIRS FOUND: ${stats.pairs}/${stats.totalPairs}`, {
            fontSize: '22px', fontFamily: 'Nunito', color: '#ffffff', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        const bonusStatus = stats.perfectMatch ? 'ACTIVE' : 'INACTIVE';
        const bonusColor = stats.perfectMatch ? '#10b981' : '#94a3b8';
        const bonusText = this.add.text(0, 5, `MEMORY MASTER: ${bonusStatus}`, {
            fontSize: '18px', fontFamily: 'Fredoka', color: bonusColor, stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        let rank = 'NOVICE';
        let icon = '🌱';
        if (stats.accuracy >= 90) { rank = 'MASTER'; icon = '👑'; }
        else if (stats.accuracy >= 70) { rank = 'EXPERT'; icon = '🎓'; }
        else if (stats.accuracy >= 50) { rank = 'ROOKIE'; icon = '⭐'; }

        const rankText = this.add.text(0, 50, `RANK: ${icon} ${rank}`, {
            fontSize: '26px', fontFamily: 'Fredoka', color: '#fbbf24', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        // BUTTONS - smaller
        const btnY = 135;

        const exitBtn = createButton(this, 'common-ui/buttons/btn_secondary', -130, btnY, 'RESULTS', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }

            if (this.sessionManager?.isActive()) {
                this.sessionManager.endSession().catch(e => console.error('End session error', e));
            }

            this.tweens.add({
                targets: container, scale: 0, alpha: 0, duration: 300,
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

        const repeatBtn = createButton(this, 'common-ui/buttons/btn_primary', 130, btnY, 'REPEAT', () => {
            this.tweens.add({
                targets: container, scale: 0, alpha: 0, duration: 300,
                onComplete: () => {
                    if (this.initData) this.scene.restart(this.initData);
                    else this.scene.restart();
                }
            });
        }, { width: 190, height: 55 });

        container.add([title, pairsText, bonusText, rankText, exitBtn, repeatBtn]);
        container.setScale(0);
        this.tweens.add({ targets: container, scale: 1, duration: 500, ease: 'Back.out' });
    }

    private createModalButton(x: number, y: number, text: string, color: number, callback: () => void) {
        const width = 180, height = 60;
        const bg = this.add.rectangle(x, y, width, height, color).setInteractive({ useHandCursor: true });
        const shadow = this.add.rectangle(x + 5, y + 5, width, height, 0x000000, 0.3);
        const label = this.add.text(x, y, text, { fontSize: '24px', fontFamily: 'Fredoka', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);

        bg.on('pointerdown', () => {
            this.tweens.add({ targets: [bg, label, shadow], scaleX: 0.95, scaleY: 0.95, duration: 50, yoyo: true, onComplete: callback });
        });
        bg.on('pointerover', () => bg.setFillStyle(color, 0.8));
        bg.on('pointerout', () => bg.setFillStyle(color, 1));

        return [shadow, bg, label];
    }
}
