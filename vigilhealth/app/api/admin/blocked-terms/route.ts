/**
 * Blocked Terms Admin API
 *
 * GET  /api/admin/blocked-terms — Get current blocked terms list
 * POST /api/admin/blocked-terms — Add new blocked terms
 * DELETE /api/admin/blocked-terms — Remove a blocked term
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { addBlockedTerms, getBlockedTerms, setBlockedTerms } from '@/lib/moderation/content-filter';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ terms: getBlockedTerms() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { terms?: string[] };

    if (!Array.isArray(body.terms) || body.terms.length === 0) {
      return NextResponse.json({ error: 'terms array is required' }, { status: 400 });
    }

    const validTerms = body.terms.filter((t) => typeof t === 'string' && t.trim().length > 0);
    addBlockedTerms(validTerms);

    return NextResponse.json({
      success: true,
      added: validTerms.length,
      total: getBlockedTerms().length,
    });
  } catch (error) {
    console.error('[BlockedTerms POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as { term?: string };

    if (!body.term?.trim()) {
      return NextResponse.json({ error: 'term is required' }, { status: 400 });
    }

    const termToRemove = body.term.toLowerCase().trim();
    const current = getBlockedTerms();
    const updated = current.filter((t) => t !== termToRemove);
    setBlockedTerms(updated);

    return NextResponse.json({
      success: true,
      removed: current.length - updated.length,
      total: updated.length,
    });
  } catch (error) {
    console.error('[BlockedTerms DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
