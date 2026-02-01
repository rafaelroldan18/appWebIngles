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
    showSoundButton?: boolean;
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
    private soundManager?: any; // any to avoid circular dependencies or complex typing if SoundManager isn't exported as type

    // UI Elements
    private topPanel!: Phaser.GameObjects.Image;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private livesContainer!: Phaser.GameObjects.Container;
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBarBg!: Phaser.GameObjects.Graphics;
    private pauseButton!: Phaser.GameObjects.Container;
    private helpButton!: Phaser.GameObjects.Container;
    private soundButton!: Phaser.GameObjects.Container;
    private soundSettingsOverlay!: Phaser.GameObjects.Container | null;

    // Callbacks
    private onPauseCallback?: () => void;
    private onHelpCallback?: () => void;

    constructor(scene: Phaser.Scene, config: HUDConfig = {}, soundManager?: any) {
        this.scene = scene;
        this.soundManager = soundManager;
        this.config = {
            showScore: config.showScore ?? true,
            showTimer: config.showTimer ?? true,
            showLives: config.showLives ?? false,
            showProgress: config.showProgress ?? false,
            showPauseButton: config.showPauseButton ?? true,
            showHelpButton: config.showHelpButton ?? true,
            showSoundButton: config.showSoundButton ?? true,
            maxLives: config.maxLives ?? 3,
            totalItems: config.totalItems ?? 10
        };

        this.container = scene.add.container(0, 0);
        this.container.setScrollFactor(0); // Fijo en pantalla
        this.container.setDepth(5000); // Siempre encima de todo, excepto overlays de pausa
        this.soundSettingsOverlay = null;

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
                fontFamily: 'Nunito',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 2
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
                fontFamily: 'Nunito',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2
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

        // Calcular posición de botones primero para saber cuánto espacio queda
        const buttonY = 30;
        let rightOffset = width - 60;

        // Pause button
        if (this.config.showPauseButton) {
            this.pauseButton = this.createIconButton(
                rightOffset,
                buttonY,
                'common-ui/icons/icon_pause',
                () => this.onPauseCallback?.()
            );
            this.container.add(this.pauseButton);
            rightOffset -= 55;
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
            rightOffset -= 55;
        }

        // Sound button
        if (this.config.showSoundButton && this.soundManager) {
            const isMuted = typeof this.soundManager.isMuted === 'function' ? this.soundManager.isMuted() : false;
            const icon = isMuted ? 'common-ui/icons/icon_sound_off' : 'common-ui/icons/icon_sound_on';

            this.soundButton = this.createIconButton(
                rightOffset,
                buttonY,
                icon,
                () => this.toggleSoundSettings()
            );
            this.container.add(this.soundButton);
            rightOffset -= 55;
        }

        // Progress bar (A la izquierda de los botones de forma dinámica)
        if (this.config.showProgress) {
            let barWidth = 160;
            const barHeight = 14;

            // Calcular espacio disponible entre la parte izquierda (xOffset) y los botones (rightOffset)
            const availableSpace = rightOffset - xOffset - 40; // 40px de margen total

            // Si el espacio es muy pequeño, reducimos el ancho de la barra
            if (barWidth > availableSpace) {
                barWidth = Math.max(80, availableSpace); // Mínimo 80px
            }

            const barX = rightOffset - barWidth - 15;
            const barY = 30 - (barHeight / 2);

            // Si aún así no cabe (pantalla muy estrecha), la ocultamos o movemos
            // Por ahora, asumimos que cabrá reducida.

            // Label 'PROGRESS'
            const progLabel = this.scene.add.text(barX + barWidth / 2, barY - 12, 'PROGRESS', {
                fontSize: '10px', fontFamily: 'Nunito', color: '#94a3b8', fontStyle: 'bold'
            }).setOrigin(0.5);
            this.container.add(progLabel);

            // Background
            this.progressBarBg = this.scene.add.graphics();
            this.progressBarBg.fillStyle(0x000000, 0.4);
            this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 7);

            // Borde sutil
            this.progressBarBg.lineStyle(2, 0x334155, 1);
            this.progressBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 7);

            this.container.add(this.progressBarBg);

            // Progress fill
            this.progressBar = this.scene.add.graphics();
            this.container.add(this.progressBar);

            // Guardar coordenadas calculadas para el update
            (this as any)._barX = barX;
            (this as any)._barY = barY;
            (this as any)._barWidth = barWidth;
            (this as any)._barHeight = barHeight;
        }
    }

    private toggleSoundSettings(): void {
        if (this.soundSettingsOverlay) {
            this.soundSettingsOverlay.destroy();
            this.soundSettingsOverlay = null;
            return;
        }

        const { width } = this.scene.cameras.main;
        const panelW = 220;
        const panelH = 180;
        const x = this.soundButton.x;
        const y = this.soundButton.y + 130;

        this.soundSettingsOverlay = this.scene.add.container(x, y).setDepth(6000).setScrollFactor(0);

        // Fondo del panel de settings
        const bg = this.scene.add.image(0, 0, 'ui_atlas', 'common-ui/panels/panel_card');
        bg.setDisplaySize(panelW, panelH);
        this.soundSettingsOverlay.add(bg);

        // Título Music
        const musicIcon = this.scene.add.image(-65, -60, 'audio_settings_icons', 'icon_music.png').setScale(0.25);
        const musicLabel = this.scene.add.text(-45, -60, 'MUSIC', {
            fontSize: '16px', fontFamily: 'Nunito', color: '#1e293b', fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        this.soundSettingsOverlay.add([musicIcon, musicLabel]);

        // Controles Music
        this.addVolumeControls(0, -25, 'music');

        // Título Sounds (antes SFX)
        const sfxIcon = this.scene.add.image(-65, 15, 'audio_settings_icons', 'icon_sfx.png').setScale(0.4);
        const sfxLabel = this.scene.add.text(-45, 15, 'SOUNDS', {
            fontSize: '16px', fontFamily: 'Nunito', color: '#1e293b', fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        this.soundSettingsOverlay.add([sfxIcon, sfxLabel]);

        // Controles SFX
        this.addVolumeControls(0, 50, 'sfx');

        // Botón Mute Global (Pill Button Style)
        const isMuted = this.soundManager.isMuted();
        const muteBtn = this.scene.add.container(0, 82);

        const muteBg = this.scene.add.graphics();
        const redrawMute = (muted: boolean) => {
            muteBg.clear();
            const color = muted ? 0x10b981 : 0xef4444; // Verde si está silenciado (para activar), Rojo si no
            muteBg.fillStyle(color, 1);
            muteBg.fillRoundedRect(-60, -15, 120, 30, 15);
            muteBg.lineStyle(1, 0xffffff, 0.4);
            muteBg.strokeRoundedRect(-60, -15, 120, 30, 15);
        };
        redrawMute(isMuted);

        const muteLabel = this.scene.add.text(0, 0, isMuted ? 'UNMUTE ALL' : 'MUTE ALL', {
            fontSize: '12px', fontFamily: 'Nunito', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        muteBtn.add([muteBg, muteLabel]);
        muteBtn.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-60, -15, 120, 30),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        muteBtn.on('pointerdown', () => {
            const muted = this.soundManager.toggleMute();
            muteLabel.setText(muted ? 'UNMUTE ALL' : 'MUTE ALL');
            redrawMute(muted);
            this.updateSoundIcon();

            this.scene.tweens.add({
                targets: muteBtn, scale: 0.95, duration: 80, yoyo: true
            });
        });

        muteBtn.on('pointerover', () => muteBtn.setAlpha(0.9));
        muteBtn.on('pointerout', () => muteBtn.setAlpha(1));

        this.soundSettingsOverlay.add(muteBtn);

        // Cerrar al hacer clic fuera
        const dim = this.scene.add.rectangle(0, 0, width * 2, this.scene.cameras.main.height * 2, 0x000000, 0).setOrigin(0.5).setInteractive();
        this.soundSettingsOverlay.addAt(dim, 0);
        dim.on('pointerdown', () => this.toggleSoundSettings());
    }

    private addVolumeControls(x: number, y: number, type: 'music' | 'sfx'): void {
        const spacing = 45;

        const btnLess = createIconButton(this.scene, 'common-ui/buttons/btn_small', 'icon_minus.png', x - spacing, y, () => {
            if (type === 'music') {
                this.soundManager.setMusicVolume(this.soundManager.getMusicVolume() - 0.1);
            } else {
                this.soundManager.setSfxVolume(this.soundManager.getSfxVolume() - 0.1);
            }
            this.updateVolumeText(valText, type);
        }, { scale: 0.22, iconAtlas: 'audio_settings_icons', iconScale: 0.25 });

        const btnMore = createIconButton(this.scene, 'common-ui/buttons/btn_small', 'icon_plus.png', x + spacing, y, () => {
            if (type === 'music') {
                this.soundManager.setMusicVolume(this.soundManager.getMusicVolume() + 0.1);
            } else {
                this.soundManager.setSfxVolume(this.soundManager.getSfxVolume() + 0.1);
            }
            this.updateVolumeText(valText, type);
        }, { scale: 0.22, iconAtlas: 'audio_settings_icons', iconScale: 0.25 });

        const valText = this.scene.add.text(x, y, '', {
            fontSize: '16px', fontFamily: 'Nunito', color: '#475569', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.updateVolumeText(valText, type);
        this.soundSettingsOverlay!.add([btnLess, btnMore, valText]);
    }

    private updateVolumeText(textObj: Phaser.GameObjects.Text, type: 'music' | 'sfx'): void {
        const vol = type === 'music' ? this.soundManager.getMusicVolume() : this.soundManager.getSfxVolume();
        textObj.setText(`${Math.round(vol * 100)}%`);
    }

    private updateSoundIcon(): void {
        const isMuted = this.soundManager.isMuted();
        const iconName = isMuted ? 'common-ui/icons/icon_sound_off' : 'common-ui/icons/icon_sound_on';
        const sprite = this.soundButton.getAt(1) as Phaser.GameObjects.Image;
        if (sprite && sprite.setTexture) {
            sprite.setFrame(iconName);
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

            this.timerText.setColor('#FFFFFF');
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
        const barX = (this as any)._barX;
        const barY = (this as any)._barY;
        const barWidth = (this as any)._barWidth;
        const barHeight = (this as any)._barHeight;

        if (barX === undefined) return;

        // Calcular porcentaje
        const percentage = this.config.totalItems > 0
            ? Math.min(100, (progress / this.config.totalItems) * 100)
            : progress;

        // Dibujar barra de progreso
        this.progressBar.clear();

        // Color basado en progreso (Naranja -> Verde)
        const color = percentage < 100 ? 0x3b82f6 : 0x10b981; // Azul mientas progresa, Verde al final

        this.progressBar.fillStyle(color, 1);
        this.progressBar.fillRoundedRect(
            barX + 2,
            barY + 2,
            Math.max(4, (barWidth - 4) * (percentage / 100)),
            barHeight - 4,
            5
        );

        // Brillo sutil en el borde del progreso
        if (percentage > 0) {
            this.progressBar.lineStyle(1, 0xffffff, 0.3);
            this.progressBar.strokeRoundedRect(
                barX + 2,
                barY + 2,
                Math.max(4, (barWidth - 4) * (percentage / 100)),
                barHeight - 4,
                5
            );
        }
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
