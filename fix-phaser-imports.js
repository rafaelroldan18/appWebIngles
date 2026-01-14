const fs = require('fs');
const path = require('path');

const files = [
    'src/lib/games/UIKit.ts',
    'src/lib/games/WordCatcherScene.ts',
    'src/lib/games/UIKit.examples.ts',
    'src/lib/games/SentenceBuilderScene.ts',
    'src/lib/games/ImageMatchScene.ts',
    'src/lib/games/GrammarRunScene.ts',
    'src/lib/games/CityExplorerScene.ts',
    'src/lib/games/GameHUD.ts',
    'src/components/features/gamification/UniversalGameCanvas.tsx',
    'src/components/features/gamification/PhaserGameCanvas.tsx'
];

const basePath = 'c:\\Users\\rp121\\Documents\\appWebIngles';

files.forEach(fileRelPath => {
    const fullPath = path.join(basePath, fileRelPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/import Phaser from ['"]phaser['"]/g, "import * as Phaser from 'phaser'");
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fileRelPath}`);
    } else {
        console.warn(`File not found: ${fullPath}`);
    }
});
