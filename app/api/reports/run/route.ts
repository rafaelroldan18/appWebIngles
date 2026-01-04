
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { report_id, parallel_id, student_id, from_date, to_date } = body;

        const supabase = await createSupabaseClient(request);

        // 1. Obtener la definición del reporte
        const { data: definition, error: defError } = await supabase
            .from('report_definitions')
            .select('*')
            .eq('report_id', report_id)
            .single();

        if (defError) {
            return NextResponse.json({ error: 'Definición de reporte no encontrada' }, { status: 404 });
        }

        // 2. Registrar la ejecución del reporte
        const { data: run, error: runError } = await supabase
            .from('report_runs')
            .insert({
                report_id,
                parallel_id,
                student_id,
                from_date,
                to_date,
                requested_by: body.requested_by // Esto debería venir del auth si no se proporciona
            })
            .select()
            .single();

        if (runError) {
            return NextResponse.json({ error: runError.message }, { status: 400 });
        }

        // 3. Generar el payload del reporte (Lógica de negocio simplificada)
        let payload = {};

        if (definition.report_type === 'estudiante' && student_id) {
            // Obtener sesiones del estudiante
            const { data: sessions } = await supabase
                .from('game_sessions')
                .select('*, topics(title), game_types(name)')
                .eq('student_id', student_id);

            const { data: progress } = await supabase
                .from('student_progress')
                .select('*')
                .eq('student_id', student_id)
                .maybeSingle();

            payload = { sessions, progress };
        } else if (definition.report_type === 'paralelo' && parallel_id) {
            // Obtener progreso de todos los estudiantes del paralelo
            const { data: students } = await supabase
                .from('users')
                .select('*, student_progress(*)')
                .eq('parallel_id', parallel_id)
                .eq('role', 'estudiante');

            payload = { students };
        }
        // Agregar más tipos de reportes según sea necesario...

        // 4. Guardar el snapshot
        const { error: snapError } = await supabase
            .from('report_snapshots')
            .insert({
                run_id: run.run_id,
                payload: payload
            });

        if (snapError) {
            console.error('Error saving snapshot:', snapError);
        }

        return NextResponse.json({ ...run, payload });
    } catch (error) {
        console.error('Error in /api/reports/run:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
