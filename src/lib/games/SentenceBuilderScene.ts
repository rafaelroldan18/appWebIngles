/**
 * SentenceBuilderScene - Click-to-build game
 * Rediseño "PREMIUM & POLISHED" V9: HINT moved to Left + Text Fix
 */

import * as Phaser from 'phaser';
import { gsap } from 'gsap';
import { loadGameAtlases } from './AtlasLoader';
import { GameHUD } from './GameHUD';
import { createButton, showToast, showGameInstructions } from './UIKit';
import { loadGameAudio } from './AudioLoader';
import { SoundManager } from './SoundManager';
import { loadSentenceBuilderContent, type SentenceBuilderItem } from './gameLoader.utils';
import type { GameSessionManager } from './GameSessionManager';
import { createSBButton } from './SentenceBuilderTheme';

interface WordCard {
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    word: string;
    container: Phaser.GameObjects.Container;
}

export class SentenceBuilderScene extends Phaser.Scene {
    private gameContent: SentenceBuilderItem[] = [];
    private currentItem: SentenceBuilderItem | null = null;
    private sessionManager: GameSessionManager | null = null;
    private currentSentenceIndex: number = 0;
    private score: number = 0;
    private timeElapsed: number = 0;
    private missionInstructions: string = '';
    private isPaused: boolean = false;
    private builtTokens: WordCard[] = [];
    private bankTokens: WordCard[] = [];
    private gameHUD!: GameHUD;
    private instructionText!: Phaser.GameObjects.Text;
    private bgShapes: Phaser.GameObjects.Graphics[] = [];
    private zoneB!: { x: number; y: number; width: number; height: number };
    private zoneC!: { x: number; y: number; width: number; height: number };
    private sentenceSlots: Array<{ graphics: Phaser.GameObjects.Graphics; x: number; y: number }> = [];
    private pauseOverlay: Phaser.GameObjects.Container | null = null;
    private checkButton!: Phaser.GameObjects.Container;
    private undoButton!: Phaser.GameObjects.Container;
    private clearButton!: Phaser.GameObjects.Container;
    private nextButton!: Phaser.GameObjects.Container;
    private hintButton!: Phaser.GameObjects.Container;
    private gameTimer!: Phaser.Time.TimerEvent;
    private soundManager!: SoundManager;

    private hintsRemaining: number = 3;
    private hintText!: Phaser.GameObjects.Text;

    constructor() { super({ key: 'SentenceBuilderScene' }); }

    init(data: any) {
        let items = loadSentenceBuilderContent(data.words || []);
        this.gameContent = Phaser.Utils.Array.Shuffle(items);
        this.sessionManager = data.sessionManager || null;
        this.missionInstructions = data.missionInstructions || '';
        this.currentSentenceIndex = 0;
        this.score = 0;
    }

    preload() { loadGameAtlases(this, 'sb'); loadGameAudio(this, 'sb'); }

    create() {
        const { width, height } = this.cameras.main;
        this.soundManager = new SoundManager(this);
        this.createGenerativeBackground();
        this.createHUD();
        this.createGameLayout();
        this.createControls();

        this.isPaused = true;
        showGameInstructions(this, {
            title: 'Sentence Builder',
            instructions: this.missionInstructions || 'Arrange words to build the sentence!',
            controls: 'Click words to move them.',
            buttonLabel: '➔ START',
            requestFullscreen: true,
            onStart: () => {
                this.isPaused = false;
                this.startGameTimer();
                this.soundManager.playMusic('bg_music', 0.4);
                this.loadNextSentence();
            }
        });
    }

