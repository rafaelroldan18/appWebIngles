/**
 * GameHUD - HUD común y reutilizable para todos los juegos
 * Usa atlas común (ui_atlas) para mantener consistencia visual
 */

import * as Phaser from 'phaser';
import { getUIFrame } from './AtlasLoader';
import { createIconButton } from './UIKit';
import { TEXT_STYLES, GAME_COLORS_HEX, DEPTH_LAYERS } from './GameStyles';

export interface HUDConfig {
    showScore?: boolean;
    showTimer?: boolean;
    showLives?: boolean;
    showProgress?: boolean;
    showPauseButton?: boolean;
    showHelpButton?: boolean;
    maxLives?: number;
    totalItems?: number; // Para la barra de progreso
}

export interface HUDData {
    score?: number;
    timeRemaining?: number;
    lives?: number;
    progress?: number; // 0-100 o número de items completados
}

export class GameHUD {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private config: Required<HUDConfig>;

    // UI Elements
    private topPanel!: Phaser.GameObjects.Image;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private livesContainer!: Phaser.GameObjects.Container;
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBarBg!: Phaser.GameObjects.Graphics;
    private pauseButton!: Phaser.GameObjects.Container;
    private helpButton!: Phaser.GameObjects.Container;

    // Callbacks
    private onPauseCallback?: () => void;
    private onHelpCallback?: () => void;

    constructor(scene: Phaser.Scene, config: HUDConfig = {}) {
        this.scene = scene;
        this.config = {
            showScore: config.showScore ?? true,
            showTimer: config.showTimer ?? true,
            showLives: config.showLives ?? false,
            showProgress: config.showProgress ?? false,
            showPauseButton: config.showPauseButton ?? true,
            showHelpButton: config.showHelpButton ?? true,
            maxLives: config.maxLives ?? 3,
            totalItems: config.totalItems ?? 10
        };

        this.container = scene.add.container(0, 0);
        this.container.setScrollFactor(0); // Fijo en pantalla
        this.container.setDepth(5000); // Siempre encima de todo, excepto overlays de pausa

        this.createHUD();
    }

    private createHUD(): void {
        const { width } = this.scene.cameras.main;

        // Panel superior oscuro (usando panel_dark del atlas)
        const panelFrame = getUIFrame('common-ui/panels/panel_dark');
        this.topPanel = this.scene.add.image(width / 2, 30, panelFrame.atlas, panelFrame.frame);
        this.topPanel.setDisplaySize(width - 40, 60);  // Reducido de 80 a 60
        this.topPanel.setScrollFactor(0);
        this.container.add(this.topPanel);

        let xOffset = 60; // Posición inicial desde la izquierda

        // Score (izquierda)
        if (this.config.showScore) {
            const scoreIcon = this.scene.add.image(xOffset, 30, 'ui_atlas', 'common-ui/rewards/trophy');
            scoreIcon.setScale(1.0);  // Reducido de 1.2 a 1.0
            this.container.add(scoreIcon);

            this.scoreText = this.scene.add.text(xOffset + 30, 30, '0', {
                fontSize: '28px',
                fontFamily: 'Fredoka',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 4
            });
            this.scoreText.setOrigin(0, 0.5);
            this.container.add(this.scoreText);

            xOffset += 150;
        }

        // Timer (centro-izquierda)
        if (this.config.showTimer) {
            const timerBg = this.scene.add.graphics();
            timerBg.fillStyle(0x000000, 0.3);
            timerBg.fillRoundedRect(xOffset - 10, 18, 120, 24, 12);  // Ajustado para HUD más pequeño
            this.container.add(timerBg);

            this.timerText = this.scene.add.text(xOffset + 50, 30, '0:00', {
                fontSize: '24px',
                fontFamily: 'Fredoka',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3
            });
            this.timerText.setOrigin(0.5, 0.5);
            this.container.add(this.timerText);

            xOffset += 140;
        }

        // Lives (centro)
        if (this.config.showLives) {
            this.livesContainer = this.scene.add.container(xOffset, 30);
            this.updateLives(this.config.maxLives);
            this.container.add(this.livesContainer);
            xOffset += (this.config.maxLives * 35) + 20;
        }

        // Progress bar (centro-derecha)
        if (this.config.showProgress) {
            const barWidth = 200;
            const barHeight = 20;
            const barX = width / 2 - barWidth / 2;
            const barY = 30;

            // Background
            this.progressBarBg = this.scene.add.graphics();
            this.progressBarBg.fillStyle(0x000000, 0.5);
            this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 10);
            this.container.add(this.progressBarBg);

            // Progress fill
            this.progressBar = this.scene.add.graphics();
            this.container.add(this.progressBar);
        }

