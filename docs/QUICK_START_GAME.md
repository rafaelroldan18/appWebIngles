# Quick Start Guide - Word Catcher Game

## 🚀 Getting Started in 5 Minutes

### Step 1: Populate Database with Test Data

1. Open Supabase SQL Editor
2. Run the script: `supabase/sample_game_data.sql`
3. **Important**: Replace these placeholders:
   - `YOUR_TEACHER_USER_ID` → Your actual teacher user_id
   - `YOUR_PARALLEL_ID` → Your actual parallel_id

### Step 2: Verify Installation

The game is already integrated! Just check:
- ✅ Phaser installed (`npm list phaser`)
- ✅ Server running (`npm run dev`)

### Step 3: Test the Game

1. **Login as a student** (must belong to the parallel you configured)
2. Navigate to **"Mis Juegos"** section
3. Click **"Jugar Ahora"** on any available game
4. Play the game!

## 🎮 How to Play

1. **Words fall from the top** of the screen
2. **Click CORRECT words** to gain +10 points
3. **Avoid INCORRECT words** or lose -5 points
4. **Don't miss correct words** or lose -2 points
5. **Game ends** after 2 minutes
6. **View your results** and play again!

## 📊 Where to Find Game Data

### As Teacher:
- Go to **"Gamificación"** section
- Select your parallel
- View assigned games
- See student progress

### As Student:
- Go to **"Mis Juegos"** section
- See available games
- View your progress stats
- Check game history

## 🔍 Troubleshooting

### Game doesn't appear?
```sql
-- Check if games are available for your parallel
SELECT * FROM game_availability WHERE parallel_id = 'YOUR_PARALLEL_ID';
```

### No game content?
```sql
-- Check if content exists for the topic
SELECT * FROM game_content WHERE topic_id = 'YOUR_TOPIC_ID';
```

### Session not saving?
- Check browser console for errors
- Verify API endpoints are responding
- Check Network tab in DevTools

## 📝 Sample Data Included

The sample SQL script creates:
- ✅ 3 Game types (Word Catcher, Sentence Builder, Vocabulary Match)
- ✅ 3 Topics (Present Simple Verbs, Common Adjectives, Daily Routines)
- ✅ 30+ words per topic (correct and incorrect)
- ✅ Game availability for your parallel

## 🎯 Next Steps

1. **Test with students** - Get feedback
2. **Create more topics** - Use admin panel
3. **Add more content** - Populate game_content table
4. **Monitor progress** - Check reports section

## 💡 Tips

- **Start simple**: Test with one topic first
- **Check logs**: Browser console shows helpful debug info
- **Verify data**: Use SQL queries to check database
- **Test thoroughly**: Try as both teacher and student

## 📞 Need Help?

Check these files for detailed information:
- `docs/WORD_CATCHER_GAME.md` - Full documentation
- `docs/WORD_CATCHER_IMPLEMENTATION.md` - Implementation details
- `supabase/sample_game_data.sql` - Sample data script

## ✨ You're Ready!

The game is fully functional and ready to use. Just populate the database and start playing! 🎉
