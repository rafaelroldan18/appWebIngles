import type { Parallel, ParallelWithStats, TeacherParallel } from '@/types/parallel.types';

export class ParallelService {
    /**
     * Get all parallels
     */
    static async getAll(): Promise<Parallel[]> {
        const response = await fetch('/api/parallels', {
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener paralelos');
        }

        return response.json();
    }

    /**
     * Get parallel by ID
     */
    static async getById(parallelId: string): Promise<Parallel> {
        const response = await fetch(`/api/parallels/${parallelId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener paralelo');
        }

        return response.json();
    }

    /**
     * Get parallels with statistics
     */
    static async getAllWithStats(): Promise<ParallelWithStats[]> {
        const response = await fetch('/api/parallels?include_stats=true', {
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener paralelos');
        }

        return response.json();
    }

    /**
     * Create a new parallel
     */
    static async create(data: { name: string; academic_year: string }): Promise<Parallel> {
        const response = await fetch('/api/parallels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear paralelo');
        }

        return response.json();
    }

    /**
     * Update a parallel
     */
    static async update(parallelId: string, data: { name?: string; academic_year?: string }): Promise<Parallel> {
        const response = await fetch(`/api/parallels/${parallelId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar paralelo');
        }

        return response.json();
    }

    /**
     * Delete a parallel
     */
    static async delete(parallelId: string): Promise<void> {
        const response = await fetch(`/api/parallels/${parallelId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar paralelo');
        }
    }

    /**
     * Get parallels assigned to a teacher
     */
    static async getByTeacher(teacherId: string): Promise<Parallel[]> {
        const response = await fetch(`/api/parallels/teacher/${teacherId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener paralelos del docente');
        }

        return response.json();
    }

    /**
     * Assign teacher to parallel
     */
    static async assignTeacher(teacherId: string, parallelId: string): Promise<TeacherParallel> {
        const response = await fetch('/api/parallels/assign-teacher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: teacherId, parallel_id: parallelId }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al asignar docente');
        }

        return response.json();
    }

    /**
     * Remove teacher from parallel
     */
    static async removeTeacher(teacherId: string, parallelId: string): Promise<void> {
        const response = await fetch('/api/parallels/remove-teacher', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: teacherId, parallel_id: parallelId }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al remover docente');
        }
    }

    /**
     * Get parallels assigned to a teacher (with details)
     */
    static async getTeacherParallels(teacherId: string): Promise<Parallel[]> {
        const response = await fetch(`/api/parallels/teacher/${teacherId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener paralelos del docente');
        }

        return response.json();
    }

    /**
     * Update all parallels for a teacher (replaces existing assignments)
     */
    static async updateTeacherParallels(teacherId: string, parallelIds: string[]): Promise<void> {
        const response = await fetch('/api/parallels/update-teacher-parallels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: teacherId, parallel_ids: parallelIds }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar paralelos del docente');
        }
    }

    /**
     * Get students in a parallel
     */
    static async getStudents(parallelId: string) {
        const response = await fetch(`/api/parallels/${parallelId}/students`, {
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener estudiantes');
        }

        return response.json();
    }
}
