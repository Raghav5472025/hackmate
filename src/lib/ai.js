// src/lib/ai.js
// Sab AI calls yahan se jayenge — Supabase Edge Function ke through

export async function callAI({ system, messages, max_tokens = 4000 }) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const res = await fetch(
      `${supabaseUrl}/functions/v1/ai-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ system, messages, max_tokens }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('AI proxy error:', err)
      throw new Error('AI service error: ' + res.status)
    }

    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.content?.[0]?.text || ''
  } catch (err) {
    console.error('callAI error:', err)
    throw err
  }
}