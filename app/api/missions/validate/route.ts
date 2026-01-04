import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mission Validation Endpoint
 * Validates if a student can play a specific game mission
 * 
 * Checks:
 * 1. Mission exists (game_availability)
 * 2. Mission is within date range
 * 3. Student hasn't exceeded max attempts
 * 4. Student belongs to the correct parallel
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const topicId = searchParams.get('topicId');
        const gameTypeId = searchParams.get('gameTypeId');
        const parallelId = searchParams.get('parallelId');

        // Validate required parameters
        if (!studentId || !topicId || !gameTypeId || !parallelId) {
            return NextResponse.json(
                {
                    isValid: false,
                    canPlay: false,
                    reason: 'Parámetros incompletos'
                },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseClient(request);

        // 1. Check if mission exists and is for the correct parallel
        const { data: availability, error: availError } = await supabase
            .from('game_availability')
            .select('*')
            .eq('topic_id', topicId)
            .eq('game_type_id', gameTypeId)
            .eq('parallel_id', parallelId)
            .maybeSingle();

        if (availError || !availability) {
            return NextResponse.json({
                isValid: false,
                canPlay: false,
                reason: 'No existe una misión activa para este juego y tema',
            });
        }

        // 2. Check date range
        const now = new Date();
        const availableFrom = new Date(availability.available_from);
        const availableUntil = availability.available_until
            ? new Date(availability.available_until)
            : null;

        if (now < availableFrom) {
            return NextResponse.json({
                isValid: true,
                canPlay: false,
                reason: `Esta misión estará disponible desde ${availableFrom.toLocaleDateString()}`,
                availabilityData: availability,
            });
        }

        if (availableUntil && now > availableUntil) {
            return NextResponse.json({
                isValid: true,
                canPlay: false,
                reason: `Esta misión expiró el ${availableUntil.toLocaleDateString()}`,
                availabilityData: availability,
            });
        }

        // 3. Count student's attempts for this specific mission
        const { data: sessions, error: sessionsError } = await supabase
            .from('game_sessions')
            .select('session_id, completed')
            .eq('student_id', studentId)
            .eq('topic_id', topicId)
            .eq('game_type_id', gameTypeId);

        if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError);
            return NextResponse.json({
                isValid: true,
                canPlay: true,
                reason: 'No se pudo verificar intentos previos, se permite jugar',
                attemptsRemaining: availability.max_attempts,
                availabilityData: availability,
            });
        }

        const attemptsUsed = sessions?.length || 0;
        const attemptsRemaining = availability.max_attempts - attemptsUsed;

        if (attemptsRemaining <= 0) {
            return NextResponse.json({
                isValid: true,
                canPlay: false,
                reason: 'Has agotado todos tus intentos para esta misión',
                attemptsRemaining: 0,
                availabilityData: availability,
            });
        }

        // 4. All checks passed - mission is valid and playable
        return NextResponse.json({
            isValid: true,
            canPlay: true,
            attemptsRemaining: attemptsRemaining,
            attemptsUsed: attemptsUsed,
            maxAttempts: availability.max_attempts,
            availabilityData: availability,
            message: attemptsRemaining === 1
                ? '⚠️ Este es tu último intento'
                : `Tienes ${attemptsRemaining} intentos restantes`,
        });

    } catch (error) {
        console.error('Error in /api/missions/validate:', error);
        return NextResponse.json(
            {
                isValid: false,
                canPlay: false,
                reason: 'Error interno del servidor'
            },
            { status: 500 }
        );
    }
}
