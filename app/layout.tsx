import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import Script from 'next/script'
import '../src/index.css'
import { AuthProvider } from '../src/contexts/AuthContext'
import { LanguageProvider } from '../src/contexts/LanguageContext'
import { ThemeProvider } from '../src/contexts/ThemeContext'

const nunito = Nunito({ 
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'English27',
  description: 'Sistema educativo gamificado para aprender inglés',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={nunito.className} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
        <Script src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js" type="module" />
        <Script src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js" noModule />
      </body>
    </html>
  )
}

