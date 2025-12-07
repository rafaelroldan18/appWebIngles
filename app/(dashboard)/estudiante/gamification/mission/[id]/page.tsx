import { MissionDetailView } from '@/components/features/gamification/student/MissionDetailView';

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MissionDetailView missionId={id} />;
}