    private createGenerativeBackground() {
        const { width, height } = this.cameras.main;
        this.add.graphics().fillGradientStyle(0xEEF2FF, 0xEEF2FF, 0xE0E7FF, 0xC7D2FE, 1).fillRect(0, 0, width, height).setDepth(-100);
        const colors = [0x6366F1, 0x818CF8, 0x4F46E5];
        for (let i = 0; i < 15; i++) {
            const shape = this.add.graphics().fillStyle(colors[i % 3], 0.08);
            const size = Phaser.Math.Between(40, 120);
            if (i % 2 === 0) shape.fillCircle(0, 0, size); else shape.fillRoundedRect(-size / 2, -size / 2, size, size, 20);
            shape.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height)).setDepth(-95);
            this.bgShapes.push(shape);
            gsap.to(shape, { x: `+=${Phaser.Math.Between(-100, 100)}`, y: `+=${Phaser.Math.Between(-100, 100)}`, rotation: Phaser.Math.FloatBetween(-3, 3), duration: Phaser.Math.Between(15, 25), repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
    }

    private createGameLayout() {
        const { width, height } = this.cameras.main;
        const availH = height - 190;
        const zyA = 85 + (availH * 0.12) / 2;
        const zyB = 85 + (availH * 0.12) + (availH * 0.48) / 2;
        const zyC = 85 + (availH * 0.60) + (availH * 0.40) / 2;
        this.instructionText = this.add.text(width / 2, zyA, '', { fontSize: '26px', fontFamily: 'Nunito', color: '#1E293B', fontStyle: '800' }).setOrigin(0.5).setDepth(10);
        this.zoneB = { x: width / 2, y: zyB, width: width * 0.94, height: availH * 0.48 };
        this.zoneC = { x: width / 2, y: zyC, width: width * 0.94, height: availH * 0.40 };
        this.add.graphics().fillStyle(0xFFFFFF, 0.5).fillRoundedRect(width / 2 - this.zoneB.width / 2, zyB - this.zoneB.height / 2, this.zoneB.width, this.zoneB.height, 25).setDepth(1);
        this.add.graphics().fillStyle(0x1E293B, 0.05).fillRoundedRect(width / 2 - this.zoneC.width / 2, zyC - this.zoneC.height / 2, this.zoneC.width, this.zoneC.height, 25).setDepth(1);
    }

    private createHUD() {
        this.gameHUD = new GameHUD(this, { showScore: true, showTimer: true, showProgress: true, totalItems: this.gameContent.length, showPauseButton: true, showHelpButton: true }, this.soundManager);
        this.gameHUD.onPause(() => this.togglePause());
        this.gameHUD.onHelp(() => this.showHelpPanel());
    }

    private createControls() {
        const { width, height } = this.cameras.main;
        const y = height - 55;

        // GRUPO IZQUIERDA (Gestión + Ayuda) - ESTILO INDIGO GLASS
        this.undoButton = createSBButton(this, 90, y, 120, 48, '↶ UNDO', () => this.handleUndo(), false);
        this.clearButton = createSBButton(this, 225, y, 125, 48, '🗑 CLEAR', () => this.handleClear(), false);

        // HINT ubicado al lado de CLEAR - ESTILO INDIGO GLASS
        this.hintButton = createSBButton(this, 380, y, 155, 48, '💡 HINT (3)', () => this.handleHint(), false);
        this.hintText = this.hintButton.getAt(1) as Phaser.GameObjects.Text;

        // GRUPO DERECHA (Acción) - ESTILO INDIGO GLASS
        this.checkButton = createSBButton(this, width - 105, y, 175, 68, '✔ SUBMIT', () => this.checkAnswer(), true);
        this.nextButton = createSBButton(this, width - 295, y, 195, 68, '➔ CONTINUE', () => this.loadNextSentence(), true).setVisible(false);
    }

    private startGameTimer() { this.gameTimer = this.time.addEvent({ delay: 1000, callback: () => { this.timeElapsed++; this.gameHUD.update({ timeRemaining: this.timeElapsed }); }, loop: true }); }

    private loadNextSentence() {
        if (this.currentSentenceIndex >= this.gameContent.length) { this.endGame(); return; }
        this.currentItem = this.gameContent[this.currentSentenceIndex];
        this.gameHUD.update({ progress: this.currentSentenceIndex + 1, score: this.score });

        this.hintsRemaining = 3;
        if (this.hintText) this.hintText.setText(`💡 HINT (3)`).setAlpha(1);
        if (this.hintButton) this.hintButton.setAlpha(1);

        const { height, width } = this.cameras.main;
        const targetY = 85 + (height - 190) * 0.12 / 2;
        gsap.fromTo(this.instructionText, { y: targetY - 20, alpha: 0 }, { y: targetY, alpha: 1, duration: 0.6, ease: 'back.out', onStart: () => { if (this.currentItem) this.instructionText.setText(this.currentItem.prompt || ''); } });

        this.createWordCards();
        this.nextButton.setVisible(false);
        this.checkButton.setVisible(true).setX(width - 105);
        this.currentSentenceIndex++;
    }

    private createWordCards() {
        this.bankTokens.forEach(c => c.container.destroy());
        this.builtTokens.forEach(c => c.container.destroy());
        this.bankTokens = [];
        this.builtTokens = [];
        this.sentenceSlots.forEach(s => { s.graphics.destroy(); });
        this.sentenceSlots = [];
        if (!this.currentItem) return;
        const tokens = [...this.currentItem.tokens];
        Phaser.Utils.Array.Shuffle(tokens);
        tokens.forEach((token, i) => {
            const tempTxt = this.add.text(0, 0, token.text, { fontSize: '18px', fontFamily: 'Nunito', fontStyle: '800' });
            const w = Math.max(90, tempTxt.width + 40);
            const h = 48;
            tempTxt.destroy();
            const container = this.add.container(0, 0).setDepth(600);
            const graphics = this.add.graphics();
            this.drawCard(graphics, w, h, 0xFFFFFF, 0x6366F1);
            const txt = this.add.text(0, 0, token.text, { fontSize: '18px', fontFamily: 'Nunito', color: '#0F172A', fontStyle: '800' }).setOrigin(0.5);
            container.add([graphics, txt]).setSize(w, h);
            container.setInteractive({ useHandCursor: true });
            container.on('pointerdown', () => { this.soundManager.playSfx('pick_word'); gsap.to(container, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => this.handleCardClick(card) }); });
            container.on('pointerover', () => { gsap.to(container, { scale: 1.1, duration: 0.2, ease: 'back.out' }); this.drawCard(graphics, w, h, 0xEEF2FF, 0x4F46E5, 4); }).on('pointerout', () => { gsap.to(container, { scale: 1, duration: 0.2, ease: 'power2.out' }); this.drawCard(graphics, w, h, 0xFFFFFF, 0x6366F1, 2); });
            gsap.from(container, { scale: 0, rotation: -0.5, duration: 0.6, delay: i * 0.08, ease: 'back.out(1.7)' });
            const card: WordCard = { graphics, text: txt, word: token.text, container };
            this.bankTokens.push(card);
        });
        this.updateLayouts(true);
    }

