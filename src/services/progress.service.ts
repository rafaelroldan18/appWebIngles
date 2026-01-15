import type { Progreso } from '@/types';

export class ProgressService {
  static async getByStudent(studentId: string): Promise<Progreso | null> {
    const response = await fetch(`/api/progress?studentId=${studentId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return response.json();
  }
}
