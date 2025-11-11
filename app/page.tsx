'use client'

import { useState } from 'react'
import { useAuth } from '../src/contexts/AuthContext'
import Landing from '../src/components/features/auth/Landing'
import Login from '../src/components/features/auth/Login'
import EstudianteDashboard from '../src/components/features/dashboard/EstudianteDashboard'
import DocenteDashboard from '../src/components/features/dashboard/DocenteDashboard'
import AdministradorDashboard from '../src/components/features/dashboard/AdministradorDashboard'
import CuentaDeshabilitada from '../src/components/features/auth/CuentaDeshabilitada'
import CuentaPendiente from '../src/components/features/auth/CuentaPendiente'
import LanguageSelector from '../src/components/layout/LanguageSelector'

export default function Home() {
  const { user, usuario, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showLanding, setShowLanding] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5FAFD] via-white to-[#E3F2FD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4DB6E8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0288D1] font-semibold">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || !usuario || showLanding) {
    return (
      <>
        {!showLogin && !showLanding && <Landing onGetStarted={() => setShowLogin(true)} />}
        {showLanding && <Landing onGetStarted={() => { setShowLanding(false); setShowLogin(true); }} />}
        {showLogin && !showLanding && <Login onBack={() => setShowLogin(false)} />}
      </>
    )
  }

  if (usuario.estado_cuenta === 'inactivo') {
    return <CuentaDeshabilitada />
  }

  if (usuario.estado_cuenta === 'pendiente') {
    return <CuentaPendiente />
  }

  const handleLogout = async () => {
    setShowLanding(true)
  }

  switch (usuario.rol) {
    case 'estudiante':
      return <EstudianteDashboard onLogout={handleLogout} />
    case 'docente':
      return <DocenteDashboard onLogout={handleLogout} />
    case 'administrador':
      return <AdministradorDashboard onLogout={handleLogout} />
    default:
      return <Login />
  }
}
