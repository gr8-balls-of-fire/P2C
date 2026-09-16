import { NextRequest, NextResponse } from 'next/server';
import { pipelineService } from '@/lib/service/pipeline.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const dormantIds = await pipelineService.identifyDormantContacts(
      params.ventureId
    );

    return NextResponse.json({
      count: dormantIds.length,
      contactIds: dormantIds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to identify dormant contacts';
    console.error('Failed to identify dormant contacts:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
