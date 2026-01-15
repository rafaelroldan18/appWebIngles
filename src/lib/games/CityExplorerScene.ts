/**
 * CityExplorerScene - Interactive map exploration game
 * Rediseñado con sistema de atlas profesional (ce_atlas + ui_atlas)
 */

import * as Phaser from 'phaser';
import { CITY_EXPLORER_CONFIG } from './cityExplorer.config';
import { preloadCommonAndGame } from './assets/assetLoader';
import { ASSET_MANIFEST } from './assets/manifest';
import { GameHUD } from './GameHUD';
import { showModal, showFeedback, showGlow, createButton, createPanel, createIconButton, showFullscreenRequest } from './UIKit';
import type { GameSessionManager } from './GameSessionManager';
import { type CityExplorerLocationItem } from './gameLoader.utils';
import type { MissionConfig } from '@/types';

interface Checkpoint {
    sprite: Phaser.GameObjects.Image; // El target visual
    glowSprite?: Phaser.GameObjects.Image; // Resplandor de proximidad
    checkIcon?: Phaser.GameObjects.Image; // Icono de completado
    data: CityExplorerLocationItem;
    isTarget: boolean;
    isCompleted: boolean;
    label: Phaser.GameObjects.Text;
    debugCircle?: Phaser.GameObjects.Arc;
}

export class CityExplorerScene extends Phaser.Scene {
    private sessionManager: GameSessionManager | null = null;
    private mapData: { checkpoints: CityExplorerLocationItem[] } | null = null;
    private missionConfig: MissionConfig | undefined;
    private translations: any = null;

    // Game objects
    private player!: Phaser.GameObjects.Image;
    private checkpoints: Checkpoint[] = [];
    private currentTarget: Checkpoint | null = null;

    // Game state
    private score: number = 0;
    private timeRemaining: number = 0;
    private locationsFound: number = 0;
    private failures: number = 0;
    private totalCheckpoints: number = 0;
    private requiredCheckpoints: number = 0;
    private isAnswering: boolean = false;
    private isGameOver: boolean = false;
    private gameStartTime: number = 0;

    // Challenge UI
    private challengeContainer: Phaser.GameObjects.Container | null = null;
    private currentAttempts: number = 0;

    // UI Elements
    private gameHUD!: GameHUD;
    private objectiveText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;

