import * as Phaser from 'phaser';
import { gsap } from 'gsap';
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
import { createIMPanel, createIMCardGraphics, createIMButton, createIMScreenFrame } from '@/lib/games/ImageMatchTheme';


interface CardObject {
    container: Phaser.GameObjects.Container;
    shadowSprite?: Phaser.GameObjects.Graphics;
    backSprite: Phaser.GameObjects.Image; // Changed from Graphics for caching
    frontImage?: Phaser.GameObjects.Image;
    frontText?: Phaser.GameObjects.Text;
    frameSprite: Phaser.GameObjects.Image; // Changed from Graphics for caching
    glowSprite: Phaser.GameObjects.Graphics;
    cardData: ImageMatchCard;
    pairId: string | number;
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
    private backgroundGraphics!: Phaser.GameObjects.Graphics;
    private floatingDots: Phaser.GameObjects.Arc[] = [];
    private imFrame!: Phaser.GameObjects.GameObject;
    private helpOverlayContainer: Phaser.GameObjects.Container | null = null;
    private missionCompleteContainer: Phaser.GameObjects.Container | null = null;
    private missionCompleteDimmer: Phaser.GameObjects.Rectangle | null = null;
    private countdownText: Phaser.GameObjects.Text | null = null;

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

        // Resize Listener
        this.scale.on('resize', this.onResize, this);

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

        // 1. Fondo Cyber-Grid (Extravagante)
        this.createCyberBackground();

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

