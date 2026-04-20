import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function callGroq(messages: any[], system: string) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

async function callGemini(messages: any[], system: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const prompt = messages.map((m: any) => m.content).join("\n");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: (system ? system + "\n\n" : "") + prompt }] }],
      }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { message, messages, system } = body;

    const msgs = messages || [{ role: "user", content: message || "Hello" }];
    const sys = system || "";

    let result = "";

    // Try Groq first
    try {
      result = await callGroq(msgs, sys);
      console.log("✅ Groq responded");
    } catch (groqErr) {
      console.log("⚠️ Groq failed, trying Gemini...", groqErr.message);
      // Fallback to Gemini
      try {
        result = await callGemini(msgs, sys);
        console.log("✅ Gemini responded");
      } catch (geminiErr) {
        throw new Error("Both AI services failed: " + geminiErr.message);
      }
    }

    return new Response(
      JSON.stringify({
        content: [{ type: "text", text: result }],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});