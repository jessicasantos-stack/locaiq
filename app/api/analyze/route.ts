/**
 * Analysis API
 * POST /api/analyze
 * Processa análises com Claude
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, analysis_type, prompt } = await request.json();

    if (!client_id || !analysis_type || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ========================================================================
    // Chamar Claude
    // ========================================================================

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 2048,
      system: `
Você é um especialista em SEO Local e Google Business Profile.
Forneça análises detalhadas, práticas e acionáveis.
Responda em Português (Brasil).
Se a resposta for JSON, formate claramente.
Se for texto, estruture com títulos e tópicos.
      `,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // ========================================================================
    // Tentar parsear como JSON (se vier JSON)
    // ========================================================================

    let result: any = response.text;

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Não é JSON, manter como texto
    }

    // ========================================================================
    // Salvar no banco (análise log)
    // ========================================================================

    await supabase.from('analysis_logs').insert({
      client_id,
      analysis_type,
      result: result,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      created_at: new Date().toISOString(),
    }).catch(() => {
      // Ignorar se tabela não existir
    });

    // ========================================================================
    // Retornar resultado
    // ========================================================================

    return NextResponse.json({
      success: true,
      result,
      analysis_type,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });
  } catch (error: any) {
    console.error('[Analyze API]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
