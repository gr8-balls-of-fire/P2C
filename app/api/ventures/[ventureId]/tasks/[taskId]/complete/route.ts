import { NextRequest, NextResponse } from 'next/server';
import { pipelineService } from '@/lib/service/pipeline.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string; taskId: string } }
) {
  try {
    const { notes } = await request.json().catch(() => ({}));

    const task = await pipelineService.completeTask(params.taskId, notes);

    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete task';
    console.error('Failed to complete task:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
