// ============================================================================
// AUTH SERVICE
// Servicio para manejar autenticación mediante API Routes
// ============================================================================

import type { LoginRequest, RegisterRequest, AuthResponse, AuthSession } from '@/types/auth.types';

export class AuthService {
  private static baseUrl = '/api/auth';

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al registrar usuario');
    }

    return result;
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al iniciar sesión');
    }

    return result;
  }

  static async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Error al cerrar sesión');
    }
  }

  static async getCurrentUser(): Promise<AuthSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) return null;

      const result = await response.json();
      
      if (!result.success) return null;

      return {
        user: result.user,
        usuario: result.usuario,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}
