import { NextRequest, NextResponse } from "next/server";

// ── /api/claude ──────────────────────────────────────────────
// API key fica APENAS aqui no servidor — nunca chega ao browser
// O frontend chama /api/claude, nunca api.anthropic.com diretamente

export async function POST(req: NextRequest) {
  try {
    const { prompt, maxTokens = 500, system } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // Rate limiting básico por IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    // TODO: implementar rate limiting com Upstash Redis se necessário

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!, // ← seguro: server-side only
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        ...(system && { system }),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Claude API error:", error);
      return NextResponse.json(
        { error: "Claude API error", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    return NextResponse.json({ text });

  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
