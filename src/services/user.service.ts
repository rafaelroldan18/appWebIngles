import type { Usuario, UserRole, AccountStatus } from '@/types';

export class UserService {
  static async getAll(): Promise<Usuario[]> {
    const response = await fetch('/api/users');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  static async getByRole(role: UserRole): Promise<Usuario[]> {
    const response = await fetch(`/api/users?role=${role}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }

  static async updateStatus(userId: string, status: AccountStatus) {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_status: status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
  }

  static async updateRole(userId: string, role: UserRole) {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
  }

  static async delete(userId: string) {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
  }

  static async getStats() {
    const response = await fetch('/api/users/stats');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
}
