import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/service/outreach.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const templates = outreachService.getEmailTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to get templates:', error);
    return NextResponse.json(
      { error: 'Failed to get templates' },
      { status: 500 }
    );
  }
}
