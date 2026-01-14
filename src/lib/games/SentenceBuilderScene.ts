/**
 * SentenceBuilderScene - Click-to-build game for building sentences
 * Rediseñado con sistema de atlas profesional
 */

import * as Phaser from 'phaser';
import { SENTENCE_BUILDER_CONFIG } from './sentenceBuilder.config';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { createButton, createPanel, showFeedback, showModal, showToast } from './UIKit';
import type { GameContent, MissionConfig } from '@/types';
import { loadSentenceBuilderContent, type SentenceBuilderItem, type SentenceBuilderToken } from './gameLoader.utils';
import type { GameSessionManager } from './GameSessionManager';

interface WordCard {
    sprite: Phaser.GameObjects.Image; // Ahora usa sprites del atlas
    text: Phaser.GameObjects.Text;
    word: string;
    container: Phaser.GameObjects.Container; // Para agrupar sprite + text
}

export class SentenceBuilderScene extends Phaser.Scene {
    private gameContent: SentenceBuilderItem[] = [];
    private currentItem: SentenceBuilderItem | null = null;
    private sessionManager: GameSessionManager | null = null;

    // Game state
    private currentSentenceIndex: number = 0;
    private score: number = 0;
    private timeRemaining: number = 0;
    private missionTitle: string = '';
    private missionInstructions: string = '';
    private missionConfig: MissionConfig | null = null;
    private isPaused: boolean = false;
    private currentItemAttempts: number = 0;
    private maxItemAttempts: number = 2; // Default
    private hintsUsed: number = 0;
    private itemStartTime: number = 0;

    // Logic Arrays
    private builtTokens: WordCard[] = [];
    private bankTokens: WordCard[] = [];

    // UI Elements
    private gameHUD!: GameHUD;
    private progressText!: Phaser.GameObjects.Text;
    private instructionText!: Phaser.GameObjects.Text;

    // Layout Zones (para posicionamiento)
    private zoneB!: { x: number; y: number; width: number; height: number }; // Sentence Line
    private zoneC!: { x: number; y: number; width: number; height: number }; // Word Bank
    private sentenceLinePanel!: Phaser.GameObjects.Image;
    private pauseOverlay: Phaser.GameObjects.Container | null = null;

    // Sentence Slots (sistema de slots del atlas)
    private sentenceSlots: Array<{ sprite: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text; index: number }> = [];

    // Buttons (ahora son contenedores del UIKit)
    private checkButton!: Phaser.GameObjects.Container;
    private undoButton!: Phaser.GameObjects.Container;
    private clearButton!: Phaser.GameObjects.Container;
    private nextButton!: Phaser.GameObjects.Container;
    private hintButton!: Phaser.GameObjects.Container;

    // Timers
    private gameTimer!: Phaser.Time.TimerEvent;

    private isGameOver: boolean = false;

    constructor() {
        super({ key: 'SentenceBuilderScene' });
    }

    private initData: any = null;

    init(data: {
        words: GameContent[];
        sessionManager: GameSessionManager;
        missionTitle?: string;
        missionInstructions?: string;
        missionConfig?: MissionConfig;
    }) {
        this.initData = data;

        // Load and Prepare Content
        this.missionConfig = data.missionConfig || null;
        let items = loadSentenceBuilderContent(data.words || []);

        // 1. Randomize Items (if enabled)
        if (this.missionConfig?.sentence_builder?.randomize_items !== false) {
            items = Phaser.Utils.Array.Shuffle(items);
        }

        // 2. Apply Items Limit
        const limit = this.missionConfig?.sentence_builder?.items_limit;
        if (limit && limit > 0) {
            items = items.slice(0, limit);
        }

        this.gameContent = items;
        this.sessionManager = data.sessionManager || null;
        this.missionTitle = data.missionTitle || '';
        this.missionInstructions = data.missionInstructions || '';

        this.currentSentenceIndex = 0;
        this.score = 0;
        const limitConfig = this.missionConfig?.time_limit_seconds;
        this.timeRemaining = limitConfig !== undefined ? limitConfig : 120;

        this.maxItemAttempts = (this.missionConfig as any)?.attempts_per_item || 2;

        this.isGameOver = false;
        this.isPaused = false;
        this.builtTokens = [];
        this.bankTokens = [];
        this.currentItem = null;
    }

