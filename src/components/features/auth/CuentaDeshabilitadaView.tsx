'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import CuentaDeshabilitada from './CuentaDeshabilitada'
import { colors } from '@/config/colors'

export function CuentaDeshabilitadaView() {
  const { user, usuario, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    
    if (!user || !usuario) {
      router.replace('/login')
      return
    }
    
    if (usuario.estado_cuenta === 'activo') {
      router.replace(`/${usuario.rol}`)
    } else if (usuario.estado_cuenta === 'pendiente') {
      router.replace('/cuenta-pendiente')
    }
  }, [user, usuario, loading, router])

  if (loading) {
    return (
      <div className={`min-h-screen ${colors.background.base} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${colors.primary.border} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className={`${colors.text.primary} font-semibold`}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || !usuario) {
    return null
  }

  return <CuentaDeshabilitada />
}
