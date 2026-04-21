import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// OpenRouter — supports many models, good for large JSON output
async function callOpenRouter(messages: any[], system: string, maxTokens: number) {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://hackmate-six.vercel.app",
      "X-Title": "HackMate AI",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      max_tokens: maxTokens,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "OpenRouter error");
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenRouter");
  return text;
}

// Groq — fast, free tier
async function callGroq(messages: any[], system: string, maxTokens: number) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: Math.min(maxTokens, 6000),
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Groq error");
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

// Gemini — Google AI
async function callGemini(messages: any[], system: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const prompt = messages.map((m: any) => m.content).join("\n");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: (system ? system + "\n\n" : "") + prompt }] }],
        generationConfig: { maxOutputTokens: 4000 },
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Gemini error");
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

// Anthropic — Claude
async function callAnthropic(messages: any[], system: string, maxTokens: number) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system: system || undefined,
      messages,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Anthropic error");
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Empty response from Anthropic");
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { message, messages, system, max_tokens } = body;
    const maxTokens = max_tokens || 4000;

    const msgs = messages || [{ role: "user", content: message || "Hello" }];
    const sys = system || "";

    // Detect if this is a PPT/JSON request (needs more tokens and better model)
    const isPPTRequest = sys.includes('"slides"') || sys.includes('JSON FORMAT') || sys.includes('layout');

    let result = "";
    const errors: string[] = [];

    if (isPPTRequest) {
      // For PPT: Try Groq first (large context), then OpenRouter, then Anthropic
      const pptOrder = [
        { name: "Groq", fn: () => callGroq(msgs, sys, maxTokens) },
        { name: "OpenRouter", fn: () => callOpenRouter(msgs, sys, maxTokens) },
        { name: "Anthropic", fn: () => callAnthropic(msgs, sys, maxTokens) },
        { name: "Gemini", fn: () => callGemini(msgs, sys) },
      ];

      for (const service of pptOrder) {
        try {
          result = await service.fn();
          console.log(`✅ PPT generated via ${service.name}`);
          break;
        } catch (err: any) {
          console.log(`⚠️ ${service.name} failed: ${err.message}`);
          errors.push(`${service.name}: ${err.message}`);
        }
      }
    } else {
      // For regular chat: Try Groq, then OpenRouter, then Gemini, then Anthropic
      const chatOrder = [
        { name: "Groq", fn: () => callGroq(msgs, sys, maxTokens) },
        { name: "OpenRouter", fn: () => callOpenRouter(msgs, sys, maxTokens) },
        { name: "Gemini", fn: () => callGemini(msgs, sys) },
        { name: "Anthropic", fn: () => callAnthropic(msgs, sys, maxTokens) },
      ];

      for (const service of chatOrder) {
        try {
          result = await service.fn();
          console.log(`✅ Chat via ${service.name}`);
          break;
        } catch (err: any) {
          console.log(`⚠️ ${service.name} failed: ${err.message}`);
          errors.push(`${service.name}: ${err.message}`);
        }
      }
    }

    if (!result) {
      throw new Error("All AI services failed: " + errors.join(" | "));
    }

    return new Response(
      JSON.stringify({ content: [{ type: "text", text: result }] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("ai-proxy error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});