    preload() {
        // Cargar atlas común (UI) + atlas específico de Sentence Builder
        loadGameAtlases(this, 'sb');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.cameras.main.setBackgroundColor('#f8fafc'); // Slate-50 equivalent

        // HUD (común)
        this.createHUD();

        // Layout de 3 Zonas
        this.createGameLayout();

        // Control Buttons
        this.createControls();

        // Start Game
        if (this.gameContent.length === 0) {
            this.add.text(width / 2, height / 2, 'No sentences found for this topic.', {
                fontSize: '24px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            return;
        }

        this.startCountdown();

        this.events.emit('scene-ready');
    }

    /**
     * Define el layout visual de 3 zonas:
     * ZONA A (arriba): Prompt Panel
     * ZONA B (centro): Sentence Line (área de construcción)
     * ZONA C (abajo): Word Bank (palabras disponibles)
     */
    private createGameLayout() {
        const { width, height } = this.cameras.main;

        // Definir alturas de zonas
        const hudHeight = 80; // Espacio del HUD
        const controlsHeight = 100; // Espacio de botones
        const availableHeight = height - hudHeight - controlsHeight;

        const zoneAHeight = availableHeight * 0.15; // 15% - Prompt
        const zoneBHeight = availableHeight * 0.35; // 35% - Sentence Line
        const zoneCHeight = availableHeight * 0.50; // 50% - Word Bank

        const zoneAY = hudHeight + zoneAHeight / 2;
        const zoneBY = hudHeight + zoneAHeight + zoneBHeight / 2;
        const zoneCY = hudHeight + zoneAHeight + zoneBHeight + zoneCHeight / 2;

        // ========== ZONA A: PROMPT PANEL ==========
        const promptPanelWidth = width * 0.85;
        const promptPanelHeight = Math.min(zoneAHeight * 0.8, 80);

        // Panel del atlas (imagen)
        const promptPanel = this.add.image(width / 2, zoneAY, 'ui_atlas', 'common-ui/panels/panel_card');
        promptPanel.setDisplaySize(promptPanelWidth, promptPanelHeight);
        promptPanel.setDepth(10);

        // Texto con Fredoka encima del panel
        this.instructionText = this.add.text(width / 2, zoneAY, 'Construct the sentence...', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial Black, sans-serif',
            color: '#1e293b',
            align: 'center',
            wordWrap: { width: promptPanelWidth - 60 }
        }).setOrigin(0.5).setDepth(11);

        // ========== ZONA B: SENTENCE LINE ==========
        // Panel sutil para el área de construcción
        const sentenceLineWidth = width * 0.9;
        const sentenceLineHeight = zoneBHeight * 0.9;

        const sentenceLinePanel = createPanel(
            this,
            'common-ui/panels/panel_card',
            width / 2,
            zoneBY,
            sentenceLineWidth,
            sentenceLineHeight
        );
        sentenceLinePanel.setDepth(5).setAlpha(0.3);
        this.sentenceLinePanel = sentenceLinePanel;

        // Label para la zona
        this.add.text(width / 2, zoneBY - sentenceLineHeight / 2 + 20, 'BUILD YOUR SENTENCE', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#64748b',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        // ========== ZONA C: WORD BANK ==========
        // Panel para el banco de palabras
        const wordBankWidth = width * 0.9;
        const wordBankHeight = zoneCHeight * 0.85;

        const wordBankPanel = createPanel(
            this,
            'common-ui/panels/panel_dark',
            width / 2,
            zoneCY,
            wordBankWidth,
            wordBankHeight
        );
        wordBankPanel.setDepth(5).setAlpha(0.5);

        // Label para la zona
        this.add.text(width / 2, zoneCY - wordBankHeight / 2 + 20, 'WORD BANK', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#94a3b8',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        // Guardar referencias de las zonas para uso posterior
        this.zoneB = { x: width / 2, y: zoneBY, width: sentenceLineWidth, height: sentenceLineHeight };
        this.zoneC = { x: width / 2, y: zoneCY, width: wordBankWidth, height: wordBankHeight };
    }

    private createHUD() {
        // HUD (standardized)
        this.gameHUD = new GameHUD(this, {
            showScore: true,
            showTimer: true,
            showProgress: true,
            totalItems: this.gameContent.length,
            showPauseButton: true,
            showHelpButton: true
        });

        // Configurar callbacks
        this.gameHUD.onPause(() => {
            console.log('HUD Pause Clicked Callback Executing');
            this.togglePause();
        });
        this.gameHUD.onHelp(() => this.showHelpPanel());

        // Prompt / Instruction Area (específico del juego)
        const { width } = this.cameras.main;
        this.instructionText = this.add.text(width / 2, 140, 'Construct the sentence...', {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: '#1e293b',
            align: 'center',
            wordWrap: { width: width - 100 }
        }).setOrigin(0.5).setDepth(50);
    }

    private createControls() {
        const { width, height } = this.cameras.main;
        const y = height - 70; // Más espacio desde el borde
        const buttonScale = 1.3;

        // Calcular posiciones según botones disponibles
        const hasUndo = this.missionConfig?.ui?.allow_undo !== false;
        const hasClear = this.missionConfig?.ui?.allow_clear !== false;
        const hasHint = this.missionConfig?.ui?.show_hint_button || (this.missionConfig?.sentence_builder as any)?.show_hint_button;

        // Layout: [Undo] [Clear] .......... [Hint?] [SUBMIT]
        const spacing = 120;
        let leftX = 100; // Inicio desde la izquierda

        // ========== BOTONES SECUNDARIOS (Izquierda) ==========

        // UNDO
        if (hasUndo) {
            this.undoButton = createButton(
                this,
                'common-ui/buttons/btn_secondary',
                leftX,
                y,
                'UNDO',
                () => this.handleUndo(),
                { width: 140, height: 60, fontSize: '20px', textOffsetY: -4 }
            );
            leftX += spacing + 30;
        }

        // CLEAR
        if (hasClear) {
            this.clearButton = createButton(
                this,
                'common-ui/buttons/btn_secondary',
                leftX,
                y,
                'CLEAR',
                () => this.handleClear(),
                { width: 140, height: 60, fontSize: '20px', textOffsetY: -4 }
            );
        }

        // ========== BOTONES PRINCIPALES (Derecha) ==========

        let rightX = width - 110;

        // SUBMIT (siempre el más visible - btn_primary)
        this.checkButton = createButton(
            this,
            'common-ui/buttons/btn_primary',
            rightX,
            y,
            'SUBMIT',
            () => this.checkAnswer(),
            { width: 180, height: 75, fontSize: '24px', fontColor: '#ffffff', textOffsetY: -4 }
        );

        // HINT (opcional - btn_small, a la izquierda del submit)
        if (hasHint) {
            rightX -= (spacing + 60);
            this.hintButton = createButton(
                this,
                'common-ui/buttons/btn_small',
                rightX,
                y,
                'HINT',
                () => this.handleHint(),
                { width: 120, height: 50, fontSize: '18px', textOffsetY: -2 }
            );
        }

        // NEXT Button (Hidden)
        this.createNextButton();
    }

    private createNextButton() {
        const { width, height } = this.cameras.main;
        // Posicionado en el mismo lugar que el SUBMIT para un flujo natural
        this.nextButton = createButton(
            this,
            'common-ui/buttons/btn_primary',
            width - 110,
            height - 70,
            'NEXT ITEM ->',
            () => this.loadNextSentence(),
            { width: 220, height: 80, fontSize: '24px', textOffsetY: -4 }
        );
        this.nextButton.setVisible(false).setDepth(2000);
    }

    private startCountdown() {
        // Simple start (enhance later if needed), just start logic
        this.startGameTimer();
        this.loadNextSentence();
    }

    private startGameTimer() {
        // 0 means practice mode (infinite)
        if (this.timeRemaining <= 0) {
            this.gameHUD.update({ timeRemaining: 999 }); // Visual representative of ∞
            return;
        }

        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeRemaining--;
                this.gameHUD.update({ timeRemaining: this.timeRemaining });
                if (this.timeRemaining <= 0) this.endGame();
            },
            loop: true
        });
    }

