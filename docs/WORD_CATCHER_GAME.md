# Word Catcher - Educational Game

## Overview
Word Catcher is an educational game built with Phaser 3 and integrated into the Next.js application. Students catch falling words by clicking on the correct ones while avoiding incorrect words.

## Architecture

### Components

#### 1. **PhaserGameCanvas.tsx** (React Component)
- Main React wrapper for the Phaser game
- Handles game lifecycle (mount/unmount)
- Manages loading states and error handling
- Communicates with parent components via callbacks
- Uses dynamic import to avoid SSR issues

#### 2. **WordCatcherScene.ts** (Phaser Scene)
- Main game scene with all gameplay logic
- Spawns falling words at intervals
- Handles click detection and scoring
- Displays UI (score, timer, stats)
- Emits events when game ends

#### 3. **GameLoader.ts** (Data Loader)
- Loads game content from REST API
- Validates game data
- Provides utility functions (shuffle, etc.)
- Checks game availability

#### 4. **GameSessionManager.ts** (Session Manager)
- Creates and manages game sessions via API
- Tracks score, correct/wrong counts
- Calculates duration and accuracy
- Submits results to backend on completion

#### 5. **wordCatcher.config.ts** (Configuration)
- Centralized game parameters
- Scoring rules
- Visual settings
- Physics constants

#### 6. **GamePlay.tsx** (UI Wrapper)
- Wraps PhaserGameCanvas
- Shows game instructions
- Displays results screen after game ends
- Handles "play again" functionality

## Game Flow

```
1. Student clicks "Jugar Ahora" on a game card
   ↓
2. GamePlay component loads
   ↓
3. PhaserGameCanvas initializes:
   - Loads game content from API
   - Creates game session
   - Initializes Phaser instance
   ↓
4. WordCatcherScene starts:
   - Spawns words at intervals
   - Player clicks correct/incorrect words
   - Score updates in real-time
   ↓
5. Game ends (timer expires):
   - Session results submitted to API
   - Results screen shown
   - Student can play again or return
```

## API Integration

### Endpoints Used

- **GET /api/games/content?topicId=...&gameTypeId=...**
  - Loads word list for the game
  - Returns array of GameContent objects

- **POST /api/games/sessions**
  - Creates new game session
  - Returns session_id

- **PUT /api/games/sessions/{sessionId}**
  - Updates session with final results
  - Automatically updates student_progress table

- **GET /api/games/availability?parallelId=...**
  - Gets available games for student's parallel

- **GET /api/games/sessions?studentId=...**
  - Gets student's game history

## Scoring System

- **Correct catch**: +10 points
- **Wrong catch**: -5 points
- **Missed correct word**: -2 points

## Game Parameters

- **Duration**: 120 seconds
- **Word fall speed**: 100 pixels/second
- **Spawn interval**: 2 seconds
- **Max words on screen**: 8

## Database Schema

### game_sessions
```sql
- session_id (uuid, PK)
- student_id (uuid, FK)
- topic_id (uuid, FK)
- game_type_id (uuid, FK)
- score (integer)
- completed (boolean)
- duration_seconds (integer)
- correct_count (integer)
- wrong_count (integer)
- details (jsonb)
- played_at (timestamp)
```

### student_progress
```sql
- progress_id (uuid, PK)
- student_id (uuid, FK, unique)
- activities_completed (integer)
- total_score (integer)
- last_updated_at (timestamp)
```

## Usage

### For Students

1. Navigate to "Mis Juegos" section
2. Click "Jugar Ahora" on any available game
3. Click correct words as they fall
4. Avoid clicking incorrect words
5. View results when time expires

### For Teachers

1. Navigate to "Gamificación" section
2. Select a parallel
3. Assign games to topics
4. Set availability dates and max attempts
5. Monitor student progress

## Technical Details

### Phaser 3 Configuration

```typescript
{
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}
```

### Responsive Design

- Game canvas scales to fit container
- Maintains aspect ratio
- Works on desktop and tablet devices

### Performance

- Dynamic import prevents SSR issues
- Proper cleanup on component unmount
- Efficient word spawning and removal
- Optimized animations with Phaser tweens

## Future Enhancements

1. **Multiple Game Types**
   - Sentence matching
   - Fill in the blanks
   - Pronunciation practice

2. **Power-ups**
   - Slow motion
   - Score multipliers
   - Extra time

3. **Difficulty Levels**
   - Adjust fall speed
   - More/fewer words
   - Time limits

4. **Leaderboards**
   - Class rankings
   - Personal bests
   - Weekly challenges

5. **Sound Effects**
   - Background music
   - Correct/wrong sounds
   - Countdown alerts

## Troubleshooting

### Game doesn't load
- Check browser console for errors
- Verify API endpoints are responding
- Ensure game content exists for the topic

### Performance issues
- Reduce max words on screen
- Disable debug mode
- Check for memory leaks in browser DevTools

### Session not saving
- Verify backend API is accessible
- Check network tab for failed requests
- Ensure student has proper permissions

## Files Structure

```
src/
├── lib/games/
│   ├── wordCatcher.config.ts
│   ├── GameLoader.ts
│   ├── GameSessionManager.ts
│   └── WordCatcherScene.ts
├── components/features/gamification/
│   ├── PhaserGameCanvas.tsx
│   ├── GamePlay.tsx
│   ├── StudentGames.tsx
│   └── GameManager.tsx
└── services/
    └── game.service.ts

app/api/games/
├── types/route.ts
├── availability/route.ts
├── content/route.ts
├── sessions/route.ts
└── sessions/[sessionId]/route.ts
```

## License

Part of the English27 educational platform.
