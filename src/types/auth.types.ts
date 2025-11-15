// ============================================================================
// TIPOS DE AUTENTICACIÓN
// ============================================================================

export type UserRole = 'estudiante' | 'docente' | 'administrador';

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
  id_usuario: string;
  auth_user_id: string;
  correo_electronico: string;
  nombre: string;
  apellido: string;
  cedula: string;
  rol: UserRole;
  estado_cuenta: 'activo' | 'inactivo' | 'pendiente';
  fecha_registro: string;
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
  nombre: string;
  apellido: string;
  cedula: string;
  rol: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: UserRole;
  };
  error?: string;
}
