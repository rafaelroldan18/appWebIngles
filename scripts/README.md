# Gamification Seeding Scripts

## Overview

This directory contains scripts for populating the gamification module with pedagogical content.

## Database Seeding

### Migration-Based Seeding (Recommended)

The gamification content for Units 13-16 has been seeded directly via database migration:
- **Migration file**: `supabase/migrations/20251121120000_seed_gamification_units_13_16.sql`
- **Status**: ✅ Applied successfully
- **Content**: 5 missions, 11 activities across Units 13-16

### TypeScript Seed Script (Alternative)

A TypeScript-based seeding script is also available but requires proper authentication:
- **Script**: `scripts/seedGamificationUnits13_16.ts`
- **Usage**: `npm run seed:gamification`
- **Note**: Requires SUPABASE_SERVICE_ROLE_KEY or authenticated user session

## Content Seeded

### Unit 13: Places in Town
- **Mission 1**: "Exploring the City Center" (Easy, Vocabulary, 100pts)
  - 3 activities: Places Vocabulary (quiz), Match Places (matching), Complete Sentences (fill-in-blank)
- **Mission 2**: "Around My Neighborhood" (Medium, Grammar, 150pts)
  - 3 activities: Prepositions of Place (quiz), Prepositions Practice (matching), Directions (fill-in-blank)

### Unit 14: Transport and Movement
- **Mission 1**: "Getting Around Town" (Easy, Vocabulary, 100pts)
  - 2 activities: Transport Vocabulary (quiz), Transport and Places (matching)

### Unit 15: Clothes and Appearance
- **Mission 1**: "What Shall I Wear?" (Easy, Vocabulary, 100pts)
  - 2 activities: Clothes Vocabulary (quiz), Clothes and Occasions (matching)

### Unit 16: Shopping and Money
- **Mission 1**: "At the Shopping Center" (Easy, Vocabulary, 100pts)
  - 2 activities: Shopping Vocabulary (quiz), Shops and Products (matching)

## Verification

To verify the content was seeded correctly, you can query the database:

```sql
-- Check missions
SELECT unit_number, title, mission_type, base_points
FROM gamification_missions
WHERE unit_number >= 13
ORDER BY unit_number, order_index;

-- Check activities
SELECT m.title as mission, a.title as activity, a.activity_type, a.points_value
FROM gamification_activities a
JOIN gamification_missions m ON a.mission_id = m.id
WHERE m.unit_number >= 13
ORDER BY m.unit_number, m.order_index, a.order_index;
```

## Content Templates

The source templates for all content are defined in:
- **File**: `src/config/gamification-content-templates.ts`
- **Structure**: Organized by unit with MissionTemplate and ActivityTemplate interfaces
- **Usage**: Can be used to generate additional content or update existing missions

## Notes

- All missions are created with `created_by = NULL` (system content)
- Missions are active by default (`is_active = true`)
- Order indices follow pattern: Unit 13 = 1300+, Unit 14 = 1400+, etc.
- Points are balanced: Easy missions = 100pts, Medium = 150pts
- Activity types: quiz, matching, fill_in_blank
