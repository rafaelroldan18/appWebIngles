import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

/**
 * GET /api/invitations/template?format=csv|xlsx
 * Descarga una plantilla para invitaciones masivas
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        // Definir datos de ejemplo sin parallel_name (ya que se selecciona en la UI)
        const exampleData = [
            {
                first_name: "Juan",
                last_name: "Pérez",
                id_card: "1234567890",
                email: "juan.perez@ejemplo.com"
            },
            {
                first_name: "María",
                last_name: "González",
                id_card: "0987654321",
                email: "maria.gonzalez@ejemplo.com"
            },
            {
                first_name: "Carlos",
                last_name: "Rodríguez",
                id_card: "1122334455",
                email: "carlos.rodriguez@ejemplo.com"
            }
        ];

        if (format === 'xlsx') {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exampleData);

            // Ajustar ancho de columnas
            const wscols = [
                { wch: 20 }, // first_name
                { wch: 20 }, // last_name
                { wch: 15 }, // id_card
                { wch: 30 }, // email
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const headers = new Headers();
            headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            headers.set('Content-Disposition', 'attachment; filename="plantilla_invitaciones_estudiantes.xlsx"');

            return new NextResponse(buf, {
                status: 200,
                headers,
            });
        }

        // CSV fallback
        const csvContent = `first_name,last_name,id_card,email
Juan,Pérez,1234567890,juan.perez@ejemplo.com
María,González,0987654321,maria.gonzalez@ejemplo.com
Carlos,Rodríguez,1122334455,carlos.rodriguez@ejemplo.com

# INSTRUCCIONES:
# 1. Elimine las filas de ejemplo
# 2. Complete los datos de cada estudiante
# 3. Todos los campos son OBLIGATORIOS
# 4. Guarde el archivo y súbalo en el sistema`;

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
