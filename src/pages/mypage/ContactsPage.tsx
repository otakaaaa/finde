import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, Mail } from 'lucide-react'
import { useMyContacts } from '@/hooks/useContacts'
import type { Contact } from '@/constants/contact'
import { ContactCard } from '@/components/contact/ContactCard'

// ── Page ───────────────────────────────────────────────────────

const ContactsPage = () => {
  const { data: contacts, isLoading, error } = useMyContacts()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            INBOX
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl pb-6">
          <Link
            to="/mypage"
            className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            <ChevronLeft className="h-3 w-3" />
            マイページ
          </Link>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Mypage</p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
            お問い合わせ履歴
          </h1>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && (!contacts || contacts.length === 0) && (
            <div className="flex flex-col items-center gap-2 py-24 text-center">
              <Mail className="mb-2 h-8 w-8 text-muted-foreground/15" />
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Contacts
              </span>
              <p className="text-xs text-muted-foreground/40">お問い合わせ履歴はありません</p>
              <Link
                to="/contact"
                className="mt-4 bg-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
              >
                お問い合わせする
              </Link>
            </div>
          )}

          {/* List */}
          {!isLoading && contacts && contacts.length > 0 && (
            <div className="space-y-1.5">
              {contacts.map((contact: Contact, i: number) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  expanded={expandedId === contact.id}
                  onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                  isAdmin={false}
                  index={i}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ContactsPage
