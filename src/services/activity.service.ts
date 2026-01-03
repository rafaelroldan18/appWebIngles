import type { Actividad, Asignacion } from '@/types';

export class ActivityService {
  static async getByCreator(creatorId: string, limit?: number): Promise<Actividad[]> {
    // Legacy endpoint removed - return empty array
    console.info('ActivityService.getByCreator: Legacy activities system not in use');
    return [];
  }

  static async getAssignmentsByStudent(studentId: string, limit?: number): Promise<Asignacion[]> {
    // Legacy endpoint removed - return empty array
    console.info('ActivityService.getAssignmentsByStudent: Legacy activities system not in use');
    return [];
  }

  static async getCreatorStats(creatorId: string) {
    // Legacy endpoint removed - return default stats
    console.info('ActivityService.getCreatorStats: Legacy activities system not in use');
    return {
      totalActividades: 0,
      actividadesAsignadas: 0,
    };
  }
}