        // 6. Marco Perimetral Neón (Cyber Frame)
        this.createCyberFrame();
    }

    private createCyberBackground() {
        const { width, height } = this.cameras.main;

        if (this.backgroundGraphics) this.backgroundGraphics.destroy();

        if (this.floatingDots && this.floatingDots.length > 0) {
            this.floatingDots.forEach(dot => {
                if (dot) {
                    gsap.killTweensOf(dot);
                    if (dot.destroy) dot.destroy();
                }
            });
        }
        this.floatingDots = [];

        // 1. FONDO BASE: Color de estudio más suave
        this.backgroundGraphics = this.add.graphics().setDepth(-100);
        this.backgroundGraphics.fillGradientStyle(
            0xEEF2FF, 0xE0E7FF, 0xFAF5FF, 0xF3E8FF, 1
        );
        this.backgroundGraphics.fillRect(0, 0, width, height);

        // Aurora: Pulsación casi imperceptible
        const aurora = this.add.graphics().setDepth(-99.5);
        aurora.fillGradientStyle(0xFFFFFF, 0xFFFFFF, 0x818CF8, 0x818CF8, 0.1);
        aurora.fillCircle(width / 2, height / 2, width);
        gsap.to(aurora, { alpha: 0.15, duration: 60, repeat: -1, yoyo: true, ease: "sine.inOut" });
        this.floatingDots.push(aurora as any);

        // 2. BLOBS: Movimiento ULTRA LENTO (4-5 minutos)
        const blobColors = [0x818CF8, 0xA5B4FC, 0x6366F1, 0xC7D2FE];
        for (let i = 0; i < 6; i++) { // Reducido de 8 a 6
            const blob = this.add.graphics().setDepth(-99);
            const size = Phaser.Math.Between(width * 0.3, width * 0.5);
            blob.fillStyle(blobColors[i % blobColors.length], 0.05); // Más transparente
            blob.fillCircle(0, 0, size / 2);
            blob.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height));
            this.floatingDots.push(blob as any);

            gsap.to(blob, {
                x: Phaser.Math.Between(0, width),
                y: Phaser.Math.Between(0, height),
                scale: 1.1,
                duration: 180 + Math.random() * 120,
                repeat: -1,
                yoyo: true,
                ease: "linear" // Linear se siente más lento que sine
            });
        }

        // 3. CRISTALES: Drifting lento
        const accentColors = [0x6366F1, 0x4F46E5, 0x818CF8];
        for (let i = 0; i < 4; i++) { // Reducido de 5 a 4
            const glass = this.add.graphics().setDepth(-98);
            const gW = Phaser.Math.Between(150, 300);
            const gH = Phaser.Math.Between(100, 200);
            glass.fillStyle(0xFFFFFF, 0.04);
            glass.fillRoundedRect(-gW / 2, -gH / 2, gW, gH, 30);
            glass.lineStyle(1, accentColors[i % accentColors.length], 0.05);
            glass.strokeRoundedRect(-gW / 2, -gH / 2, gW, gH, 30);
            glass.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height));
            this.floatingDots.push(glass as any);

            gsap.to(glass, {
                rotation: "+=0.05",
                y: "+=10",
                duration: 120 + Math.random() * 80,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

        // 4. SKETCHES: Micro-pulsación
        const sketchColors = [0x6366F1, 0x818CF8];
        for (let i = 0; i < 8; i++) { // Reducido de 12 a 8
            const sX = Phaser.Math.Between(50, width - 50);
            const sY = Phaser.Math.Between(50, height - 50);
            const sketch = this.add.graphics().setDepth(-97);
            sketch.lineStyle(2, sketchColors[i % sketchColors.length], 0.08);

            const shapeType = i % 3;
            if (shapeType === 0) {
                sketch.strokeRect(-12, -12, 24, 24);
                sketch.setRotation(Math.PI / 4);
            } else if (shapeType === 1) {
                sketch.strokeCircle(0, 0, 12);
            } else {
                sketch.moveTo(-12, 0); sketch.lineTo(12, 0);
                sketch.moveTo(0, -12); sketch.lineTo(0, 12);
            }

            sketch.setPosition(sX, sY);
            this.floatingDots.push(sketch as any);

            gsap.to(sketch, {
                alpha: 0.02,
                duration: 20 + Math.random() * 10,
                repeat: -1,
                yoyo: true
            });
        }

        // 5. FLARES: Estáticos con luz ambiental
        for (let i = 0; i < 6; i++) {
            const flare = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(40, 100),
                0xFFFFFF,
                0.01
            ).setDepth(-96).setBlendMode(Phaser.BlendModes.ADD);
            this.floatingDots.push(flare as any);

            gsap.to(flare, {
                alpha: 0.005,
                duration: 10 + Math.random() * 10,
                repeat: -1,
                yoyo: true
            });
        }
    }

    private createCyberFrame() {
        const { width, height } = this.cameras.main;
        if (this.imFrame) this.imFrame.destroy();
        this.imFrame = createIMScreenFrame(this, width, height) as any;
    }

    private onResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Update Camera
        this.cameras.main.setSize(width, height);

        // Re-create background and frame
        this.createCyberBackground();
        this.createCyberFrame();

        // Re-create Standard HUD elements (Moves/Pairs capsules)
        this.createStandardHUD();

        // Reposition Board
        this.repositionBoard();

        // Reposition Pause Overlay if active
        if (this.pauseOverlay && this.pauseOverlay.active) {
            this.pauseOverlay.list.forEach((child: any) => {
                if (child instanceof Phaser.GameObjects.Rectangle) {
                    child.setDisplaySize(width, height);
                } else if (child instanceof Phaser.GameObjects.Container) {
                    child.setPosition(width / 2, height / 2);
                }
            });
        }

        // Reposition Help Overlay if active
        if (this.helpOverlayContainer && this.helpOverlayContainer.active) {
            this.helpOverlayContainer.list.forEach((child: any) => {
                if (child instanceof Phaser.GameObjects.Rectangle) {
                    child.setDisplaySize(width, height);
                } else if (child instanceof Phaser.GameObjects.Container) {
                    child.setPosition(width / 2, height / 2);
                }
            });
        }

        // Re-create Mission Complete Modal if active
        if (this.missionCompleteContainer && this.missionCompleteContainer.active) {
            // Store current stats somehow? Or just reposition.
            // For now, let's just reposition the container elements
            this.missionCompleteContainer.setPosition(width / 2, height / 2);
            if (this.missionCompleteDimmer) {
                this.missionCompleteDimmer.setPosition(width / 2, height / 2);
                this.missionCompleteDimmer.setDisplaySize(width, height);
            }
        }

        // Reposition Countdown
        if (this.countdownText && this.countdownText.active) {
            this.countdownText.setPosition(width / 2, height / 2);
        }
    }

    private createStandardHUD() {
        const { width } = this.cameras.main;

        // Limpiar HUD anterior si existe para evitar duplicados
        if (this.gameHUD) {
            this.gameHUD.destroy();
        }

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

        // Integrar PAIRS y MOVES simétricamente respecto al Timer centrado
        const totalPairs = new Set(this.cardsData.map(c => c.pairId)).size;
        const infoStyle = { fontSize: '18px', fontFamily: 'Nunito', color: '#1E293B', fontStyle: '900' };

        // Destruir previos para evitar duplicados ('ghost text')
        if (this.pairsText) {
            const oldCont = this.pairsText.parentContainer;
            if (oldCont) oldCont.destroy();
            else this.pairsText.destroy();
        }
        if (this.movesText) {
            const oldCont = this.movesText.parentContainer;
            if (oldCont) oldCont.destroy();
            else this.movesText.destroy();
        }

        const centerX = width / 2;

        // Container MOVES (A la izquierda del Timer)
        const mCont = this.add.container(centerX - 130, 32).setDepth(5001).setScrollFactor(0);
        const mBg = this.add.graphics();
        mBg.fillStyle(0xFFFFFF, 0.7);
        mBg.fillRoundedRect(-65, -18, 130, 36, 18);
        mBg.lineStyle(2, 0x6366F1, 0.5);
        mBg.strokeRoundedRect(-65, -18, 130, 36, 18);
        this.movesText = this.add.text(0, 0, `MOVES: ${this.moves}`, infoStyle).setOrigin(0.5);
        mCont.add([mBg, this.movesText]);

        // Container PAIRS (A la derecha del Timer)
        const pCont = this.add.container(centerX + 130, 32).setDepth(5001).setScrollFactor(0);
        const pBg = this.add.graphics();
        pBg.fillStyle(0xFFFFFF, 0.7);
        pBg.fillRoundedRect(-65, -18, 130, 36, 18);
        pBg.lineStyle(2, 0x6366F1, 0.5);
        pBg.strokeRoundedRect(-65, -18, 130, 36, 18);
        this.pairsText = this.add.text(0, 0, `PAIRS: ${this.matches}/${totalPairs}`, infoStyle).setOrigin(0.5);
        pCont.add([pBg, this.pairsText]);
    }

    private createBoard() {
        // En ImageMatch, el grid es estático en cuanto a datos, pero dinámico en posición
        this.repositionBoard(true);
    }

    private repositionBoard(isInitialCreate: boolean = false) {
        const { width, height } = this.cameras.main;
        let { rows, cols } = this.resolvedConfig.grid;

        // Espaciado dinámico mínimo para maximizar tamaño
        const cardSpacing = Math.min(width, height) * 0.01;

        // Márgenes dinámicos para evitar solapamientos
        const marginX = width * 0.05;
        const marginTop = 130; // Aumentado para dejar espacio a Pairs/Moves
        const marginBottom = 40;

        const availableWidth = width - (marginX * 2);
        const availableHeight = height - marginTop - marginBottom;

        // Calcular el tamaño máximo de celda posible
        const cellW = (availableWidth - (cols - 1) * cardSpacing) / cols;
        const cellH = (availableHeight - (rows - 1) * cardSpacing) / rows;

        // Ajuste de ratio para que sean un poco más cuadradas pero elegantes
        const cardRatio = 0.78;
        let finalCardWidth = cellW;
        let finalCardHeight = cellH;

        if (finalCardWidth / finalCardHeight > cardRatio) {
            finalCardWidth = finalCardHeight * cardRatio;
        } else {
            finalCardHeight = finalCardWidth / cardRatio;
        }

        // Tamaño total del grid para el centrado
        const gridWidth = cols * finalCardWidth + (cols - 1) * cardSpacing;
        const gridHeight = rows * finalCardHeight + (rows - 1) * cardSpacing;

        // Centrado en el área disponible
        // Safeguard: Ensure valid dimensions for texture generation
        if (finalCardWidth < 1 || finalCardHeight < 1) return;

        // Generate Textures for Performance (Cached)
        this.generateCardTextures(finalCardWidth, finalCardHeight);

        const startX = (width - gridWidth) / 2 + finalCardWidth / 2;
        const startY = marginTop + (availableHeight - gridHeight) / 2 + finalCardHeight / 2;

        if (isInitialCreate) {
            this.cardsData.forEach((cardData, index) => {
                // Creation is sequential, position set by GridAlign later
                this.createCard(0, 0, cardData, finalCardWidth, finalCardHeight);
            });
        }

        // Optimized Layout: Using a reliable manual calculation to avoid runtime plugin resolution issues
        // which was causing "is not a function" errors in some environments.
        this.cards.forEach((cardObj, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const tx = startX + col * (finalCardWidth + cardSpacing);
            const ty = startY + row * (finalCardHeight + cardSpacing);
            cardObj.container.setPosition(tx, ty);
        });
    }

    private generateCardTextures(width: number, height: number) {
        // Create RenderTextures to cache the complex graphics
        const keys = ['tex_card_back', 'tex_card_front'];

        // Remove old textures if they exist to free memory and allow re-saving
        keys.forEach(key => {
            if (this.textures.exists(key)) {
                this.textures.remove(key);
            }
        });

        const rtBack = this.make.renderTexture({ width: width, height: height });
        const gBack = createIMCardGraphics(this, width, height, true);
        gBack.setPosition(width / 2, height / 2);
        rtBack.draw(gBack);
        rtBack.saveTexture('tex_card_back');
        gBack.destroy();
        rtBack.destroy();

        const rtFront = this.make.renderTexture({ width: width, height: height });
        const gFront = createIMCardGraphics(this, width, height, false);
        gFront.setPosition(width / 2, height / 2);
        rtFront.draw(gFront);
        rtFront.saveTexture('tex_card_front');
        gFront.destroy();
        rtFront.destroy();

        // IMPORTANT: Update existing card sprites to use the new texture objects
        // This prevents the "Cannot read properties of null (reading 'glTexture')" error
        if (this.cards && this.cards.length > 0) {
            this.cards.forEach(card => {
                if (card.backSprite && card.backSprite.active) {
                    card.backSprite.setTexture('tex_card_back');
                }
                if (card.frameSprite && card.frameSprite.active) {
                    card.frameSprite.setTexture('tex_card_front');
                }
            });
        }
    }

    private createCard(x: number, y: number, cardData: ImageMatchCard, cardWidth: number, cardHeight: number) {
        const container = this.add.container(x, y).setSize(cardWidth, cardHeight);

        // LAYER 1: Shadow (Static Texture if possible or simple graphics)
        // Optimized: Simple shadow using standard Alpha
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.15);
        shadow.fillRoundedRect(-cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth, cardHeight, 14);

        // LAYER 2: Cached Sprites (Huge Performance Boost)
        const back = this.add.image(0, 0, 'tex_card_back');
        const frontBase = this.add.image(0, 0, 'tex_card_front').setVisible(false);

        // LAYER 3: Content
        let frontContent: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
        if (cardData.kind === 'image') {
            const key = `img_${cardData.pairId}`;
            if (this.textures.exists(key)) {
                const imgSize = Math.min(cardWidth, cardHeight) * 0.75;
                frontContent = this.add.image(0, 0, key)
                    .setDisplaySize(imgSize, imgSize)
                    .setVisible(false);
            } else {
                const emoji = this.emojiMap[cardData.prompt.toLowerCase()] || '🖼️';
                frontContent = this.add.text(0, 0, emoji, { fontSize: `${Math.min(cardWidth, cardHeight) * 0.5}px` }).setOrigin(0.5).setVisible(false);
            }
        } else {
            const text = cardData.prompt.toUpperCase();
            // Tamaño de fuente ajustado para tarjetas oscuras (White/Cyan)
            let baseFontSize = Math.floor(cardHeight * 0.14);

            frontContent = this.add.text(0, 0, text, {
                fontSize: `${baseFontSize}px`,
                fontFamily: 'Nunito',
                color: '#2D3436', // Acoplado al nuevo diseño charcoal
                align: 'center',
                wordWrap: { width: cardWidth - 25 },
                fontStyle: '900'
            }).setOrigin(0.5).setVisible(false);

            // Ajuste dinámico agresivo para evitar cualquier desborde
            const maxWidth = cardWidth * 0.85;
            const maxHeight = cardHeight * 0.85;

            if (frontContent.width > maxWidth || frontContent.height > maxHeight) {
                const scale = Math.min(maxWidth / frontContent.width, maxHeight / frontContent.height);
                frontContent.setScale(scale);
            }
        }

        const glow = this.add.graphics();
        glow.lineStyle(6, 0x4A90E2, 1);
        glow.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
        glow.setAlpha(0);

        container.add([shadow, back, frontBase, frontContent, glow]);
        container.setInteractive({ useHandCursor: true });

        const cardObj: CardObject = {
            container,
            backSprite: back,
            frontImage: frontContent instanceof Phaser.GameObjects.Image ? frontContent : undefined,
            frontText: frontContent instanceof Phaser.GameObjects.Text ? frontContent : undefined,
            frameSprite: frontBase,
            glowSprite: glow,
            cardData,
            pairId: cardData.pairId,
            isFlipped: false,
            isMatched: false
        };

        this.cards.push(cardObj);
        container.on('pointerdown', () => this.handleCardClick(cardObj));

        // GSAP Hover effects
        container.on('pointerover', () => {
            if (!cardObj.isFlipped && !cardObj.isMatched && !this.isProcessing) {
                gsap.to(container, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
            }
        });
        container.on('pointerout', () => {
            gsap.to(container, { scale: 1, duration: 0.2, ease: 'power2.out' });
        });
    }

    private handleCardClick(card: CardObject) {
        if (this.isProcessing || this.isPaused || this.isGameOver || card.isFlipped || card.isMatched) return;

        this.soundManager.playSfx('card_flip');

        // Feedback visual de selección (Mini pulse)
        gsap.to(card.container, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });

        this.flipCard(card, true);

        if (!this.firstPick) {
            this.firstPick = card;
            // Indicador de "Seleccionada"
            gsap.to(card.glowSprite, { alpha: 0.5, duration: 0.2 });
        } else {
            this.secondPick = card;
            this.isProcessing = true;
            this.moves++;

            // Animación HUD update
            this.movesText.setText(`MOVES: ${this.moves}`);
            gsap.from(this.movesText, { scale: 1.2, duration: 0.2, ease: 'back.out' });

            this.time.delayedCall(this.resolvedConfig.reveal_delay_ms || 400, () => this.checkMatch());
        }

        if (this.resolvedConfig.max_moves && this.moves >= this.resolvedConfig.max_moves) {
            this.endGame();
        }
    }

    private flipCard(card: CardObject, faceUp: boolean) {
        // Detener cualquier animación GSAP previa en este objeto
        gsap.killTweensOf(card.container);

        gsap.to(card.container, {
            scaleX: 0,
            duration: 0.15,
            ease: 'power1.in',
            onComplete: () => {
                card.isFlipped = faceUp;
                if (card.backSprite) card.backSprite.setVisible(!faceUp);
                if (card.frameSprite) card.frameSprite.setVisible(faceUp);
                if (card.frontImage) card.frontImage.setVisible(faceUp);
                if (card.frontText) card.frontText.setVisible(faceUp);

                gsap.to(card.container, {
                    scaleX: 1,
                    duration: 0.15,
                    ease: 'power1.out'
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
            pairId: String(p1.pairId),
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
        this.pairsText.setText(`Pairs: ${this.matches}/${totalPairs}`);

        const x1 = p1.container.x;
        const y1 = p1.container.y;
        const x2 = p2.container.x;
        const y2 = p2.container.y;

        // 1. Rayo Laser de Conexión (Cyber Beam)
        const beam = this.add.graphics();
        beam.lineStyle(4, 0x00FFFF, 1);
        beam.beginPath();
        beam.moveTo(x1, y1);
        beam.lineTo(x2, y2);
        beam.strokePath();
        beam.setDepth(6000).setAlpha(0);

        this.tweens.add({
            targets: beam,
            alpha: { from: 1, to: 0 },
            duration: 600,
            onComplete: () => beam.destroy()
        });

        // 2. Texto "MATCH!" Flotante
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const matchTxt = this.add.text(midX, midY, 'MATCH!', {
            fontSize: '48px', fontFamily: 'Orbitron, Nunito', color: '#00FF00', fontStyle: '900', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(8000).setScale(0);

        this.tweens.add({
            targets: matchTxt,
            scale: 1.2,
            y: '-=50',
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => matchTxt.destroy()
        });

        // 3. Activar glow de las cartas intensificado
        this.tweens.add({
            targets: [p1.glowSprite, p2.glowSprite],
            alpha: 1,
            duration: 800,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });

        // 4. Mostrar íconos de check con pulso
        const check1 = this.add.image(x1, y1, 'ui_atlas', 'common-ui/fx/fx_check').setScale(0).setDepth(7000);
        const check2 = this.add.image(x2, y2, 'ui_atlas', 'common-ui/fx/fx_check').setScale(0).setDepth(7000);

        this.tweens.add({
            targets: [check1, check2],
            scale: 2.5,
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Back.easeOut',
            onComplete: () => {
                check1.destroy();
                check2.destroy();
            }
        });

        // 5. Partículas
        showImpactParticles(this, x1, y1, 0x00FFFF);
        showImpactParticles(this, x2, y2, 0xFF00FF);
        showBurst(this, midX, midY, 0x00FF00);

        // 6. Efecto 'Pop' y Feedback Verde Suave (GSAP)
        gsap.to([p1.container, p2.container], {
            scale: 1.15,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'back.out(2)'
        });

        // Glow Verde Suave
        [p1, p2].forEach(p => {
            p.glowSprite.clear();
            p.glowSprite.lineStyle(8, 0x95D5B2, 1); // Verde Salvia Suave
            p.glowSprite.strokeRoundedRect(-p.container.width / 2, -p.container.height / 2, p.container.width, p.container.height, 12);
            gsap.to(p.glowSprite, { alpha: 1, duration: 0.3 });
        });

        // 7. Limpiar estado
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

        // 1. Crosses de Error con Shake y Tinte Rojo Neón
        const cross1 = this.add.image(x1, y1, 'ui_atlas', 'common-ui/fx/fx_cross').setScale(0).setDepth(7000).setTint(0xFF0033);
        const cross2 = this.add.image(x2, y2, 'ui_atlas', 'common-ui/fx/fx_cross').setScale(0).setDepth(7000).setTint(0xFF0033);

        this.tweens.add({
            targets: [cross1, cross2],
            scale: 2.2,
            alpha: { from: 1, to: 0 },
            duration: 900,
            ease: 'Expo.easeOut',
            onComplete: () => {
                cross1.destroy();
                cross2.destroy();
            }
        });

        // 2. Shake Horizontal Suave con GSAP (Visual Intuition)
        gsap.to([p1.container, p2.container], {
            x: "+=10",
            duration: 0.04,
            repeat: 7,
            yoyo: true,
            ease: "none",
            onComplete: () => {
                gsap.to(p1.container, { x: x1, duration: 0.1 });
                gsap.to(p2.container, { x: x2, duration: 0.1 });
            }
        });

        // Glow Rojo Suave temporal
        [p1, p2].forEach(p => {
            p.glowSprite.clear();
            p.glowSprite.lineStyle(8, 0xE76F51, 1); // Coral/Rojo Suave
            p.glowSprite.strokeRoundedRect(-p.container.width / 2, -p.container.height / 2, p.container.width, p.container.height, 12);
            gsap.to(p.glowSprite, { alpha: 1, duration: 0.2, yoyo: true, repeat: 1 });
        });

        // 3. Feedback visual potente de error (Rojo Profesional)
        p1.glowSprite.clear();
        p1.glowSprite.lineStyle(6, 0xE74C3C, 1);
        p1.glowSprite.strokeRoundedRect(-p1.container.width / 2, -p1.container.height / 2, p1.container.width, p1.container.height, 10);
        p1.glowSprite.setAlpha(1);

        p2.glowSprite.clear();
        p2.glowSprite.lineStyle(6, 0xE74C3C, 1);
        p2.glowSprite.strokeRoundedRect(-p2.container.width / 2, -p2.container.height / 2, p2.container.width, p2.container.height, 10);
        p2.glowSprite.setAlpha(1);

        this.time.delayedCall(350, () => {
            p1.glowSprite.setAlpha(0);
            p2.glowSprite.setAlpha(0);
            // Restaurar color original azul para futuros usos
            [p1, p2].forEach(p => {
                p.glowSprite.clear();
                p.glowSprite.lineStyle(6, 0x4A90E2, 1);
                p.glowSprite.strokeRoundedRect(-p.container.width / 2, -p.container.height / 2, p.container.width, p.container.height, 10);
            });
        });

        // 4. Partículas
        showImpactParticles(this, x1, y1, 0xFF0033);
        showImpactParticles(this, x2, y2, 0xFF0033);

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

        // Backdrop traslúcido total
        this.pauseOverlay = this.add.container(0, 0).setDepth(20000).setVisible(false).setScrollFactor(0);
        const backdrop = this.add.rectangle(0, 0, width, height, 0x010409, 0.6).setOrigin(0).setInteractive();

        const panelCont = this.add.container(width / 2, height / 2);
        const pW = 400, pH = 300;

        const bg = createIMPanel(this, pW, pH);

        const title = this.add.text(0, -80, 'PAUSED', {
            fontSize: '42px', fontFamily: 'Orbitron, Nunito', color: '#1E293B', fontStyle: '900'
        }).setOrigin(0.5);

        const info = this.add.text(0, -25, 'MISSION SUSPENDED', {
            fontSize: '14px', fontFamily: 'Orbitron', color: '#6366F1', letterSpacing: 2
        }).setOrigin(0.5);

        const resumeBtn = createIMButton(this, 0, 45, 240, 55, '➔ RESUME MISSION', () => this.togglePause(), true);
        const exitBtn = createIMButton(this, 0, 110, 180, 50, 'EXIT GAME', () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();
            this.game.events.emit('GAME_EXIT');
        }, false);

        panelCont.add([bg, title, info, resumeBtn, exitBtn]);
        this.pauseOverlay.add([backdrop, panelCont]);
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
        if (!wasPaused) this.isPaused = true;

        const { width, height } = this.cameras.main;
        if (this.helpOverlayContainer) this.helpOverlayContainer.destroy();
        this.helpOverlayContainer = this.add.container(0, 0).setDepth(30000).setScrollFactor(0);

        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();

        const pW = 440, pH = 340;
        const panel = this.add.container(width / 2, height / 2);
        const bg = createIMPanel(this, pW, pH);

        const title = this.add.text(0, -110, 'How to play', {
            fontSize: '32px', fontFamily: 'Orbitron, Nunito', color: '#1E293B', fontStyle: '900'
        }).setOrigin(0.5);

        const info = this.add.text(0, -10, this.missionInstructions, {
            fontSize: '20px', fontFamily: 'Nunito', color: '#6366F1', align: 'center', wordWrap: { width: 380 }, fontStyle: '800'
        }).setOrigin(0.5);

        const closeBtn = createIMButton(this, 0, 110, 180, 55, '➔ GOT IT!', () => {
            if (this.helpOverlayContainer) {
                this.helpOverlayContainer.destroy();
                this.helpOverlayContainer = null;
            }
            if (!wasPaused) this.isPaused = false;
        }, true);

        panel.add([bg, title, info, closeBtn]);
        this.helpOverlayContainer.add([backdrop, panel]);

        panel.setScale(0.8).setAlpha(0);
        this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 400, ease: 'Back.out' });
    }

    private startCountdown() {
        const { width, height } = this.cameras.main;
        let count = 3;

        if (this.countdownText) this.countdownText.destroy();
        this.countdownText = this.add.text(width / 2, height / 2, '3', {
            fontSize: '130px', fontFamily: 'Orbitron, Nunito', color: '#ffffff', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(1500).setScrollFactor(0);

        const txt = this.countdownText;
        this.time.addEvent({
            delay: 1000, repeat: 3,
            callback: () => {
                count--;
                if (count > 0) {
                    txt.setText(count.toString()).setColor('#00FFFF'); // Cyan Neón
                }
                else if (count === 0) {
                    txt.setText('GO!').setColor('#00FF00'); // Verde Eléctrico
                    this.soundManager.playSfx('game_start');
                }
                else {
                    txt.destroy();
                    this.peekCards();
                }
            }
        });
    }

    private peekCards() {
        this.isProcessing = true; // Bloquear clicks

        // Fase 1: Voltear todas las cartas
        this.cards.forEach(card => this.flipCard(card, true));

        // Fase 2: Mostrar texto motivador abajo (para no bloquear las cartas)
        const { width, height } = this.cameras.main;
        const peekText = this.add.text(width / 2, height - 70, 'MEMORIZE!', {
            fontSize: '38px', fontFamily: 'Orbitron, Nunito', color: '#FFFF00', fontStyle: '900', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(2000);

        this.tweens.add({ targets: peekText, scale: 1.1, duration: 400, yoyo: true, repeat: -1 });

        // Fase 3: Ocultar después de 3 segundos
        this.time.delayedCall(3000, () => {
            peekText.destroy();
            this.cards.forEach(card => this.flipCard(card, false));
            this.time.delayedCall(400, () => {
                this.isProcessing = false;
                this.startGameplay();
            });
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

        if (this.missionCompleteDimmer) this.missionCompleteDimmer.destroy();
        this.missionCompleteDimmer = this.add.rectangle(0, 0, width, height, 0x010409, 0.7).setOrigin(0).setInteractive().setDepth(50000);

        if (this.missionCompleteContainer) this.missionCompleteContainer.destroy();
        this.missionCompleteContainer = this.add.container(width / 2, height / 2).setDepth(50001);

        const pW = 480, pH = 420;
        const bg = createIMPanel(this, pW, pH);

        const title = this.add.text(0, -145, 'MISSION COMPLETE', {
            fontSize: '34px', fontFamily: 'Orbitron, Nunito', color: '#1E293B', fontStyle: '900'
        }).setOrigin(0.5);

        const subtitle = this.add.text(0, -110, 'DATA RETRIEVED SUCCESSFULLY', {
            fontSize: '12px', fontFamily: 'Orbitron', color: '#6366F1', letterSpacing: 2
        }).setOrigin(0.5);

        const pairsText = this.add.text(0, -40, `MATCHED PAIRS: ${stats.pairs}/${stats.totalPairs}`, {
            fontSize: '22px', fontFamily: 'Nunito', color: '#444444', fontStyle: '800'
        }).setOrigin(0.5);

        const accuracyText = this.add.text(0, -5, `ACCURACY: ${stats.accuracy}%`, {
            fontSize: '20px', fontFamily: 'Nunito', color: '#6366F1', fontStyle: '900'
        }).setOrigin(0.5);

        const bonusStatus = stats.perfectMatch ? 'PERFECT MISSION!' : 'STANDARD CLEAR';
        const bonusColor = stats.perfectMatch ? '#10B981' : '#64748B';
        const bonusText = this.add.text(0, 30, bonusStatus, {
            fontSize: '18px', fontFamily: 'Orbitron', color: bonusColor, fontStyle: '900'
        }).setOrigin(0.5);

        let rank = 'ROOKIE';
        let icon = '📡';
        if (stats.accuracy >= 90) { rank = 'CYBER MASTER'; icon = '⚡'; }
        else if (stats.accuracy >= 70) { rank = 'SPECIALIST'; icon = '💻'; }
        else if (stats.accuracy >= 50) { rank = 'OPERATIVE'; icon = '🔍'; }

        const rankText = this.add.text(0, 85, `${icon} RANK: ${rank}`, {
            fontSize: '28px', fontFamily: 'Orbitron, Nunito', color: '#1E293B', fontStyle: '900'
        }).setOrigin(0.5);

        const exitBtn = createIMButton(this, -110, 160, 180, 55, 'RESULTS', () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();
            this.game.events.emit('GAME_EXIT');
        }, false);

        const repeatBtn = createIMButton(this, 110, 160, 180, 55, 'RETRY', () => {
            if (this.initData) this.scene.restart(this.initData);
            else this.scene.restart();
        }, true);

        this.missionCompleteContainer.add([bg, title, subtitle, pairsText, accuracyText, bonusText, rankText, exitBtn, repeatBtn]);

        this.missionCompleteContainer.setScale(0.8).setAlpha(0);
        this.tweens.add({ targets: this.missionCompleteContainer, scale: 1, alpha: 1, duration: 500, ease: 'Back.out(1.7)' });
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
