import { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/services/user.service';
import type { Usuario, UserRole } from '@/types';

export function useUsers(filterRole?: UserRole) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = filterRole 
        ? await UserService.getByRole(filterRole)
        : await UserService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading users');
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, error, reload: loadUsers };
}

export function useUserStats() {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalEstudiantes: 0,
    totalDocentes: 0,
    usuariosActivos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    UserService.getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
