import { createSupabaseClient } from '@/lib/supabase-api';

export async function GET() {
  try {
    const supabase = await createSupabaseClient();

    const [total, estudiantes, docentes, activos] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'estudiante'),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'docente'),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('estado_cuenta', 'activo'),
    ]);

    return Response.json({
      totalUsuarios: total.count || 0,
      totalEstudiantes: estudiantes.count || 0,
      totalDocentes: docentes.count || 0,
      usuariosActivos: activos.count || 0,
    });
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
