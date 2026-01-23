import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * POST /api/invitations/bulk
 * Procesa invitaciones masivas desde un archivo Excel/CSV
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea docente o administrador
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    // Obtener los datos del body
    const body = await request.json();
    const { students, parallel_id } = body;

    if (!parallel_id) {
      return NextResponse.json({ error: 'Parallel ID is required' }, { status: 400 });
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron estudiantes' }, { status: 400 });
    }

    // Validar estructura de datos
    const errors: string[] = [];
    const validStudents: any[] = [];

    // Inicializar cliente admin para operaciones de BD que requieren bypass de RLS
    // Es crucial usar este cliente para inserts en tablas como users/invitations donde el RLS podría bloquear al docente
    const supabaseAdmin = createServiceRoleClient();

    students.forEach((student, index) => {
      const rowNumber = index + 2; // +2 porque la fila 1 es el header y empezamos en 0

      // Convertir todos los campos a string para manejar valores numéricos de Excel
      const firstName = student.first_name ? String(student.first_name).trim() : '';
      const lastName = student.last_name ? String(student.last_name).trim() : '';
      const idCard = student.id_card ? String(student.id_card).trim() : '';
      const email = student.email ? String(student.email).trim() : '';

      // Validar campos requeridos
      if (!firstName) {
        errors.push(`Fila ${rowNumber}: El first_name es requerido`);
        return;
      }

      if (!lastName) {
        errors.push(`Fila ${rowNumber}: El last_name es requerido`);
        return;
      }

      if (!idCard) {
        errors.push(`Fila ${rowNumber}: La cédula es requerida`);
        return;
      }

      if (!email) {
        errors.push(`Fila ${rowNumber}: El correo electrónico es requerido`);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Fila ${rowNumber}: El correo electrónico no es válido`);
        return;
      }

      // Validar cédula (solo números y guiones)
      const cedulaRegex = /^[0-9-]+$/;
      if (!cedulaRegex.test(idCard)) {
        errors.push(`Fila ${rowNumber}: La cédula solo debe contener números y guiones`);
        return;
      }

      validStudents.push({
        first_name: firstName,
        last_name: lastName,
        id_card: idCard,
        email: email.toLowerCase(),
      });
    });

    // Si hay errores de validación, retornarlos
    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Errores de validación',
        details: errors,
        validCount: validStudents.length,
        errorCount: errors.length,
      }, { status: 400 });
    }

    // Verificar duplicados en el archivo
    const emails = validStudents.map(s => s.email);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);

    if (duplicateEmails.length > 0) {
      return NextResponse.json({
        error: 'Correos duplicados en el archivo',
        details: [`Los siguientes correos están duplicados: ${[...new Set(duplicateEmails)].join(', ')}`],
      }, { status: 400 });
    }

    // Verificar si ya existen invitaciones o usuarios con estos correos o cédulas
    const ids = validStudents.map(s => s.id_card);

    const { data: existingInvitations } = await supabase
      .from('invitations')
      .select('email')
      .in('email', emails)
      .in('status', ['pendiente', 'activada']);

    const { data: existingUsers } = await supabase
      .from('users')
      .select('email, id_card, account_status')
      .or(`email.in.(${emails.join(',')}),id_card.in.(${ids.join(',')})`);

    const existingEmails = new Set(existingInvitations?.map(i => i.email.toLowerCase()) || []);
    const registeredEmails = new Set();
    const registeredIds = new Set();

    existingUsers?.forEach(u => {
      registeredEmails.add(u.email.toLowerCase());
      registeredIds.add(u.id_card);
    });

    const conflicts: string[] = [];
    validStudents.forEach((student, index) => {
      const email = student.email.toLowerCase();

      if (existingEmails.has(email)) {
        conflicts.push(`Fila ${index + 2}: El correo ${student.email} ya tiene una invitación pendiente enviada.`);
      } else if (registeredEmails.has(email)) {
        const user = existingUsers?.find(u => u.email.toLowerCase() === email);
        const statusMsg = user?.account_status === 'pendiente'
          ? 'pendiente de activación'
          : 'activo en el sistema';
        conflicts.push(`Fila ${index + 2}: El correo ${student.email} ya está registrado y se encuentra ${statusMsg}.`);
      } else if (registeredIds.has(student.id_card)) {
        const user = existingUsers?.find(u => u.id_card === student.id_card);
        const statusMsg = user?.account_status === 'pendiente'
          ? 'pendiente de activación'
          : 'activo en el sistema';
        conflicts.push(`Fila ${index + 2}: La cédula ${student.id_card} ya está registrada y se encuentra ${statusMsg}.`);
      }
    });

    if (conflicts.length > 0) {
      return NextResponse.json({
        error: 'Se encontraron conflictos con usuarios existentes',
        details: conflicts,
      }, { status: 400 });
    }

    // Crear las invitaciones
    const invitationsToCreate = validStudents.map(student => ({
      email: student.email,
      first_name: student.first_name,
      last_name: student.last_name,
      id_card: student.id_card,
      role: 'estudiante',
      invitation_code: generateInvitationCode(),
      created_by_user_id: currentUser.user_id,
      status: 'pendiente',
      parallel_id: parallel_id,
      created_date: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
    }));

    // USAR supabaseAdmin para evitar errores de permisos (RLS)
    const { data: createdInvitations, error: createError } = await supabaseAdmin
      .from('invitations')
      .insert(invitationsToCreate)
      .select();

    if (createError) {
      console.error('Error creating invitations:', createError);
      return NextResponse.json({ error: 'Error al crear invitaciones: ' + createError.message }, { status: 500 });
    }

    // Enviar correos de invitación usando Supabase Auth
    // Prioriza la variable de entorno para asegurar que el link sea correcto incluso si se llama desde otro origen
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (createdInvitations) {
      // Usamos Promise.allSettled para procesar todas las invitaciones y capturar los IDs de Auth
      const inviteResults = await Promise.allSettled(
        createdInvitations.map((invitation) =>
          supabaseAdmin.auth.admin.inviteUserByEmail(invitation.email, {
            redirectTo: `${origin}/activate?code=${invitation.invitation_code}`,
            data: {
              first_name: invitation.first_name,
              last_name: invitation.last_name,
              id_card: invitation.id_card,
              role: 'estudiante',
              invitation_code: invitation.invitation_code,
            },
          })
        )
      );

      // Crear los registros de usuarios pendientes en la base de datos
      const usersToCreate = createdInvitations.map((invitation, index) => {
        const result = inviteResults[index];
        const authUserId = result.status === 'fulfilled' ? (result.value.data.user?.id || null) : null;

        return {
          email: invitation.email,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          id_card: invitation.id_card,
          role: 'estudiante',
          account_status: 'pendiente',
          parallel_id: parallel_id,
          auth_user_id: authUserId,
        };
      });

      // USAR supabaseAdmin para evitar errores de permisos (RLS) al insertar usuarios pendientes
      const { error: usersError } = await supabaseAdmin
        .from('users')
        .insert(usersToCreate);

      if (usersError) {
        console.error('Error creating pending users:', usersError);
        // Continuamos de todos modos porque las invitaciones ya fueron enviadas
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se crearon ${createdInvitations?.length || 0} invitaciones y se enviaron los correos exitosamente`,
      created: createdInvitations?.length || 0,
      invitations: createdInvitations,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Función auxiliar para generar códigos de invitación
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
