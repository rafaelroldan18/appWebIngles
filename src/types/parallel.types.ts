// Parallel Types - Academic organization
export interface Parallel {
    parallel_id: string;
    name: string;
    academic_year: string;
    created_at?: string;
}

export interface TeacherParallel {
    id: string;
    teacher_id: string;
    parallel_id: string;
    parallel?: Parallel;
}

export interface ParallelWithStats extends Parallel {
    student_count: number;
    teacher_count: number;
}
