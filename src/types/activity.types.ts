// Student progress type (used by student_progress table)
export interface Progreso {
  progress_id: string;
  student_id: string;
  activities_completed: number;
  total_score: number;
  current_level: number;
}

