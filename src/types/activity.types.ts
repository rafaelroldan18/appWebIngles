export type ActivityType = 'lectura' | 'escritura' | 'escucha' | 'conversacion';
export type DifficultyLevel = 'bajo' | 'medio' | 'alto';
export type AssignmentStatus = 'pendiente' | 'en_curso' | 'completado';

export interface Actividad {
  id_actividad: string;
  titulo: string;
  tipo: ActivityType;
  nivel_dificultad: DifficultyLevel;
  fecha_creacion: string;
  creado_por: string;
}

export interface Asignacion {
  id_asignacion: string;
  id_actividad: string;
  id_estudiante: string;
  estado: AssignmentStatus;
  puntaje_obtenido: number;
  fecha_limite: string;
  actividades: Actividad;
}

export interface Progreso {
  id_progreso: string;
  id_estudiante: string;
  actividades_completadas: number;
  puntaje_total: number;
  nivel_actual: number;
}
