import { NextRequest, NextResponse } from 'next/server';
import { pipelineService } from '@/lib/service/pipeline.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { contactIds } = await request.json();

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds array is required' },
        { status: 400 }
      );
    }

    const marked = await pipelineService.markDormantContacts(
      params.ventureId,
      contactIds
    );

    return NextResponse.json({
      marked: marked.length,
      contactIds: marked,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark dormant contacts';
    console.error('Failed to mark dormant contacts:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
