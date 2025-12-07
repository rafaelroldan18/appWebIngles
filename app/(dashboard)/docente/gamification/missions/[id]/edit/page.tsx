import { EditMissionForm } from '@/components/features/gamification/teacher/EditMissionForm';

interface EditMissionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditMissionPage({ params }: EditMissionPageProps) {
  const { id } = await params;
  return <EditMissionForm missionId={id} />;
}
