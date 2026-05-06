import * as Phaser from 'phaser';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { createCEHUDBg, CE_THEME } from './CityExplorerUI';
import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle';
import { createButton, createPanel, showModal, showFeedback, showGlow, showFullscreenRequest, showGameInstructions } from './UIKit';
import { AnswerTracker } from './answerTracker';
import type { GameSessionManager } from './GameSessionManager';
import { CityExplorerLocationItem, CityExplorerMapData } from './gameLoader.utils';
import { CITY_EXPLORER_CONFIG } from './cityExplorer.config';
import { loadGameAudio } from './AudioLoader';
import { SoundManager } from './SoundManager';

interface Checkpoint {
    sprite: Phaser.GameObjects.Image;
    glowSprite?: Phaser.GameObjects.Image;
    checkIcon?: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    data: CityExplorerLocationItem;
    isTarget: boolean;
    isCompleted: boolean;
    debugCircle?: Phaser.GameObjects.Arc;
}

export class CityExplorerScene extends Phaser.Scene {
    // Data
    private mapData: CityExplorerMapData | null = null;
    private sessionManager: GameSessionManager | null = null;
    private answerTracker!: AnswerTracker;
    private initData: any = null;

    // Config
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: any = null;
    private requiredCheckpoints: number = 0;

    // State
    private isAnswering: boolean = false;
    private isGameOver: boolean = false;
    private isPaused: boolean = false;
    private missionPanel!: Phaser.GameObjects.Image; // Added for position sync
    private gameStartTime: number = 0;
    private soundManager!: SoundManager;
    private score: number = 0;
    private locationsFound: number = 0;
    private failures: number = 0;
    private timeElapsed: number = 0; // Changed from timeRemaining to timeElapsed (counts UP)

    // Objects
    private player!: Phaser.GameObjects.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: any;
    private checkpoints: Checkpoint[] = [];
    private currentTarget: Checkpoint | null = null;
    private guideArrow!: Phaser.GameObjects.Container;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;

