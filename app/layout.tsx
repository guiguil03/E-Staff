import type { Metadata } from 'next'
import { fraunces, plexSans, plexMono } from '@/lib/fonts'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Académie & Production — Madagascar',
  description: "Formation en langues et mise à disposition d'agents formés, à Madagascar.",
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