    private loadNextSentence() {
        if (this.isGameOver) return;

        // 1. Check end condition
        if (this.currentSentenceIndex >= this.gameContent.length) {
            this.endGame();
            return;
        }

        // 2. Setup Item
        this.currentItem = this.gameContent[this.currentSentenceIndex];
        this.currentItemAttempts = this.maxItemAttempts;
        this.hintsUsed = 0;
        this.itemStartTime = Date.now();

        // Update HUD
        this.gameHUD.update({
            progress: this.currentSentenceIndex + 1,
            score: this.score
        });

        // 3. Update Prompt (with slight fade in for polish)
        if (this.currentItem.prompt) {
            this.instructionText.setAlpha(0);
            this.instructionText.setText(this.currentItem.prompt);
            this.tweens.add({
                targets: this.instructionText,
                alpha: 1,
                duration: 300
            });
        }

        // 4. Create Word Cards (This cleans Slots, Bank and Sets tiles to tile_word)
        this.createWordCards();

        // 5. Reset Controls UI
        this.nextButton.setVisible(false);
        if (this.undoButton) {
            this.undoButton.setAlpha(1);
            this.undoButton.setVisible(true);
        }
        if (this.clearButton) {
            this.clearButton.setAlpha(1);
            this.clearButton.setVisible(true);
        }
        this.checkButton.setVisible(true);

        // Advance index for next time
        this.currentSentenceIndex++;
    }

