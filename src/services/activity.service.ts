import type { Actividad, Asignacion } from '@/types';

export class ActivityService {
  static async getByCreator(creatorId: string, limit?: number): Promise<Actividad[]> {
    const params = new URLSearchParams({ creatorId });
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`/api/activities?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  static async getAssignmentsByStudent(studentId: string, limit?: number): Promise<Asignacion[]> {
    const params = new URLSearchParams({ studentId });
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`/api/activities/assignments?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  static async getCreatorStats(creatorId: string) {
    const response = await fetch(`/api/activities/stats?creatorId=${creatorId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
}
