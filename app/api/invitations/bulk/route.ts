import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

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
    const { students } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron estudiantes' }, { status: 400 });
    }

    // Validar estructura de datos
    const errors: string[] = [];
    const validStudents: any[] = [];

    students.forEach((student, index) => {
      const rowNumber = index + 2; // +2 porque la fila 1 es el header y empezamos en 0

      // Validar campos requeridos
      if (!student.first_name || student.first_name.trim() === '') {
        errors.push(`Fila ${rowNumber}: El first_name es requerido`);
        return;
      }

      if (!student.last_name || student.last_name.trim() === '') {
        errors.push(`Fila ${rowNumber}: El last_name es requerido`);
        return;
      }

      if (!student.id_card || student.id_card.trim() === '') {
        errors.push(`Fila ${rowNumber}: La cédula es requerida`);
        return;
      }

      if (!student.email || student.email.trim() === '') {
        errors.push(`Fila ${rowNumber}: El correo electrónico es requerido`);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student.email)) {
        errors.push(`Fila ${rowNumber}: El correo electrónico no es válido`);
        return;
      }

      // Validar cédula (solo números y guiones)
      const cedulaRegex = /^[0-9-]+$/;
      if (!cedulaRegex.test(student.id_card)) {
        errors.push(`Fila ${rowNumber}: La cédula solo debe contener números y guiones`);
        return;
      }

      validStudents.push({
        first_name: student.first_name.trim(),
        last_name: student.last_name.trim(),
        id_card: student.id_card.trim(),
        email: student.email.trim().toLowerCase(),
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

    // Verificar si ya existen invitaciones o usuarios con estos correos
    const { data: existingInvitations } = await supabase
      .from('invitations')
      .select('email')
      .in('email', emails)
      .in('status', ['pendiente', 'activada']);

    const { data: existingUsers } = await supabase
      .from('users')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set([
      ...(existingInvitations?.map(i => i.email) || []),
      ...(existingUsers?.map(u => u.email) || []),
    ]);

    if (existingEmails.size > 0) {
      return NextResponse.json({
        error: 'Algunos correos ya están registrados o tienen invitaciones pendientes',
        details: [`Correos existentes: ${Array.from(existingEmails).join(', ')}`],
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
      created_date: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
    }));

    const { data: createdInvitations, error: createError } = await supabase
      .from('invitations')
      .insert(invitationsToCreate)
      .select();

    if (createError) {
      console.error('Error creating invitations:', createError);
      return NextResponse.json({ error: 'Error al crear invitaciones' }, { status: 500 });
    }

    // TODO: Aquí se enviarían los correos electrónicos
    // Por ahora solo retornamos el resultado

    return NextResponse.json({
      success: true,
      message: `Se crearon ${createdInvitations?.length || 0} invitaciones exitosamente`,
      created: createdInvitations?.length || 0,
      invitations: createdInvitations,
    });

  } catch (error) {
    console.error('Error in bulk invitations endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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
