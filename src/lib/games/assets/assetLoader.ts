import type Phaser from "phaser";
import type { AssetManifest, ManifestEntry } from "./manifest";

function loadEntry(scene: Phaser.Scene, entry?: ManifestEntry) {
    if (!entry) return;

    entry.atlases?.forEach(a => {
        if (!scene.textures.exists(a.key)) {
            scene.load.atlas(a.key, a.png, a.json);
        }
    });

    entry.images?.forEach(i => {
        if (!scene.textures.exists(i.key)) {
            scene.load.image(i.key, i.url);
        }
    });
}

export function preloadCommonAndGame(scene: Phaser.Scene, gameKey: string, manifest: AssetManifest) {
    loadEntry(scene, manifest.common);
    loadEntry(scene, manifest[gameKey]);
}
