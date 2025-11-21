import { MissionStatsView } from '@/components/features/gamification/teacher/MissionStatsView';

interface MissionStatsPageProps {
  params: {
    id: string;
  };
}

export default function MissionStatsPage({ params }: MissionStatsPageProps) {
  return <MissionStatsView missionId={params.id} />;
}
