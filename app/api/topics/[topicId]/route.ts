/**
 * PUT /api/topics/[topicId]
 * Update existing topic
 * 
 * DELETE /api/topics/[topicId]
 * Delete topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

interface RouteParams {
    params: Promise<{
        topicId: string;
    }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createSupabaseClient(request);
        const { topicId } = await params;

        // Get request body
        const body = await request.json();
        const { title, description, level, theory_content } = body;

        // Build update object (only include provided fields)
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (level !== undefined) updates.level = level;
        if (theory_content !== undefined) updates.theory_content = theory_content;

        // Update topic
        const { data, error } = await supabase
            .from('topics')
            .update(updates)
            .eq('topic_id', topicId)
            .select()
            .single();

        if (error) {
            //console.error('Error updating topic:', error);
            return NextResponse.json(
                { error: 'Failed to update topic' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        //console.error('Error in PUT /api/topics/[topicId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createSupabaseClient(request);
        const { topicId } = await params;

        // 1. Get all sessions for this topic to adjust student progress scores
        const { data: sessionsToClean, error: fetchSessionsError } = await supabase
            .from('game_sessions')
            .select('student_id, score, completed')
            .eq('topic_id', topicId);

        if (!fetchSessionsError && sessionsToClean && sessionsToClean.length > 0) {
            // Group impact per student
            const impactPerStudent: Record<string, { score: number, completions: number }> = {};

            sessionsToClean.forEach(session => {
                if (!impactPerStudent[session.student_id]) {
                    impactPerStudent[session.student_id] = { score: 0, completions: 0 };
                }
                impactPerStudent[session.student_id].score += (session.score || 0);
                if (session.completed) {
                    impactPerStudent[session.student_id].completions += 1;
                }
            });

            // Update student progress for each affected student
            for (const studentId in impactPerStudent) {
                const impact = impactPerStudent[studentId];
                if (impact.score > 0 || impact.completions > 0) {
                    // Get current progress
                    const { data: currentProgress } = await supabase
                        .from('student_progress')
                        .select('total_score, activities_completed')
                        .eq('student_id', studentId)
                        .single();

                    if (currentProgress) {
                        await supabase
                            .from('student_progress')
                            .update({
                                total_score: Math.max(0, currentProgress.total_score - impact.score),
                                activities_completed: Math.max(0, currentProgress.activities_completed - impact.completions),
                                last_updated_at: new Date().toISOString()
                            })
                            .eq('student_id', studentId);
                    }
                }
            }
        }

        // 2. Cascade Delete associated availability (missions)
        const { error: availabilityError } = await supabase
            .from('game_availability')
            .delete()
            .eq('topic_id', topicId);

        if (availabilityError) {
            //console.error('Error deleting topic availability:', availabilityError);
            return NextResponse.json(
                { error: 'Failed to delete topic missions' },
                { status: 500 }
            );
        }

        // 3. Cascade Delete associated content
        const { error: contentError } = await supabase
            .from('game_content')
            .delete()
            .eq('topic_id', topicId);

        if (contentError) {
            //console.error('Error deleting topic content:', contentError);
            return NextResponse.json(
                { error: 'Failed to delete topic content' },
                { status: 500 }
            );
        }

        // 4. Cascade Delete associated sessions
        const { error: sessionsError } = await supabase
            .from('game_sessions')
            .delete()
            .eq('topic_id', topicId);

        if (sessionsError) {
            //console.error('Error deleting topic sessions:', sessionsError);
            return NextResponse.json(
                { error: 'Failed to delete topic sessions' },
                { status: 500 }
            );
        }

        // Cascade Delete topic rules (theory)
        const { error: rulesError } = await supabase
            .from('topic_rules')
            .delete()
            .eq('topic_id', topicId);

        if (rulesError) {
            //console.error('Error deleting topic rules:', rulesError);
            return NextResponse.json(
                { error: 'Failed to delete topic rules' },
                { status: 500 }
            );
        }

        // Delete topic
        const { error } = await supabase
            .from('topics')
            .delete()
            .eq('topic_id', topicId);

        if (error) {
            //console.error('Error deleting topic:', error);
            return NextResponse.json(
                { error: 'Failed to delete topic' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        //console.error('Error in DELETE /api/topics/[topicId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
