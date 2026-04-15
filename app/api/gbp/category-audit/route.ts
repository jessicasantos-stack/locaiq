/**
 * Category Safety Audit
 * POST /api/gbp/category-audit
 * Valida categorias antes de recomendar
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  categorySafety,
  getSafeRecommendation,
} from '@/app/utils/categorySafetyChecker';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      client_id,
      action, // 'validate_single' | 'validate_set' | 'suggest'
      category,
      categories,
      industry,
      is_secondary,
    } = await request.json();

    if (!client_id || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ========================================================================
    // AÇÃO 1: Validar UMA categoria
    // ========================================================================

    if (action === 'validate_single' && category) {
      const validation = categorySafety.validateCategory(
        category,
        industry,
        is_secondary || false
      );

      // Log na auditoria
      await supabase.from('category_audit_log').insert({
        client_id,
        action: 'evaluated',
        category,
        is_primary: !is_secondary,
        risk_level: validation.riskLevel,
        risk_reason: validation.reasons.join('; '),
        status: 'pending',
      });

      return NextResponse.json({
        success: true,
        validation,
      });
    }

    // ========================================================================
    // AÇÃO 2: Validar SET de categorias
    // ========================================================================

    if (action === 'validate_set' && categories) {
      const validation = categorySafety.validateCategorySet(
        categories,
        industry,
        categories[0]
      );

      // Log stuffing detectado
      if (validation.stuffing_detected) {
        await supabase.from('category_audit_log').insert({
          client_id,
          action: 'evaluated',
          category: `Set: ${categories.join(', ')}`,
          risk_level: 'critical',
          risk_reason: validation.warning,
          status: 'rejected',
        });
      }

      return NextResponse.json({
        success: true,
        validation,
        stuffing_detected: validation.stuffing_detected,
      });
    }

    // ========================================================================
    // AÇÃO 3: Sugerir próxima categoria SEGURA
    // ========================================================================

    if (action === 'suggest' && categories && category) {
      const recommendation = getSafeRecommendation(
        categories,
        category,
        industry
      );

      if (recommendation.canAdd) {
        // Log como approved
        await supabase.from('category_audit_log').insert({
          client_id,
          action: 'added',
          category,
          risk_level: 'low',
          status: 'approved',
        });
      } else {
        // Log como rejected
        await supabase.from('category_audit_log').insert({
          client_id,
          action: 'evaluated',
          category,
          risk_level: 'high',
          risk_reason: recommendation.reason,
          status: 'rejected',
        });
      }

      return NextResponse.json({
        success: true,
        ...recommendation,
      });
    }

    // ========================================================================
    // AÇÃO 4: Detectar Stuffing
    // ========================================================================

    if (action === 'detect_stuffing' && categories) {
      const detection = categorySafety.detectStuffing(categories);

      return NextResponse.json({
        success: true,
        ...detection,
      });
    }

    // ========================================================================
    // AÇÃO 5: Listar histórico de auditoria
    // ========================================================================

    if (action === 'history') {
      const { data: history, error } = await supabase
        .from('category_audit_log')
        .select('*')
        .eq('client_id', client_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        history: history || [],
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Category Audit]', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
