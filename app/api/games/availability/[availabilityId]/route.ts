
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ availabilityId: string }> }
) {
    try {
        const { availabilityId } = await params;
        const supabase = await createSupabaseClient(request);

        const { data, error } = await supabase
            .from('game_availability')
            .select(`
                availability_id, game_type_id, topic_id, parallel_id, 
                available_from, available_until, max_attempts, created_at, 
                show_theory, is_active, mission_title, mission_instructions, mission_config,
                game_types (name, description),
                topics (title, description)
            `)
            .eq('availability_id', availabilityId)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ availabilityId: string }> }
) {
    try {
        const { availabilityId } = await params;
        const body = await request.json();
        const supabase = await createSupabaseClient(request);

        // Validar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Obtener el estado actual de la misión
        let { data: currentMission, error: fetchError } = await supabase
            .from('game_availability')
            .select('is_active, activated_at')
            .eq('availability_id', availabilityId)
            .single();

        // Si falla por la columna inexistente, intentar solo con is_active
        if (fetchError && fetchError.message.includes('activated_at')) {
            const retryFetch = await supabase
                .from('game_availability')
                .select('is_active')
                .eq('availability_id', availabilityId)
                .single();
            currentMission = retryFetch.data as any;
        }

        // ========================================
        // VALIDACIONES DE CAMPOS DE MISIÓN
        // ========================================

        let missionTitle = body.mission_title?.trim();
        let missionInstructions = body.mission_instructions?.trim();
        let missionConfig = body.mission_config;

        // Validar mission_title si se proporciona
        if (body.mission_title !== undefined && !missionTitle) {
            return NextResponse.json(
                { error: 'mission_title no puede estar vacío' },
                { status: 400 }
            );
        }

        // Validar mission_instructions si se proporciona (mínimo 10 caracteres)
        if (body.mission_instructions !== undefined) {
            if (!missionInstructions || missionInstructions.length < 10) {
                return NextResponse.json(
                    { error: 'mission_instructions debe tener al menos 10 caracteres' },
                    { status: 400 }
                );
            }
        }

        // Validar mission_config si se proporciona (debe ser JSON válido)
        if (body.mission_config !== undefined) {
            if (typeof missionConfig === 'string') {
                try {
                    missionConfig = JSON.parse(missionConfig);
                } catch (e) {
                    return NextResponse.json(
                        { error: 'mission_config debe ser un JSON válido' },
                        { status: 400 }
                    );
                }
            }

            if (typeof missionConfig !== 'object' || Array.isArray(missionConfig)) {
                return NextResponse.json(
                    { error: 'mission_config debe ser un objeto JSON' },
                    { status: 400 }
                );
            }
        }

        // ========================================
        // PREPARAR DATOS PARA ACTUALIZACIÓN
        // ========================================

        const updateData: any = {
            game_type_id: body.game_type_id,
            topic_id: body.topic_id,
            available_from: body.available_from,
            available_until: body.available_until,
            max_attempts: body.max_attempts,
            show_theory: body.show_theory !== undefined ? body.show_theory : true,
            is_active: body.is_active !== undefined ? body.is_active : false,
        };

        // Agregar campos de misión si se proporcionan
        if (missionTitle !== undefined) {
            updateData.mission_title = missionTitle;
        }
        if (missionInstructions !== undefined) {
            updateData.mission_instructions = missionInstructions;
        }
        if (missionConfig !== undefined) {
            updateData.mission_config = missionConfig;
        }

        // Si se está activando la misión (cambiando de inactiva a activa) y no tiene activated_at, establecerlo
        // Para esto, necesitamos saber si estaba activa antes. currentMission solo tiene 'is_active'.
        // Si 'activated_at' no existe en la tabla, esta lógica se ajustará.
        // Por ahora, asumimos que si se envía is_active=true y antes era false, se intenta establecer activated_at.
        if (body.is_active === true && currentMission && !currentMission.is_active) {
            updateData.activated_at = new Date().toISOString();
        }

        // Intentar actualizar
        let { data, error } = await supabase
            .from('game_availability')
            .update(updateData)
            .eq('availability_id', availabilityId)
            .select('availability_id, mission_title')
            .single();

        // Si falla porque la columna 'activated_at' no existe (error común de caché o migración pendiente)
        if (error && (error.message.includes('activated_at') || error.code === '42703')) {
            console.warn('[API] activated_at column missing, retrying update without it...');
            const { activated_at, ...fallbackData } = updateData;
            const retry = await supabase
                .from('game_availability')
                .update(fallbackData)
                .eq('availability_id', availabilityId)
                .select('availability_id, mission_title')
                .single();
            data = retry.data;
            error = retry.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ availabilityId: string }> }
) {
    try {
        const { availabilityId } = await params;
        const supabase = await createSupabaseClient(request);

        // Validar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // 1. Obtener detalles de la misión antes de borrarla para saber qué registros limpiar
        const { data: mission, error: getError } = await supabase
            .from('game_availability')
            .select('topic_id, game_type_id, parallel_id')
            .eq('availability_id', availabilityId)
            .single();

        if (getError || !mission) {
            return NextResponse.json({ error: 'Misión no encontrada o ya eliminada' }, { status: 404 });
        }

        // 2. Obtener IDs de los estudiantes en ese paralelo
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('user_id')
            .eq('parallel_id', mission.parallel_id)
            .eq('role', 'estudiante');

        if (studentsError) {
        }
        let sessionsDeleted = 0;
        if (students && students.length > 0) {
            const studentIds = students.map(s => s.user_id);

            // 3. Obtener las sesiones antes de borrarlas para restar los puntos del progreso
            const { data: sessionsToClean, error: fetchSessionsError } = await supabase
                .from('game_sessions')
                .select('student_id, score, completed')
                .eq('topic_id', mission.topic_id)
                .eq('game_type_id', mission.game_type_id)
                .in('student_id', studentIds);

            if (!fetchSessionsError && sessionsToClean && sessionsToClean.length > 0) {
                // Agrupar impacto por estudiante
                const impactPerStudent: Record<string, { score: number, completions: number }> = {};

                sessionsToClean.forEach(session => {
                    if (!impactPerStudent[session.student_id]) {
                        impactPerStudent[session.student_id] = { score: 0, completions: 0 };
                    }
                    impactPerStudent[session.student_id].score += (session.score || 0);
                    if (session.completed) {
                        impactPerStudent[session.student_id].completions += 1;
                    }
                });

                // Actualizar el progreso de cada estudiante restando lo ganado en esta misión
                for (const studentId in impactPerStudent) {
                    const impact = impactPerStudent[studentId];
                    if (impact.score > 0 || impact.completions > 0) {
                        // Usamos raw SQL o RPC si estuviera disponible, pero aquí lo haremos con una resta manual
                        // Primero obtenemos el progreso actual
                        const { data: currentProgress } = await supabase
                            .from('student_progress')
                            .select('total_score, activities_completed')
                            .eq('student_id', studentId)
                            .single();

                        if (currentProgress) {
                            await supabase
                                .from('student_progress')
                                .update({
                                    total_score: Math.max(0, currentProgress.total_score - impact.score),
                                    activities_completed: Math.max(0, currentProgress.activities_completed - impact.completions),
                                    last_updated_at: new Date().toISOString()
                                })
                                .eq('student_id', studentId);
                        }
                    }
                }
            }

            // 4. Borrar sesiones de esos estudiantes para ese tema y juego específico
            const { count, error: sessionsError } = await supabase
                .from('game_sessions')
                .delete()
                .eq('topic_id', mission.topic_id)
                .eq('game_type_id', mission.game_type_id)
                .in('student_id', studentIds);

            if (sessionsError) {
            } else {
                sessionsDeleted = count || 0;
            }
        }

        // 4. Finalmente borrar la misión (disponibilidad)
        const { data: deletedData, error: deleteError } = await supabase
            .from('game_availability')
            .delete()
            .eq('availability_id', availabilityId)
            .select('availability_id');

        if (deleteError) {
            return NextResponse.json({
                error: 'No se pudo eliminar la misión principal.',
                message: deleteError.message,
                code: deleteError.code
            }, { status: 400 });
        }

        if (!deletedData || deletedData.length === 0) {
            return NextResponse.json({
                error: 'La misión no existe o no tiene permisos para eliminarla.',
                details: 'Zero rows affected'
            }, { status: 404 });
        }


        return NextResponse.json({
            success: true,
            message: 'Misión eliminada correctamente.',
            details: {
                missionDeleted: true,
                sessionsCleared: sessionsDeleted,
                missionId: availabilityId
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error.message
        }, { status: 500 });
    }
}
