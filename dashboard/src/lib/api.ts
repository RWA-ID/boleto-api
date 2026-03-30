export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function getApiKey(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('boleto_api_key') : null
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('boleto_api_key') : null
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.message || err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Events
export const createEvent = (body: object) =>
  apiFetch('/v1/events', { method: 'POST', body: JSON.stringify(body) })

export const confirmEvent = (invoiceId: string, txHash: string) =>
  apiFetch(`/v1/events/${invoiceId}/confirm`, { method: 'POST', body: JSON.stringify({ txHash }) })

export const getEvent = (id: string) => apiFetch(`/v1/events/${id}`)

export const getInventory = (eventId: string) => apiFetch(`/v1/events/${eventId}/inventory`)

export const mintTicket = (eventId: string, body: object) =>
  apiFetch(`/v1/events/${eventId}/mint`, { method: 'POST', body: JSON.stringify(body) })

// Image upload
export async function uploadImage(file: File): Promise<{ uri: string; cid: string }> {
  const apiKey = getApiKey()
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API_BASE}/v1/upload/image`, {
    method: 'POST',
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}
