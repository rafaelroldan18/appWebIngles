
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get('topicId');
        const targetGameTypeId = searchParams.get('targetGameTypeId');

        if (!topicId) {
            return NextResponse.json({ error: 'topicId es requerido' }, { status: 400 });
        }

        const supabase = await createSupabaseClient(request);

        // Convertir nombre de formato snake_case a Title Case
        const formatGameTypeName = (name: string): string => {
            return name
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        // Si se proporciona targetGameTypeId, necesitamos buscar su UUID
        let gameTypeUuid = null;
        if (targetGameTypeId) {
            const formattedName = formatGameTypeName(targetGameTypeId);
            console.log(`[API GET] Converting '${targetGameTypeId}' to '${formattedName}'`);

            const { data: gameType } = await supabase
                .from('game_types')
                .select('game_type_id')
                .eq('name', formattedName)
                .single();

            if (gameType) {
                gameTypeUuid = gameType.game_type_id;
            }
        }

        // Query con join a game_types para obtener el nombre
        let query = supabase
            .from('game_content')
            .select(`
                *,
                game_types!target_game_type_id (
                    name
                )
            `)
            .eq('topic_id', topicId);

        // Filtrar por UUID del game_type si se encontró
        if (gameTypeUuid) {
            query = query.eq('target_game_type_id', gameTypeUuid);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Convertir de Title Case a snake_case
        const toSnakeCase = (str: string): string => {
            return str
                .split(' ')
                .map(word => word.toLowerCase())
                .join('_');
        };

        // Transformar datos para incluir target_game_type_id como string (snake_case)
        const enrichedData = data.map((item: any) => ({
            ...item,
            target_game_type_id: item.game_types?.name ? toSnakeCase(item.game_types.name) : null,
            game_types: undefined // Remover el objeto anidado
        }));

        console.log(`[API] Loaded ${enrichedData.length} items for topic ${topicId}${targetGameTypeId ? ` and game ${targetGameTypeId}` : ''}`);

        return NextResponse.json(enrichedData);
    } catch (error) {
        console.error('Error in /api/games/content:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
