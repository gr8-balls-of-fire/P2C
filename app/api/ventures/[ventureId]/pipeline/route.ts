import { NextRequest, NextResponse } from 'next/server';
import { pipelineService } from '@/lib/service/pipeline.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const view = await pipelineService.getPipelineView(params.ventureId);

    return NextResponse.json(view);
  } catch (error) {
    console.error('Failed to get pipeline view:', error);
    return NextResponse.json(
      { error: 'Failed to get pipeline view' },
      { status: 500 }
    );
  }
}
