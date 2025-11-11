import type { Metadata } from 'next'
import '../src/index.css'
import { AuthProvider } from '../src/contexts/AuthContext'
import { LanguageProvider } from '../src/contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'English27 - Aprende inglés de forma divertida',
  description: 'Sistema educativo gamificado para aprender inglés',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
