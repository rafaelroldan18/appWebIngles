# Units 13-16 UI Alignment

## Overview

The student gamification UI has been updated to explicitly reflect English textbook Units 13-16 with proper grouping, labeling, and visual organization.

## Units from the English Textbook

- **Unit 13**: Places
- **Unit 14**: Out and about
- **Unit 15**: What shall I wear?
- **Unit 16**: Buy it!

## UI Components Updated

### 1. MissionsListView (`src/components/features/gamification/student/MissionsListView.tsx`)

**Changes:**
- Added unit summary section at the top showing completion stats for each unit (13-16)
- Missions are now grouped by unit with clear section headers
- Each unit section displays:
  - Unit number and English title (e.g., "Unit 13: Places")
  - Progress indicator showing completed vs total missions
  - Percentage completion badge
- Units are displayed in sequential order (13, 14, 15, 16)
- Filtering (All, Not Started, In Progress, Completed) works within each unit group

**Visual Organization:**
```
📚 Unidades del Libro (Units 13-16)
┌─────────────────────────────────────────┐
│ Unit 13: Places    │ Unit 14: Out and about │
│ 1/2 completed      │ 0/1 completed          │
└─────────────────────────────────────────┘

Unit 13: Places
1 de 2 misiones completadas [50% completado]
┌────────────────┐ ┌────────────────┐
│ Mission Card 1 │ │ Mission Card 2 │
└────────────────┘ └────────────────┘

Unit 14: Out and about
...
```

### 2. MissionCard (`src/components/features/gamification/student/MissionCard.tsx`)

**Changes:**
- Unit label now displays as "Unit {number}: {English title}"
- Example: "Unit 13: Places" instead of just "Unidad 13"
- Unit label styled in blue color to stand out
- Maintains all existing functionality (difficulty badge, points, progress, etc.)

### 3. MissionDetailView (`src/components/features/gamification/student/MissionDetailView.tsx`)

**Changes:**
- Mission header displays full unit information: "Unit {number}: {English title}"
- Example: "Unit 15: What shall I wear?"
- Consistent with the card display format
- All mission details remain intact

### 4. ProgressDashboard (`src/components/features/gamification/student/ProgressDashboard.tsx`)

**Changes:**
- Added documentation comment indicating it tracks progress across Units 13-16
- No visual changes (displays missions from all units together)

## Data Source

All unit information is consumed from the **live database**:
- Mission data fetched via `getMissionsWithProgress()` API
- Unit numbers stored in `gamification_missions.unit_number` field
- No hardcoded content - fully dynamic based on database records

## Benefits

1. **Clear Unit Association**: Students immediately see which textbook unit each mission belongs to
2. **Progress Tracking by Unit**: Easy to see completion status per unit at a glance
3. **Organized Learning Path**: Sequential presentation matches the textbook structure
4. **Contextual Learning**: English unit titles help students connect digital activities with their physical textbook

## Testing Verification

To verify the changes:

1. Navigate to `/estudiante/gamification/missions`
2. Check the summary section shows 4 units (13-16) with completion stats
3. Verify missions are grouped under unit headers with English titles
4. Confirm mission cards display "Unit X: Title" format
5. Open any mission detail page and verify unit information in header

## Database Content

Current database contains:
- Unit 13: 2 missions (Exploring the City Center, Around My Neighborhood)
- Unit 14: 1 mission (Getting Around Town)
- Unit 15: 1 mission (What Shall I Wear?)
- Unit 16: 1 mission (At the Shopping Center)

Total: 5 missions, 11 activities across the 4 units.
