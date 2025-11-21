import { MissionPlayView } from '@/components/features/gamification/student/MissionPlayView';

interface MissionPlayPageProps {
  params: {
    id: string;
  };
}

export default function MissionPlayPage({ params }: MissionPlayPageProps) {
  return <MissionPlayView missionId={params.id} />;
}
