'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

export function ContactForm() {
  const { t } = useI18n()
  const [result, setResult] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setResult('')
    const formData = new FormData(e.currentTarget)
    formData.append('access_key', 'f013f6ea-4485-448f-ac91-f0d28c7d07e3')
    const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.success) {
      setResult('success')
      ;(e.target as HTMLFormElement).reset()
    } else {
      setResult('error')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#666] uppercase tracking-widest mb-2">
            {t.contact.name}
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder={t.contact.namePlaceholder}
            className="w-full bg-[#111] border border-[#1f1f1f] rounded px-4 py-3 font-mono text-[#f0f0f0] text-sm focus:outline-none focus:border-[#f97316] transition-colors placeholder-[#444]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#666] uppercase tracking-widest mb-2">
            {t.contact.email}
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder={t.contact.emailPlaceholder}
            className="w-full bg-[#111] border border-[#1f1f1f] rounded px-4 py-3 font-mono text-[#f0f0f0] text-sm focus:outline-none focus:border-[#f97316] transition-colors placeholder-[#444]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-[#666] uppercase tracking-widest mb-2">
          {t.contact.subject}
        </label>
        <input
          type="text"
          name="subject"
          required
          placeholder={t.contact.subjectPlaceholder}
          className="w-full bg-[#111] border border-[#1f1f1f] rounded px-4 py-3 font-mono text-[#f0f0f0] text-sm focus:outline-none focus:border-[#f97316] transition-colors placeholder-[#444]"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-[#666] uppercase tracking-widest mb-2">
          {t.contact.message}
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder={t.contact.messagePlaceholder}
          className="w-full bg-[#111] border border-[#1f1f1f] rounded px-4 py-3 font-mono text-[#f0f0f0] text-sm focus:outline-none focus:border-[#f97316] transition-colors placeholder-[#444] resize-none"
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#f97316] text-white font-mono font-bold px-8 py-3 rounded hover:bg-[#fb923c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? t.contact.sending : t.contact.submit}
        </button>
        {result === 'success' && (
          <span className="text-[#22c55e] text-sm font-mono flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 8 6.5 11.5 13 5"/></svg>
            {t.contact.success}
          </span>
        )}
        {result === 'error' && (
          <span className="text-[#ef4444] text-sm font-mono">{t.contact.error}</span>
        )}
      </div>
    </form>
  )
}
