import * as Phaser from 'phaser';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { createButton, createPanel, showModal, showFeedback, showGlow, showFullscreenRequest, showGameInstructions } from './UIKit';
import { AnswerTracker } from './answerTracker';
import type { GameSessionManager } from './GameSessionManager';
import { CityExplorerLocationItem, CityExplorerMapData } from './gameLoader.utils';
import { CITY_EXPLORER_CONFIG } from './cityExplorer.config';

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
        this.load.image('bg_city', '/assets/backgrounds/city-explorer/bg_lolium.png');
    }

    create() {
        try {
            const { width, height } = this.cameras.main;
            const worldWidth = 1600;
            const worldHeight = 1200;

            this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

            // 1. Background (City Map)
            const mapBg = this.add.image(0, 0, 'bg_city').setOrigin(0);
            mapBg.setDisplaySize(worldWidth, worldHeight);
            mapBg.setDepth(0);

            // 2. Decoraciones fijas para llenar el mapa
            this.createDecoration(worldWidth, worldHeight);

            // 3. Marcadores
            this.createMapMarkers();

            // 4. Player
            this.createPlayer();

            // 5. Controls
            this.setupControls();

            // 6. HUD
            this.createHud();

            // 7. Camera follow
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            // 8. Start Game - Now handled by showInitialFullscreen -> showGameInstructions
            // this.startGame();

            // 9. Fullscreen Request
            this.showInitialFullscreen();

            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[CityExplorer] Error en Create:', error);
        }
    }

    private showInitialFullscreen() {
        this.isPaused = true;
        showGameInstructions(this, {
            title: 'City Explorer',
            instructions: this.missionInstructions || 'Explore the map to find all the required locations. Complete the challenges at each stop!',
            controls: 'Use Arrow Keys (↑ ↓ ← →) or W-A-S-D to navigate.\n\n• PAUSE (⏸): Pause the game\n• HELP (?): View instructions',
            controlIcons: ['arrows'],
            requestFullscreen: true,
            buttonLabel: 'START EXPLORING',
            onStart: () => {
                this.isPaused = false;
                this.startGame();
            }
        });
    }

    private createDecoration(worldWidth: number, worldHeight: number) {
        const decorations = [
            { x: 150, y: 180, frame: 'city-explorer/buildings/building_house' },
            { x: 300, y: 180, frame: 'city-explorer/buildings/building_shop' },
            { x: 700, y: 180, frame: 'city-explorer/buildings/building_house' },
            { x: 1100, y: 250, frame: 'city-explorer/buildings/building_house' },
            { x: 1400, y: 150, frame: 'city-explorer/buildings/building_shop' },
            { x: 150, y: worldHeight - 150, frame: 'city-explorer/buildings/building_shop' },
            { x: 400, y: worldHeight - 250, frame: 'city-explorer/buildings/building_house' },
            { x: 900, y: worldHeight - 180, frame: 'city-explorer/buildings/building_shop' },
            { x: 1300, y: worldHeight - 200, frame: 'city-explorer/buildings/building_house' },
            { x: 400, y: 600, frame: 'city-explorer/buildings/building_shop' },
            { x: 1000, y: 550, frame: 'city-explorer/buildings/building_house' },
            { x: 1200, y: 800, frame: 'city-explorer/buildings/building_shop' }
        ];

        decorations.forEach(config => {
            const img = this.add.image(config.x, config.y, 'ce_atlas', config.frame);
            img.setAlpha(0.5).setScale(0.9).setDepth(10);
        });
    }

    private createMapMarkers() {
        if (!this.mapData || !this.mapData.checkpoints) return;
        this.mapData.checkpoints.forEach(loc => this.createCheckpointMarker(loc));
    }

    private createCheckpointMarker(loc: CityExplorerLocationItem) {
        const glow = this.add.image(loc.x, loc.y, 'ui_atlas', 'common-ui/fx/fx_glow')
            .setScale(1.2).setAlpha(0).setDepth(18);

        const marker = this.add.image(loc.x, loc.y, 'ce_atlas', 'city-explorer/markers/market_target')
            .setScale(1.5).setTint(0x94a3b8).setDepth(20);

        const checkIcon = this.add.image(loc.x, loc.y - 15, 'ui_atlas', 'common-ui/fx/fx_check')
            .setScale(0.8).setDepth(25).setAlpha(0);

        const label = this.add.text(loc.x, loc.y + 42, loc.name.toLowerCase(), {
            fontSize: '14px', fontFamily: 'Fredoka', color: '#ffffff', backgroundColor: '#1e293b', padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0).setDepth(30);

        const debugCircle = this.add.circle(loc.x, loc.y, loc.radius || 70, 0x3b82f6, 0.03)
            .setStrokeStyle(1, 0x3b82f6, 0.1).setDepth(15);

        this.checkpoints.push({
            sprite: marker, glowSprite: glow, checkIcon: checkIcon, data: loc,
            isTarget: false, isCompleted: false, label: label, debugCircle: debugCircle
        });
    }

    private createPlayer() {
        const { width, height } = this.cameras.main;
        this.player = this.add.image(width / 2, height / 2, 'ce_atlas', 'city-explorer/player/player_topdown');
        this.player.setScale(0.85).setDepth(100);
        this.physics.add.existing(this.player);

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setCollideWorldBounds(true);
            body.setSize(40, 25);
            body.setOffset(10, 65);
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
    }

    private createHud() {
        const { width } = this.cameras.main;
        // HUD (Manual Position Sync for reliably clickable buttons in panning camera)
        this.gameHUD = new GameHUD(this, {
            showTimer: true,
            showScore: true,
            showProgress: true,
            showLives: false,
            maxLives: 0,
            totalItems: this.requiredCheckpoints,
            showHelpButton: true,
            showPauseButton: true
        });
        this.gameHUD.getContainer().setScrollFactor(0).setDepth(5000);

        this.progressText = this.add.text(width / 2, 78, `CHECKPOINTS: 0/${this.requiredCheckpoints}`, {
            fontSize: '18px',
            fontFamily: 'Fredoka',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        this.missionPanel = createPanel(this, 'common-ui/panels/panel_dark', width / 2, 115, 600, 50)
            .setScrollFactor(0).setDepth(4999).setAlpha(0.9);

        this.objectiveText = this.add.text(width / 2, 115, 'initializing...', {
            fontSize: '17px',
            fontFamily: 'Fredoka',
            color: '#fbbf24',
            align: 'center',
            wordWrap: { width: 580 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);

        this.gameHUD.onPause(() => this.togglePause());
        this.gameHUD.onHelp(() => {
            showModal(this, {
                title: 'HOW TO PLAY',
                message: this.missionInstructions,
                buttons: [{ label: 'OK', onClick: () => { }, isPrimary: true }]
            });
        });

        this.updateHud();
    }

    private startGame() {
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

        // Seleccionar primer target
        this.currentTarget = this.checkpoints[0];
        if (this.currentTarget) {
            this.currentTarget.isTarget = true;
            this.setupTargetGlow(this.currentTarget);
        }
    }

    private setupTargetGlow(cp: Checkpoint) {
        if (!cp.sprite) return;
        cp.sprite.setTint(0x3b82f6);
        this.tweens.add({
            targets: cp.sprite, scale: 1.6, duration: 800, yoyo: true, repeat: -1
        });

        const rawClue = cp.data.challenge?.prompt || `Find the ${cp.data.name}`;
        const formattedClue = rawClue.charAt(0).toUpperCase() + rawClue.slice(1).toLowerCase();
        this.objectiveText.setText(formattedClue);
    }

    update(time: number, delta: number) {
        // Position sync removed as we now use ScrollFactor(0) for UI logic

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
        if (moveX > 0) this.player.setFlipX(false);
        else if (moveX < 0) this.player.setFlipX(true);

        this.checkProximityFeedback();
        this.checkCollisions();
    }

    private checkProximityFeedback() {
        if (!this.currentTarget || this.isAnswering || this.isPaused) return;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        const dist = Phaser.Math.Distance.Between(body.center.x, body.center.y, this.currentTarget.data.x, this.currentTarget.data.y);
        const radius = this.currentTarget.data.radius || 70;

        if (dist < radius * 2 && this.currentTarget.glowSprite?.alpha === 0) {
            this.tweens.add({ targets: this.currentTarget.glowSprite, alpha: 0.6, duration: 300 });
            this.tweens.add({ targets: this.currentTarget.sprite, scale: 2.2, duration: 200, yoyo: true, ease: 'Quad.easeInOut' });
        } else if (dist >= radius * 2 && this.currentTarget.glowSprite?.alpha! > 0) {
            this.tweens.add({ targets: this.currentTarget.glowSprite, alpha: 0, duration: 300 });
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
        this.submitAnswer(cp, true);
    }

    private submitAnswer(cp: Checkpoint, isCorrect: boolean) {
        showFeedback(this, 0, 0, isCorrect, 800);
        if (isCorrect) {
            const points = CITY_EXPLORER_CONFIG.scoring.points_correct;
            this.score += points;
            this.locationsFound++;
            showGlow(this, 0, 0, 0x10b981, 600);
            this.answerTracker.recordCorrectCatch(cp.data.id, cp.data.challenge?.prompt || cp.data.name, { x: cp.data.x, y: cp.data.y }, cp.data.challenge?.ruleTag ? [cp.data.challenge.ruleTag] : []);
            this.sessionManager?.updateScore(points, true);
        } else {
            const penalty = CITY_EXPLORER_CONFIG.scoring.points_wrong;
            this.score = Math.max(0, this.score + penalty);
            this.failures++;
            this.cameras.main.shake(200, 0.005);
            this.answerTracker.recordDistractorCatch(cp.data.id, cp.data.challenge?.prompt || cp.data.name, { x: cp.data.x, y: cp.data.y }, cp.data.challenge?.ruleTag ? [cp.data.challenge.ruleTag] : []);
            this.sessionManager?.updateScore(penalty, false);
        }
        this.updateHud();
        this.time.delayedCall(800, () => this.handleChallengeComplete(cp, isCorrect));
    }

    private handleChallengeComplete(cp: Checkpoint, success: boolean) {
        this.isAnswering = false;
        cp.isCompleted = true;
        this.tweens.killTweensOf(cp.sprite);

        if (success) {
            cp.sprite.setTint(0x10b981).setScale(1.5).setAlpha(0.8);
            if (cp.checkIcon) cp.checkIcon.setTexture('ui_atlas', 'common-ui/fx/fx_check').setAlpha(1).setScale(1);
        } else {
            cp.sprite.setTint(0xef4444).setScale(1.5).setAlpha(0.8);
            if (cp.checkIcon) cp.checkIcon.setTexture('ui_atlas', 'common-ui/fx/fx_cross').setAlpha(1);
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
