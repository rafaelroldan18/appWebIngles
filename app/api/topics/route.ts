/**
 * GET /api/topics
 * Get all topics or filter by level/teacher
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient(request);
        const { searchParams } = new URL(request.url);

        const level = searchParams.get('level');
        const teacherId = searchParams.get('teacherId');
        const topicId = searchParams.get('topicId');

        let query = supabase
            .from('topics')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (level) {
            query = query.eq('level', level);
        }
        if (teacherId) {
            query = query.eq('created_by', teacherId);
        }
        if (topicId) {
            query = query.eq('topic_id', topicId);
        }

        const { data, error } = await query;

        if (error) {
            //console.error('Error fetching topics:', error);
            return NextResponse.json(
                { error: 'Failed to fetch topics' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        //console.error('Error in GET /api/topics:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
