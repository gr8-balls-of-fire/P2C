import { NextRequest, NextResponse } from 'next/server';
import { pipelineService } from '@/lib/service/pipeline.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string; taskId: string } }
) {
  try {
    const { reason } = await request.json().catch(() => ({}));

    const task = await pipelineService.skipTask(params.taskId, reason);

    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to skip task';
    console.error('Failed to skip task:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
