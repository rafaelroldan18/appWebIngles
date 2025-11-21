export type InvitationRole = 'docente' | 'estudiante';
export type InvitationStatus = 'pendiente' | 'activada' | 'expirada';

export interface InvitationCreator {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: string;
}

export interface Invitation {
  id_invitacion: string;
  codigo_invitacion: string;
  correo_electronico: string;
  nombre: string;
  apellido: string;
  cedula: string;
  rol: InvitationRole;
  estado: InvitationStatus;
  creado_por: string;
  creador?: InvitationCreator;
  fecha_creacion: string;
  fecha_expiracion: string;
  fecha_activacion: string | null;
  id_usuario: string | null;
}

export interface CreateInvitationRequest {
  correo_electronico: string;
  nombre: string;
  apellido: string;
  cedula: string;
  rol: InvitationRole;
}

export interface CreateBulkInvitationsRequest {
  invitaciones: CreateInvitationRequest[];
}

export interface ValidateInvitationRequest {
  codigo_invitacion: string;
}

export interface ActivateInvitationRequest {
  codigo_invitacion: string;
  password: string;
  nombre?: string;
  apellido?: string;
  cedula?: string;
}

export interface InvitationResponse {
  success: boolean;
  message?: string;
  invitation?: Invitation;
  error?: string;
}

export interface BulkInvitationResponse {
  success: boolean;
  message?: string;
  invitations?: Invitation[];
  errors?: string[];
}
