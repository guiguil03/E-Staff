import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl mb-4">Contact</h1>
      <p className="mb-8">
        Une question sur une formation, un projet de staffing, ou autre chose : écris-nous,
        on répond directement.
      </p>
      <ContactForm />
    </main>
  )
}
