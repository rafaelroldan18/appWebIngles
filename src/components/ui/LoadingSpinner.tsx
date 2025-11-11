export function LoadingSpinner({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFD] via-white to-[#E3F2FD] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#4DB6E8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#0288D1] font-semibold">{message}</p>
      </div>
    </div>
  );
}
