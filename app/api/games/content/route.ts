
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

        // Verificar si ya es un UUID (8-4-4-4-12 chars)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetGameTypeId || '');

        if (isUuid) {
            gameTypeUuid = targetGameTypeId;
            console.log(`[API GET] Using UUID directly: ${gameTypeUuid}`);
        } else if (targetGameTypeId) {
            const formattedName = formatGameTypeName(targetGameTypeId);
            console.log(`[API GET] Converting slug '${targetGameTypeId}' to name '${formattedName}'`);

            const { data: gameType } = await supabase
                .from('game_types')
                .select('game_type_id')
                .eq('name', formattedName)
                .single();

            if (gameType) {
                gameTypeUuid = gameType.game_type_id;
            }
        }

        // Query principal
        let query = supabase
            .from('game_content')
            .select(`
                *,
                game_types!target_game_type_id (
                    name
                )
            `)
            .eq('topic_id', topicId);

        // Filtrar por UUID del game_type O incluir contenido genérico (null)
        // Esto es CLAVE para que el contenido cargue si no está estrictamente vinculado
        if (gameTypeUuid) {
            query = query.or(`target_game_type_id.eq.${gameTypeUuid},target_game_type_id.is.null`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[API GET] Supabase Error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Convertir de Title Case a snake_case
        const toSnakeCase = (str: string): string => {
            return str
                .split(' ')
                .map(word => word.toLowerCase())
                .join('_');
        };

        // Transformar datos para incluir el slug descriptivo pero MANTENER el target_game_type_id original (UUID)
        const enrichedData = data.map((item: any) => ({
            ...item,
            // Agregamos el slug como campo extra, pero no sobreescribimos el ID original
            game_type_slug: item.game_types?.name ? toSnakeCase(item.game_types.name) : null,
            game_types: undefined // Remover el objeto anidado para limpiar la respuesta
        }));

        console.log(`[API] Loaded ${enrichedData.length} items for topic ${topicId}${targetGameTypeId ? ` and game ${targetGameTypeId}` : ''}`);

        return NextResponse.json(enrichedData);
    } catch (error) {
        console.error('Error in /api/games/content:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
