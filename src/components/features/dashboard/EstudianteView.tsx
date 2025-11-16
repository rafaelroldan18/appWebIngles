'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import EstudianteDashboard from './EstudianteDashboard'

export function EstudianteView() {
  const { user, usuario, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    
    if (!user || !usuario) {
      router.replace('/login')
      return
    }
    
    if (usuario.estado_cuenta === 'inactivo') {
      router.replace('/cuenta-deshabilitada')
    } else if (usuario.estado_cuenta === 'pendiente') {
      router.replace('/cuenta-pendiente')
    } else if (usuario.rol !== 'estudiante') {
      router.replace(`/${usuario.rol}`)
    }
  }, [user, usuario, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5FAFD] via-white to-[#E3F2FD] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4DB6E8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0288D1] dark:text-blue-400 font-semibold">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || !usuario || usuario.rol !== 'estudiante') {
    return null
  }

  return <EstudianteDashboard onLogout={() => router.push('/')} />
}
