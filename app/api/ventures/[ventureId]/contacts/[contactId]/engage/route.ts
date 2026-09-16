import { NextRequest, NextResponse } from 'next/server';
import { pipelineService } from '@/lib/service/pipeline.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string; contactId: string } }
) {
  try {
    const { reason } = await request.json().catch(() => ({}));

    const contact = await pipelineService.engageContact(
      params.ventureId,
      params.contactId,
      reason
    );

    return NextResponse.json(contact);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to engage contact';
    console.error('Failed to engage contact:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
