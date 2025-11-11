import { useState, useEffect } from 'react';
import { ProgressService } from '@/services/progress.service';
import type { Progreso } from '@/types';

export function useProgress(studentId?: string) {
  const [progress, setProgress] = useState<Progreso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    ProgressService.getByStudent(studentId)
      .then(setProgress)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  return { progress, loading, error };
}
