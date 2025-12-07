import { MissionPlayView } from '@/components/features/gamification/student/MissionPlayView';

interface MissionPlayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MissionPlayPage({ params }: MissionPlayPageProps) {
  const { id } = await params;
  return <MissionPlayView missionId={id} />;
}
