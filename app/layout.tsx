import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { fraunces, plexSans, plexMono } from '@/lib/fonts'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'e-Staf — Académie de langues & externalisation d’élite, Madagascar',
  description: "e-Staf lève deux freins à la fois : la barrière de la langue pour les talents, et les craintes liées à l'externalisation pour les entreprises. Formation d'élite et staffing B2B depuis Madagascar.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
