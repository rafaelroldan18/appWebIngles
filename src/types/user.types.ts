export type UserRole = 'estudiante' | 'docente' | 'administrador';
export type AccountStatus = 'activo' | 'inactivo' | 'pendiente';

export interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: UserRole;
  estado_cuenta: AccountStatus;
  fecha_registro: string;
  auth_user_id: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
