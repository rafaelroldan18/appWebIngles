// ============================================================================
// MISSION ACTIVITIES MANAGEMENT PAGE
// Route: /docente/gamification/missions/[id]/activities
// Teachers can add, edit, and delete activities for a specific mission
// ============================================================================

import { ManageActivitiesView } from '@/components/features/gamification/teacher/ManageActivitiesView';

export default function MissionActivitiesPage({
  params,
}: {
  params: { id: string };
}) {
  return <ManageActivitiesView missionId={params.id} />;
}
