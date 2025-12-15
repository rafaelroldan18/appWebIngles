import { useState, useEffect } from 'react';
import { ActivityService } from '@/services/activity.service';
import type { Actividad, Asignacion } from '@/types';

export function useActivities(creatorId?: string) {
  const [activities, setActivities] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) return;

    // Legacy system - return empty array
    setActivities([]);
    setLoading(false);
  }, [creatorId]);

  return { activities, loading, error };
}

export function useStudentAssignments(studentId?: string) {
  const [assignments, setAssignments] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    // Legacy system - return empty array
    setAssignments([]);
    setLoading(false);
  }, [studentId]);

  return { assignments, loading, error };
}
