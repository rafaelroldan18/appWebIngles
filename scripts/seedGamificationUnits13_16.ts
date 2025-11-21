/**
 * SEED GAMIFICATION CONTENT - UNITS 13-16
 *
 * This script populates the database with pedagogical content for English curriculum units 13-16:
 * - Unit 13: Places in town
 * - Unit 14: Transport and movement
 * - Unit 15: Clothes and appearance
 * - Unit 16: Shopping and money
 *
 * Usage:
 *   npx tsx scripts/seedGamificationUnits13_16.ts
 *
 * Features:
 * - Idempotent: Can be run multiple times without duplicating data
 * - Checks for existing missions by title + unit before inserting
 * - Uses system user (first admin found) as creator
 * - Creates missions with associated activities
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { CONTENT_TEMPLATES, MissionTemplate, ActivityTemplate } from '../src/config/gamification-content-templates';

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

interface MissionRecord {
  id: string;
  unit_number: number;
  topic: string;
  title: string;
  description: string;
  difficulty_level: string;
  base_points: number;
  mission_type: string;
  estimated_duration_minutes: number;
  is_active: boolean;
  order_index: number;
  created_by: string;
}

async function getSystemUser(): Promise<string | null> {
  const { data: admins, error } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('rol', 'administrador')
    .limit(1);

  if (error || !admins || admins.length === 0) {
    console.log('  ⚠️  No admin user found, missions will be created without creator');
    return null;
  }

  return admins[0].id_usuario;
}

async function missionExists(title: string, unit: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('gamification_missions')
    .select('id')
    .eq('title', title)
    .eq('unit_number', unit)
    .maybeSingle();

  if (error) {
    console.error('Error checking mission existence:', error);
    return null;
  }

  return data?.id || null;
}

async function createMission(
  template: MissionTemplate,
  creatorId: string | null,
  orderIndex: number
): Promise<string | null> {
  const existingId = await missionExists(template.title, template.unit);

  if (existingId) {
    console.log(`  ⏭️  Mission "${template.title}" already exists, skipping...`);
    return existingId;
  }

  const missionData = {
    unit_number: template.unit,
    topic: template.topic,
    title: template.title,
    description: template.description,
    difficulty_level: template.difficulty_level,
    base_points: template.base_points,
    mission_type: template.mission_type,
    estimated_duration_minutes: template.estimated_duration_minutes,
    is_active: true,
    order_index: orderIndex,
    created_by: creatorId,
  };

  const { data, error } = await supabase
    .from('gamification_missions')
    .insert(missionData)
    .select('id')
    .single();

  if (error) {
    console.error(`  ❌ Error creating mission "${template.title}":`, error.message);
    return null;
  }

  console.log(`  ✅ Created mission: "${template.title}"`);
  return data.id;
}

async function createActivity(
  missionId: string,
  template: ActivityTemplate,
  orderIndex: number
): Promise<boolean> {
  const activityData = {
    mission_id: missionId,
    title: template.title,
    activity_type: template.type,
    prompt: template.prompt,
    content_data: template.content_data,
    points_value: template.points_value,
    time_limit_seconds: template.time_limit_seconds || null,
    order_index: orderIndex,
    is_active: true,
  };

  const { error } = await supabase
    .from('gamification_activities')
    .insert(activityData);

  if (error) {
    console.error(`    ❌ Error creating activity "${template.title}":`, error.message);
    return false;
  }

  console.log(`    ✅ Created activity: "${template.title}" (${template.type})`);
  return true;
}

async function seedUnit(unitNumber: number, creatorId: string | null): Promise<void> {
  console.log(`\n📚 Seeding Unit ${unitNumber}...`);

  const templates = CONTENT_TEMPLATES[unitNumber];

  if (!templates || templates.length === 0) {
    console.log(`  ⚠️  No templates found for Unit ${unitNumber}`);
    return;
  }

  let missionOrderIndex = unitNumber * 100;

  for (const missionTemplate of templates) {
    const missionId = await createMission(missionTemplate, creatorId, missionOrderIndex);

    if (!missionId) {
      console.log(`  ⚠️  Skipping activities for failed mission`);
      continue;
    }

    let activityOrderIndex = 1;
    for (const activityTemplate of missionTemplate.activities) {
      await createActivity(missionId, activityTemplate, activityOrderIndex);
      activityOrderIndex++;
    }

    missionOrderIndex++;
  }
}

async function clearActivitiesForMission(missionId: string): Promise<void> {
  const { error } = await supabase
    .from('gamification_activities')
    .delete()
    .eq('mission_id', missionId);

  if (error) {
    console.error('Error clearing activities:', error);
  }
}

async function seedAllUnits(): Promise<void> {
  console.log('🌱 Starting gamification content seeding for Units 13-16...\n');
  console.log('=' .repeat(60));

  try {
    const creatorId = await getSystemUser();
    if (creatorId) {
      console.log(`📋 Using admin user as creator: ${creatorId}`);
    } else {
      console.log(`📋 Creating missions without specific creator`);
    }

    for (const unit of [13, 14, 15, 16]) {
      await seedUnit(unit, creatorId);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Seeding complete!\n');

    const { data: missions } = await supabase
      .from('gamification_missions')
      .select('id, title, unit_number')
      .in('unit_number', [13, 14, 15, 16])
      .order('unit_number', { ascending: true })
      .order('order_index', { ascending: true });

    if (missions && missions.length > 0) {
      console.log('\n📊 Summary:');
      console.log(`   Total missions created: ${missions.length}`);

      for (const unit of [13, 14, 15, 16]) {
        const unitMissions = missions.filter(m => m.unit_number === unit);
        console.log(`   Unit ${unit}: ${unitMissions.length} missions`);
      }

      console.log('\n✅ All content for Units 13-16 is now available in the database!');
    }

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedAllUnits()
  .then(() => {
    console.log('\n👋 Seeding script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
