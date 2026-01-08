'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import AdministradorDashboard from './AdministradorDashboard'

export function AdministradorView() {
  const { user, usuario, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    
    if (!user || !usuario) {
      router.replace('/login')
      return
    }
    
    if (usuario.account_status === 'inactivo') {
      router.replace('/cuenta-deshabilitada')
    } else if (usuario.account_status === 'pendiente') {
      router.replace('/cuenta-pendiente')
    } else if (usuario.role !== 'administrador') {
      router.replace(`/${usuario.role}`)
    }
  }, [user, usuario, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary dark:text-white font-semibold">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  if (!user || !usuario || usuario.role !== 'administrador') {
    return null
  }

  return <AdministradorDashboard onLogout={() => router.push('/')} />
}
