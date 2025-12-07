// ============================================================================
// MISSION ACTIVITIES MANAGEMENT PAGE
// Route: /docente/gamification/missions/[id]/activities
// Teachers can add, edit, and delete activities for a specific mission
// ============================================================================

import { ManageActivitiesView } from '@/components/features/gamification/teacher/ManageActivitiesView';

export default async function MissionActivitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManageActivitiesView missionId={id} />;
}
