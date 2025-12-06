import StudentDetailView from '@/components/features/gamification/teacher/StudentDetailView';

interface StudentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const resolvedParams = await params;
  return <StudentDetailView studentId={resolvedParams.id} />;
}
