import type { Metadata } from 'next'
import { fraunces, plexSans, plexMono } from '@/lib/fonts'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'e-taff — Académie de langues & staffing B2B, Madagascar',
  description: "e-taff forme des candidats en langues et place des agents formés chez des clients internationaux, depuis Madagascar.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
