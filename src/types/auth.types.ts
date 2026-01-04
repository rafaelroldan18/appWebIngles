// ============================================================================
// TIPOS DE AUTENTICACIÓN
// ============================================================================

import { UserRole } from './user.types';
export type { UserRole };

export interface User {
  id: string;
  email?: string;
  role?: string;
  app_metadata?: {
    provider?: string;
  };
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface UsuarioDB {
  id: string;
  user_id: string;
  auth_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  id_card: string;
  role: UserRole;
  account_status: 'activo' | 'inactivo' | 'pendiente';
  registration_date: string;
  parallel_id?: string | null;
  parallel_name?: string | null;
  points?: number;
}

export interface AuthSession {
  user: User;
  usuario: UsuarioDB;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  id_card: string;
  rol: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
  };
  error?: string;
}
