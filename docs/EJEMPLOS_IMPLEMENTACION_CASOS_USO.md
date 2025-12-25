# 💻 Ejemplos de Implementación - Casos de Uso English27

Este documento contiene ejemplos de código para implementar los casos de uso más importantes del sistema.

---

## 📋 Tabla de Contenidos

1. [UC-E14: Iniciar Misión](#uc-e14-iniciar-misión)
2. [UC-E15: Completar Actividad Quiz](#uc-e15-completar-actividad-quiz)
3. [UC-E23: Completar Misión](#uc-e23-completar-misión)
4. [UC-S01: Calcular Nivel](#uc-s01-calcular-nivel)
5. [UC-S02: Actualizar Racha](#uc-s02-actualizar-racha)
6. [UC-S03: Verificar y Otorgar Badges](#uc-s03-verificar-y-otorgar-badges)
7. [UC-D12: Crear Misión](#uc-d12-crear-misión)
8. [UC-D21: Crear Actividad Quiz](#uc-d21-crear-actividad-quiz)

---

## UC-E14: Iniciar Misión

### API Endpoint

```typescript
// app/api/missions/[missionId]/start/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { missionId: string } }
) {
  try {
    const supabase = createClient();
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // 2. Verificar que la misión existe y está activa
    const { data: mission, error: missionError } = await supabase
      .from('gamification_missions')
      .select('*')
      .eq('id', params.missionId)
      .eq('is_active', true)
      .single();
    
    if (missionError || !mission) {
      return NextResponse.json(
        { error: 'Misión no encontrada o inactiva' },
        { status: 404 }
      );
    }
    
    // 3. Verificar si ya existe un intento
    const { data: existingAttempt } = await supabase
      .from('gamification_mission_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('mission_id', params.missionId)
      .single();
    
    // 4. Si ya existe y está completado, no permitir reiniciar
    if (existingAttempt && existingAttempt.status === 'completed') {
      return NextResponse.json(
        { 
          error: 'Misión ya completada',
          attempt: existingAttempt 
        },
        { status: 400 }
      );
    }
    
    // 5. Si ya existe y está en progreso, retornar el intento existente
    if (existingAttempt && existingAttempt.status === 'in_progress') {
      return NextResponse.json({
        message: 'Misión ya iniciada',
        attempt: existingAttempt,
        mission
      });
    }
    
    // 6. Contar actividades de la misión
    const { count: totalActivities } = await supabase
      .from('gamification_activities')
      .select('*', { count: 'exact', head: true })
      .eq('mission_id', params.missionId)
      .eq('is_active', true);
    
    // 7. Crear nuevo intento
    const { data: newAttempt, error: attemptError } = await supabase
      .from('gamification_mission_attempts')
      .insert({
        user_id: user.id,
        mission_id: params.missionId,
        status: 'in_progress',
        score_percentage: 0,
        points_earned: 0,
        time_spent_seconds: 0,
        activities_completed: 0,
        total_activities: totalActivities || 0,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (attemptError) {
      console.error('Error creating attempt:', attemptError);
      return NextResponse.json(
        { error: 'Error al iniciar misión' },
        { status: 500 }
      );
    }
    
    // 8. Obtener actividades de la misión
    const { data: activities } = await supabase
      .from('gamification_activities')
      .select('*')
      .eq('mission_id', params.missionId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });
    
    return NextResponse.json({
      message: 'Misión iniciada exitosamente',
      attempt: newAttempt,
      mission,
      activities
    });
    
  } catch (error) {
    console.error('Error in start mission:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### Service Method

```typescript
// src/services/gamification.service.ts

export async function startMission(missionId: string) {
  const response = await fetch(`/api/missions/${missionId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al iniciar misión');
  }
  
  return response.json();
}
```

### React Component

```typescript
// src/components/features/missions/MissionCard.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startMission } from '@/services/gamification.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    description: string;
    difficulty_level: 'facil' | 'medio' | 'dificil';
    base_points: number;
    estimated_duration_minutes: number;
    topic: string;
  };
  userStatus?: 'not_started' | 'in_progress' | 'completed';
}

export function MissionCard({ mission, userStatus = 'not_started' }: MissionCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleStartMission = async () => {
    try {
      setIsLoading(true);
      const result = await startMission(mission.id);
      
      // Redirigir a la primera actividad
      if (result.activities && result.activities.length > 0) {
        router.push(`/missions/${mission.id}/activities/${result.activities[0].id}`);
      } else {
        router.push(`/missions/${mission.id}`);
      }
    } catch (error) {
      console.error('Error starting mission:', error);
      alert(error instanceof Error ? error.message : 'Error al iniciar misión');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDifficultyColor = () => {
    switch (mission.difficulty_level) {
      case 'facil': return 'green';
      case 'medio': return 'yellow';
      case 'dificil': return 'red';
      default: return 'gray';
    }
  };
  
  const getButtonText = () => {
    switch (userStatus) {
      case 'completed': return 'Completada ✓';
      case 'in_progress': return 'Continuar';
      case 'not_started': return 'Iniciar Misión';
      default: return 'Iniciar';
    }
  };
  
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{mission.title}</h3>
        <Badge color={getDifficultyColor()}>
          {mission.difficulty_level}
        </Badge>
      </div>
      
      <p className="text-gray-600 mb-4">{mission.description}</p>
      
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span>📚 {mission.topic}</span>
        <span>⏱️ {mission.estimated_duration_minutes} min</span>
        <span>⭐ {mission.base_points} puntos</span>
      </div>
      
      <Button
        onClick={handleStartMission}
        disabled={isLoading || userStatus === 'completed'}
        fullWidth
        variant={userStatus === 'completed' ? 'secondary' : 'primary'}
      >
        {isLoading ? 'Cargando...' : getButtonText()}
      </Button>
    </Card>
  );
}
```

---

## UC-E15: Completar Actividad Quiz

### API Endpoint

```typescript
// app/api/activities/[activityId]/submit/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface QuizAnswer {
  questionIndex: number;
  selectedOption: number;
}

export async function POST(
  request: Request,
  { params }: { params: { activityId: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { answers, missionAttemptId, timeSpent } = body as {
      answers: QuizAnswer[];
      missionAttemptId: string;
      timeSpent: number;
    };
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    // 2. Obtener actividad
    const { data: activity, error: activityError } = await supabase
      .from('gamification_activities')
      .select('*')
      .eq('id', params.activityId)
      .single();
    
    if (activityError || !activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }
    
    // 3. Validar respuestas
    const contentData = activity.content_data as {
      questions: Array<{
        question: string;
        options: string[];
        correct: number;
      }>;
    };
    
    let correctAnswers = 0;
    const feedback: Array<{
      questionIndex: number;
      isCorrect: boolean;
      correctAnswer: number;
      userAnswer: number;
    }> = [];
    
    answers.forEach((answer) => {
      const question = contentData.questions[answer.questionIndex];
      const isCorrect = answer.selectedOption === question.correct;
      
      if (isCorrect) correctAnswers++;
      
      feedback.push({
        questionIndex: answer.questionIndex,
        isCorrect,
        correctAnswer: question.correct,
        userAnswer: answer.selectedOption
      });
    });
    
    // 4. Calcular puntaje
    const totalQuestions = contentData.questions.length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    const pointsEarned = Math.round((scorePercentage / 100) * activity.points_value);
    
    // 5. Contar intentos previos
    const { count: attemptNumber } = await supabase
      .from('gamification_activity_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_id', params.activityId);
    
    // 6. Crear registro de intento
    const { data: activityAttempt, error: attemptError } = await supabase
      .from('gamification_activity_attempts')
      .insert({
        user_id: user.id,
        activity_id: params.activityId,
        mission_attempt_id: missionAttemptId,
        user_answers: answers,
        is_correct: scorePercentage === 100,
        score_percentage: scorePercentage,
        points_earned: pointsEarned,
        time_spent_seconds: timeSpent,
        attempt_number: (attemptNumber || 0) + 1,
        feedback: JSON.stringify(feedback),
        attempted_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (attemptError) {
      console.error('Error creating activity attempt:', attemptError);
      return NextResponse.json({ error: 'Error al guardar intento' }, { status: 500 });
    }
    
    // 7. Actualizar intento de misión
    const { data: missionAttempt } = await supabase
      .from('gamification_mission_attempts')
      .select('*')
      .eq('id', missionAttemptId)
      .single();
    
    if (missionAttempt) {
      const newActivitiesCompleted = missionAttempt.activities_completed + 1;
      const newPointsEarned = missionAttempt.points_earned + pointsEarned;
      const newTimeSpent = missionAttempt.time_spent_seconds + timeSpent;
      
      await supabase
        .from('gamification_mission_attempts')
        .update({
          activities_completed: newActivitiesCompleted,
          points_earned: newPointsEarned,
          time_spent_seconds: newTimeSpent,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', missionAttemptId);
    }
    
    // 8. Registrar transacción de puntos
    await supabase
      .from('gamification_points_transactions')
      .insert({
        user_id: user.id,
        points_change: pointsEarned,
        transaction_type: 'activity_complete',
        source_type: 'activity',
        source_id: params.activityId,
        description: `Actividad completada: ${activity.title}`,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      message: 'Actividad completada',
      activityAttempt,
      feedback,
      scorePercentage,
      pointsEarned,
      correctAnswers,
      totalQuestions
    });
    
  } catch (error) {
    console.error('Error in submit activity:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
```

### React Component

```typescript
// src/components/features/activities/QuizActivity.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface QuizActivityProps {
  activity: {
    id: string;
    title: string;
    prompt: string;
    content_data: {
      questions: QuizQuestion[];
    };
    points_value: number;
    time_limit_seconds?: number;
  };
  missionAttemptId: string;
  onComplete: (result: any) => void;
}

export function QuizActivity({ activity, missionAttemptId, onComplete }: QuizActivityProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  
  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Calcular tiempo transcurrido
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Convertir respuestas a formato esperado
      const answers = Object.entries(selectedAnswers).map(([questionIndex, selectedOption]) => ({
        questionIndex: parseInt(questionIndex),
        selectedOption
      }));
      
      // Enviar respuestas
      const response = await fetch(`/api/activities/${activity.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers,
          missionAttemptId,
          timeSpent
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al enviar respuestas');
      }
      
      const result = await response.json();
      onComplete(result);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error al enviar respuestas');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isAllAnswered = activity.content_data.questions.every(
    (_, index) => selectedAnswers[index] !== undefined
  );
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{activity.title}</h1>
      <p className="text-gray-600 mb-6">{activity.prompt}</p>
      
      <div className="space-y-6">
        {activity.content_data.questions.map((question, questionIndex) => (
          <Card key={questionIndex} className="p-6">
            <h3 className="font-semibold mb-4">
              {questionIndex + 1}. {question.question}
            </h3>
            
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`
                    flex items-center p-4 border rounded-lg cursor-pointer
                    transition-colors
                    ${selectedAnswers[questionIndex] === optionIndex
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    value={optionIndex}
                    checked={selectedAnswers[questionIndex] === optionIndex}
                    onChange={() => handleSelectAnswer(questionIndex, optionIndex)}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {Object.keys(selectedAnswers).length} de {activity.content_data.questions.length} respondidas
        </p>
        
        <Button
          onClick={handleSubmit}
          disabled={!isAllAnswered || isSubmitting}
          size="lg"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Respuestas'}
        </Button>
      </div>
    </div>
  );
}
```

---

## UC-E23: Completar Misión

### Database Function (Supabase)

```sql
-- Function to complete mission and trigger all related updates
CREATE OR REPLACE FUNCTION complete_mission(
  p_mission_attempt_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_mission_id UUID;
  v_points_earned INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_badges_earned JSON;
  v_result JSON;
BEGIN
  -- 1. Get mission attempt details
  SELECT user_id, mission_id, points_earned
  INTO v_user_id, v_mission_id, v_points_earned
  FROM gamification_mission_attempts
  WHERE id = p_mission_attempt_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Mission attempt not found';
  END IF;
  
  -- 2. Update mission attempt status
  UPDATE gamification_mission_attempts
  SET 
    status = 'completed',
    completed_at = NOW(),
    score_percentage = CASE 
      WHEN total_activities > 0 
      THEN (activities_completed::FLOAT / total_activities::FLOAT * 100)::INTEGER
      ELSE 0
    END
  WHERE id = p_mission_attempt_id;
  
  -- 3. Get old level
  SELECT nivel_actual INTO v_old_level
  FROM progreso_estudiantes
  WHERE id_estudiante = v_user_id;
  
  -- 4. Update student progress (this will trigger level calculation)
  UPDATE progreso_estudiantes
  SET 
    puntaje_total = puntaje_total + v_points_earned,
    actividades_completadas = actividades_completadas + 1,
    fecha_ultima_actualizacion = NOW()
  WHERE id_estudiante = v_user_id;
  
  -- 5. Get new level
  SELECT nivel_actual INTO v_new_level
  FROM progreso_estudiantes
  WHERE id_estudiante = v_user_id;
  
  -- 6. Register points transaction
  INSERT INTO gamification_points_transactions (
    user_id,
    points_change,
    transaction_type,
    source_type,
    source_id,
    description,
    created_at
  )
  VALUES (
    v_user_id,
    v_points_earned,
    'mission_complete',
    'mission',
    v_mission_id,
    'Mission completed',
    NOW()
  );
  
  -- 7. Check and award badges (this will be done by a separate function)
  SELECT check_and_award_badges(v_user_id) INTO v_badges_earned;
  
  -- 8. Build result
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'mission_id', v_mission_id,
    'points_earned', v_points_earned,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'level_up', v_new_level > v_old_level,
    'badges_earned', v_badges_earned
  );
  
  RETURN v_result;
END;
$$;
```

### API Endpoint

```typescript
// app/api/missions/[missionId]/complete/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { missionId: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { missionAttemptId } = body;
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    // 2. Verificar que el intento pertenece al usuario
    const { data: attempt, error: attemptError } = await supabase
      .from('gamification_mission_attempts')
      .select('*')
      .eq('id', missionAttemptId)
      .eq('user_id', user.id)
      .single();
    
    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 });
    }
    
    // 3. Verificar que todas las actividades están completadas
    if (attempt.activities_completed < attempt.total_activities) {
      return NextResponse.json(
        { 
          error: 'No se han completado todas las actividades',
          completed: attempt.activities_completed,
          total: attempt.total_activities
        },
        { status: 400 }
      );
    }
    
    // 4. Llamar a la función de base de datos para completar misión
    const { data: result, error: completeError } = await supabase
      .rpc('complete_mission', {
        p_mission_attempt_id: missionAttemptId
      });
    
    if (completeError) {
      console.error('Error completing mission:', completeError);
      return NextResponse.json({ error: 'Error al completar misión' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Misión completada exitosamente',
      ...result
    });
    
  } catch (error) {
    console.error('Error in complete mission:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
```

---

## UC-S01: Calcular Nivel

### Database Trigger

```sql
-- Trigger function to calculate level when points change
CREATE OR REPLACE FUNCTION calculate_student_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_level INTEGER;
  v_level_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  v_threshold INTEGER;
  v_level INTEGER := 1;
BEGIN
  -- Calculate level based on total points
  FOR v_level IN REVERSE 10..1 LOOP
    v_threshold := v_level_thresholds[v_level];
    IF NEW.puntaje_total >= v_threshold THEN
      v_new_level := v_level;
      EXIT;
    END IF;
  END LOOP;
  
  -- Update level if changed
  IF v_new_level IS NOT NULL AND v_new_level != OLD.nivel_actual THEN
    NEW.nivel_actual := v_new_level;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_calculate_level ON progreso_estudiantes;
CREATE TRIGGER trigger_calculate_level
  BEFORE UPDATE OF puntaje_total ON progreso_estudiantes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_student_level();
```

### TypeScript Implementation (Alternative)

```typescript
// src/lib/gamification/level-calculator.ts

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

export function calculateLevel(totalPoints: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getPointsForNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 0; // Max level reached
  }
  return LEVEL_THRESHOLDS[currentLevel] - currentPoints;
}

export function getLevelProgress(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 100; // Max level
  }
  
  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel];
  const pointsInCurrentLevel = currentPoints - currentLevelThreshold;
  const pointsNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  
  return Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
}
```

---

## UC-S02: Actualizar Racha

### Database Function

```sql
-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_streak RECORD;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_result JSON;
  v_bonus_multiplier DECIMAL := 1.0;
BEGIN
  -- Get or create streak record
  SELECT * INTO v_streak
  FROM gamification_streaks
  WHERE user_id = p_user_id;
  
  IF v_streak IS NULL THEN
    -- Create new streak
    INSERT INTO gamification_streaks (
      user_id,
      current_streak,
      longest_streak,
      last_activity_date,
      streak_started_at,
      total_active_days,
      updated_at
    )
    VALUES (
      p_user_id,
      1,
      1,
      v_today,
      v_today,
      1,
      NOW()
    )
    RETURNING * INTO v_streak;
    
    v_result := json_build_object(
      'current_streak', 1,
      'longest_streak', 1,
      'streak_continued', false,
      'streak_broken', false,
      'bonus_multiplier', 1.0
    );
    
  ELSIF v_streak.last_activity_date = v_today THEN
    -- Same day, no change
    v_result := json_build_object(
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak,
      'streak_continued', false,
      'streak_broken', false,
      'bonus_multiplier', 1.0
    );
    
  ELSIF v_streak.last_activity_date = v_yesterday THEN
    -- Consecutive day, increment streak
    UPDATE gamification_streaks
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = v_today,
      total_active_days = total_active_days + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_streak;
    
    -- Calculate bonus multiplier
    v_bonus_multiplier := CASE
      WHEN v_streak.current_streak >= 30 THEN 2.0
      WHEN v_streak.current_streak >= 14 THEN 1.5
      WHEN v_streak.current_streak >= 7 THEN 1.25
      WHEN v_streak.current_streak >= 3 THEN 1.1
      ELSE 1.0
    END;
    
    v_result := json_build_object(
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak,
      'streak_continued', true,
      'streak_broken', false,
      'bonus_multiplier', v_bonus_multiplier
    );
    
  ELSE
    -- Streak broken, reset
    UPDATE gamification_streaks
    SET 
      current_streak = 1,
      last_activity_date = v_today,
      streak_started_at = v_today,
      total_active_days = total_active_days + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_streak;
    
    v_result := json_build_object(
      'current_streak', 1,
      'longest_streak', v_streak.longest_streak,
      'streak_continued', false,
      'streak_broken', true,
      'bonus_multiplier', 1.0
    );
    
  END IF;
  
  RETURN v_result;
END;
$$;

-- Trigger to call this function after activity completion
CREATE OR REPLACE FUNCTION trigger_update_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_user_streak(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_streak_on_activity ON gamification_activity_attempts;
CREATE TRIGGER trigger_update_streak_on_activity
  AFTER INSERT ON gamification_activity_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak();
```

---

## UC-S03: Verificar y Otorgar Badges

### Database Function

```sql
-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_badge RECORD;
  v_user_has_badge BOOLEAN;
  v_criteria_met BOOLEAN;
  v_badges_awarded JSON[] := ARRAY[]::JSON[];
  v_badge_info JSON;
BEGIN
  -- Loop through all active badges
  FOR v_badge IN 
    SELECT * FROM gamification_badges WHERE is_active = true
  LOOP
    -- Check if user already has this badge
    SELECT EXISTS(
      SELECT 1 FROM gamification_user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) INTO v_user_has_badge;
    
    IF NOT v_user_has_badge THEN
      -- Check if user meets criteria
      v_criteria_met := false;
      
      CASE v_badge.criteria_type
        WHEN 'missions_completed' THEN
          SELECT COUNT(DISTINCT mission_id) >= v_badge.criteria_value
          INTO v_criteria_met
          FROM gamification_mission_attempts
          WHERE user_id = p_user_id AND status = 'completed';
          
        WHEN 'points_reached' THEN
          SELECT puntaje_total >= v_badge.criteria_value
          INTO v_criteria_met
          FROM progreso_estudiantes
          WHERE id_estudiante = p_user_id;
          
        WHEN 'streak_days' THEN
          SELECT current_streak >= v_badge.criteria_value
          INTO v_criteria_met
          FROM gamification_streaks
          WHERE user_id = p_user_id;
          
        WHEN 'perfect_scores' THEN
          SELECT COUNT(*) >= v_badge.criteria_value
          INTO v_criteria_met
          FROM gamification_mission_attempts
          WHERE user_id = p_user_id 
            AND status = 'completed' 
            AND score_percentage = 100;
            
        WHEN 'speed_bonus' THEN
          -- Count missions completed in less than half the estimated time
          SELECT COUNT(*) >= v_badge.criteria_value
          INTO v_criteria_met
          FROM gamification_mission_attempts ma
          JOIN gamification_missions m ON m.id = ma.mission_id
          WHERE ma.user_id = p_user_id 
            AND ma.status = 'completed'
            AND ma.time_spent_seconds < (m.estimated_duration_minutes * 30);
            
        ELSE
          v_criteria_met := false;
      END CASE;
      
      -- If criteria met, award badge
      IF v_criteria_met THEN
        -- Insert user badge
        INSERT INTO gamification_user_badges (
          user_id,
          badge_id,
          earned_at,
          progress_at_earning
        )
        VALUES (
          p_user_id,
          v_badge.id,
          NOW(),
          json_build_object(
            'criteria_type', v_badge.criteria_type,
            'criteria_value', v_badge.criteria_value
          )
        );
        
        -- Award points
        IF v_badge.points_reward > 0 THEN
          INSERT INTO gamification_points_transactions (
            user_id,
            points_change,
            transaction_type,
            source_type,
            source_id,
            description,
            created_at
          )
          VALUES (
            p_user_id,
            v_badge.points_reward,
            'badge_earned',
            'badge',
            v_badge.id,
            'Badge earned: ' || v_badge.name,
            NOW()
          );
          
          -- Update total points
          UPDATE progreso_estudiantes
          SET puntaje_total = puntaje_total + v_badge.points_reward
          WHERE id_estudiante = p_user_id;
        END IF;
        
        -- Add to result
        v_badge_info := json_build_object(
          'id', v_badge.id,
          'name', v_badge.name,
          'description', v_badge.description,
          'icon', v_badge.icon,
          'rarity', v_badge.rarity,
          'points_reward', v_badge.points_reward
        );
        
        v_badges_awarded := array_append(v_badges_awarded, v_badge_info);
      END IF;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'badges_awarded', v_badges_awarded,
    'count', array_length(v_badges_awarded, 1)
  );
END;
$$;
```

---

## UC-D12: Crear Misión

### React Component

```typescript
// src/components/features/teacher/CreateMissionForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

export function CreateMissionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    unit_number: 1,
    topic: '',
    title: '',
    description: '',
    difficulty_level: 'medio' as 'facil' | 'medio' | 'dificil',
    mission_type: 'mixed' as 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'speaking' | 'writing' | 'mixed',
    estimated_duration_minutes: 15,
    base_points: 100
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear misión');
      }
      
      const result = await response.json();
      
      // Redirigir a agregar actividades
      router.push(`/teacher/missions/${result.mission.id}/activities/new`);
      
    } catch (error) {
      console.error('Error creating mission:', error);
      alert('Error al crear misión');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Crear Nueva Misión</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Número de Unidad
          </label>
          <Input
            type="number"
            min="1"
            value={formData.unit_number}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              unit_number: parseInt(e.target.value)
            }))}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Tema
          </label>
          <Input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              topic: e.target.value
            }))}
            placeholder="Ej: Present Simple"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Título
        </label>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            title: e.target.value
          }))}
          placeholder="Título de la misión"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Descripción
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            description: e.target.value
          }))}
          placeholder="Describe la misión..."
          rows={4}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Dificultad
          </label>
          <Select
            value={formData.difficulty_level}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              difficulty_level: e.target.value as any
            }))}
          >
            <option value="facil">Fácil (100 pts)</option>
            <option value="medio">Medio (200 pts)</option>
            <option value="dificil">Difícil (300 pts)</option>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo de Misión
          </label>
          <Select
            value={formData.mission_type}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              mission_type: e.target.value as any
            }))}
          >
            <option value="grammar">Gramática</option>
            <option value="vocabulary">Vocabulario</option>
            <option value="reading">Lectura</option>
            <option value="listening">Escucha</option>
            <option value="speaking">Habla</option>
            <option value="writing">Escritura</option>
            <option value="mixed">Mixto</option>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Duración Estimada (minutos)
          </label>
          <Input
            type="number"
            min="5"
            max="120"
            value={formData.estimated_duration_minutes}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              estimated_duration_minutes: parseInt(e.target.value)
            }))}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Puntos Base
          </label>
          <Input
            type="number"
            min="10"
            max="1000"
            step="10"
            value={formData.base_points}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              base_points: parseInt(e.target.value)
            }))}
            required
          />
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Creando...' : 'Crear Misión y Agregar Actividades'}
        </Button>
      </div>
    </form>
  );
}
```

---

**Documento creado:** 2024-12-16  
**Versión:** 1.0  
**Estado:** ✅ Completo

Este documento proporciona ejemplos de código completos para los casos de uso más importantes. Cada ejemplo incluye:
- API endpoints
- Database functions
- Service methods
- React components
- Validaciones
- Manejo de errores
