/**
 * SEED GAMIFICATION CONTENT - UNITS 13-16
 *
 * This script populates the database with pedagogical content for English curriculum units 13-16:
 * - Unit 13: Places
 * - Unit 14: Out and About
 * - Unit 15: What Shall I Wear?
 * - Unit 16: Buy It!
 *
 * Usage:
 *   npm run seed:gamification
 *
 * Features:
 * - Idempotent: Can be run multiple times without duplicating data
 * - Checks for existing missions by code before inserting
 * - Updates existing missions if found
 * - Creates missions with associated activities from gamification-units-13-16.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { gamificationUnits13to16 } from '../src/config/gamification-units-13-16';

config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const difficultyMap: Record<string, 'facil' | 'medio' | 'dificil'> = {
  easy: 'facil',
  medium: 'medio',
  hard: 'dificil',
};

function transformActivityData(activity: any): any {
  let contentData: any = {};

  switch (activity.type) {
    case 'flashcards':
      contentData = {
        type: 'flashcards',
        cards: activity.data.cards || []
      };
      break;

    case 'matching_pairs':
      contentData = {
        type: 'matching_pairs',
        pairs: (activity.data.pairs || []).map((p: any) => ({
          id: p.left,
          match: p.right
        }))
      };
      break;

    case 'match_up':
      contentData = {
        type: 'match_up',
        pairs: (activity.data.pairs || []).map((p: any) => ({
          term: p.left,
          definition: p.right
        }))
      };
      break;

    case 'complete_sentence':
      contentData = {
        type: 'complete_sentence',
        sentence: '',
        blanks: (activity.data.items || []).map((item: any, idx: number) => ({
          position: item.text.indexOf('___'),
          answer: item.answer,
          alternatives: []
        })),
        feedback: 'Great job!'
      };
      if (activity.data.items && activity.data.items[0]) {
        contentData.sentence = activity.data.items[0].text;
      }
      break;

    case 'quiz':
      contentData = {
        type: 'quiz',
        questions: (activity.data.questions || []).map((q: any) => ({
          question: q.question,
          options: q.options || [],
          correct: q.options ? q.options.indexOf(q.answer) : 0,
          feedback: q.feedback || 'Correct!'
        }))
      };
      break;

    case 'group_sort':
      contentData = {
        type: 'group_sort',
        groups: Object.entries(activity.data.groups || {}).map(([name, items]) => ({
          name,
          items: items as string[]
        }))
      };
      break;

    case 'spin_wheel':
      contentData = {
        type: 'spin_wheel',
        segments: activity.data.prompts || [],
        question: 'Spin the wheel and answer the question',
        correctSegment: 0
      };
      break;

    case 'open_box':
      contentData = {
        type: 'open_box',
        items: (activity.data.boxes || []).map((box: any, idx: number) => ({
          label: `Box ${idx + 1}`,
          content: box.question,
          isCorrect: true
        })),
        question: 'Click on a box to reveal the question'
      };
      break;

    case 'unjumble':
      const item = activity.data.items?.[0];
      contentData = {
        type: 'unjumble',
        sentence: item?.answer || '',
        words: item?.scrambled ? item.scrambled.split(' / ') : [],
        feedback: 'Excellent!'
      };
      break;

    case 'speaking_cards':
      contentData = {
        type: 'speaking_cards',
        cards: (activity.data.cards || []).map((card: string) => ({
          prompt: card,
          guidingQuestions: [],
          vocabulary: []
        }))
      };
      break;

    case 'hangman':
      contentData = {
        type: 'hangman',
        word: activity.data.words?.[0] || 'example',
        hint: activity.label,
        category: 'Vocabulary',
        maxAttempts: 6
      };
      break;

    case 'anagram':
      const word = activity.data.words?.[0];
      contentData = {
        type: 'anagram',
        word: word?.answer || 'word',
        scrambled: word?.scrambled || 'word',
        hint: activity.label,
        feedback: 'Perfect!'
      };
      break;

    default:
      console.log(`    ⚠️  Unknown activity type: ${activity.type}`);
      contentData = { type: activity.type, data: activity.data };
  }

  return contentData;
}

async function seedGamificationData() {
  console.log('🌱 Starting gamification seed for Units 13-16...\n');
  console.log('='.repeat(60));

  try {
    let totalMissions = 0;
    let totalActivities = 0;

    for (const unit of gamificationUnits13to16) {
      console.log(`\n📚 Processing Unit ${unit.unit}: ${unit.title}`);

      for (let missionIndex = 0; missionIndex < unit.missions.length; missionIndex++) {
        const mission = unit.missions[missionIndex];

        const { data: existingMission } = await supabase
          .from('gamification_missions')
          .select('id')
          .eq('code', mission.code)
          .maybeSingle();

        let missionId: string;

        if (existingMission) {
          console.log(`  ✓ Mission ${mission.code} already exists, updating...`);

          const { data: updatedMission, error: updateError } = await supabase
            .from('gamification_missions')
            .update({
              unit_number: unit.unit,
              topic: unit.title,
              title: mission.title,
              description: mission.objective,
              difficulty_level: difficultyMap[mission.difficulty] || 'medio',
              base_points: mission.difficulty === 'easy' ? 100 : mission.difficulty === 'medium' ? 150 : 200,
              mission_type: 'mixed',
              estimated_duration_minutes: mission.activities.length * 5,
              is_active: true,
              order_index: missionIndex,
            })
            .eq('id', existingMission.id)
            .select()
            .single();

          if (updateError) {
            console.error(`  ❌ Error updating mission ${mission.code}:`, updateError.message);
            continue;
          }

          missionId = updatedMission.id;

          await supabase
            .from('gamification_activities')
            .delete()
            .eq('mission_id', missionId);
        } else {
          console.log(`  + Creating mission ${mission.code}: ${mission.title}`);

          const { data: newMission, error: insertError } = await supabase
            .from('gamification_missions')
            .insert({
              code: mission.code,
              unit_number: unit.unit,
              topic: unit.title,
              title: mission.title,
              description: mission.objective,
              difficulty_level: difficultyMap[mission.difficulty] || 'medio',
              base_points: mission.difficulty === 'easy' ? 100 : mission.difficulty === 'medium' ? 150 : 200,
              mission_type: 'mixed',
              estimated_duration_minutes: mission.activities.length * 5,
              is_active: true,
              order_index: missionIndex,
            })
            .select()
            .single();

          if (insertError) {
            console.error(`  ❌ Error creating mission ${mission.code}:`, insertError.message);
            continue;
          }

          missionId = newMission.id;
          totalMissions++;
        }

        for (let actIndex = 0; actIndex < mission.activities.length; actIndex++) {
          const activity = mission.activities[actIndex];
          const contentData = transformActivityData(activity);

          const { error: actError } = await supabase
            .from('gamification_activities')
            .insert({
              mission_id: missionId,
              title: activity.label,
              activity_type: activity.type,
              prompt: activity.label,
              content_data: contentData,
              points_value: 50,
              time_limit_seconds: null,
              order_index: actIndex,
              is_active: true,
            });

          if (actError) {
            console.error(`    ❌ Error creating activity ${activity.label}:`, actError.message);
          } else {
            console.log(`    ✓ Created activity: ${activity.label} (${activity.type})`);
            totalActivities++;
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Seeding complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total missions created: ${totalMissions}`);
    console.log(`   Total activities created: ${totalActivities}`);
    console.log('\n✅ All content for Units 13-16 is now available!\n');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedGamificationData()
  .then(() => {
    console.log('👋 Seeding script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
