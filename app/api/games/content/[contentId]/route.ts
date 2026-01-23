/**
 * PUT /api/games/content/[contentId]
 * Update existing game content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

interface RouteParams {
    params: Promise<{
        contentId: string;
    }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createSupabaseClient(request);
        const { contentId } = await params;

        // Get request body
        const body = await request.json();
        const { content_type, content_text, is_correct, image_url, metadata, target_game_type_id } = body;

        // Build update object (only include provided fields)
        const updates: any = {};

        // Si se proporciona target_game_type_id (como string/nombre), buscar su UUID
        if (target_game_type_id !== undefined) {
            // Convertir de snake_case a Title Case
            const formatGameTypeName = (name: string): string => {
                return name
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            };

            const formattedName = formatGameTypeName(target_game_type_id);

            const { data: gameType, error: gameTypeError } = await supabase
                .from('game_types')
                .select('game_type_id')
                .eq('name', formattedName)
                .single();

            if (gameTypeError || !gameType) {
                return NextResponse.json(
                    { error: `Game type '${target_game_type_id}' (${formattedName}) not found` },
                    { status: 400 }
                );
            }

            updates.target_game_type_id = gameType.game_type_id;
        }

        if (content_type !== undefined) updates.content_type = content_type;
        if (content_text !== undefined) updates.content_text = content_text;
        if (is_correct !== undefined) updates.is_correct = is_correct;
        if (image_url !== undefined) updates.image_url = image_url;
        if (metadata !== undefined) updates.metadata = metadata;

        // Update content
        const { data, error } = await supabase
            .from('game_content')
            .update(updates)
            .eq('content_id', contentId)
            .select()
            .single();

        if (error) {
            console.error('Error updating game content:', error);
            return NextResponse.json(
                { error: 'Failed to update game content' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Content not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createSupabaseClient(request);
        const { contentId } = await params;

        // Delete content
        const { error } = await supabase
            .from('game_content')
            .delete()
            .eq('content_id', contentId);

        if (error) {
            return NextResponse.json(
                { error: 'Failed to delete game content' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
