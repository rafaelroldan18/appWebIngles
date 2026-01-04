/**
 * GET /api/reports/parallel-info
 * Provides basic information about a parallel (students and topics)
 * even when there are no completed game sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient(request);
        const { searchParams } = new URL(request.url);
        const parallelId = searchParams.get('parallelId');

        if (!parallelId) {
            return NextResponse.json(
                { error: 'parallelId is required' },
                { status: 400 }
            );
        }

        // 1. Get parallel information
        const { data: parallel, error: parallelError } = await supabase
            .from('parallels')
            .select('parallel_id, name, academic_year')
            .eq('parallel_id', parallelId)
            .single();

        if (parallelError || !parallel) {
            console.error('Parallel error or not found:', parallelError);
            return NextResponse.json(
                { error: 'Parallel not found' },
                { status: 404 }
            );
        }

        // 2. Get students in this parallel
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('user_id, first_name, last_name, email')
            .eq('parallel_id', parallelId)
            .eq('role', 'estudiante')
            .order('last_name', { ascending: true });

        if (studentsError) {
            console.error('Error fetching students:', studentsError);
        }

        // 3. Get topics - for now fetch all topics as there is no direct level link in parallels table
        // We could filter by missions later if needed
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('topic_id, title, description, level')
            .order('title', { ascending: true });

        if (topicsError) {
            console.error('Error fetching topics:', topicsError);
        }

        // 4. Get active missions for this parallel
        const { data: missions, error: missionsError } = await supabase
            .from('game_availability')
            .select(`
                availability_id,
                is_active,
                show_theory,
                max_attempts,
                available_from,
                available_until,
                game_types(name),
                topics(title)
            `)
            .eq('parallel_id', parallelId)
            .order('available_from', { ascending: false });

        if (missionsError) {
            console.error('Error fetching missions:', missionsError);
        }

        const getRelationData = (data: any, field: string) => {
            if (!data) return null;
            if (Array.isArray(data)) return data[0]?.[field];
            return data[field];
        };

        return NextResponse.json({
            parallel: {
                id: parallel.parallel_id,
                name: parallel.name,
                level: parallel.academic_year
            },
            students: (students || []).map(s => ({
                id: s.user_id,
                name: `${s.first_name} ${s.last_name}`,
                email: s.email
            })),
            topics: (topics || []).map(t => ({
                id: t.topic_id,
                title: t.title,
                description: t.description
            })),
            missions: (missions || []).map(m => ({
                id: m.availability_id,
                game: getRelationData(m.game_types, 'name') || 'Desconocido',
                topic: getRelationData(m.topics, 'title') || 'Sin tema',
                isActive: m.is_active,
                showTheory: m.show_theory,
                maxAttempts: m.max_attempts,
                availableFrom: m.available_from,
                availableUntil: m.available_until
            }))
        });

    } catch (error) {
        console.error('Error in GET /api/reports/parallel-info:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
