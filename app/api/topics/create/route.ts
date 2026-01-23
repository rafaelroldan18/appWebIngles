/**
 * POST /api/topics/create
 * Create a new topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient(request);

        // Get request body
        const body = await request.json();
        const { title, description, level, theory_content, created_by } = body;

        // Validate required fields
        if (!title || !level || !created_by) {
            return NextResponse.json(
                { error: 'Missing required fields: title, level, created_by' },
                { status: 400 }
            );
        }

        // Insert topic
        const { data, error } = await supabase
            .from('topics')
            .insert({
                title,
                description: description || null,
                level,
                theory_content: theory_content || null,
                created_by,
            })
            .select()
            .single();

        if (error) {
           // console.error('Error creating topic:', error);
            return NextResponse.json(
                { error: 'Failed to create topic' },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        //console.error('Error in POST /api/topics/create:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