    // UI
    private gameHUD!: GameHUD;
    private progressText!: Phaser.GameObjects.Text;
    private objectiveText!: Phaser.GameObjects.Text;
    private gameTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'CityExplorerScene' });
    }

    init(data: any) {
        this.initData = data;
        this.mapData = data.mapData || null;
        this.sessionManager = data.sessionManager || null;
        this.missionTitle = data.missionTitle || 'CITY EXPLORER';
        this.missionInstructions = data.missionInstructions || 'Explore the city and find the locations!';
        this.missionConfig = data.missionConfig || null;

        this.requiredCheckpoints = this.mapData?.checkpoints.length || 0;
        this.score = 0;
        this.locationsFound = 0;
        this.failures = 0;
        this.timeElapsed = 0; // Start at 0 and count UP

        this.isGameOver = false;
        this.isAnswering = false;
        this.isPaused = false;
        this.checkpoints = [];
        this.currentTarget = null;
        this.gameStartTime = Date.now();

        this.answerTracker = new AnswerTracker();
    }

    preload() {
        loadGameAtlases(this, 'ce');
        loadGameAudio(this, 'ce');
        this.load.image('bg_city', '/assets/backgrounds/city-explorer/bg_lolium.png');
    }

    create() {
        try {
            const { width, height } = this.cameras.main;
            this.soundManager = new SoundManager(this);
            const worldWidth = 1600;
            const worldHeight = 1200;
            const headerHeight = 150;

            // Physics Bounds
            this.physics.world.setBounds(0, headerHeight, worldWidth, worldHeight - headerHeight);
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

            // 0. Base Background (Full Black to cover everything)
            this.add.rectangle(0, 0, worldWidth, worldHeight, 0x01040a).setOrigin(0).setDepth(-100);

            // 1. Background (Digital Grid)
            const { createDigitalGrid, createRestrictedZone, createHoloMarker, createNavCursor, CE_THEME } = require('./CityExplorerUI');
            // Offset Grid to start below header
            const mapBg = createDigitalGrid(this, worldWidth, worldHeight - headerHeight);
            mapBg.setPosition(0, headerHeight);
            mapBg.setDepth(0);

            // 2. Obstacles (Restricted Zones)
            this.createDecoration(worldWidth, worldHeight, createRestrictedZone);

            // 3. Marcadores Holográficos
            this.createMapMarkers(createHoloMarker);

            // 4. Player (Nav Cursor)
            this.createPlayer(createNavCursor);

            // 4.5 Guidance Arrow
            this.createGuidanceArrow();

            // 5. Physics Collisions
            this.physics.add.collider(this.player, this.obstacles);

            // 5. Controls
            this.setupControls();

            // 6. HUD
            this.createHud();

            // 7. Camera follow (Smooth Lerp)
            this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

            // 9. Fullscreen Request
            this.showInitialFullscreen();

            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[CityExplorer] Error en Create:', error);
        }
    }

    private createDecoration(worldWidth: number, worldHeight: number, zoneFactory: any) {
        this.obstacles = this.physics.add.staticGroup();

        const zones = [
            { x: 150, y: 180, w: 120, h: 100 },
            { x: 300, y: 180, w: 100, h: 80 },
            { x: 700, y: 180, w: 150, h: 120 },
            { x: 1100, y: 250, w: 180, h: 150 },
            { x: 1400, y: 150, w: 120, h: 120 },
            { x: 150, y: worldHeight - 150, w: 120, h: 100 },
            { x: 400, y: worldHeight - 250, w: 150, h: 150 },
            { x: 900, y: worldHeight - 180, w: 140, h: 100 },
            { x: 1300, y: worldHeight - 200, w: 160, h: 120 },
            { x: 400, y: 600, w: 100, h: 100 },
            { x: 1000, y: 550, w: 200, h: 150 },
            { x: 1200, y: 800, w: 150, h: 150 }
        ];

        zones.forEach(config => {
            // Visual
            const zone = zoneFactory(this, config.x, config.y, config.w, config.h);
            zone.setDepth(20);

            // Invisible Physics Block
            const block = this.obstacles.create(config.x, config.y, null);
            block.setVisible(false);
            const body = block.body as Phaser.Physics.Arcade.StaticBody;
            body.setSize(config.w, config.h);
            body.updateFromGameObject();
        });
    }

    private createMapMarkers(markerFactory: any) {
        if (!this.mapData || !this.mapData.checkpoints) return;

        // Si no se pasó factory, importar (safeguard)
        if (!markerFactory) {
            const { createHoloMarker } = require('./CityExplorerUI');
            markerFactory = createHoloMarker;
        }

        this.mapData.checkpoints.forEach(loc => {
            // Holo Marker Visual
            const marker = markerFactory(this, loc.x, loc.y);
            marker.setDepth(25);

            // Icono eliminado por solicitud de limpieza visual
            // const checkIcon = ...

            // Etiqueta Holográfica
            const label = this.add.text(loc.x, loc.y + 35, loc.name.toUpperCase(), {
                fontSize: '12px', fontFamily: 'Orbitron, monospace', color: '#93c5fd', backgroundColor: '#0f172aAA', padding: { x: 6, y: 2 }
            }).setOrigin(0.5, 0).setDepth(30).setAlpha(0.8);

            // Hitbox invisible para lógica
            const debugCircle = this.add.circle(loc.x, loc.y, loc.radius || 70, 0x000000, 0).setDepth(0);

            // Sprite fake para compatibilidad con la lógica existente que espera 'sprite'
            const logicSprite = this.add.image(loc.x, loc.y, 'ui_atlas', 'common-ui/fx/fx_glow')
                .setAlpha(0).setScale(0).setVisible(false).setActive(false); // TOTALMENTE INVISIBLE

            this.checkpoints.push({
                sprite: logicSprite, // Mantenemos ref para lógica antigua
                glowSprite: marker,  // Usaremos el contenedor visual aquí
                // checkIcon: checkIcon, // Removed from visual
                data: loc,
                isTarget: false,
                isCompleted: false,
                label: label,
                debugCircle: debugCircle
            });
        });
    }

    private createPlayer(cursorFactory: any) {
        const { width, height } = this.cameras.main;

        // Visual Container
        const cursorValues = cursorFactory ? cursorFactory(this, width / 2, height / 2) : this.add.container(width / 2, height / 2);
        this.player = cursorValues; // TypeScript amigable hacking
        (this.player as any).body = null; // Prepare for physics enable

        this.physics.add.existing(this.player);
        this.player.setDepth(100);

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setCollideWorldBounds(true);
            body.setCircle(15);
            body.setOffset(-15, -15); // Centrar collider en contenedor
        }
    }

    private setupControls() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };

        // Prevent browser from scrolling with arrows/WASD
        this.input.keyboard?.addCapture([
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.W,
            Phaser.Input.Keyboard.KeyCodes.A,
            Phaser.Input.Keyboard.KeyCodes.S,
            Phaser.Input.Keyboard.KeyCodes.D
        ]);
    }

    private createGuidanceArrow() {
        this.guideArrow = this.add.container(0, 0);
        // Solo un punto simple, como pidió el usuario
        const dot = this.add.circle(0, 0, 5, 0xfbbf24, 1);
        this.guideArrow.add(dot);
        this.guideArrow.setDepth(1001).setAlpha(0);
    }

    private showInitialFullscreen() {
        this.isPaused = true;

        // Ensure input is captured when clicking anywhere on the game
        this.input.on('pointerdown', () => {
            if (!this.scale.isFullscreen && this.sys.game.canvas) {
                this.sys.game.canvas.focus();
            }
        });

        showGameInstructions(this, {
            title: 'DATA RETRIEVAL',
            instructions: this.missionInstructions || 'Navigate the digital grid to locate and decrypt data nodes.',
            controls: 'Use Arrow Keys or WASD to navigate.\n• Follow the yellow indicator arrow.\n• Avoid restricted zones.',
            controlIcons: ['arrows'],
            requestFullscreen: true,
            buttonLabel: 'INITIALIZE',
            onStart: () => {
                this.isPaused = false;
                this.startGame();
            }
        });
    }

    private createHud() {
        const { width, height } = this.cameras.main;
        this.gameHUD = new GameHUD(this, {
            showTimer: true,
            showScore: true,
            showProgress: true,
            showLives: false,
            maxLives: 0,
            totalItems: this.requiredCheckpoints,
            showHelpButton: true,
            showPauseButton: true
        }, this.soundManager);
        this.gameHUD.getContainer().setScrollFactor(0).setDepth(5000);

        this.progressText = this.add.text(width / 2, 75, `NODES: 0/${this.requiredCheckpoints}`, {
            fontSize: '16px',
            fontFamily: 'Orbitron, monospace',
            color: '#3b82f6',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        // --- NEW DIALOG BOX DESIGN (Digital Panel) ---
        const dialogW = 600;
        const dialogH = 100;
        const dialogX = width / 2;
        const dialogY = height - 70;

        // Background with Glass effect
        const glass = new RoundRectangle(this, 0, 0, dialogW, dialogH, 15, 0x010409, 0.85);
        glass.setStrokeStyle(2, 0x38bdf8, 0.4);
        this.add.existing(glass);

        // Sidebar Accent
        const sidebar = new RoundRectangle(this, -dialogW / 2 + 10, 0, 8, dialogH - 20, 4, 0x38bdf8, 1);
        this.add.existing(sidebar);

        const labelX = -dialogW / 2 + 35;
        const missionLabel = this.add.text(labelX, -dialogH / 2 + 25, 'SYSTEM ASSIGNMENT:', {
            fontSize: '11px',
            fontFamily: 'Orbitron, monospace',
            color: '#38bdf8',
            letterSpacing: 2
        }).setOrigin(0, 0.5);

        this.objectiveText = this.add.text(labelX, 15, 'WAITING FOR DATA...', {
            fontSize: '19px',
            fontFamily: 'Nunito',
            color: '#ffffff',
            align: 'left',
            fontStyle: 'bold',
            wordWrap: { width: dialogW - 80 }
        }).setOrigin(0, 0.5);

        const dialogContainer = this.add.container(dialogX, dialogY, [
            glass, sidebar, missionLabel, this.objectiveText
        ]).setScrollFactor(0).setDepth(5000);

        this.gameHUD.onPause(() => this.togglePause());
        this.gameHUD.onHelp(() => {
            showGameInstructions(this, {
                title: 'Data Retrieval',
                instructions: this.missionInstructions,
                controls: 'Navigate with Arrows/WASD to find data nodes.',
                controlIcons: ['arrows'],
                buttonLabel: 'RESUME MISSION',
                onStart: () => { }
            });
        });

        this.updateHud();
    }

    private startGame() {
        console.log('[CityExplorer] Starting game and clearing blocks...');
        // Ensure all movement-blocking flags are cleared
        this.isPaused = false;
        this.isAnswering = false;
        this.isGameOver = false;

        // Force physics and keyboard focus
        this.physics.resume();
        this.physics.world.resume();

        if (this.input.keyboard) {
            this.input.keyboard.enabled = true;
            this.input.keyboard.resetKeys();
        }

        // Try to focus the game canvas multiple times to be sure
        const focusCanvas = () => {
            try {
                this.sys.game.canvas.focus();
                window.focus();
            } catch (e) {
                // silent fail 
            }
        };

        focusCanvas();
        setTimeout(focusCanvas, 100);
        setTimeout(focusCanvas, 500);

        this.gameStartTime = Date.now();
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.isPaused || this.isGameOver) return;
                this.timeElapsed++; // Count UP instead of down
                this.updateHud();
                // Timer no longer ends the game - only finding all checkpoints does
            }
        });

        this.soundManager.playMusic('bg_music', 0.4);
        this.soundManager.playSfx('game_start');

        // --- NEW: Initialize First Target ---
        this.currentTarget = this.checkpoints.find(c => !c.isCompleted);
        if (this.currentTarget) {
            this.setupTargetGlow(this.currentTarget);
            if (this.guideArrow) this.guideArrow.setAlpha(1);
        }
    }

    private setupTargetGlow(cp: Checkpoint) {
        if (!cp.glowSprite) return;

        // Limpiar animaciones previas
        this.tweens.killTweensOf(cp.glowSprite);
        cp.glowSprite.setScale(1).setAlpha(1);

        // Actualizar Texto Inmediatamente
        const rawClue = cp.data.challenge?.prompt || `Find the ${cp.data.name}`;
        const formattedClue = `> ${rawClue.toUpperCase()}`;

        if (this.objectiveText) {
            this.objectiveText.setText(formattedClue);
        }

        this.soundManager.playSfx('found_clue', 0.5);
    }

    update(time: number, delta: number) {
        // Update guidance arrow
        if (this.currentTarget && !this.isGameOver && !this.isPaused) {
            // Actualizar Satélite de Guía
            if (this.currentTarget && this.guideArrow && this.guideArrow.alpha > 0) {
                const targetAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.currentTarget.data.x, this.currentTarget.data.y);

                // Distancia de orbita fija
                const orbitDist = 60;
                const satelliteX = this.player.x + Math.cos(targetAngle) * orbitDist;
                const satelliteY = this.player.y + Math.sin(targetAngle) * orbitDist;

                // Lerp para suavidad
                this.guideArrow.x = Phaser.Math.Linear(this.guideArrow.x, satelliteX, 0.1);
                this.guideArrow.y = Phaser.Math.Linear(this.guideArrow.y, satelliteY, 0.1);

                // Rotación local del satélite
                this.guideArrow.rotation += 0.05;
            }
        } else {
            this.guideArrow.setAlpha(0);
        }

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body || this.isGameOver || this.isAnswering || this.isPaused) {
            if (body) body.setVelocity(0);
            return;
        }

        const speed = 250;
        let moveX = 0;
        let moveY = 0;

        if (this.cursors && this.wasd) {
            if (this.cursors.left.isDown || this.wasd.A.isDown) moveX = -speed;
            else if (this.cursors.right.isDown || this.wasd.D.isDown) moveX = speed;
            if (this.cursors.up.isDown || this.wasd.W.isDown) moveY = -speed;
            else if (this.cursors.down.isDown || this.wasd.S.isDown) moveY = speed;
        }

        body.setVelocity(moveX, moveY);

        // Rotación suave hacia la dirección de movimiento
        if (moveX !== 0 || moveY !== 0) {
            const targetAngle = Math.atan2(moveY, moveX) + Math.PI / 2; // +90deg porque el gráfico apunta arriba (0, -15)
            // Lerp angle for smoothness
            const currentAngle = this.player.rotation;
            let diff = targetAngle - currentAngle;
            // Normalizar diferencia a -PI a +PI
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            this.player.rotation += diff * 0.15;
        }

        this.checkProximityFeedback();
        this.checkCollisions();
    }

    private checkProximityFeedback() {
        if (!this.currentTarget || this.isAnswering || this.isPaused) return;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        const dist = Phaser.Math.Distance.Between(body.center.x, body.center.y, this.currentTarget.data.x, this.currentTarget.data.y);
        const radius = this.currentTarget.data.radius || 70;

        if (dist < radius * 2) {
            // Cerca: Aumentar brillo/rotacion
            if (this.currentTarget.glowSprite) {
                this.currentTarget.glowSprite.setAlpha(1);
                this.currentTarget.glowSprite.rotation += 0.05;
            }
        }
    }

    private checkCollisions() {
        if (!this.currentTarget || this.isAnswering || this.isPaused) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.currentTarget.data.x, this.currentTarget.data.y);
        if (dist < (this.currentTarget.data.radius || 70)) {
            this.handleReachTarget(this.currentTarget);
        }
    }

    private handleReachTarget(cp: Checkpoint) {
        this.isAnswering = true;
        this.soundManager.playSfx('map_pin', 0.7);
        this.submitAnswer(cp, true);
    }

    private submitAnswer(cp: Checkpoint, isCorrect: boolean) {
        if (isCorrect) {
            const points = CITY_EXPLORER_CONFIG.scoring.points_correct;
            this.score += points;
            this.locationsFound++;
            // Eliminado el bloom verde excesivo (showGlow)
            this.soundManager.playSfx('correct', 0.6);
            this.soundManager.playSfx('unlock', 0.8);
            this.answerTracker.recordCorrectCatch(cp.data.id, cp.data.challenge?.prompt || cp.data.name, { x: cp.data.x, y: cp.data.y }, cp.data.challenge?.ruleTag ? [cp.data.challenge.ruleTag] : []);
            this.sessionManager?.updateScore(points, true);
        } else {
            const penalty = CITY_EXPLORER_CONFIG.scoring.points_wrong;
            this.score = Math.max(0, this.score + penalty);
            this.failures++;
            this.cameras.main.shake(200, 0.005);
            this.soundManager.playSfx('wrong', 0.6);
            this.answerTracker.recordDistractorCatch(cp.data.id, cp.data.challenge?.prompt || cp.data.name, { x: cp.data.x, y: cp.data.y }, cp.data.challenge?.ruleTag ? [cp.data.challenge.ruleTag] : []);
            this.sessionManager?.updateScore(penalty, false);
        }
        this.updateHud();
        this.time.delayedCall(800, () => this.handleChallengeComplete(cp, isCorrect));
    }

    private handleChallengeComplete(cp: Checkpoint, success: boolean) {
        this.isAnswering = false;
        cp.isCompleted = true;

        if (cp.glowSprite) {
            this.tweens.killTweensOf(cp.glowSprite);
            // Efecto minimalista: El marcador simplemente se apaga (desaparece)
            this.tweens.add({ targets: cp.glowSprite, alpha: 0, scale: 0.5, duration: 400 });
        }

        if (this.locationsFound >= this.requiredCheckpoints) {
            this.endGame();
        } else {
            this.currentTarget = this.checkpoints.find(c => !c.isCompleted);
            if (this.currentTarget) this.setupTargetGlow(this.currentTarget);
            else this.endGame();
        }
    }

    private updateHud() {
        this.gameHUD.update({
            score: this.score,
            timeRemaining: this.timeElapsed,
            progress: this.locationsFound / this.requiredCheckpoints
        });
        if (this.progressText) this.progressText.setText(`CHECKPOINTS: ${this.locationsFound}/${this.requiredCheckpoints}`);
    }

    private buildGamePayload() {
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const accuracy = (this.locationsFound + this.failures) > 0 ? Math.round((this.locationsFound / (this.locationsFound + this.failures)) * 100) : 0;

        // Calculate score based on performance metrics to avoid "clamping at zero" loopholes
        // Points: +200 per correct, -50 per failure
        const effectiveScore = (this.locationsFound * 200) - (this.failures * 50);
        const maxScorePossible = this.requiredCheckpoints * 200; // Based on goal

        // Ensure strictly non-negative for the grade
        const scoreRatio = maxScorePossible > 0 ? Math.max(0, effectiveScore) / maxScorePossible : 0;
        const normalizedScore = Math.round(scoreRatio * 10 * 10) / 10;  // Score out of 10

        return {
            score: normalizedScore,           // Nota sobre 10 (ej: 8.5/10)
            scoreRaw: Math.max(0, this.score),  // Puntos brutos para estadísticas
            correctCount: this.locationsFound,
            wrongCount: this.failures,
            durationSeconds: duration,
            accuracy: accuracy,
            answers: this.answerTracker.getAnswers()
        };
    }

    private async endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        if (this.gameTimer) this.gameTimer.remove();
        this.soundManager.stopMusic();
        this.soundManager.playSfx('game_win');
        if (this.sessionManager) await this.sessionManager.endSession().catch(e => console.error(e));
        const payload = this.buildGamePayload();
        this.createMissionCompleteModal(payload);
    }

    private createMissionCompleteModal(payload: any) {
        const cam = this.cameras.main;
        const centerX = cam.worldView.centerX;
        const centerY = cam.worldView.centerY;

        const container = this.add.container(centerX, centerY).setDepth(40000);
        // Dimmer covers the entire camera view
        const dim = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.85).setInteractive(); // Re-enabled for modal blocking

        // Background & Border from modals_atlas (glass effect)
        const panelW = 540;
        const panelH = 460;
        const panelBg = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Panel/panel-001.png', panelW, panelH, 20, 20, 20, 20)
            .setTint(0x0a1a2e).setAlpha(0.85);
        const panelBorder = this.add.nineslice(0, 0, 'modals_atlas', 'Default/Border/panel-border-001.png', panelW, panelH, 20, 20, 20, 20)
            .setTint(0x3b82f6);

        const trophy = this.add.image(0, -60, 'ui_atlas', 'common-ui/rewards/trophy').setScale(1.2);
        const title = this.add.text(0, -160, 'CITY EXPLORED!', {
            fontSize: '38px',
            fontFamily: 'Fredoka',
            color: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        const statsContainer = this.add.container(0, 30);
        const stats = [
            { label: 'CHECKPOINTS', value: `${payload.correctCount}/${this.requiredCheckpoints}` },
            { label: 'ACCURACY', value: `${payload.accuracy}%` },
            { label: 'SCORE', value: `${payload.score.toFixed(1)}/10` }
        ];

        stats.forEach((item, idx) => {
            statsContainer.add([
                this.add.text(-100, idx * 40, item.label, { fontSize: '20px', fontFamily: 'Fredoka', color: '#94a3b8' }).setOrigin(0, 0.5),
                this.add.text(100, idx * 40, item.value.toString(), { fontSize: '22px', fontFamily: 'Fredoka', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5)
            ]);
        });

        const btnY = 175;
        const resultsBtn = createButton(this, 'common-ui/buttons/btn_secondary', -125, btnY, 'RESULTS', () => {
            if (this.scale.isFullscreen) this.scale.stopFullscreen();
            this.events.emit('exit', payload);
            this.game.events.emit('exit', payload);
        }, { width: 190, height: 60 });

        const replayBtn = createButton(this, 'common-ui/buttons/btn_primary', 125, btnY, 'REPEAT', () => {
            this.scene.restart(this.initData);
        }, { width: 190, height: 60 });

        container.add([dim, panelBg, panelBorder, trophy, title, statsContainer, resultsBtn, replayBtn]);
        container.setScale(0);
        this.tweens.add({ targets: container, scale: 1, duration: 500, ease: 'Back.out' });
    }

    private togglePause() {
        if (this.isGameOver || this.isPaused) return;
        this.isPaused = true;
        this.physics.pause();
        if (this.gameTimer) this.gameTimer.paused = true;
        // No pausar tweens globales para permitir que la UI (modal) se anime
        // this.tweens.pauseAll();

        showModal(this, {
            title: 'EXIT GAME?',
            message: 'Are you sure you want to exit? Your progress will be saved.',
            buttons: [
                {
                    label: 'CANCEL',
                    onClick: () => {
                        this.isPaused = false;
                        this.physics.resume();
                        if (this.gameTimer) this.gameTimer.paused = false;
                        this.tweens.resumeAll();
                    },
                    isPrimary: false
                },
                {
                    label: 'EXIT',
                    onClick: () => {
                        if (this.scale.isFullscreen) this.scale.stopFullscreen();
                        const payload = this.buildGamePayload();
                        this.events.emit('exit', payload);
                        this.game.events.emit('exit', payload);
                    },
                    isPrimary: true
                }
            ]
        });
    }
}
