
export type ReportType = 'estudiante' | 'paralelo' | 'juego' | 'tema' | 'periodo';

export interface ReportDefinition {
    report_id: string;
    name: string;
    description: string | null;
    report_type: ReportType;
    created_by: string | null;
    created_at: string;
}

export interface ReportRun {
    run_id: string;
    report_id: string;
    requested_by: string | null;
    parallel_id: string | null;
    student_id: string | null;
    from_date: string | null;
    to_date: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    file_path: string | null;
    error_message: string | null;
    created_at: string;
    report_definitions?: {
        name: string;
    };
    parallels?: {
        name: string;
    };
}

export interface ReportSnapshot {
    snapshot_id: string;
    run_id: string;
    payload: any;
    created_at: string;
}
