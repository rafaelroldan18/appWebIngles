/**
 * GameHUD - HUD común y reutilizable para todos los juegos
 * Usa atlas común (ui_atlas) para mantener consistencia visual
 */

import * as Phaser from 'phaser';
import { getUIFrame } from './AtlasLoader';
import { createIconButton } from './UIKit';
import { TEXT_STYLES, GAME_COLORS_HEX, DEPTH_LAYERS } from './GameStyles';
import { createSBHUDBg, createSBIconButton } from './SentenceBuilderTheme';
import { createCEHUDBg } from './CityExplorerUI';

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

        // Detectar juegos para estilos específicos
        const isWordCatcher = this.scene.scene.key === 'WordCatcherScene';
        const isSentenceBuilder = this.scene.scene.key === 'SentenceBuilderScene';
        const isImageMatch = this.scene.scene.key === 'ImageMatchScene';

        if (isWordCatcher) {
            // HUD Estilo Premium Word Catcher - Ajustado a los bordes
            const { createWordCatcherHUDBg } = require('./WordCatcherTheme');
            const hudGraphic = createWordCatcherHUDBg(this.scene, width - 8, 64);
            this.topPanel = hudGraphic as any;
            (this.topPanel as any).setPosition(width / 2, 36);
            this.container.add(hudGraphic);
        } else if (isSentenceBuilder) {
            // HUD Estilo Premium Sentence Builder (Indigo Theme)
            const hudGraphic = createSBHUDBg(this.scene, width - 30, 64);
            this.topPanel = hudGraphic as any;
            (this.topPanel as any).setPosition(width / 2, 32);
            this.container.add(hudGraphic);
        } else if (isImageMatch) {
            // HUD Estilo Neon Pulse para Image Match - Acoplado al borde (margin 2)
            const { createIMHUDBg } = require('./ImageMatchTheme');
            const hudGraphic = createIMHUDBg(this.scene, width - 4, 60);
            this.topPanel = hudGraphic as any;
            (this.topPanel as any).setPosition(width / 2, 32);
            this.container.add(hudGraphic);
        } else if (this.scene.scene.key === 'CityExplorerScene') {
            const hudGraphic = createCEHUDBg(this.scene, width - 40, 60);
            this.topPanel = hudGraphic as any;
            (this.topPanel as any).setPosition(width / 2, 30);
            this.container.add(hudGraphic);
        } else {
            // Panel superior oscuro original
            const panelFrame = getUIFrame('common-ui/panels/panel_dark');
            this.topPanel = this.scene.add.image(width / 2, 30, panelFrame.atlas, panelFrame.frame);
            this.topPanel.setDisplaySize(width - 40, 60);
            this.topPanel.setScrollFactor(0);
            this.container.add(this.topPanel);
        }

        let xOffset = isWordCatcher ? 45 : 60; // Posición inicial desde la izquierda

        // Score (izquierda)
        if (this.config.showScore) {
            const scoreIcon = this.scene.add.image(xOffset, isSentenceBuilder ? 32 : 30, 'ui_atlas', 'common-ui/rewards/trophy');
            scoreIcon.setScale(isSentenceBuilder ? 1.1 : 1.0);
            if (isSentenceBuilder) scoreIcon.setTint(0xFBBF24); // Oro nítido
            this.container.add(scoreIcon);

            this.scoreText = this.scene.add.text(xOffset + 32, (isSentenceBuilder || isImageMatch) ? 32 : 30, '0', {
                fontSize: (isSentenceBuilder || isImageMatch) ? '32px' : '28px',
                fontFamily: 'Nunito',
                color: isWordCatcher ? '#34D399' : (isSentenceBuilder ? '#FFFFFF' : (isImageMatch ? '#2D3436' : '#FFD700')),
                stroke: '#000000',
                strokeThickness: isImageMatch ? 0 : ((isSentenceBuilder) ? 0 : 3),
                fontStyle: '900'
            });
            this.scoreText.setOrigin(0, 0.5);
            this.container.add(this.scoreText);

            xOffset += isWordCatcher ? 90 : 150;
        }

        // Timer (Centro para Word Catcher y Image Match)
        if (this.config.showTimer) {
            const timerBg = this.scene.add.graphics();
            const timerX = (isWordCatcher || isImageMatch) ? width / 2 : xOffset + 50;

            if (isSentenceBuilder) {
                timerBg.fillStyle(0xFFFFFF, 0.1);
                timerBg.fillRoundedRect(xOffset - 15, 18, 135, 30, 15);
                timerBg.lineStyle(1.5, 0xFFFFFF, 0.2).strokeRoundedRect(xOffset - 15, 18, 135, 30, 15);
            } else if (isWordCatcher) {
                timerBg.fillStyle(0x000000, 0.4);
                timerBg.fillRoundedRect(timerX - 60, 18, 120, 36, 12);
                timerBg.lineStyle(2, 0x818CF8, 0.5).strokeRoundedRect(timerX - 60, 18, 120, 36, 12);
            } else if (isImageMatch) {
                timerBg.fillStyle(0x6366F1, 0.08);
                timerBg.fillRoundedRect(timerX - 60, 15, 120, 36, 18);
                timerBg.lineStyle(2, 0x6366F1, 0.2).strokeRoundedRect(timerX - 60, 15, 120, 36, 18);
            } else {
                timerBg.fillStyle(0x000000, 0.3);
                timerBg.fillRoundedRect(xOffset - 10, 18, 120, 24, 12);
            }
            this.container.add(timerBg);

            this.timerText = this.scene.add.text(timerX, (isWordCatcher || isImageMatch) ? 36 : (isSentenceBuilder ? 32 : 30), '0:00', {
                fontSize: (isSentenceBuilder || isImageMatch || isWordCatcher) ? '26px' : '24px',
                fontFamily: 'Nunito',
                color: isImageMatch ? '#1E293B' : '#FFFFFF',
                stroke: '#000000',
                strokeThickness: isImageMatch ? 0 : (isSentenceBuilder ? 0 : 3),
                fontStyle: '900'
            });
            this.timerText.setOrigin(0.5, 0.5);
            this.container.add(this.timerText);

            xOffset += isWordCatcher ? 130 : 145;
        }

        // Lives (centro)
        if (this.config.showLives) {
            this.livesContainer = this.scene.add.container(xOffset, 30);
            this.updateLives(this.config.maxLives);
            this.container.add(this.livesContainer);
            xOffset += (this.config.maxLives * 35) + 20;
        }

        // Calcular posición de botones primero para saber cuánto espacio queda
        const buttonY = isWordCatcher ? 36 : 30;
        let rightOffset = isWordCatcher ? (width - 45) : (width - 60);

        // Pause button
        if (this.config.showPauseButton) {
            this.pauseButton = this.createIconButton(
                rightOffset,
                isSentenceBuilder ? 32 : buttonY,
                'common-ui/icons/icon_pause',
                () => this.onPauseCallback?.()
            );
            if (isSentenceBuilder) (this.pauseButton.getAt(1) as Phaser.GameObjects.Image).setTint(0xFFFFFF);
            this.container.add(this.pauseButton);
            rightOffset -= 55;
        }

        // Help button
        if (this.config.showHelpButton) {
            this.helpButton = this.createIconButton(
                rightOffset,
                isSentenceBuilder ? 32 : buttonY,
                'common-ui/icons/icon_help',
                () => this.onHelpCallback?.()
            );
            if (isSentenceBuilder) (this.helpButton.getAt(1) as Phaser.GameObjects.Image).setTint(0xFFFFFF);
            this.container.add(this.helpButton);
            rightOffset -= 55;
        }

        // Sound button
        if (this.config.showSoundButton && this.soundManager) {
            const isMuted = typeof this.soundManager.isMuted === 'function' ? this.soundManager.isMuted() : false;
            const icon = isMuted ? 'common-ui/icons/icon_sound_off' : 'common-ui/icons/icon_sound_on';

            this.soundButton = this.createIconButton(
                rightOffset,
                isSentenceBuilder ? 32 : buttonY,
                icon,
                () => this.toggleSoundSettings()
            );
            if (isSentenceBuilder) (this.soundButton.getAt(1) as Phaser.GameObjects.Image).setTint(0xFFFFFF);
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
            const barY = isSentenceBuilder ? 32 : (30 - (barHeight / 2));

            // Si aún así no cabe (pantalla muy estrecha), la ocultamos o movemos
            // Por ahora, asumimos que cabrá reducida.

            // Label 'PROGRESS'
            const progLabel = this.scene.add.text(barX + barWidth / 2, barY - 12, 'PROGRESS', {
                fontSize: '11px', fontFamily: 'Nunito', color: isSentenceBuilder ? '#FFFFFF' : '#94a3b8', fontStyle: '900'
            }).setOrigin(0.5);
            this.container.add(progLabel);

            // Background
            this.progressBarBg = this.scene.add.graphics();
            this.progressBarBg.fillStyle(0x000000, isSentenceBuilder ? 0.2 : 0.4);
            this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 7);

            // Borde sutil
            this.progressBarBg.lineStyle(2, isSentenceBuilder ? 0x6366F1 : 0x334155, 1);
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
        const isSB = this.scene.scene.key === 'SentenceBuilderScene';
        const isIM = this.scene.scene.key === 'ImageMatchScene';
        const isGrammarRun = this.scene.scene.key === 'GrammarRunScene';
        const isWordCatcher = this.scene.scene.key === 'WordCatcherScene';

        const panelW = 220;
        // Increase height for Grammar Run and Word Catcher to avoid overlap
        const panelH = isIM ? 260 : (isSB ? 210 : ((isGrammarRun || isWordCatcher) ? 250 : 180));

        // Adjust Y position offset if panel is taller
        let startY = this.soundButton.y + 130;
        if (isSB || isIM) startY = this.soundButton.y + (isIM ? 170 : 145);
        if (isGrammarRun || isWordCatcher) startY = this.soundButton.y + 165; // Adjust for taller panel

        const x = this.soundButton.x;
        const y = startY;

        this.soundSettingsOverlay = this.scene.add.container(x, y).setDepth(6000).setScrollFactor(0);

        // Detectar juegos para temas específicos
        // remains defined above

        // Fondo del panel de settings
        let bg: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

        if (isSB) {
            // Estilo Indigo Glass para Sentence Builder
            const { createSBPanel } = require('./SentenceBuilderTheme');
            bg = createSBPanel(this.scene, panelW, panelH);
            bg.setPosition(0, 0);
        } else if (isGrammarRun) {
            const { createGrammarRunPanel } = require('./GrammarRunTheme');
            bg = createGrammarRunPanel(this.scene, panelW, panelH);
            bg.setPosition(0, 0);
        } else if (isWordCatcher) {
            const { createWordCatcherPanel } = require('./WordCatcherTheme');
            bg = createWordCatcherPanel(this.scene, panelW, panelH, 0x6366F1);
            bg.setPosition(0, 0);
        } else if (isIM) {
            const { createIMPanel } = require('./ImageMatchTheme');
            bg = createIMPanel(this.scene, panelW, panelH);
            bg.setPosition(0, 0);
        } else {
            bg = this.scene.add.image(0, 0, 'ui_atlas', 'common-ui/panels/panel_card');
            bg.setDisplaySize(panelW, panelH);
        }

        this.soundSettingsOverlay.add(bg);

        // Color de texto según tema (siempre blanco puro en SB, oscuro en IM)
        const textColor = isIM ? '#1E293B' : (isSB ? '#FFFFFF' : ((isGrammarRun || isWordCatcher) ? '#ffffff' : '#1e293b'));
        const textWeight = (isSB || isIM) ? '900' : 'bold';

        // Título Music
        const musicIcon = this.scene.add.image(-65, -60, 'audio_settings_icons', 'icon_music.png').setScale(0.25).setTint(isIM ? 0x6366F1 : (isSB ? 0xFFFFFF : 0xFFFFFF));
        const musicLabel = this.scene.add.text(-45, -60, 'Music', {
            fontSize: '16px', fontFamily: 'Nunito', color: textColor, fontStyle: textWeight
        }).setOrigin(0, 0.5);
        this.soundSettingsOverlay.add([musicIcon, musicLabel]);

        // Controles Music
        this.addVolumeControls(0, -25, 'music');

        // Título Sounds (antes SFX)
        const sfxIcon = this.scene.add.image(-65, 15, 'audio_settings_icons', 'icon_sfx.png').setScale(0.4).setTint(isIM ? 0x6366F1 : (isSB ? 0xFFFFFF : 0xFFFFFF));
        const sfxLabel = this.scene.add.text(-45, 15, 'Sounds', {
            fontSize: '16px', fontFamily: 'Nunito', color: textColor, fontStyle: textWeight
        }).setOrigin(0, 0.5);
        this.soundSettingsOverlay.add([sfxIcon, sfxLabel]);

        // Controles SFX
        this.addVolumeControls(0, 50, 'sfx');

        // Botón Mute Global (Pill Button Style)
        const isMuted = this.soundManager.isMuted();
        const muteBtn = this.scene.add.container(0, (panelH / 2) - 30);

        const muteBg = this.scene.add.graphics();
        const redrawMute = (muted: boolean) => {
            muteBg.clear();
            const color = muted ? 0x10b981 : (isSB ? 0x6366F1 : 0xef4444); // Indigo si no está muteado en SB
            muteBg.fillStyle(color, 1);
            muteBg.fillRoundedRect(-70, -18, 140, 36, 18);
            muteBg.lineStyle(2, 0xffffff, isSB ? 0.3 : 0.4);
            muteBg.strokeRoundedRect(-70, -18, 140, 36, 18);
        };
        redrawMute(isMuted);

        const muteLabel = this.scene.add.text(0, 0, isMuted ? 'Unmute all' : 'Mute all', {
            fontSize: '14px', fontFamily: 'Nunito', color: '#ffffff', fontStyle: '900'
        }).setOrigin(0.5);

        muteBtn.add([muteBg, muteLabel]);
        muteBtn.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-60, -15, 120, 30),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        muteBtn.on('pointerdown', () => {
            const muted = this.soundManager.toggleMute();
            muteLabel.setText(muted ? 'Unmute all' : 'Mute all');
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
        const isSB = this.scene.scene.key === 'SentenceBuilderScene';
        const spacing = 45;

        let btnLess, btnMore;

        if (isSB) {
            const { createSBSmallButton } = require('./SentenceBuilderTheme');
            btnLess = createSBSmallButton(this.scene, x - spacing, y, '−', () => {
                if (type === 'music') {
                    this.soundManager.setMusicVolume(this.soundManager.getMusicVolume() - 0.1);
                } else {
                    this.soundManager.setSfxVolume(this.soundManager.getSfxVolume() - 0.1);
                }
                this.updateVolumeText(valText, type);
            });

            btnMore = createSBSmallButton(this.scene, x + spacing, y, '+', () => {
                if (type === 'music') {
                    this.soundManager.setMusicVolume(this.soundManager.getMusicVolume() + 0.1);
                } else {
                    this.soundManager.setSfxVolume(this.soundManager.getSfxVolume() + 0.1);
                }
                this.updateVolumeText(valText, type);
            });
        } else {
            btnLess = createIconButton(this.scene, 'common-ui/buttons/btn_small', 'icon_minus.png', x - spacing, y, () => {
                if (type === 'music') {
                    this.soundManager.setMusicVolume(this.soundManager.getMusicVolume() - 0.1);
                } else {
                    this.soundManager.setSfxVolume(this.soundManager.getSfxVolume() - 0.1);
                }
                this.updateVolumeText(valText, type);
            }, { scale: 0.22, iconAtlas: 'audio_settings_icons', iconScale: 0.25 });

            btnMore = createIconButton(this.scene, 'common-ui/buttons/btn_small', 'icon_plus.png', x + spacing, y, () => {
                if (type === 'music') {
                    this.soundManager.setMusicVolume(this.soundManager.getMusicVolume() + 0.1);
                } else {
                    this.soundManager.setSfxVolume(this.soundManager.getSfxVolume() + 0.1);
                }
                this.updateVolumeText(valText, type);
            }, { scale: 0.22, iconAtlas: 'audio_settings_icons', iconScale: 0.25 });
        }

        const isIM = this.scene.scene.key === 'ImageMatchScene';
        const valTextColor = isIM ? '#1E293B' : '#FFFFFF';

        const valText = this.scene.add.text(x, y, '', {
            fontSize: '18px', fontFamily: 'Nunito', color: valTextColor, fontStyle: '900'
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
        const isSB = this.scene.scene.key === 'SentenceBuilderScene';
        const isIM = this.scene.scene.key === 'ImageMatchScene';

        if (isSB) {
            return createSBIconButton(this.scene, x, y, iconFrame, callback);
        }

        if (isIM) {
            const { createIMIconButton } = require('./ImageMatchTheme');
            return createIMIconButton(this.scene, x, y, iconFrame, callback);
        }

        if (this.scene.scene.key === 'WordCatcherScene') {
            const { createWCIconButton, WORD_CATCHER_THEME } = require('./WordCatcherTheme');
            return createWCIconButton(this.scene, x, y, iconFrame, WORD_CATCHER_THEME.colors.secondary, callback);
        }

        // Usar el UIKit para crear el botón para otros juegos
        const container = createIconButton(
            this.scene,
            'common-ui/buttons/btn_round',
            iconFrame,
            x,
            y,
            callback,
            { scale: 0.65, iconScale: 0.8, iconOffsetY: 0 }
        );

        return container;
    }

    /**
     * Actualiza los datos del HUD
     */
    public update(data: HUDData): void {
        const { gsap } = require('gsap');
        const isImageMatch = this.scene.scene.key === 'ImageMatchScene';

        if (data.score !== undefined && this.scoreText) {
            const oldScore = parseInt(this.scoreText.text);
            this.scoreText.setText(data.score.toString());
            if (isImageMatch && data.score !== oldScore) {
                gsap.from(this.scoreText, { scale: 1.3, duration: 0.2, ease: 'back.out' });
            }
        }

        if (data.timeRemaining !== undefined && this.timerText) {
            const minutes = Math.floor(data.timeRemaining / 60);
            const seconds = data.timeRemaining % 60;
            this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

            // Solo cambiar color si no estamos en ImageMatch (donde el color es fijo y oscuro)
            if (!isImageMatch) {
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
        const isSB = this.scene.scene.key === 'SentenceBuilderScene';
        const color = percentage < 100 ? (isSB ? 0x818CF8 : 0x3b82f6) : 0x10b981;

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
    /**
     * Re-calcula la posición de todos los elementos (útil para cambios de tamaño/fullscreen)
     */
    public refreshLayout(): void {
        // Guardar valores actuales
        const currentScore = this.scoreText?.text;
        const currentTimer = this.timerText?.text;

        // Limpiar contenedor
        this.container.removeAll(true);

        // Re-crear todo
        this.createHUD();

        // Restaurar valores
        if (currentScore && this.scoreText) this.scoreText.setText(currentScore);
        if (currentTimer && this.timerText) this.timerText.setText(currentTimer);
    }
}