    private createWordCards() {
        // Clear existing
        this.builtTokens.forEach(c => c.container.destroy());
        this.bankTokens.forEach(c => c.container.destroy());
        this.builtTokens = [];
        this.bankTokens = [];

        // Limpiar slots anteriores
        this.sentenceSlots.forEach(slot => {
            slot.sprite.destroy();
            slot.text.destroy();
        });
        this.sentenceSlots = [];

        if (!this.currentItem) return;

        // Get tokens and shuffle logic
        const tokens = [...this.currentItem.tokens];
        // Shuffle for bank presentation
        Phaser.Utils.Array.Shuffle(tokens);



        tokens.forEach((token, idx) => {
            const container = this.add.container(0, 0);

            // Tile del atlas (base visual)
            const sprite = this.add.image(0, 0, 'sb_atlas', 'sentence-builder/tiles/tile_word');

            // Texto con Fredoka encima del tile
            const txt = this.add.text(0, 0, token.text, {
                fontSize: '20px',
                color: '#0f172a',
                fontStyle: 'bold',
                fontFamily: 'Fredoka, Arial Black, sans-serif'
            }).setOrigin(0.5);

            // Tamaño del tile (adaptado al texto)
            const padding = 40;
            const w = Math.max(120, txt.width + padding);
            sprite.setDisplaySize(w, 60);

            container.add([sprite, txt]);

            const card: WordCard = {
                sprite: sprite,
                text: txt,
                word: token.text,
                container: container
            };

            // Interacción profesional
            sprite.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.handleCardClick(card))
                .on('pointerover', () => {
                    // Solo hover si el tile está disponible (visible en el banco)
                    if (this.bankTokens.includes(card)) {
                        sprite.setFrame('sentence-builder/tiles/tile_word_active');
                        container.setScale(1.05);
                    }
                })
                .on('pointerout', () => {
                    // Restaurar solo si está en el banco
                    if (this.bankTokens.includes(card)) {
                        sprite.setFrame('sentence-builder/tiles/tile_word');
                        container.setScale(1);
                    }
                });

            this.bankTokens.push(card);
        });

