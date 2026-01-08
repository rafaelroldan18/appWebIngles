
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parallelId = searchParams.get('parallelId');
        const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default to true

        if (!parallelId) {
            return NextResponse.json({ error: 'parallelId es requerido' }, { status: 400 });
        }

        const supabase = await createSupabaseClient(request);

        let query = supabase
            .from('game_availability')
            .select(`
        availability_id,
        game_type_id,
        topic_id,
        parallel_id,
        available_from,
        available_until,
        max_attempts,
        created_at,
        show_theory,
        is_active,
        mission_title,
        mission_instructions,
        mission_config,
        game_types (name, description),
        topics (title, description)
      `)
            .eq('parallel_id', parallelId);

        // Filter by active status if requested (default behavior for students)
        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/availability:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = await createSupabaseClient(request);

        // ========================================
        // VALIDACIONES DE CAMPOS DE MISIÓN
        // ========================================

        // 1. Validar mission_title (requerido o autogenerado)
        let missionTitle = body.mission_title?.trim();
        if (!missionTitle) {
            // Autogenerar título basado en game_type y topic
            const { data: gameType } = await supabase
                .from('game_types')
                .select('name')
                .eq('game_type_id', body.game_type_id)
                .single();

            const { data: topic } = await supabase
                .from('topics')
                .select('title')
                .eq('topic_id', body.topic_id)
                .single();

            missionTitle = `${gameType?.name || 'Juego'} - ${topic?.title || 'Tema'}`;
        }

        // 2. Validar mission_instructions (requerido, mínimo 10 caracteres)
        const missionInstructions = body.mission_instructions?.trim();
        if (!missionInstructions || missionInstructions.length < 10) {
            return NextResponse.json(
                { error: 'mission_instructions es requerido y debe tener al menos 10 caracteres' },
                { status: 400 }
            );
        }

        // 3. Validar mission_config (debe ser JSON válido)
        let missionConfig = body.mission_config || {};
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

        // ========================================
        // PREPARAR DATOS PARA INSERCIÓN
        // ========================================

        const insertData = {
            game_type_id: body.game_type_id,
            topic_id: body.topic_id,
            parallel_id: body.parallel_id,
            available_from: body.available_from,
            available_until: body.available_until,
            max_attempts: body.max_attempts,
            show_theory: body.show_theory !== undefined ? body.show_theory : true,
            is_active: body.is_active !== undefined ? body.is_active : false,
            // Nuevos campos de misión
            mission_title: missionTitle,
            mission_instructions: missionInstructions,
            mission_config: missionConfig,
            // Si la misión se crea como activa, establecer activated_at
            ...(body.is_active === true && { activated_at: new Date().toISOString() })
        };

        // Intentar insertar
        let { data, error } = await supabase
            .from('game_availability')
            .insert(insertData)
            .select('availability_id, mission_title')
            .single();

        // Si falla porque la columna 'activated_at' no existe (error común de caché o migración pendiente)
        if (error && (error.message.includes('activated_at') || error.code === '42703')) {
            console.warn('[API] activated_at column missing, retrying without it...');
            const { activated_at, ...fallbackData } = insertData;
            const retry = await supabase
                .from('game_availability')
                .insert(fallbackData)
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
        console.error('Error in /api/games/availability POST:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