    private drawCard(g: Phaser.GameObjects.Graphics, w: number, h: number, fill: number, line: number, lw: number = 2) {
        g.clear().fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 10).lineStyle(lw, line, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    }

    private handleCardClick(card: WordCard) {
        if (this.nextButton.visible && (this.nextButton.getAt(1) as Phaser.GameObjects.Text).text === '➔ CONTINUE') return;
        const bIdx = this.bankTokens.indexOf(card);
        if (bIdx !== -1) { this.bankTokens.splice(bIdx, 1); this.builtTokens.push(card); }
        else { const buIdx = this.builtTokens.indexOf(card); if (buIdx !== -1) { this.builtTokens.splice(buIdx, 1); this.bankTokens.push(card); } }
        this.updateLayouts();
    }

    private handleUndo() { if (this.builtTokens.length > 0) this.handleCardClick(this.builtTokens[this.builtTokens.length - 1]); }
    private handleClear() { while (this.builtTokens.length > 0) this.handleCardClick(this.builtTokens[this.builtTokens.length - 1]); }

    private updateLayouts(isFirstLoad = false) {
        const spacing = 15;
        const targetCount = Math.max(this.currentItem?.tokens?.length || 0, this.currentItem?.targetTokens?.length || 0);
        let sW = 120, sH = 54;
        const sAreaW = this.zoneB.width - 60;
        const cols = Math.floor(sAreaW / (sW + spacing));
        const sStartY = this.zoneB.y - this.zoneB.height / 2 + 80;
        if (this.sentenceSlots.length === 0) {
            for (let i = 0; i < targetCount; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const rowCount = Math.min(targetCount - row * cols, cols);
                const rowW = rowCount * (sW + spacing) - spacing;
                const sX = (this.zoneB.x - rowW / 2) + col * (sW + spacing) + sW / 2;
                const sY = sStartY + row * (sH + 15) + sH / 2;
                const g = this.add.graphics().setDepth(10).lineStyle(2, 0x6366F1, 0.1).strokeRoundedRect(-sW / 2, -sH / 2, sW, sH, 10);
                g.setPosition(sX, sY);
                this.sentenceSlots.push({ graphics: g, x: sX, y: sY });
            }
        }
        this.builtTokens.forEach((card, i) => { const slot = this.sentenceSlots[i]; if (slot) gsap.to(card.container, { x: slot.x, y: slot.y, rotation: 0, duration: 0.4, ease: 'back.out(1.2)' }); });
        let bX = this.zoneC.x - (this.zoneC.width - 80) / 2;
        let bY = this.zoneC.y - (this.zoneC.height - 100) / 2 + 45;
        this.bankTokens.forEach(card => {
            const w = card.container.width;
            if (bX + w > this.zoneC.x + (this.zoneC.width - 80) / 2) { bX = this.zoneC.x - (this.zoneC.width - 80) / 2; bY += 70; }
            gsap.to(card.container, { x: bX + w / 2, y: bY, duration: 0.4, ease: 'back.out(1.2)' });
            bX += w + 15;
        });
    }