        // Botones de acción (derecha)
        // Botones de acción (derecha)
        // Botones de acción (derecha)
        const buttonY = 30;
        let rightOffset = width - 60; // Simétrico con el lado izquierdo (xOffset comienza en 60)

        // Pause button
        if (this.config.showPauseButton) {
            this.pauseButton = this.createIconButton(
                rightOffset,
                buttonY,
                'common-ui/icons/icon_pause',
                () => this.onPauseCallback?.()
            );
            this.container.add(this.pauseButton);
            rightOffset -= 55; // Espaciado ajustado para botones de escala 0.65
        }

        // Help button
        if (this.config.showHelpButton) {
            this.helpButton = this.createIconButton(
                rightOffset,
                buttonY,
                'common-ui/icons/icon_help',
                () => this.onHelpCallback?.()
            );
            this.container.add(this.helpButton);
        }
    }

    private createIconButton(
        x: number,
        y: number,
        iconFrame: string,
        callback: () => void
    ): Phaser.GameObjects.Container {
        // Usar el UIKit para crear el botón, más pequeño para encajar en barra 60px
        return createIconButton(
            this.scene,
            'common-ui/buttons/btn_round',
            iconFrame,
            x,
            y,
            callback,
            { scale: 0.65, iconScale: 0.8, iconOffsetY: 0 }
        );
    }

    /**
     * Actualiza los datos del HUD
     */
    public update(data: HUDData): void {
        if (data.score !== undefined && this.scoreText) {
            this.scoreText.setText(data.score.toString());
        }

        if (data.timeRemaining !== undefined && this.timerText) {
            const minutes = Math.floor(data.timeRemaining / 60);
            const seconds = data.timeRemaining % 60;
            this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

            // Cambiar color si queda poco tiempo
            if (data.timeRemaining <= 10) {
                this.timerText.setColor('#FF0000');
            } else if (data.timeRemaining <= 30) {
                this.timerText.setColor('#FFA500');
            } else {
                this.timerText.setColor('#FFFFFF');
            }
        }

        if (data.lives !== undefined && this.livesContainer) {
            this.updateLives(data.lives);
        }

        if (data.progress !== undefined && this.progressBar) {
            this.updateProgress(data.progress);
        }
    }

    private updateLives(lives: number): void {
        this.livesContainer.removeAll(true);

        for (let i = 0; i < this.config.maxLives; i++) {
            const frameName = i < lives ? 'common-ui/rewards/star_full' : 'common-ui/rewards/star_empty';
            const heart = this.scene.add.image(i * 35, 0, 'ui_atlas', frameName);
            heart.setScale(0.6);
            this.livesContainer.add(heart);
        }
    }

    private updateProgress(progress: number): void {
        const { width } = this.scene.cameras.main;
        const barWidth = 200;
        const barHeight = 20;
        const barX = width / 2 - barWidth / 2;
        const barY = 30;

        // Calcular porcentaje
        const percentage = this.config.totalItems > 0
            ? Math.min(100, (progress / this.config.totalItems) * 100)
            : progress;

        // Dibujar barra de progreso
        this.progressBar.clear();
        this.progressBar.fillStyle(0x4CAF50, 1);
        this.progressBar.fillRoundedRect(
            barX + 2,
            barY + 2,
            (barWidth - 4) * (percentage / 100),
            barHeight - 4,
            8
        );
    }

    /**
     * Registra callback para el botón de pausa
     */
    public onPause(callback: () => void): void {
        this.onPauseCallback = callback;
    }

    /**
     * Registra callback para el botón de ayuda
     */
    public onHelp(callback: () => void): void {
        this.onHelpCallback = callback;
    }

    /**
     * Muestra u oculta el HUD
     */
    public setVisible(visible: boolean): void {
        this.container.setVisible(visible);
    }

    /**
     * Destruye el HUD
     */
    public destroy(): void {
        this.container.destroy();
    }

    /**
     * Obtiene el contenedor principal
     */
    public getContainer(): Phaser.GameObjects.Container {
        return this.container;
    }
}
