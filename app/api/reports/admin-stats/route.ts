/**
 * GET /api/reports/admin-stats
 * Dedicated API for System Administration Reporting - Thesis version.
 * Focuses on system control and verifiable usage metrics using the real DB schema.
 * Uses Service Role and in-memory joining for maximum reliability and correctness.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServiceRoleClient();

        // 1. Fetch All Raw Data (In parallel for speed)
        const [
            { data: allUsers, error: userError },
            { data: allParallels, error: parError },
            { data: allTeacherRels, error: relError },
            { count: totalSessions, error: countError }
        ] = await Promise.all([
            supabase.from('users').select('user_id, first_name, last_name, role, account_status, email, parallel_id'),
            supabase.from('parallels').select('parallel_id, name, academic_year').order('name'),
            supabase.from('teacher_parallels').select('teacher_id, parallel_id'),
            supabase.from('game_sessions').select('*', { count: 'exact', head: true }).eq('completed', true)
        ]);

        if (userError) throw userError;
        if (parError) throw parError;
        if (relError) throw relError;
        if (countError) throw countError;

        // 2. Maps for quick lookup
        const usersMap = new Map((allUsers || []).map(u => [u.user_id, `${u.first_name} ${u.last_name}`]));
        const parallelsMap = new Map((allParallels || []).map(p => [p.parallel_id, p.name]));

        // Map teachers to parallels
        const teacherAssignments = new Map<string, string[]>();
        (allTeacherRels || []).forEach(rel => {
            const current = teacherAssignments.get(rel.parallel_id) || [];
            const name = usersMap.get(rel.teacher_id);
            if (name) teacherAssignments.set(rel.parallel_id, [...current, name]);
        });

        // 3. User Metrics
        const userMetrics = {
            total: allUsers?.length || 0,
            active: allUsers?.filter(u => u.account_status === 'activo').length || 0,
            inactive: allUsers?.filter(u => u.account_status !== 'activo').length || 0,
            byRole: {
                students: allUsers?.filter(u => u.role === 'estudiante').length || 0,
                teachers: allUsers?.filter(u => u.role === 'docente').length || 0,
                admins: allUsers?.filter(u => u.role === 'administrador').length || 0
            }
        };

        // 4. Parallels List
        const parallelsList = (allParallels || []).map(p => ({
            id: p.parallel_id,
            name: p.name,
            teacher: (teacherAssignments.get(p.parallel_id) || []).join(', ') || 'Sin docente asignado',
            academicYear: p.academic_year
        }));

        // 5. General Student Report (Extended Audit)
        const studentReport = (allUsers || [])
            .filter(u => u.role === 'estudiante')
            .map(s => {
                const pName = s.parallel_id ? parallelsMap.get(s.parallel_id) : null;
                const teachers = s.parallel_id ? teacherAssignments.get(s.parallel_id) : [];

                return {
                    id: s.user_id,
                    name: `${s.first_name} ${s.last_name}`,
                    email: s.email,
                    parallel: pName || 'Sin asignar',
                    teacher: (teachers || []).join(', ') || 'N/A',
                    status: s.account_status
                };
            })
            .sort((a, b) => a.parallel.localeCompare(b.parallel));

        // 6. System Usage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentSessions, error: recentError } = await supabase
            .from('game_sessions')
            .select('played_at')
            .gte('played_at', thirtyDaysAgo.toISOString())
            .eq('completed', true)
            .order('played_at', { ascending: true });

        if (recentError) throw recentError;

        const usageTrend: Record<string, number> = {};
        recentSessions?.forEach(s => {
            if (s.played_at) {
                const date = s.played_at.split('T')[0];
                usageTrend[date] = (usageTrend[date] || 0) + 1;
            }
        });

        const systemUsage = {
            totalSessions: totalSessions || 0,
            recentActivity: Object.keys(usageTrend).map(date => ({
                date,
                sessions: usageTrend[date]
            }))
        };

        return NextResponse.json({
            userMetrics,
            parallelsList,
            studentReport,
            systemUsage
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Error de auditoría de base de datos',
            details: error.message
        }, { status: 500 });
    }
}
