import type Phaser from "phaser";

export type HudConfig = {
    showTimer?: boolean;
    showLives?: boolean;
    showProgress?: boolean;
    showHelp?: boolean;
};

export type HudRefs = {
    root: Phaser.GameObjects.Container;
    scoreText: Phaser.GameObjects.Text;
    timeText?: Phaser.GameObjects.Text;
    livesText?: Phaser.GameObjects.Text;
    progressText?: Phaser.GameObjects.Text;
    onPause?: () => void;
    onHelp?: () => void;
};

export function createHud(scene: Phaser.Scene, cfg: HudConfig): HudRefs {
    const W = scene.scale.width;
    const padding = 14;

    // Contenedor HUD fijo
    const root = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);

    // Panel superior (frame SIN .png)
    const panel = scene.add.image(W / 2, 46, "ui_atlas", "panel_card");
    panel.setOrigin(0.5, 0.5);

    // Ajuste simple: escala según ancho
    panel.setScale(Math.min(1, W / (panel.width + 80)));

    // Iconos
    const iconPause = scene.add.image(padding + 26, 46, "ui_atlas", "icon_pause")
        .setInteractive({ useHandCursor: true });

    const iconHelp = scene.add.image(W - (padding + 26), 46, "ui_atlas", "icon_help")
        .setInteractive({ useHandCursor: true });

    // Textos (usa tus fonts ya cargadas via CSS)
    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        fontFamily: "Fredoka",
        fontSize: "18px",
        color: "#ffffff",
    };

    const scoreText = scene.add.text(W / 2 - 210, 36, "Score: 0", baseStyle);

    const timeText = cfg.showTimer
        ? scene.add.text(W / 2 - 20, 36, "Time: --", baseStyle)
        : undefined;

    const livesText = cfg.showLives
        ? scene.add.text(W / 2 + 150, 36, "Lives: --", baseStyle)
        : undefined;

    const progressText = cfg.showProgress
        ? scene.add.text(W / 2 + 280, 36, "0/0", baseStyle).setOrigin(1, 0)
        : undefined;

    // Agregar todo al root
    root.add([panel, iconPause, iconHelp, scoreText]);
    if (timeText) root.add(timeText);
    if (livesText) root.add(livesText);
    if (progressText) root.add(progressText);

    const refs: HudRefs = { root, scoreText, timeText, livesText, progressText };

    iconPause.on("pointerup", () => refs.onPause?.());
    iconHelp.on("pointerup", () => refs.onHelp?.());

    return refs;
}