        this.updateLayouts();
    }

    private handleCardClick(card: WordCard) {
        if (this.nextButton.visible) return; // Locked

        // If in bank -> move to build (click-to-add)
        const bankIdx = this.bankTokens.indexOf(card);
        if (bankIdx !== -1) {
            // Feedback visual: tile se activa momentáneamente
            card.sprite.setFrame('sentence-builder/tiles/tile_word_active');

            // Micro-animación de "pop"
            this.tweens.add({
                targets: card.container,
                scale: 1.15,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    // Mover a construcción
                    this.bankTokens.splice(bankIdx, 1);
                    this.builtTokens.push(card);
                    this.updateLayouts();
                }
            });
            return;
        }

        // If in build -> move back to bank (click-to-remove from slot)
        const buildIdx = this.builtTokens.indexOf(card);
        if (buildIdx !== -1) {
            // Remover de construcción y devolver al banco
            this.builtTokens.splice(buildIdx, 1);
            this.bankTokens.push(card);

            // Restaurar frame normal
            card.sprite.setFrame('sentence-builder/tiles/tile_word');
            card.container.setScale(1);

            this.updateLayouts();
            return;
        }
    }

    private handleUndo() {
        if (this.nextButton.visible) return;
        if (this.builtTokens.length > 0) {
            const card = this.builtTokens.pop();
            if (card) {
                this.bankTokens.push(card);
                this.updateLayouts();
            }
        }
    }

    private handleClear() {
        if (this.nextButton.visible) return;
        if (this.builtTokens.length > 0) {
            // Move all back to bank
            this.bankTokens.push(...this.builtTokens);
            this.builtTokens = [];
            this.updateLayouts();
        }
    }

    private updateLayouts() {
        // Usar las zonas definidas en createGameLayout
        const spacing = 12;

        // ========== ZONA B: SENTENCE LINE (Built Tokens con SLOTS) ==========
        const sentenceAreaWidth = this.zoneB.width - 60;
        const sentenceStartY = this.zoneB.y - this.zoneB.height / 2 + 60;

        // Calcular cuántos slots necesitamos (basado en la oración objetivo)
        const targetTokenCount = this.currentItem?.targetTokens?.length || this.builtTokens.length || 5;
        const slotWidth = 140;
        const slotHeight = 60;

        // Crear/actualizar slots
        const slotsPerLine = Math.floor(sentenceAreaWidth / (slotWidth + spacing));
        const totalLines = Math.ceil(targetTokenCount / slotsPerLine);

        // Limpiar slots anteriores si existen
        if (!this.sentenceSlots) {
            this.sentenceSlots = [];
        }

        // Crear slots si no existen o si cambió el número
        while (this.sentenceSlots.length < targetTokenCount) {
            const slotIndex = this.sentenceSlots.length;
            const lineIndex = Math.floor(slotIndex / slotsPerLine);
            const posInLine = slotIndex % slotsPerLine;

            const lineWidth = Math.min(targetTokenCount - (lineIndex * slotsPerLine), slotsPerLine) * (slotWidth + spacing) - spacing;
            const lineStartX = this.zoneB.x - lineWidth / 2;
            const slotX = lineStartX + posInLine * (slotWidth + spacing) + slotWidth / 2;
            const slotY = sentenceStartY + lineIndex * (slotHeight + 20);

            // Slot del atlas (inicialmente vacío)
            const slotSprite = this.add.image(slotX, slotY, 'sb_atlas', 'sentence-builder/slots/slot_empty');
            slotSprite.setDisplaySize(slotWidth, slotHeight);
            slotSprite.setDepth(20);

            // Texto encima del slot (inicialmente vacío)
            const slotText = this.add.text(slotX, slotY, '', {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial Black, sans-serif',
                color: '#1e293b',
                align: 'center',
                wordWrap: { width: slotWidth - 20 }
            }).setOrigin(0.5).setDepth(21);

            this.sentenceSlots.push({ sprite: slotSprite, text: slotText, index: slotIndex });
        }

        // Eliminar slots sobrantes
        while (this.sentenceSlots.length > targetTokenCount) {
            const slot = this.sentenceSlots.pop();
            if (slot) {
                slot.sprite.destroy();
                slot.text.destroy();
            }
        }

        // Actualizar slots con las palabras construidas
        this.sentenceSlots.forEach((slot, index) => {
            if (index < this.builtTokens.length) {
                // Slot lleno
                const card = this.builtTokens[index];
                slot.sprite.setFrame('sentence-builder/slots/slot_filled');
                slot.text.setText(card.word);

                // Ocultar el container de la card (ya que ahora se muestra en el slot)
                card.container.setVisible(false);
            } else {
                // Slot vacío
                slot.sprite.setFrame('sentence-builder/slots/slot_empty');
                slot.text.setText('');
            }
        });

        // ========== ZONA C: WORD BANK (Bank Tokens) ==========
        const bankAreaWidth = this.zoneC.width - 60;
        const bankAreaHeight = this.zoneC.height - 100;
        const bankStartY = this.zoneC.y - this.zoneC.height / 2 + 60;

        // Cálculo de escala responsiva
        let bankScale = 1.0;
        let bankSpacing = 15;
        let rowHeight = 80;

        // Si hay muchas palabras, reducir escala preventivamente
        if (this.bankTokens.length > 12) {
            bankScale = 0.85;
            bankSpacing = 10;
            rowHeight = 65;
        } else if (this.bankTokens.length > 20) {
            bankScale = 0.7;
            bankSpacing = 8;
            rowHeight = 55;
        }

        let bX = this.zoneC.x - bankAreaWidth / 2;
        let bY = bankStartY;

        this.bankTokens.forEach((card, i) => {
            card.container.setScale(bankScale);
            const w = card.sprite.displayWidth;

            if (bX + w > this.zoneC.x + bankAreaWidth / 2) {
                bX = this.zoneC.x - bankAreaWidth / 2;
                bY += rowHeight; // New row with adjusted height
            }

            // Si aún así nos salimos de la zona, una reducción extra de emergencia
            if (bY > this.zoneC.y + this.zoneC.height / 2 - 40) {
                // Esto es un caso extremo, aplicamos un factor de escala global adicional
                this.bankTokens.forEach(c => c.container.setScale(bankScale * 0.8));
                // Recalculamos posición (simplificado: reiniciamos y aplicamos menos espacio)
            }

            card.container.x = bX + w / 2;
            card.container.y = bY;
            card.container.setVisible(true); // Visible en el banco
            card.sprite.clearTint();

            bX += w + bankSpacing;
        });
    }

    private handleHint() {
        if (!this.currentItem || this.nextButton.visible) return;

        const maxHints = (this.missionConfig?.sentence_builder as any)?.max_hints_per_item || 3;

        if (this.hintsUsed >= maxHints) {
            showToast(this, 'Max hints used!', 1000, false);
            return;
        }

        const targetTokens = this.currentItem.targetTokens || [];

        // Find the first index where the built sentence diverges from the target
        let mismatchIndex = 0;
        while (
            mismatchIndex < this.builtTokens.length &&
            mismatchIndex < targetTokens.length &&
            this.builtTokens[mismatchIndex].word === targetTokens[mismatchIndex]
        ) {
            mismatchIndex++;
        }

        // If the sentence is fully correct so far (or empty), hint the next word
        // If there is a mismatch at mismatchIndex, hint the CORRECT word for that slot

        if (mismatchIndex < targetTokens.length) {
            const nextNeededWord = targetTokens[mismatchIndex];

            // Deduct Score and Increment Hint Count
            const cost = this.missionConfig?.sentence_builder?.hint_cost || 10;
            this.score = Math.max(0, this.score - cost);
            this.gameHUD.update({ score: this.score });
            if (this.sessionManager) this.sessionManager.updateScore(-cost, false);
            this.hintsUsed++;

            // Strategy: Find the needed card.
            // 1. Look in the Bank (most likely)
            let targetCard = this.bankTokens.find(c => c.word === nextNeededWord);

            // 2. If not in Bank, it might be misplaced in the Built area (after the mismatch index)
            if (!targetCard) {
                targetCard = this.builtTokens.find((c, idx) => c.word === nextNeededWord && idx > mismatchIndex);
            }

            // 3. Last resort: It might be the actual card at the mismatch index (if duplicates exist and we picked the wrong one?)
            // Or if the logic above failed, just find ANY card with that word.
            if (!targetCard) {
                targetCard = this.builtTokens.find(c => c.word === nextNeededWord);
            }

            if (targetCard) {
                // Visual Feedback: Pulse the card
                this.tweens.add({
                    targets: targetCard.sprite,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true,
                    repeat: 2,
                    onStart: () => targetCard!.sprite.setTint(0xf59e0b),
                    onComplete: () => targetCard!.sprite.clearTint()
                });

                // Text Feedback
                showToast(this, `Hint: Find "${nextNeededWord}"`, 2000, true);
            } else {
                // Should not happen if data is consistent
                console.warn('Hint System: Could not find card for word:', nextNeededWord);
            }

            // Managed by showToast duration
        } else if (this.builtTokens.length > targetTokens.length) {
            // Case: User built "The cat is black extra"
            // Mismatch index will be at 'extra'.
            // Hint should be: "Remove extra words"
            showToast(this, 'Hint: Too many words!', 2000, false);
        }
    }

    private checkAnswer() {
        if (!this.currentItem) return;

        const builtSentence = this.builtTokens.map(c => c.word).join(' ');
        const target = this.currentItem.targetSentence;

        // Check exact match (or variants if implemented)
        const isCorrect = builtSentence.trim() === target.trim();

        if (isCorrect) {
            this.handleSuccess();
        } else {
            this.handleFailure(builtSentence);
        }
    }

    private handleSuccess() {
        const { width, height } = this.cameras.main;
        const attemptsUsed = (this.maxItemAttempts - this.currentItemAttempts) + 1;
        const timeSpent = Date.now() - this.itemStartTime;

        showFeedback(this, width / 2, height / 2, true, 600);
        showToast(this, 'CORRECT!', 1000, true);
        this.score += 100; // Config score
        this.gameHUD.update({ score: this.score });

        // Record Item (Standardized)
        if (this.sessionManager) {
            this.sessionManager.updateScore(100, true);
            this.sessionManager.recordItem({
                id: this.currentItem!.id,
                text: this.currentItem!.prompt || 'Construct sentence',
                result: 'correct',
                user_input: this.builtTokens.map(t => t.word).join(' '),
                correct_answer: this.currentItem!.targetSentence,
                time_ms: timeSpent,
                meta: {
                    attempts: attemptsUsed,
                    hints_used: this.hintsUsed,
                    feedback: 'Correct!',
                    tags: this.currentItem!.tags,
                    rule_tag: this.currentItem!.tags?.[0] || 'general'
                }
            });
        }

        this.checkButton.setVisible(false);
        this.nextButton.setVisible(true);

        // Optional: play sound
    }

    private handleFailure(userInput: string) {
        this.currentItemAttempts--;
        const attemptsUsed = (this.maxItemAttempts - this.currentItemAttempts); // if start 2, current 1, used 1.
        const timeSpent = Date.now() - this.itemStartTime;

        const { width, height } = this.cameras.main;
        showFeedback(this, width / 2, height / 2, false, 600);
        showToast(this, this.currentItemAttempts > 0 ? 'Try Again' : 'Incorrect', 1000, false);

        // Record Attempt (if configured to record every attempt, usually strictly only final or every? User said 'Cada Submit crea un registro')
        // So we record WRONG attempts too.
        if (this.sessionManager) {
            this.sessionManager.recordItem({
                id: this.currentItem!.id,
                text: this.currentItem!.prompt || 'Construct sentence',
                result: 'wrong', // It's an attempt
                user_input: userInput,
                correct_answer: this.currentItem!.targetSentence,
                time_ms: timeSpent,
                meta: {
                    attempts: attemptsUsed,
                    hints_used: this.hintsUsed,
                    feedback: this.currentItemAttempts > 0 ? 'Try Again' : this.currentItem!.explanation || 'Incorrect',
                    tags: this.currentItem!.tags,
                    rule_tag: this.currentItem!.tags?.[0] || 'general'
                }
            });
            // Update score for penalty? User said "si no quieres castigar, pon points_wrong: 0". 
            // We usually don't deduct for intermediate wrongs unless configured.
        }

        this.cameras.main.shake(100, 0.005);

        // Premium Panel Shake
        this.tweens.add({
            targets: this.sentenceLinePanel,
            x: this.sentenceLinePanel.x + 5,
            duration: 50,
            yoyo: true,
            repeat: 3
        });

        if (this.currentItemAttempts <= 0) {
            // Show correct answer if configured
            const showCorrect = this.missionConfig?.ui?.show_correct_on_fail || (this.missionConfig?.sentence_builder as any)?.show_correct_on_fail;

            if (showCorrect) {
                showToast(this, `Answer: ${this.currentItem!.targetSentence}`, 3000, false);
            }

            // We should record fail
            this.sessionManager?.updateScore(0, false);
            this.checkButton.setVisible(false); // Can't submit again
            this.nextButton.setVisible(true); // Must move on
        }
    }

    private async endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Stop timers
        if (this.gameTimer) this.gameTimer.remove();

        // Submit Session Data
        if (this.sessionManager) {
            try {
                await this.sessionManager.endSession();
            } catch (error) {
                console.error('Session save failed (proceeding to results):', error);
            }
        }

        // Clear logic
        this.builtTokens.forEach(c => c.container.destroy());
        this.bankTokens.forEach(c => c.container.destroy());

        // Stats
        const sessionData = this.sessionManager?.getSessionData();
        const duration = this.sessionManager?.getDuration() || 0;

        const correct = sessionData?.correctCount || 0;
        const totalAttempts = (sessionData?.correctCount || 0) + (sessionData?.wrongCount || 0);

        const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;

        // Speed Builder Bonus: 100% accuracy and at least 3 sentences
        const speedBonus = accuracy === 100 && correct >= 3;

        // Payload
        const gameOverPayload = {
            scoreRaw: this.score + (speedBonus ? 500 : 0),
            correctCount: correct,
            wrongCount: sessionData?.wrongCount || 0,
            durationSeconds: duration,
            answers: sessionData?.items.map(item => ({
                item_id: item.id,
                prompt: item.text,
                student_answer: item.user_input || '',
                correct_answer: item.correct_answer || '',
                is_correct: item.result === 'correct',
                meta: { time_ms: item.time_ms, rule_tag: item.meta?.rule_tag }
            })) || []
        };

        const totalItemsInGame = this.gameContent.length;

        this.createMissionCompleteModal({
            sentences: correct,
            totalSentences: totalItemsInGame,
            accuracy: accuracy,
            speedBonus: speedBonus,
            eventData: gameOverPayload
        });
    }

    private createMissionCompleteModal(stats: any) {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setDepth(6000).setInteractive().setScrollFactor(0);

        const container = this.add.container(width / 2, height / 2).setDepth(6001).setScrollFactor(0);

        const bgWidth = 700;
        const bgHeight = 500;
        const bg = this.add.image(0, 0, 'ui_atlas', 'common-ui/panels/panel_modal');
        bg.setDisplaySize(bgWidth, bgHeight);

        // TITLE
        const title = this.add.text(0, -bgHeight / 2 + 60, 'MISSION COMPLETE', {
            fontSize: '52px', fontFamily: 'Arial Black', color: '#fbbf24', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        // MAIN STATS (Centered)
        const sText = this.add.text(0, -50, `Sentences: ${stats.sentences}/${stats.totalSentences}`, {
            fontSize: '36px', fontFamily: 'Arial Black', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        const aText = this.add.text(0, 30, `Accuracy: ${stats.accuracy}%`, {
            fontSize: '36px', fontFamily: 'Arial Black', color: '#fbbf24', align: 'center'
        }).setOrigin(0.5);

        // BUTTONS
        const btnY = bgHeight / 2 - 80;

        // EXIT (Left)
        const exitBtn = createButton(this, 'common-ui/buttons/btn_primary', -120, btnY, 'EXIT', () => {
            console.log('EXIT BUTTON CLICKED');
            this.game.events.emit('GAME_EXIT', stats.eventData);
            this.game.events.emit('GAME_OVER', stats.eventData);
        }, { width: 180, height: 70, fontSize: '24px', textOffsetY: -4 });

        // REPLAY (Right)
        const replayBtn = createButton(this, 'common-ui/buttons/btn_secondary', 120, btnY, 'REPLAY', () => {
            this.scene.restart();
        }, { width: 180, height: 70, fontSize: '24px', textOffsetY: -4 });

        container.add([bg, title, sText, aText, exitBtn, replayBtn]);

        container.setScale(0);
        this.tweens.add({ targets: container, scale: 1, duration: 500, ease: 'Back.out' });
    }

    private togglePause() {
        if (this.isGameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            console.log('DEBUG: PAUSING');
            this.physics.pause();
            if (this.gameTimer) this.gameTimer.paused = true;
            this.tweens.pauseAll();

            // Create Pause UI
            const { width, height } = this.cameras.main;
            this.pauseOverlay = this.add.container(0, 0).setDepth(40000).setScrollFactor(0);

            const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();
            const panel = createPanel(this, 'common-ui/panels/panel_modal', width / 2, height / 2, 600, 480);

            const pTitle = this.add.text(width / 2, height / 2 - 120, 'GAME PAUSED', {
                fontSize: '54px',
                fontFamily: 'Arial Black',
                color: '#fbbf24',
                stroke: '#000000',
                strokeThickness: 10
            }).setOrigin(0.5).setScrollFactor(0);

            const rBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 100, 'RESUME GAME', () => {
                this.togglePause();
            }, { width: 280, height: 80, fontSize: '28px', textOffsetY: -5 });

            this.pauseOverlay.add([backdrop, panel, pTitle, rBtn]);


            // Force visibility immediately - no tween for debug reliability
            this.pauseOverlay.setAlpha(1);
            // this.tweens.add({ targets: this.pauseOverlay, alpha: 1, duration: 200 });
        } else {
            this.physics.resume();
            if (this.gameTimer) this.gameTimer.paused = false;
            this.tweens.resumeAll();

            if (this.pauseOverlay) {
                this.pauseOverlay.destroy();
                this.pauseOverlay = null;
            }
        }
    }

    private showHelpPanel() {
        if (this.isGameOver) return;

        // Manually pause game logic WITHOUT triggering the "Pause Menu"
        const wasPreviouslyPaused = this.isPaused;
        if (!wasPreviouslyPaused) {
            this.isPaused = true;
            this.physics.pause();
            if (this.gameTimer) this.gameTimer.paused = true;
            this.tweens.pauseAll();
        }

        const { width, height } = this.cameras.main;
        const helpOverlay = this.add.container(0, 0).setDepth(45000).setScrollFactor(0);

        const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();
        const panel = createPanel(this, 'common-ui/panels/panel_modal', width / 2, height / 2, 600, 480);

        const title = this.add.text(width / 2, height / 2 - 180, 'INSTRUCTIONS', {
            fontSize: '44px',
            fontFamily: 'Arial Black',
            color: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        const instructions = this.add.text(width / 2, height / 2 - 20, this.missionInstructions || 'Build the correct sentence by selecting the words in order.', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 520 }
        }).setOrigin(0.5);

        const closeBtn = createButton(this, 'common-ui/buttons/btn_primary', width / 2, height / 2 + 160, 'CLOSE', () => {
            helpOverlay.destroy();
            // Resume only if it wasn't paused before
            if (!wasPreviouslyPaused) {
                this.isPaused = false;
                this.physics.resume();
                if (this.gameTimer) this.gameTimer.paused = false;
                this.tweens.resumeAll();
            }
        }, { width: 220, height: 75, fontSize: '26px', textOffsetY: -5 });

        helpOverlay.add([dim, panel, title, instructions, closeBtn]);
    }

    update(time: number, delta: number) {
        // Logica de update si es necesaria
    }
}
