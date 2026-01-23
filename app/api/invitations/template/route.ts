import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * GET /api/invitations/template?format=csv|xlsx
 * Descarga una plantilla para invitaciones masivas
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        // Get available parallels from database
        const supabase = createServiceRoleClient();
        const { data: parallels, error } = await supabase
            .from('parallels')
            .select('parallel_id, name, academic_year')
            .order('name');

        if (error) {
            console.error('Error fetching parallels:', error);
        }

        // Build parallels list for reference
        let parallelsReference = '\n\n# PARALELOS DISPONIBLES:\n';
        if (parallels && parallels.length > 0) {
            parallelsReference += '# Use el NOMBRE del paralelo en la columna "parallel_name"\n';
            parallelsReference += '# Paralelos disponibles:\n';
            parallels.forEach(p => {
                parallelsReference += `#   - ${p.name} (${p.academic_year})\n`;
            });
        } else {
            parallelsReference += '# No hay paralelos disponibles. Por favor, cree paralelos antes de usar esta plantilla.\n';
        }

        // Crear contenido CSV con ejemplo
        const exampleParallelName = parallels && parallels.length > 0 ? parallels[0].name : 'A';

        const csvContent = `first_name,last_name,id_card,email,parallel_name
Juan,Pérez,1234567890,juan.perez@ejemplo.com,${exampleParallelName}
María,González,0987654321,maria.gonzalez@ejemplo.com,${exampleParallelName}
Carlos,Rodríguez,1122334455,carlos.rodriguez@ejemplo.com,${exampleParallelName}

# INSTRUCCIONES:
# 1. Elimine las filas de ejemplo (Juan, María, Carlos)
# 2. Complete los datos de cada estudiante
# 3. En la columna "parallel_name" escriba el NOMBRE del paralelo (ej: A, B, C)
# 4. Todos los campos son OBLIGATORIOS
# 5. El nombre del paralelo debe coincidir EXACTAMENTE con uno de los disponibles
# 6. Guarde el archivo y súbalo en el sistema
${parallelsReference}`;

        if (format === 'xlsx') {
            // Para XLSX, enviamos el mismo CSV pero con extensión .xlsx
            // Excel puede abrir archivos CSV con extensión .xlsx
            const headers = new Headers();
            headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            headers.set('Content-Disposition', 'attachment; filename="plantilla_invitaciones_estudiantes.xlsx"');

            return new NextResponse(csvContent, {
                status: 200,
                headers,
            });
        }

        // CSV por defecto
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv; charset=utf-8');
        headers.set('Content-Disposition', 'attachment; filename="plantilla_invitaciones_estudiantes.csv"');

        return new NextResponse(csvContent, {
            status: 200,
            headers,
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Error al generar plantilla' },
            { status: 500 }
        );
    }
}
