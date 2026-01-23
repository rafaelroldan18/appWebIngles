import { NextRequest, NextResponse } from 'next/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Use anon client for public endpoint
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    const { invitation_code } = body;

    if (!invitation_code) {
      return NextResponse.json(
        { success: false, error: 'Código de invitación requerido' },
        { status: 400 }
      );
    }

    await supabase.rpc('mark_expired_invitations');

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        parallels!invitations_parallel_id_fkey(parallel_id, name, academic_year)
      `)
      .eq('invitation_code', invitation_code.toUpperCase())
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Código de invitación inválido' },
        { status: 404 }
      );
    }

    if (invitation.status === 'activada') {
      return NextResponse.json(
        { success: false, error: 'Esta invitación ya ha sido activada' },
        { status: 400 }
      );
    }

    if (invitation.status === 'expirada') {
      return NextResponse.json(
        { success: false, error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al validar invitación' },
      { status: 500 }
    );
  }
}
