import { NextRequest, NextResponse } from 'next/server';
import { pipelineService } from '@/lib/service/pipeline.service';
import { TaskStatus, Channel } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TaskStatus | null;
    const channel = searchParams.get('channel') as Channel | null;
    const sortBy = searchParams.get('sortBy') as 'priority' | 'dueAt' | null;

    const tasks = await pipelineService.getDailyTaskQueue(params.ventureId, {
      status: status || undefined,
      channel: channel || undefined,
      sortBy: sortBy || 'priority',
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to get task queue:', error);
    return NextResponse.json(
      { error: 'Failed to get task queue' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { contactId, action, channel, dueAt, priority, notes } = await request.json();

    if (!contactId || !action || !dueAt) {
      return NextResponse.json(
        { error: 'contactId, action, and dueAt are required' },
        { status: 400 }
      );
    }

    const task = await pipelineService.createTask({
      ventureId: params.ventureId,
      contactId,
      action,
      channel: channel || undefined,
      dueAt: new Date(dueAt),
      priority,
      notes,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    console.error('Failed to create task:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
