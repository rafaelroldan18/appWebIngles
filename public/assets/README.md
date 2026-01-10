# Game Assets Directory

This directory contains all visual and audio assets used in the game.

## 📁 Directory Structure

```
assets/
├── games/
│   ├── common/                    # Shared assets across all games
│   │   └── ui/                    # UI elements
│   │       └── kenney-ui-1/       # Kenney UI pack (blue theme)
│   │           ├── panel.png      # Main UI panel background
│   │           ├── button.png     # Normal button state
│   │           ├── button-hover.png # Hover button state
│   │           ├── icon-pause.png # Pause icon
│   │           └── icon-help.png  # Help icon
│   │
│   └── word-catcher/              # Word Catcher specific assets
│       ├── backgrounds/           # Game backgrounds
│       │   └── bg_1.png          # Starry sky background
│       └── sprites/               # Game sprites
│           ├── token.png         # Correct word token (green)
│           ├── token-bad.png     # Wrong word token (red)
│           └── particle.png      # Particle effects
│
└── fonts/                         # Game fonts (optional)
    └── game-font.ttf             # Custom game font
```

## 🎨 Asset Packs

### Kenney UI Pack
- **Style:** Clean, modern, flat design
- **Colors:** Blue gradient theme
- **Use case:** UI panels, buttons, icons
- **License:** CC0 (Public Domain)

### PixelFrog Sprites
- **Style:** Pixel art, retro gaming aesthetic
- **Use case:** Game characters, tokens, particles
- **License:** Free for commercial use with attribution

## 📐 Asset Specifications

### UI Elements (Kenney)
| Asset | Dimensions | Format | Usage |
|-------|-----------|--------|-------|
| panel.png | 400x300 | PNG | HUD background panels |
| button.png | 200x80 | PNG | Interactive buttons (normal) |
| button-hover.png | 200x80 | PNG | Interactive buttons (hover) |
| icon-pause.png | 64x64 | PNG | Pause game button |
| icon-help.png | 64x64 | PNG | Help/instructions button |

### Word Catcher Assets
| Asset | Dimensions | Format | Usage |
|-------|-----------|--------|-------|
| bg_1.png | 800x600 | PNG | Game background |
| token.png | 64x64 | PNG | Correct word container |
| token-bad.png | 64x64 | PNG | Wrong word container |
| particle.png | 16x16 | PNG | Catch effect particles |

## 🔧 Usage in Code

### Import Configuration
```typescript
import { GAME_ASSETS, preloadWordCatcherAssets } from '@/lib/games/assets.config';
```

### Preload Assets in Phaser
```typescript
class GameScene extends Phaser.Scene {
    preload() {
        // Preload all Word Catcher assets
        preloadWordCatcherAssets(this, 'kenney-ui-1');
    }
}
```

### Use Assets
```typescript
// Access asset paths
const panelPath = GAME_ASSETS.ui.kenneyUI1.panel;
const tokenPath = GAME_ASSETS.wordCatcher.sprites.token;

// In Phaser scene
this.add.image(x, y, 'ui-panel');
this.add.image(x, y, 'wc-token');
```

## 🎨 Asset Pack Variants

The system supports multiple UI themes:

- **kenney-ui-1** (default) - Blue theme
- **kenney-red** - Red theme (to be added)
- **modern-neon** - Neon theme (to be added)
- **retro-pixel** - Pixel art theme (to be added)

To switch themes, change the `asset_pack` in mission configuration:

```json
{
  "asset_pack": "kenney-ui-1"
}
```

## 📝 Adding New Assets

### 1. Add the file to the appropriate directory
```bash
# For UI elements
public/assets/games/common/ui/[pack-name]/[asset-name].png

# For game-specific assets
public/assets/games/[game-name]/[category]/[asset-name].png
```

### 2. Update assets.config.ts
```typescript
export const GAME_ASSETS = {
    ui: {
        kenneyUI1: {
            // ... existing assets
            newAsset: '/assets/games/common/ui/kenney-ui-1/new-asset.png',
        }
    }
}
```

### 3. Update preload function
```typescript
export function preloadWordCatcherAssets(scene: Phaser.Scene) {
    // ... existing loads
    scene.load.image('new-asset-key', uiAssets.newAsset);
}
```

## 🖼️ Asset Guidelines

### Image Format
- **Format:** PNG with transparency
- **Color Mode:** RGBA
- **Compression:** Optimized for web

### Naming Convention
- Use lowercase with hyphens: `button-hover.png`
- Be descriptive: `icon-pause.png` not `icon1.png`
- Include state if applicable: `button.png`, `button-hover.png`

### Size Recommendations
- **UI Icons:** 64x64 or 128x128
- **Buttons:** 200x80 or similar ratio
- **Panels:** 400x300 or larger
- **Backgrounds:** Match game canvas (800x600)
- **Sprites:** 64x64 for tokens, 32x32 for small items

### Performance
- Keep file sizes under 500KB when possible
- Use sprite sheets for animations
- Optimize PNGs with tools like TinyPNG

## 📄 License Information

See [CREDITS.md](./CREDITS.md) for detailed license information and attribution requirements.

**Quick Summary:**
- ✅ Kenney assets: CC0 (no attribution required)
- ⚠️ PixelFrog assets: Attribution required
- ✅ Custom assets: Unlimited use

## 🔗 Resources

- **Kenney Assets:** https://kenney.nl/assets
- **PixelFrog Assets:** https://pixelfrog-assets.itch.io/
- **Asset Configuration:** `src/lib/games/assets.config.ts`
- **Credits:** `public/assets/CREDITS.md`

---

Last updated: January 8, 2026