    private checkAnswer() {
        const isCorrect = this.builtTokens.map(c => c.word).join(' ') === (this.currentItem?.targetTokens?.join(' ') || '');
        const { width } = this.cameras.main;
        if (isCorrect) {
            this.soundManager.playSfx('correct');
            this.createExplosion(this.builtTokens[this.builtTokens.length - 1].container.x, this.builtTokens[this.builtTokens.length - 1].container.y);
            showToast(this, '✓ EXCELLENT! ORDER COMPLETE', 1500, true);
            this.checkButton.setVisible(false);
            this.nextButton.setVisible(true).setX(width - 105);
            (this.nextButton.getAt(1) as Phaser.GameObjects.Text).setText('➔ CONTINUE');
        } else {
            this.soundManager.playSfx('wrong');
            this.cameras.main.shake(150, 0.006);
            showToast(this, '✗ INCORRECT! Try again!', 1500, false);
            this.checkButton.setVisible(true).setX(width - 105);
            this.nextButton.setVisible(true).setX(width - 295);
            (this.nextButton.getAt(1) as Phaser.GameObjects.Text).setText('➔ SKIP');
        }
    }

    private createExplosion(x: number, y: number) {
        for (let i = 0; i < 20; i++) {
            const star = this.add.star(x, y, 5, 5, 12, 0x6366F1).setDepth(1000);
            gsap.to(star, { x: x + Phaser.Math.Between(-200, 200), y: y + Phaser.Math.Between(-200, 200), alpha: 0, scale: 0, rotation: 6.28, duration: 1, ease: 'power2.out', onComplete: () => star.destroy() });
        }
    }

    private handleHint() {
        if (this.hintsRemaining <= 0) {
            showToast(this, 'NO MORE HINTS!', 1000, false);
            gsap.to(this.hintButton, { x: '+=10', yoyo: true, repeat: 5, duration: 0.05 });
            return;
        }
        const t = this.currentItem?.targetTokens || [];
        for (let i = 0; i < t.length; i++) {
            if (!this.builtTokens[i] || this.builtTokens[i].word !== t[i]) {
                const card = this.bankTokens.find(c => c.word === t[i]) || this.builtTokens.find((c, idx) => c.word === t[i] && idx > i);
                if (card) {
                    this.hintsRemaining--;
                    this.hintText.setText(`💡 HINT (${this.hintsRemaining})`);
                    if (this.hintsRemaining === 0) { this.hintText.setAlpha(0.5); this.hintButton.setAlpha(0.6); }
                    gsap.to(card.container, { scale: 1.3, duration: 0.2, yoyo: true, repeat: 3, ease: 'sine.inOut' });
                    const fx = this.add.graphics().setDepth(1000).lineStyle(4, 0x6366F1, 1).strokeCircle(0, 0, 50).setPosition(card.container.x, card.container.y);
                    gsap.fromTo(fx, { alpha: 1, scale: 0.8 }, { alpha: 0, scale: 2.5, duration: 0.8, ease: 'power2.out', onComplete: () => fx.destroy() });
                }
                break;
            }
        }
    }

    private endGame() {
        if (this.gameTimer) this.gameTimer.destroy();
        this.soundManager.playSfx('game_win');
        this.createMissionCompleteModal();
    }

    private createMissionCompleteModal() {
        const { width, height } = this.cameras.main;

        // 1. Backdrop traslúcido total
        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive().setDepth(50000);

        const container = this.add.container(width / 2, height / 2).setDepth(50001);

        // 2. Panel Indigo Glass
        const panelW = 450, panelH = 340;
        const bg = this.add.graphics();
        bg.fillStyle(0x4338ca, 0.95); // Indigo 700
        bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);
        bg.lineStyle(4, 0x818CF8, 1);
        bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

        // Brillo superior
        bg.fillStyle(0xffffff, 0.1);
        bg.fillRoundedRect(-panelW / 2 + 5, -panelH / 2 + 5, panelW - 10, panelH / 2.5, { tl: 15, tr: 15, bl: 5, br: 5 });

