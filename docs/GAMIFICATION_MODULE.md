# 🎮 Gamification Module - Architecture & Implementation Guide

## 📋 Overview

This document describes the architecture and implementation plan for the gamification module in English27.

## 🏗️ Architecture Summary

### Routes Structure

```
/estudiante/gamification     → Student view (achievements, points, leaderboard)
/docente/gamification        → Teacher view (create challenges, track progress)
/administrador/gamification  → Admin view (global settings, moderation)
```

### Folder Structure

```
app/(dashboard)/
├── estudiante/gamification/page.tsx
├── docente/gamification/page.tsx
└── administrador/gamification/page.tsx

src/
├── components/features/gamification/
│   ├── student/
│   │   ├── GamificationStudentView.tsx      (Logic + Protection)
│   │   └── GamificationStudentDashboard.tsx (UI)
│   ├── teacher/
│   │   ├── GamificationTeacherView.tsx
│   │   └── GamificationTeacherDashboard.tsx
│   └── admin/
│       ├── GamificationAdminView.tsx
│       └── GamificationAdminDashboard.tsx
│
├── services/
│   └── gamification.service.ts
│
├── hooks/
│   ├── useGamification.ts
│   ├── useAchievements.ts
│   └── useLeaderboard.ts
│
├── types/
│   └── gamification.types.ts
│
└── lib/gamification/
    ├── points-calculator.ts
    ├── achievement-validator.ts
    └── leaderboard-utils.ts

app/api/gamification/
├── route.ts
├── achievements/route.ts
├── challenges/route.ts
└── leaderboard/route.ts
```

## 🔗 Integration with Existing Auth System

The gamification module integrates seamlessly with the existing authentication system:

- **AuthContext**: Used to get current user (`usuario`) and role (`usuario.rol`)
- **Route Protection**: Each View component verifies authentication and role
- **User Identification**: Uses `usuario.id_usuario` as foreign key in all tables
- **Role-Based Access**:
  - Students: View their own progress, achievements, and leaderboard
  - Teachers: Create challenges, view class statistics, award manual points
  - Admins: Global configuration, achievement management, moderation

## 🗄️ Database Schema

### Tables to Create (via Supabase migrations)

1. **gamification_user_progress**
   - Stores user's total points, level, experience, streak
   - One record per user

2. **gamification_achievements**
   - Global achievements (created by admins)
   - Criteria-based unlocking

3. **gamification_user_achievements**
   - User's progress on achievements
   - Tracks completion and progress percentage

4. **gamification_challenges**
   - Teacher-created challenges
   - Time-bound with rewards

5. **gamification_user_challenges**
   - User's progress on challenges
   - Tracks status and completion

6. **gamification_rewards**
   - Claimable rewards (badges, avatars, themes)
   - Cost in points

7. **gamification_user_rewards**
   - User's claimed rewards

8. **gamification_points_transactions**
   - Audit log of all point changes
   - Tracks source and reason

9. **gamification_settings**
   - Global configuration
   - Adjustable by admins

### RLS Policies Required

- **Students**: Can view their own data and public leaderboards
- **Teachers**: Can create challenges and view assigned students' progress
- **Admins**: Full access to all tables

## 🎯 Core Features by Role

### Students
- View total points, level, and experience bar
- View unlocked and in-progress achievements
- View leaderboard position
- Claim rewards with earned points
- View and participate in active challenges
- View points history

### Teachers
- Create and manage challenges
- View class-wide statistics
- Track individual student progress
- Award manual bonus points
- View engagement metrics

### Admins
- Configure global gamification settings
- Create and manage global achievements
- View platform-wide statistics
- Moderate teacher-created content
- Adjust point values and formulas

## 📝 Next Implementation Steps

### Phase 1: Database Setup
1. Create migration with all tables
2. Set up RLS policies
3. Create indexes for performance
4. Insert default settings record

### Phase 2: Backend Implementation
1. Complete GamificationService methods
2. Implement API routes
3. Add points calculation logic
4. Add achievement validation logic

### Phase 3: Frontend Implementation
1. Build student dashboard UI components
2. Build teacher dashboard UI components
3. Build admin dashboard UI components
4. Implement hooks for data fetching

### Phase 4: Business Logic
1. Implement points calculator
2. Implement achievement validator
3. Implement leaderboard utils
4. Add automatic achievement checking

### Phase 5: Testing & Polish
1. Test all role-based access
2. Test point calculations
3. Test achievement unlocking
4. Polish UI/UX

## 🔒 Security Considerations

- All database operations use RLS policies
- Role verification in both frontend and backend
- Points cannot be directly manipulated by users
- Achievements unlock only via validated criteria
- Admins required for global configuration changes

## 🚀 Navigation Integration

To add gamification links to existing dashboards:

### Student Dashboard
```tsx
// In EstudianteDashboard.tsx
<button onClick={() => router.push('/estudiante/gamification')}>
  Ver Gamificación
</button>
```

### Teacher Dashboard
```tsx
// In DocenteDashboard.tsx
<button onClick={() => router.push('/docente/gamification')}>
  Gestionar Gamificación
</button>
```

### Admin Dashboard
```tsx
// In AdministradorDashboard.tsx
<button onClick={() => router.push('/administrador/gamification')}>
  Configurar Gamificación
</button>
```

## 📊 Data Flow Example

### Student Views Achievements
1. User navigates to `/estudiante/gamification`
2. `GamificationStudentView` verifies auth and role
3. `GamificationStudentDashboard` calls `useAchievements(userId)`
4. Hook calls `GamificationService.getUserAchievements(userId)`
5. Service queries `gamification_user_achievements` via Supabase client
6. RLS policy allows student to view their own achievements
7. Data returned and displayed in UI

### Teacher Creates Challenge
1. Teacher navigates to `/docente/gamification`
2. Opens challenge creation modal
3. Submits challenge data
4. Frontend calls `GamificationService.createChallenge(data)`
5. Service sends POST to `/api/gamification/challenges`
6. API route verifies teacher role
7. RLS policy allows teacher to insert challenge
8. Challenge created and students can now see it

## 🎨 UI Components to Create

- AchievementCard (display single achievement with progress)
- LeaderboardTable (display top users)
- ChallengeCard (display challenge with countdown)
- PointsDisplay (animated points counter)
- LevelProgressBar (experience progress to next level)
- RewardCard (claimable reward with cost)
- StatCard (display metrics with icons)

---

**Note**: All files have been created as skeletons with TODO comments marking where business logic will be implemented in the next phase.
