/**
 * PUT /api/topics/[topicId]
 * Update existing topic
 * 
 * DELETE /api/topics/[topicId]
 * Delete topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

interface RouteParams {
    params: Promise<{
        topicId: string;
    }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createSupabaseClient(request);
        const { topicId } = await params;

        // Get request body
        const body = await request.json();
        const { title, description, level, theory_content } = body;

        // Build update object (only include provided fields)
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (level !== undefined) updates.level = level;
        if (theory_content !== undefined) updates.theory_content = theory_content;

        // Update topic
        const { data, error } = await supabase
            .from('topics')
            .update(updates)
            .eq('topic_id', topicId)
            .select()
            .single();

        if (error) {
            console.error('Error updating topic:', error);
            return NextResponse.json(
                { error: 'Failed to update topic' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in PUT /api/topics/[topicId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createSupabaseClient(request);
        const { topicId } = await params;

        // Check if topic has content
        const { data: contentData } = await supabase
            .from('game_content')
            .select('content_id')
            .eq('topic_id', topicId)
            .limit(1);

        if (contentData && contentData.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete topic with existing content. Delete content first.' },
                { status: 400 }
            );
        }

        // Delete topic
        const { error } = await supabase
            .from('topics')
            .delete()
            .eq('topic_id', topicId);

        if (error) {
            console.error('Error deleting topic:', error);
            return NextResponse.json(
                { error: 'Failed to delete topic' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/topics/[topicId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
