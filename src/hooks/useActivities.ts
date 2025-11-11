import { useState, useEffect } from 'react';
import { ActivityService } from '@/services/activity.service';
import type { Actividad, Asignacion } from '@/types';

export function useActivities(creatorId?: string) {
  const [activities, setActivities] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) return;

    ActivityService.getByCreator(creatorId, 5)
      .then(setActivities)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [creatorId]);

  return { activities, loading, error };
}

export function useStudentAssignments(studentId?: string) {
  const [assignments, setAssignments] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    ActivityService.getAssignmentsByStudent(studentId, 5)
      .then(setAssignments)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  return { assignments, loading, error };
}
