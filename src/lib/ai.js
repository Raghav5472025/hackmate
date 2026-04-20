// src/lib/ai.js
// Sab AI calls yahan se jayenge — Supabase Edge Function ke through
import { supabase } from './supabase'

export async function callAI({ system, messages, max_tokens = 4000 }) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ system, messages, max_tokens }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('AI proxy error:', err)
      throw new Error('AI service error')
    }

    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.content?.[0]?.text || ''
  } catch (err) {
    console.error('callAI error:', err)
    throw err
  }
}
