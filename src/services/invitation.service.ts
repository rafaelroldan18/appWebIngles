import type {
  Invitation,
  CreateInvitationRequest,
  CreateBulkInvitationsRequest,
  ValidateInvitationRequest,
  ActivateInvitationRequest,
  InvitationResponse,
  BulkInvitationResponse,
} from '@/types/invitation.types';

export class InvitationService {
  private static baseUrl = '/api/invitations';

  static async getAll(): Promise<Invitation[]> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al obtener invitaciones');
    }

    return result.invitations;
  }

  static async create(data: CreateInvitationRequest): Promise<InvitationResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al crear invitación');
    }

    return result;
  }

  static async createBulk(data: CreateBulkInvitationsRequest): Promise<BulkInvitationResponse> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al crear invitaciones masivas');
    }

    return result;
  }

  static async validate(data: ValidateInvitationRequest): Promise<InvitationResponse> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al validar invitación');
    }

    return result;
  }

  static async activate(data: ActivateInvitationRequest): Promise<InvitationResponse> {
    const response = await fetch(`${this.baseUrl}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al activar invitación');
    }

    return result;
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Error al eliminar invitación');
    }
  }
}
