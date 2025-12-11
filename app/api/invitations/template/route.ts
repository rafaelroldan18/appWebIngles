import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/invitations/template?format=csv|xlsx
 * Descarga una plantilla para invitaciones masivas
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        // Crear contenido CSV con ejemplo
        const csvContent = `nombre,apellido,cedula,correo_electronico
Juan,Pérez,1234567890,juan.perez@ejemplo.com
María,González,0987654321,maria.gonzalez@ejemplo.com
Carlos,Rodríguez,1122334455,carlos.rodriguez@ejemplo.com`;

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
        console.error('Error generating template:', error);
        return NextResponse.json(
            { error: 'Error al generar plantilla' },
            { status: 500 }
        );
    }
}
