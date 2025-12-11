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
      .from('usuarios')
      .select('id_usuario, rol')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.rol)) {
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
      if (!student.nombre || student.nombre.trim() === '') {
        errors.push(`Fila ${rowNumber}: El nombre es requerido`);
        return;
      }

      if (!student.apellido || student.apellido.trim() === '') {
        errors.push(`Fila ${rowNumber}: El apellido es requerido`);
        return;
      }

      if (!student.cedula || student.cedula.trim() === '') {
        errors.push(`Fila ${rowNumber}: La cédula es requerida`);
        return;
      }

      if (!student.correo_electronico || student.correo_electronico.trim() === '') {
        errors.push(`Fila ${rowNumber}: El correo electrónico es requerido`);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student.correo_electronico)) {
        errors.push(`Fila ${rowNumber}: El correo electrónico no es válido`);
        return;
      }

      // Validar cédula (solo números y guiones)
      const cedulaRegex = /^[0-9-]+$/;
      if (!cedulaRegex.test(student.cedula)) {
        errors.push(`Fila ${rowNumber}: La cédula solo debe contener números y guiones`);
        return;
      }

      validStudents.push({
        nombre: student.nombre.trim(),
        apellido: student.apellido.trim(),
        cedula: student.cedula.trim(),
        correo_electronico: student.correo_electronico.trim().toLowerCase(),
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
    const emails = validStudents.map(s => s.correo_electronico);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);

    if (duplicateEmails.length > 0) {
      return NextResponse.json({
        error: 'Correos duplicados en el archivo',
        details: [`Los siguientes correos están duplicados: ${[...new Set(duplicateEmails)].join(', ')}`],
      }, { status: 400 });
    }

    // Verificar si ya existen invitaciones o usuarios con estos correos
    const { data: existingInvitations } = await supabase
      .from('invitaciones')
      .select('correo_electronico')
      .in('correo_electronico', emails)
      .in('estado', ['pendiente', 'activada']);

    const { data: existingUsers } = await supabase
      .from('usuarios')
      .select('correo_electronico')
      .in('correo_electronico', emails);

    const existingEmails = new Set([
      ...(existingInvitations?.map(i => i.correo_electronico) || []),
      ...(existingUsers?.map(u => u.correo_electronico) || []),
    ]);

    if (existingEmails.size > 0) {
      return NextResponse.json({
        error: 'Algunos correos ya están registrados o tienen invitaciones pendientes',
        details: [`Correos existentes: ${Array.from(existingEmails).join(', ')}`],
      }, { status: 400 });
    }

    // Crear las invitaciones
    const invitationsToCreate = validStudents.map(student => ({
      correo_electronico: student.correo_electronico,
      nombre: student.nombre,
      apellido: student.apellido,
      cedula: student.cedula,
      rol: 'estudiante',
      codigo_invitacion: generateInvitationCode(),
      creado_por: currentUser.id_usuario,
      estado: 'pendiente',
      fecha_creacion: new Date().toISOString(),
      fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
    }));

    const { data: createdInvitations, error: createError } = await supabase
      .from('invitaciones')
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
