import { EditMissionForm } from '@/components/features/gamification/teacher/EditMissionForm';

interface EditMissionPageProps {
  params: {
    id: string;
  };
}

export default function EditMissionPage({ params }: EditMissionPageProps) {
  return <EditMissionForm missionId={params.id} />;
}
