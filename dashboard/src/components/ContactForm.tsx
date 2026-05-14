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

  const labelCls = 'block text-[12px] font-semibold uppercase tracking-[0.12em] mb-2'
  const labelStyle = { color: 'var(--ink-500)' }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div>
          <label className={labelCls} style={labelStyle}>{t.contact.name}</label>
          <input type="text" name="name" required placeholder={t.contact.namePlaceholder} className="input" />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>{t.contact.email}</label>
          <input type="email" name="email" required placeholder={t.contact.emailPlaceholder} className="input" />
        </div>
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>{t.contact.subject}</label>
        <input type="text" name="subject" required placeholder={t.contact.subjectPlaceholder} className="input" />
      </div>
      <div>
        <label className={labelCls} style={labelStyle}>{t.contact.message}</label>
        <textarea name="message" required rows={5} placeholder={t.contact.messagePlaceholder} className="textarea" style={{ resize: 'none' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ opacity: submitting ? 0.6 : 1 }}>
          {submitting ? t.contact.sending : t.contact.submit}
        </button>
        {result === 'success' && (
          <span style={{ color: 'var(--success-600)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 8 6.5 11.5 13 5"/></svg>
            {t.contact.success}
          </span>
        )}
        {result === 'error' && (
          <span style={{ color: 'var(--danger-500)', fontSize: 14 }}>{t.contact.error}</span>
        )}
      </div>
    </form>
  )
}