    // Controls
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private gameTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'CityExplorerScene' });
    }

    private initData: any = null;

    init(data: {
        sessionManager: GameSessionManager;
        map?: any;
        missionConfig?: MissionConfig;
        translations?: any;
    }) {
        this.initData = data;
        this.translations = data.translations || null;
        this.sessionManager = data.sessionManager;
        this.mapData = data.map || { checkpoints: [] };
        this.missionConfig = data.missionConfig;

        // Config Defaults
        const ceConfig = this.missionConfig?.city_explorer;
        this.totalCheckpoints = this.mapData?.checkpoints?.length || 0;
        this.requiredCheckpoints = Math.min(
            ceConfig?.checkpoints_to_complete || 6,
            this.totalCheckpoints
        );

        this.score = 0;
        this.locationsFound = 0;
        this.failures = 0;
        this.timeRemaining = this.missionConfig?.time_limit_seconds || 300;
        this.isGameOver = false;
        this.isAnswering = false;
        this.checkpoints = [];
        this.currentTarget = null;
        this.gameStartTime = 0; // Se seteará en create o update
    }

    preload() {
        preloadCommonAndGame(this, 'city-explorer', ASSET_MANIFEST);
    }

    create() {
        try {
            const { width, height } = this.cameras.main;

            const worldWidth = 1600;
            const worldHeight = 1200;

            // 0. Configurar Límites del Mundo
            this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

            // 1. Background (Verde suave para mapa expandido)
            this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0xecfdf5);
            // Rejilla sutil en todo el mundo
            this.add.grid(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 64, 64, 0x000000, 0, 0x10b981, 0.05);

            // 2. Decoración básica
            this.createDecoration(worldWidth, worldHeight);

            // 3. Render Checkpoints
            this.createMapMarkers();

            // 4. Create Player
            this.createPlayer();
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            // 5. HUD
            this.createHud();

            // 6. Controls
            this.setupControls();

            // 7. Start Logic
            this.startGameplay();

            // 8. Pantalla Completa (Petición Inicial)
            this.isAnswering = true; // Bloquear movimiento inicialmente
            showFullscreenRequest(this, () => {
                this.isAnswering = false; // Desbloquear al cerrar
            }, {
                title: this.translations?.fullscreenTitle,
                message: this.translations?.fullscreenPrompt,
                buttonLabel: this.translations?.fullscreenStart
            });

            console.log('[CityExplorer] Scene Created. Player at:', this.player.x, this.player.y);
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('[CityExplorer] Error en Create:', error);
        }
    }

    private createDecoration(worldWidth: number, worldHeight: number) {
        // Lista de posiciones fijas más expandida para el mundo grande
        const decorations = [
            // Superior
            { x: 150, y: 180, frame: 'city-explorer/buildings/building_house' },
            { x: 300, y: 180, frame: 'city-explorer/buildings/building_shop' },
            { x: 700, y: 180, frame: 'city-explorer/buildings/building_house' },
            { x: 1100, y: 250, frame: 'city-explorer/buildings/building_house' },
            { x: 1400, y: 150, frame: 'city-explorer/buildings/building_shop' },

            // Inferior
            { x: 150, y: worldHeight - 150, frame: 'city-explorer/buildings/building_shop' },
            { x: 400, y: worldHeight - 250, frame: 'city-explorer/buildings/building_house' },
            { x: 900, y: worldHeight - 180, frame: 'city-explorer/buildings/building_shop' },
            { x: 1300, y: worldHeight - 200, frame: 'city-explorer/buildings/building_house' },

            // Zona Central/Aleatoria
            { x: 400, y: 600, frame: 'city-explorer/buildings/building_shop' },
            { x: 1000, y: 550, frame: 'city-explorer/buildings/building_house' },
            { x: 1200, y: 800, frame: 'city-explorer/buildings/building_shop' }
        ];

        decorations.forEach(config => {
            const img = this.add.image(config.x, config.y, 'ce_atlas', config.frame);
            img.setAlpha(0.5);
            img.setScale(0.9);
            img.setDepth(10);
        });
    }

    private createMapMarkers() {
        if (!this.mapData || !this.mapData.checkpoints) return;
        this.mapData.checkpoints.forEach(loc => this.createCheckpointMarker(loc));
    }

    private createCheckpointMarker(loc: CityExplorerLocationItem) {
        // 1. Resplandor (ui_atlas) - Debajo del marker
        const glow = this.add.image(loc.x, loc.y, 'ui_atlas', 'common-ui/fx/fx_glow')
            .setScale(1.2)
            .setAlpha(0)
            .setDepth(18);

        // 2. Marcador Visual (ce_atlas)
        const marker = this.add.image(loc.x, loc.y, 'ce_atlas', 'city-explorer/markers/market_target')
            .setScale(1.5)
            .setTint(0x94a3b8) // Gris por defecto
            .setDepth(20);

        // 3. Icono de Completado (ui_atlas) - Inicialmente invisible
        const checkIcon = this.add.image(loc.x, loc.y - 15, 'ui_atlas', 'common-ui/fx/fx_check')
            .setScale(0.8)
            .setDepth(25)
            .setAlpha(0);

        // 4. Banderola de Texto (Label) - Estilo refinado en minúsculas
        const label = this.add.text(loc.x, loc.y + 42, loc.name.toLowerCase(), {
            fontSize: '14px',
            fontFamily: 'Fredoka',
            color: '#ffffff',
            backgroundColor: '#1e293b',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0).setDepth(30);

        // Añadir una pequeña flecha o estilo al label si fuera necesario (opcional)
        label.setFontStyle('500');

        // 5. Debug Circle (Sutil)
        const debugCircle = this.add.circle(loc.x, loc.y, loc.radius || 70, 0x3b82f6, 0.03)
            .setStrokeStyle(1, 0x3b82f6, 0.1)
            .setDepth(15);

        this.checkpoints.push({
            sprite: marker,
            glowSprite: glow,
            checkIcon: checkIcon,
            data: loc,
            isTarget: false,
            isCompleted: false,
            label: label,
            debugCircle: debugCircle
        });
    }

    private createPlayer() {
        const { width, height } = this.cameras.main;
        const startX = width / 2;
        const startY = height / 2;

        // 1. Crear jugador con física directa (más robusto)
        this.player = this.add.image(startX, startY, 'ce_atlas', 'city-explorer/player/player_topdown');
        this.player.setScale(0.85).setDepth(100);
        this.physics.add.existing(this.player);

        // 2. Ajustar hitbox a los pies para sentir realismo Top-Down
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setCollideWorldBounds(true);
            body.setSize(40, 25);
            body.setOffset(10, 65);
            console.log('[CityExplorer] Player physics body initialized');
        } else {
            console.error('[CityExplorer] Failed to initialize player physics body');
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

        // 1. Instanciar HUD común
        this.gameHUD = new GameHUD(this, {
            showTimer: true,
            showScore: true,
            showProgress: true, // Barra de progreso visual
            showLives: true,    // Mostrar "intentos" o vidas
            maxLives: 3,
            totalItems: this.requiredCheckpoints,
            showHelpButton: true,
            showPauseButton: true
        });

        // 2. Texto de progreso X/Y (Crucial para el usuario)
        this.progressText = this.add.text(width / 2, 45, `CHECKPOINTS: 0/${this.requiredCheckpoints}`, {
            fontSize: '18px',
            fontFamily: 'Fredoka',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        this.updateHud();

        // 3. Panel de Misión (Burbuja de diálogo mejorada)
        // Posicionado más abajo para no chocar con el HUD de checkpoints
        const missionPanel = createPanel(this, 'common-ui/panels/panel_dark', width / 2, 115, 600, 50)
            .setScrollFactor(0).setDepth(4999).setAlpha(0.9);

        this.objectiveText = this.add.text(width / 2, 115, 'initializing...', {
            fontSize: '17px',
            fontFamily: 'Fredoka',
            color: '#fbbf24',
            align: 'center',
            wordWrap: { width: 580 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);

        this.updateHud();

        // Configurar botones del HUD
        this.gameHUD.onPause(() => {
            if (this.isGameOver) return;

            // Salir de pantalla completa al salir del juego
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }

            const payload = this.buildGamePayload();
            this.events.emit('exit', payload);
            this.game.events.emit('exit', payload);
        });

        this.gameHUD.onHelp(() => {
            console.log('[CityExplorer] Help button clicked');
            showModal(this, {
                title: 'HOW TO PLAY',
                message: 'Explore the city using arrows or WASD. Go to the active checkpoint (RED) to solve the challenge. Complete all locations to win!',
                buttons: [{ label: 'GOT IT!', onClick: () => { }, isPrimary: true }]
            });
        });
    }

    private updateHud() {
        this.gameHUD.update({
            score: this.score,
            timeRemaining: this.timeRemaining,
            progress: this.locationsFound,
            lives: Math.max(0, 3 - (this.failures % 3)) // Simulación de vidas
        });

        if (this.progressText) {
            this.progressText.setText(`CHECKPOINTS: ${this.locationsFound}/${this.requiredCheckpoints}`);
        }
    }

    private startGameplay() {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isGameOver || this.isAnswering) return;
                this.timeRemaining--;
                this.updateHud();
                if (this.timeRemaining <= 0) this.endGame();
            },
            loop: true
        });

        this.selectNextTarget();
    }

    private selectNextTarget() {
        if (this.currentTarget) {
            this.currentTarget.sprite.setTint(0x94a3b8);
            this.currentTarget.isTarget = false;
        }

        const available = this.checkpoints.filter(cp => !cp.isCompleted);
        if (available.length === 0) {
            this.endGame();
            return;
        }

        this.currentTarget = Phaser.Utils.Array.GetRandom(available);
        this.currentTarget.isTarget = true;

        // YA NO usamos tintes rojos. Todos los marcadores son iguales para obligar a leer etiquetas.
        this.currentTarget.sprite.setTint(0x3b82f6);

        // Animación sutil solo de escala para indicar actividad (muy leve)
        this.tweens.add({
            targets: this.currentTarget.sprite,
            scale: 1.6,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        const rawClue = this.currentTarget.data.challenge?.prompt || `Find the ${this.currentTarget.data.name}`;
        // Formatear a minúsculas/sentence case
        const formattedClue = rawClue.charAt(0).toUpperCase() + rawClue.slice(1).toLowerCase();
        this.objectiveText.setText(formattedClue);
    }

    update(time: number, delta: number) {
        // Log de estado periódico (cada 2 segundos aprox)
        if (Math.floor(time / 1000) % 2 === 0 && Math.floor((time - delta) / 1000) % 2 !== 0) {
            console.log(`[CityExplorer] State - isAnswering: ${this.isAnswering}, isGameOver: ${this.isGameOver}, inputEnabled: ${this.input.enabled}`);
        }

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        if (this.isGameOver || this.isAnswering) {
            body.setVelocity(0);
            return;
        }

        const speed = 250;
        body.setVelocity(0);

        let moveX = 0;
        let moveY = 0;

        // Controles teclado
        if (this.cursors && this.wasd) {
            const keys = {
                left: this.cursors.left.isDown || this.wasd.A.isDown,
                right: this.cursors.right.isDown || this.wasd.D.isDown,
                up: this.cursors.up.isDown || this.wasd.W.isDown,
                down: this.cursors.down.isDown || this.wasd.S.isDown
            };

            if (keys.left) moveX = -speed;
            else if (keys.right) moveX = speed;

            if (keys.up) moveY = -speed;
            else if (keys.down) moveY = speed;

            if (moveX !== 0 || moveY !== 0) {
                // Solo loggear si realmente se está intentando mover
                if (Math.random() < 0.01) console.log(`[CityExplorer] Key pressed! moveX: ${moveX}, moveY: ${moveY}`);
            }
        }

        body.setVelocity(moveX, moveY);

        // Orientación (Flip)
        if (moveX > 0) this.player.setFlipX(false);
        else if (moveX < 0) this.player.setFlipX(true);

        this.checkProximityFeedback();
        this.checkCollisions();
    }

    private checkProximityFeedback() {
        if (!this.currentTarget || this.isAnswering) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        const dist = Phaser.Math.Distance.Between(body.center.x, body.center.y, this.currentTarget.data.x, this.currentTarget.data.y);
        const radius = this.currentTarget.data.radius || 70;

        // Efecto si estamos cerca (1.5x el radio de colisión)
        const isNear = dist < radius * 2;

        if (isNear && this.currentTarget.glowSprite?.alpha === 0) {
            // Entró al rango de proximidad
            this.tweens.add({
                targets: this.currentTarget.glowSprite,
                alpha: 0.6,
                duration: 300
            });

            // Pulse effect sugerido (1 -> 1.12 -> 1)
            this.tweens.add({
                targets: this.currentTarget.sprite,
                scale: 2.2, // escala base era 1.5, 1.5 * 1.5 aprox
                duration: 200,
                yoyo: true,
                ease: 'Quad.easeInOut'
            });
        } else if (!isNear && this.currentTarget.glowSprite?.alpha! > 0) {
            // Salió del rango
            this.tweens.add({
                targets: this.currentTarget.glowSprite,
                alpha: 0,
                duration: 300
            });
        }
    }

    private checkCollisions() {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        for (const cp of this.checkpoints) {
            if (cp.isCompleted) continue;

            const dist = Phaser.Math.Distance.Between(body.center.x, body.center.y, cp.data.x, cp.data.y);
            const radius = cp.data.radius || 70;

            if (dist < radius) {
                this.handleCheckpointEnter(cp);
                break;
            }
        }
    }

    private handleCheckpointEnter(cp: Checkpoint) {
        if (this.isAnswering) return;

        // Bloqueo de seguridad spawn
        if (this.time.now < 2000) return;

        console.log('[CityExplorer] Checking location:', cp.data.name);

        // Si es el target actual: ÉXITO
        if (cp === this.currentTarget) {
            this.isAnswering = true; // Bloquear para un solo hit
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            if (body) body.setVelocity(0);
            this.submitAnswer(cp, true);
        } else {
            // Si es otro lugar: FALLO (No bloqueamos el juego, solo feedback)
            this.submitAnswer(cp, false);
        }
    }

    // Eliminamos showChallengeModal ya que no se usa en esta mecánica directa
    private submitAnswer(cp: Checkpoint, isCorrect: boolean) {
        // 1. Mostrar Feedback Visual (Check/Cross) con duración de 800ms
        showFeedback(this, 0, 0, isCorrect, 800);

        if (isCorrect) {
            this.score += 200;
            this.locationsFound++;
            showGlow(this, 0, 0, 0x10b981, 600);

            this.updateHud();

            // Esperar al feedback antes de limpiar y pasar al siguiente
            this.time.delayedCall(800, () => {
                this.handleChallengeComplete(cp, true, 200);
            });
        } else {
            // Feedback de error más ágil (no bloquea el juego)
            this.score = Math.max(0, this.score - 50);
            this.failures++;
            this.cameras.main.shake(200, 0.005);
            this.updateHud();

            // Pequeño delay de invulnerabilidad para no fallar 100 veces por frame
            this.isAnswering = true;
            this.time.delayedCall(1000, () => {
                this.isAnswering = false;
            });
        }
    }

    private handleChallengeComplete(cp: Checkpoint, success: boolean, points: number) {
        this.isAnswering = false;
        cp.isCompleted = true;

        // 1. Detener animaciones previas
        this.tweens.killTweensOf(cp.sprite);

        // 2. Estado Final Visual
        if (success) {
            cp.sprite.setTint(0x10b981).setScale(1.5).setAlpha(0.8);
            if (cp.checkIcon) {
                cp.checkIcon.setTexture('ui_atlas', 'common-ui/fx/fx_check').setAlpha(1).setScale(1);
                this.tweens.add({ targets: cp.checkIcon, scale: 1.2, duration: 300, yoyo: true });
            }
        } else {
            cp.sprite.setTint(0xef4444).setScale(1.5).setAlpha(0.8);
            if (cp.checkIcon) {
                cp.checkIcon.setTexture('ui_atlas', 'common-ui/fx/fx_cross').setAlpha(1);
            }
        }

        // Ocultar debug si existiera
        if (cp.debugCircle) cp.debugCircle.setVisible(false);

        if (this.locationsFound >= this.requiredCheckpoints || (this.locationsFound + (this.checkpoints.filter(c => !c.isCompleted).length)) < this.requiredCheckpoints) {
            this.endGame();
        } else {
            this.selectNextTarget();
        }
    }

    private buildGamePayload() {
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const accuracy = (this.locationsFound + this.failures) > 0
            ? Math.round((this.locationsFound / (this.locationsFound + this.failures)) * 100)
            : 0;

        return {
            scoreRaw: Math.max(0, this.score),
            correctCount: this.locationsFound,
            wrongCount: this.failures,
            durationSeconds: duration,
            accuracy: accuracy,
            answers: [] // Detalle simplificado
        };
    }

    private async endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isAnswering = true;
        if (this.gameTimer) this.gameTimer.remove();

        if (this.sessionManager) {
            await this.sessionManager.endSession().catch(e => console.error(e));
        }

        const payload = this.buildGamePayload();
        this.createMissionCompleteModal(payload);
    }

    private createMissionCompleteModal(payload: any) {
        const { width, height } = this.cameras.main;

        // Contenedor principal fijo en pantalla (scrollFactor 0)
        const container = this.add.container(width / 2, height / 2).setDepth(8000).setScrollFactor(0);

        // 1. Fondo Atenuado
        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setInteractive();

        // 2. Panel Principal (ui_atlas) - Reduced size
        const bgWidth = 520;
        const bgHeight = 450;
        const panel = createPanel(this, 'common-ui/panels/panel_modal', 0, 0, bgWidth, bgHeight);

        // 3. Icono de Recompensa (Trophy) - Smaller
        const trophy = this.add.image(0, -70, 'ui_atlas', 'common-ui/rewards/trophy')
            .setScale(1.4)
            .setDepth(8001);

        // Efecto de brillo detrás del trofeo - Smaller
        const glow = this.add.image(0, -70, 'ui_atlas', 'common-ui/fx/fx_glow')
            .setScale(2.0)
            .setAlpha(0.6)
            .setTint(0xffcc00);

        // 4. Título - Smaller and repositioned
        const title = this.add.text(0, -175, 'CITY EXPLORED!', {
            fontSize: '40px',
            fontFamily: 'Fredoka',
            color: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // 5. Estadísticas - Smaller and repositioned
        const statsContainer = this.add.container(0, 40);
        const stats = [
            { label: 'CHECKPOINTS', value: `${payload.correctCount}/${this.requiredCheckpoints}` },
            { label: 'ACCURACY', value: `${payload.accuracy}%` },
            { label: 'TOTAL SCORE', value: payload.scoreRaw }
        ];

        stats.forEach((item, idx) => {
            const y = idx * 40;
            const labelText = this.add.text(-100, y, item.label, {
                fontSize: '20px', fontFamily: 'Fredoka', color: '#94a3b8'
            }).setOrigin(0, 0.5);

            const valueText = this.add.text(100, y, item.value.toString(), {
                fontSize: '22px', fontFamily: 'Fredoka', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(1, 0.5);

            statsContainer.add([labelText, valueText]);
        });

        // 6. Botones (Consistentes) - Smaller
        const btnY = 165;
        const resultsBtn = createButton(this, 'common-ui/buttons/btn_secondary', -125, btnY, 'RESULTS', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }

            this.events.emit('gameOver', payload);
            this.events.emit('game-over', payload);
            this.game.events.emit('gameOver', payload);
            this.game.events.emit('game-over', payload);
            this.game.events.emit('GAME_OVER', payload);
        }, { width: 190, height: 60 });

        const replayBtn = createButton(this, 'common-ui/buttons/btn_primary', 125, btnY, 'REPEAT', () => {
            this.scene.restart(this.initData);
        }, { width: 190, height: 60 });

        container.add([dim, panel, glow, trophy, title, statsContainer, resultsBtn, replayBtn]);

        // Animación de entrada
        container.setScale(0);
        this.tweens.add({
            targets: container,
            scale: 1,
            duration: 600,
            ease: 'Back.out'
        });

        // Animación sutil del trofeo
        this.tweens.add({
            targets: trophy,
            y: -80,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
