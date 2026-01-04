
import type {
    ReportDefinition,
    ReportRun,
    ReportSnapshot
} from '@/types';

export class ReportService {
    /**
     * Obtiene todas las definiciones de reportes disponibles
     */
    static async getDefinitions(): Promise<ReportDefinition[]> {
        const response = await fetch('/api/reports/definitions');
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener definiciones de reportes');
        }
        return response.json();
    }

    /**
     * Ejecuta un reporte
     */
    static async runReport(data: Partial<ReportRun>): Promise<ReportRun> {
        const response = await fetch('/api/reports/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al ejecutar reporte');
        }
        return response.json();
    }

    /**
     * Obtiene el resultado (snapshot) de una ejecución de reporte
     */
    static async getSnapshot(runId: string): Promise<ReportSnapshot> {
        const response = await fetch(`/api/reports/snapshots/${runId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener resultado del reporte');
        }
        return response.json();
    }

    /**
     * Obtiene el historial de ejecuciones de un reporte específico
     */
    static async getRunHistory(reportId: string): Promise<ReportRun[]> {
        const response = await fetch(`/api/reports/history?reportId=${reportId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener historial de reportes');
        }
        return response.json();
    }
}