        // 3. Textos Nítidos
        const title = this.add.text(0, -85, 'MISSION COMPLETE!', {
            fontSize: '40px',
            fontFamily: 'Nunito',
            color: '#FFFFFF',
            fontStyle: '900'
        }).setOrigin(0.5);

        const scoreText = this.add.text(0, -25, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'Nunito',
            color: '#FBBF24',
            fontStyle: '800'
        }).setOrigin(0.5);

        // 4. Botones SB PREMIUM
        const btnReplay = createSBButton(this, -110, 80, 180, 60, '↺ REPLAY', () => this.scene.restart(), false);
        const btnResults = createSBButton(this, 110, 80, 180, 60, '➔ RESULTS', () => this.game.events.emit('GAME_EXIT'), true);

        container.add([bg, title, scoreText, btnReplay, btnResults]);

        // Animación Juicy
        container.setScale(0.8).setAlpha(0);
        this.tweens.add({ targets: container, scale: 1, alpha: 1, duration: 500, ease: 'Back.out(1.7)' });
    }

    private togglePause(showOverlay: boolean = true) {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            if (showOverlay) this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
    }
    private showPauseOverlay() {
        const { width, height } = this.cameras.main;

        // Backdrop total
        this.pauseOverlay = this.add.container(0, 0).setDepth(45000);
        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();

        // Contenedor del panel
        const panelCont = this.add.container(width / 2, height / 2);
        const pW = 400, pH = 320;

        const bg = this.add.graphics();
        bg.fillStyle(0x4338ca, 0.95); // Indigo 700
        bg.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, 20);
        bg.lineStyle(4, 0x818CF8, 1);
        bg.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, 20);

        const title = this.add.text(0, -80, 'PAUSED', {
            fontSize: '42px',
            fontFamily: 'Nunito',
            color: '#FFFFFF',
            fontStyle: '900'
        }).setOrigin(0.5);

        const bC = createSBButton(this, 0, 15, 220, 60, '➔ CONTINUE', () => this.togglePause(), true);
        const bE = createSBButton(this, 0, 95, 180, 50, 'EXIT', () => this.game.events.emit('GAME_EXIT'), false);

        panelCont.add([bg, title, bC, bE]);
        this.pauseOverlay.add([backdrop, panelCont]);

        panelCont.setScale(0.8).setAlpha(0);
        this.tweens.add({ targets: panelCont, scale: 1, alpha: 1, duration: 400, ease: 'Back.out' });
    }
    private hidePauseOverlay() { if (this.pauseOverlay) this.pauseOverlay.destroy(); }
    private showHelpPanel() {
        const wasPaused = this.isPaused;
        if (!wasPaused) this.isPaused = true; // Pausa lógica sin overlay

        const { width, height } = this.cameras.main;
        const helpContainer = this.add.container(0, 0).setDepth(60000);

        // 1. Backdrop traslúcido
        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();

        // 2. Panel Indigo Glass
        const pW = 500, pH = 420;
        const panel = this.add.container(width / 2, height / 2);

        const bg = this.add.graphics();
        bg.fillStyle(0x4338ca, 0.95);
        bg.fillRoundedRect(-pW / 2, -pH / 2, pW, pH, 25);
        bg.lineStyle(4, 0x818CF8, 1);
        bg.strokeRoundedRect(-pW / 2, -pH / 2, pW, pH, 25);

        bg.fillStyle(0xffffff, 0.1);
        bg.fillRoundedRect(-pW / 2 + 5, -pH / 2 + 5, pW - 10, pH / 2.5, { tl: 20, tr: 20, bl: 5, br: 5 });

        const title = this.add.text(0, -130, 'How to play', {
            fontSize: '38px', fontFamily: 'Nunito', color: '#FFFFFF', fontStyle: '900'
        }).setOrigin(0.5);

        const info = this.add.text(0, 0, this.missionInstructions || 'Select words in order to build the sentence.', {
            fontSize: '24px', fontFamily: 'Nunito', color: '#FFFFFF', align: 'center', wordWrap: { width: 420 }, fontStyle: '600'
        }).setOrigin(0.5);

        const closeBtn = createSBButton(this, 0, 140, 200, 60, '➔ GOT IT!', () => {
            helpContainer.destroy();
            if (!wasPaused) this.isPaused = false; // Reanudar lógica
        }, true);

        panel.add([bg, title, info, closeBtn]);
        helpContainer.add([backdrop, panel]);

        panel.setScale(0.8).setAlpha(0);
        this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 400, ease: 'Back.out' });
    }
    update() { }
}
