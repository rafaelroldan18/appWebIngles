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
    
    if (usuario.account_status === 'activo') {
      router.replace(`/${usuario.role}`)
    } else if (usuario.account_status === 'pendiente') {
      router.replace('/cuenta-pendiente')
    }
  }, [user, usuario, loading, router])

  if (loading) {
    return (
      <div className={`min-h-screen ${colors.background.base} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2B6BEE] dark:border-[#6FA0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
