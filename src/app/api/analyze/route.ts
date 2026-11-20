import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput, MIN_POLICY_LENGTH } from '@/lib/sanitize';
import {
  isValidContext,
  isValidPersona,
  isValidTolerance,
} from '@/lib/types';
import { analyzePolicy } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const rawPolicyText = body.policyText;
    const persona = body.persona;
    const context = body.context;
    const riskTolerance = body.riskTolerance;

    if (!rawPolicyText || typeof rawPolicyText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid policyText string.' },
        { status: 400 }
      );
    }

    const sanitizedPolicy = sanitizeInput(rawPolicyText);

    if (sanitizedPolicy.length < MIN_POLICY_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Pasted policy text is too short (minimum ${MIN_POLICY_LENGTH} characters required).`,
        },
        { status: 400 }
      );
    }

    if (!isValidPersona(persona)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unsupported user persona.' },
        { status: 400 }
      );
    }

    if (!isValidContext(context)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unsupported usage context.' },
        { status: 400 }
      );
    }

    if (!isValidTolerance(riskTolerance)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unsupported risk tolerance.' },
        { status: 400 }
      );
    }

    // Execute hybrid analysis pipeline (LLM if configured, otherwise deterministic rule engine)
    const result = await analyzePolicy({
      policyText: sanitizedPolicy,
      persona,
      context,
      riskTolerance,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during policy analysis.',
      },
      { status: 500 }
    );
  }
}
