export type InvitationRole = 'docente' | 'estudiante';
export type InvitationStatus = 'pendiente' | 'activada' | 'expirada';

export interface InvitationCreator {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface Invitation {
  invitation_id: string;
  invitation_code: string;
  email: string;
  first_name: string;
  last_name: string;
  id_card: string;
  role: InvitationRole;
  status: InvitationStatus;
  created_by_user_id: string;
  creador?: InvitationCreator;
  created_date: string;
  expiration_date: string;
  activation_date: string | null;
  user_id: string | null;
  parallel_id?: string | null;
  parallel_name?: string;
}

// Base invitation data
interface BaseInvitationRequest {
  email: string;
  first_name: string;
  last_name: string;
  id_card: string;
}

// Student invitation - requires single parallel
interface StudentInvitationRequest extends BaseInvitationRequest {
  role: 'estudiante';
  parallel_id: string; // Required for students
}

// Teacher invitation - requires multiple parallels
interface TeacherInvitationRequest extends BaseInvitationRequest {
  role: 'docente';
  parallel_ids: string[]; // Required for teachers (at least one)
}

// Union type for create invitation
export type CreateInvitationRequest = StudentInvitationRequest | TeacherInvitationRequest;

export interface CreateBulkInvitationsRequest {
  invitations: CreateInvitationRequest[];
}

export interface ValidateInvitationRequest {
  invitation_code: string;
}

export interface ActivateInvitationRequest {
  invitation_code: string;
  password: string;
  first_name?: string;
  last_name?: string;
  id_card?: string;
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
