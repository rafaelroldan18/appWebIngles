/**
 * POST /api/games/content
 * Create new game content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient(request);

        // Get request body
        const body = await request.json();
        const { topic_id, content_type, content_text, is_correct, image_url, metadata } = body;

        // Validate required fields
        if (!topic_id || !content_type || !content_text) {
            return NextResponse.json(
                { error: 'Missing required fields: topic_id, content_type, content_text' },
                { status: 400 }
            );
        }

        // Validate content_type
        const validTypes = ['word', 'sentence', 'location', 'image-word-pair'];
        if (!validTypes.includes(content_type)) {
            return NextResponse.json(
                { error: `Invalid content_type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Insert content
        const { data, error } = await supabase
            .from('game_content')
            .insert({
                topic_id,
                content_type,
                content_text,
                is_correct: is_correct ?? true,
                image_url: image_url || null,
                metadata: metadata || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating game content:', error);
            return NextResponse.json(
                { error: 'Failed to create game content' },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/games/content:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
