import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { checkAndAwardBadges } from '../../../lib/badge-assignment';

export const dynamic = 'force-dynamic';

const BASE_POINTS = 10;
const PERFECT_BONUS = 5;
const MISSION_COMPLETE_BONUS = 20;

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    // Auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Payload requerido' }, { status: 400 });
    }

    const {
      activity_id,
      mission_id,
      user_answers,
      is_correct,
      score_percentage,
      time_spent_seconds = 0,
    } = body;

    if (!activity_id || !mission_id || typeof score_percentage !== 'number') {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 });
    }

    // Map to users.user_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userId = currentUser.user_id as string;
    const service = createServiceRoleClient();


    // Calculate points for this activity
    const activityPoints = BASE_POINTS + (score_percentage === 100 ? PERFECT_BONUS : 0);

    // Get or create mission attempt (buscar el más reciente)
    let { data: existingAttempt } = await service
      .from('gamification_mission_attempts')
      .select('id, status, total_activities, activities_completed, points_earned')
      .eq('user_id', userId)
      .eq('mission_id', mission_id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let attemptId = existingAttempt?.id as string | undefined;

    // Si el intento ya está completado, no permitir más actividades
    if (existingAttempt && existingAttempt.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Esta misión ya fue completada',
        mission_attempt: existingAttempt,
        missionCompleted: true,
      });
    }

    if (!attemptId) {
      // Obtener el total de actividades de la misión
      const { data: activities } = await service
        .from('gamification_activities')
        .select('id')
        .eq('mission_id', mission_id)
        .eq('is_active', true);

      const totalActivities = activities?.length ?? 0;

      if (totalActivities === 0) {
        return NextResponse.json({ error: 'No hay actividades en esta misión' }, { status: 400 });
      }

      const { data: newAttempt, error: createErr } = await service
        .from('gamification_mission_attempts')
        .insert({
          user_id: userId,
          mission_id,
          status: 'in_progress',
          total_activities: totalActivities,
          activities_completed: 0,
          points_earned: 0,
          score_percentage: 0,
          time_spent_seconds: 0,
          started_at: new Date().toISOString(),
        })
        .select('id, status, total_activities, activities_completed, points_earned')
        .single();

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }
      attemptId = newAttempt.id;
      existingAttempt = newAttempt;
    }


    // Si total_activities es 0, recalcular
    if (existingAttempt?.total_activities === 0) {
      const { data: activities } = await service
        .from('gamification_activities')
        .select('id')
        .eq('mission_id', mission_id)
        .eq('is_active', true);

      const totalActivities = activities?.length ?? 0;

      if (totalActivities > 0) {
        await service
          .from('gamification_mission_attempts')
          .update({ total_activities: totalActivities })
          .eq('id', attemptId);

        if (existingAttempt) {
          existingAttempt.total_activities = totalActivities;
        }
      }
    }

    // Check if this activity was already completed in this mission attempt
    const { data: previousAttempts } = await service
      .from('gamification_activity_attempts')
      .select('id, points_earned')
      .eq('user_id', userId)
      .eq('activity_id', activity_id)
      .eq('mission_attempt_id', attemptId);

    const isNewActivity = !previousAttempts || previousAttempts.length === 0;

    // Create activity attempt record
    const { error: activityErr } = await service
      .from('gamification_activity_attempts')
      .insert({
        user_id: userId,
        activity_id,
        mission_attempt_id: attemptId,
        score_percentage,
        points_earned: activityPoints,
        time_spent_seconds,
      });

    if (activityErr) {
      return NextResponse.json({ error: activityErr.message }, { status: 500 });
    }

    // Register points transaction
    if (isNewActivity && activityPoints > 0) {
      await service
        .from('gamification_points_transactions')
        .insert({
          user_id: userId,
          points_change: activityPoints,
          transaction_type: 'activity_complete',
          source_type: 'activity',
          source_id: activity_id,
          description: `Puntos por actividad (${score_percentage}%)`,
        });
    }

    // Update mission attempt progress
    const newActivitiesCompleted = (existingAttempt?.activities_completed || 0) + (isNewActivity ? 1 : 0);
    const newPointsEarned = (existingAttempt?.points_earned || 0) + (isNewActivity ? activityPoints : 0);
    const totalActivities = existingAttempt?.total_activities || 0;
    const missionCompleted = totalActivities > 0 && newActivitiesCompleted >= totalActivities;

    let finalPoints = newPointsEarned;

    // Add mission completion bonus
    if (missionCompleted) {
      finalPoints += MISSION_COMPLETE_BONUS;
    }

    const { data: updated, error: updateErr } = await service
      .from('gamification_mission_attempts')
      .update({
        activities_completed: newActivitiesCompleted,
        points_earned: finalPoints,
        status: missionCompleted ? 'completed' : 'in_progress',
        completed_at: missionCompleted ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select('id, activities_completed, total_activities, points_earned, status')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If mission completed, register bonus transaction
    if (missionCompleted) {
      await service
        .from('gamification_points_transactions')
        .insert({
          user_id: userId,
          points_change: MISSION_COMPLETE_BONUS,
          transaction_type: 'mission_complete',
          source_type: 'mission',
          source_id: mission_id,
          description: `Bonus por completar misión`,
        });
    }

    // Check and assign badges
    const newBadges = await checkAndAwardBadges(service, userId);

    return NextResponse.json({
      success: true,
      activity_attempt_id: attemptId,
      mission_attempt: updated,
      pointsEarned: isNewActivity ? activityPoints : 0,
      missionCompleted,
      newBadges,
    });
  } catch (error: any) {
    console.error('Error completing activity:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
