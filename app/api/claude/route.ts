import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// ── /api/claude ──────────────────────────────────────────────
// API key fica APENAS aqui no servidor — nunca chega ao browser
// O frontend chama /api/claude, nunca api.anthropic.com diretamente

export async function POST(req: NextRequest) {
  try {
    const { prompt, maxTokens = 500, system } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { success, remaining } = rateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
      );
    }

    // Input sanitization
    const sanitizedPrompt = prompt.slice(0, 10000).trim();
    const sanitizedSystem = system ? system.slice(0, 5000).trim() : undefined;
    const clampedTokens = Math.min(Math.max(maxTokens, 50), 4096);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: clampedTokens,
        ...(sanitizedSystem && { system: sanitizedSystem }),
        messages: [{ role: "user", content: sanitizedPrompt }],
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
