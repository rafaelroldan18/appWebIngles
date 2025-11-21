import { MissionDetailView } from '@/components/features/gamification/student/MissionDetailView';

export default function MissionDetailPage({ params }: { params: { id: string } }) {
  return <MissionDetailView missionId={params.id} />;
}
