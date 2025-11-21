# Teacher Panel - Units 13-16 Management

## Overview

The teacher panel has been enhanced to provide pedagogically clear management of gamification content for English textbook Units 13-16. Teachers can now create, edit, and manage missions and activities aligned with the real curriculum.

## Key Features

### 1. **Units 13-16 Specific Interface**

All teacher interfaces now explicitly reference and support Units 13-16:
- **Unit 13**: Places
- **Unit 14**: Out and about
- **Unit 15**: What shall I wear?
- **Unit 16**: Buy it!

### 2. **Mission Management** (`MissionsListView.tsx`)

**Features:**
- Filter missions by unit with full titles (e.g., "Unit 13: Places - Places in town")
- View missions grouped and labeled by unit
- Quick access to edit, stats, activities, and delete functions
- Visual indicators for unit, difficulty, type, and points

**Filters Available:**
- Unit (13-16 with titles)
- Difficulty (Easy, Medium, Hard)
- Type (Grammar, Vocabulary, Reading, Listening, Speaking, Writing, Mixed)

### 3. **Create Mission Form** (`CreateMissionForm.tsx`)

**Pedagogical Features:**
- Unit selection with full titles and topics
- **Automatic defaults** when selecting a unit:
  - Suggested mission type (vocabulary/grammar)
  - Recommended difficulty level
  - Default base points (100 pts)
  - Estimated duration (15 minutes)

**Pedagogical Hints:**
Each unit displays contextual suggestions:

**Unit 13 - Places:**
- Focus on places vocabulary: bank, post office, supermarket, library
- Use "there is/are" questions
- Include prepositions of place: next to, between, opposite

**Unit 14 - Out and about:**
- Transport vocabulary: train, bus, metro, bicycle, plane
- Movement verbs: walk, drive, fly, ride
- Suggestions with "Let's" and "Shall we"

**Unit 15 - What shall I wear?:**
- Clothing items: jacket, boots, t-shirt, jeans, coat
- Describing appearance: What are you wearing?
- Weather-appropriate clothing

**Unit 16 - Buy it!:**
- Shopping vocabulary: checkout, sale, discount, price
- Money and prices: How much is it?
- Shop types: bookshop, butcher, chemist

### 4. **Edit Mission Form** (`EditMissionForm.tsx`)

**Features:**
- Load existing mission data
- Edit all mission properties
- Unit selection with full titles
- Maintain consistency with create form
- Updates persist to database

### 5. **Manage Activities** (`ManageActivitiesView.tsx`) **[NEW]**

**Comprehensive Activity Management:**

**Route:** `/docente/gamification/missions/[id]/activities`

**Features:**
- View all activities for a specific mission
- Add new activities (quiz, matching, fill-in-blank)
- Edit existing activities
- Delete activities
- Activities are sorted by order_index
- Real-time database updates

**Activity Creation:**
- Select activity type (Quiz, Matching, Fill in Blank)
- Set title, prompt/instructions
- Configure points value
- Optional time limit
- Set order index for sequencing
- Sample content_data created automatically

**Important Notes:**
- Creates activities with sample content structure
- Teachers can refine content_data via database or future advanced editor
- Changes persist to `gamification_activities` table
- Does not break seed data - all operations are additive or explicit updates/deletes

## Role-Based Access Control

**Security:**
- Only `docente` (teacher) and `administrador` (admin) roles can access these interfaces
- RLS policies enforce that teachers can:
  - Create missions (assigned as creator)
  - Edit their own missions
  - Delete their own missions
  - Admins can edit/delete all missions
- Activities inherit permissions from their parent mission

## Data Persistence

**Database Operations:**
- **Missions:** Stored in `gamification_missions` table
- **Activities:** Stored in `gamification_activities` table
- All changes are immediately persisted
- Foreign key relationships maintained (activities → missions)
- Cascade deletes: Deleting a mission removes its activities

**Non-Destructive:**
- Seed data remains intact unless explicitly edited/deleted
- New missions/activities coexist with seeded content
- Teachers can create custom content beyond Units 13-16

## Workflow Example

### Creating a New Mission

1. Navigate to `/docente/gamification/missions`
2. Click "Create Mission"
3. Select unit (e.g., "Unit 13: Places - Places in town")
4. Review pedagogical hints for that unit
5. Form auto-fills with recommended defaults
6. Customize title, description, difficulty, type
7. Save mission → redirects to missions list

### Adding Activities to a Mission

1. From missions list, click "Activities" on any mission
2. View existing activities (from seed or previous additions)
3. Click "Add Activity"
4. Select type (quiz/matching/fill-in-blank)
5. Set title, prompt, points, optional time limit
6. Save → Activity created with sample structure
7. Refine content_data through database if needed

### Editing a Mission

1. From missions list, click "Edit" on any mission
2. Modify any field (unit, title, description, points, etc.)
3. Save → Changes persist immediately
4. Mission updates reflected for all students

### Deleting Content

1. **Delete Activity:** From activities view, click "Delete" → Confirmation → Removed from database
2. **Delete Mission:** From missions list, click "Delete" → Confirmation → Mission and all activities removed

## Technical Details

**Components Modified:**
- `MissionsListView.tsx` - Added Units 13-16 filtering and labels
- `CreateMissionForm.tsx` - Added pedagogical defaults and hints
- `EditMissionForm.tsx` - Added Units 13-16 titles

**Components Created:**
- `ManageActivitiesView.tsx` - Full activity management interface

**Routes Created:**
- `/docente/gamification/missions/[id]/activities` - Activity management page

**API Functions Used:**
- `getMissionById()` - Load mission details
- `createMission()` - Create new mission
- `updateMission()` - Update existing mission
- `deleteMission()` - Delete mission
- `getActivitiesForMission()` - Load all activities for a mission
- `createActivity()` - Create new activity
- `updateActivity()` - Update existing activity
- `deleteActivity()` - Delete activity

## Future Enhancements

Potential improvements for teacher panel:

1. **Advanced Activity Editor**
   - Visual editor for quiz questions
   - Drag-and-drop for matching pairs
   - Interactive fill-in-blank creator

2. **Content Templates**
   - Pre-built activity templates per unit
   - Quick duplication of existing activities
   - Import/export activities

3. **Analytics Dashboard**
   - Student performance per activity
   - Completion rates per mission
   - Difficulty adjustments based on data

4. **Bulk Operations**
   - Clone missions across units
   - Batch edit multiple activities
   - Assign missions to specific student groups

## Summary

Teachers now have a fully functional, pedagogically-informed interface to manage gamification content for Units 13-16 of the English textbook. The panel provides:

✅ Clear unit-based organization with English titles
✅ Pedagogical hints and smart defaults
✅ Full CRUD operations for missions and activities
✅ Role-based access control
✅ Real-time database persistence
✅ Non-destructive coexistence with seed data

All changes are immediately available to students through the gamification module.
