export type UserRole = 'estudiante' | 'docente' | 'administrador';
export type AccountStatus = 'activo' | 'inactivo' | 'pendiente';

export interface Usuario {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  id_card: string;
  role: UserRole;
  account_status: AccountStatus;
  registration_date: string;
  auth_user_id: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
