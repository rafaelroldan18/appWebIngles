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
        const items = Array.isArray(body) ? body : [body];

        if (items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        // Validate items
        for (const item of items) {
            const { topic_id, content_type, content_text, target_game_type_id } = item;
            if (!topic_id || !content_type || !content_text || !target_game_type_id) {
                return NextResponse.json(
                    { error: 'Missing required fields in one or more items: topic_id, content_type, content_text, target_game_type_id' },
                    { status: 400 }
                );
            }
        }

        // Cache for game type UUIDs
        const gameTypeMap = new Map();

        const formatGameTypeName = (name: string): string => {
            return name
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        const insertPayloads = [];

        for (const item of items) {
            const { topic_id, content_type, content_text, is_correct, image_url, metadata, target_game_type_id } = item;

            // Get game type UUID
            let gameTypeId = gameTypeMap.get(target_game_type_id);
            if (!gameTypeId) {
                const formattedName = formatGameTypeName(target_game_type_id);
                const { data: gameType } = await supabase
                    .from('game_types')
                    .select('game_type_id')
                    .eq('name', formattedName)
                    .single();

                if (gameType) {
                    gameTypeId = gameType.game_type_id;
                    gameTypeMap.set(target_game_type_id, gameTypeId);
                } else {
                    return NextResponse.json(
                        { error: `Game type '${target_game_type_id}' not found` },
                        { status: 400 }
                    );
                }
            }

            insertPayloads.push({
                topic_id,
                target_game_type_id: gameTypeId,
                content_type,
                content_text,
                is_correct: is_correct ?? true,
                image_url: image_url || null,
                metadata: metadata || null,
            });
        }

        // Insert all content
        const { data, error } = await supabase
            .from('game_content')
            .insert(insertPayloads)
            .select();

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create game content' },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
