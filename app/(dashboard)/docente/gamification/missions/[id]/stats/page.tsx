import { MissionStatsView } from '@/components/features/gamification/teacher/MissionStatsView';

interface MissionStatsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MissionStatsPage({ params }: MissionStatsPageProps) {
  const { id } = await params;
  return <MissionStatsView missionId={id} />;
}
