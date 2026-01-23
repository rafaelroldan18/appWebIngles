/**
 * POST /api/games/types/seed
 * Seed the game_types table with the 5 game types
 * This should be run once to populate the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

const GAME_TYPES = [
    {
        name: 'word_catcher',
        description: 'Catch falling words - vocabulary practice game'
    },
    {
        name: 'grammar_run',
        description: 'Run and choose correct grammar options'
    },
    {
        name: 'sentence_builder',
        description: 'Build sentences by arranging words in correct order'
    },
    {
        name: 'image_match',
        description: 'Match images with their corresponding words'
    },
    {
        name: 'city_explorer',
        description: 'Explore the city and learn location-based vocabulary'
    }
];

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient(request);

        // Check if game types already exist
        const { data: existing } = await supabase
            .from('game_types')
            .select('name');

        if (existing && existing.length > 0) {
            return NextResponse.json({
                message: 'Game types already exist',
                existing: existing.map(g => g.name)
            });
        }

        // Insert game types
        const { data, error } = await supabase
            .from('game_types')
            .insert(GAME_TYPES)
            .select();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Game types seeded successfully',
            data
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
