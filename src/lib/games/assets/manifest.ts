export type AtlasDef = { key: string; png: string; json: string };
export type ImageDef = { key: string; url: string };

export type ManifestEntry = {
    atlases?: AtlasDef[];
    images?: ImageDef[];
};

export type AssetManifest = Record<string, ManifestEntry>;

export const ASSET_MANIFEST: AssetManifest = {
    common: {
        atlases: [
            {
                key: "ui_atlas",
                png: "/assets/atlases/common-ui/texture.png",
                json: "/assets/atlases/common-ui/texture.json",
            },
            {
                key: "modals_atlas",
                png: "/assets/atlases/modals/texture.png",
                json: "/assets/atlases/modals/texture.json",
            },
            {
                key: "audio_settings_icons",
                png: "/assets/atlases/common-ui/icons/texture.png",
                json: "/assets/atlases/common-ui/icons/texture.json",
            },
        ],
    },

    "word-catcher": {
        atlases: [{ key: "wc_atlas", png: "/assets/atlases/word-catcher/texture.png", json: "/assets/atlases/word-catcher/texture.json" }],
        images: [{ key: "wc_bg_soft", url: "/assets/backgrounds/word-catcher/bg_soft.png" }],
    },

    "image-match": {
        atlases: [{ key: "im_atlas", png: "/assets/atlases/image-match/texture.png", json: "/assets/atlases/image-match/texture.json" }],
        images: [{ key: "im_bg_table", url: "/assets/backgrounds/image-match/bg_table.png" }],
    },

    "grammar-run": {
        atlases: [{ key: "gr_atlas", png: "/assets/atlases/grammar-run/texture.png", json: "/assets/atlases/grammar-run/texture.json" }],
    },

    "sentence-builder": {
        atlases: [{ key: "sb_atlas", png: "/assets/atlases/sentence-builder/texture.png", json: "/assets/atlases/sentence-builder/texture.json" }],
    },

    "city-explorer": {
        atlases: [{ key: "ce_atlas", png: "/assets/atlases/city-explorer/texture.png", json: "/assets/atlases/city-explorer/texture.json" }],
    },
};
