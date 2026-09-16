import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/service/outreach.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { contactId, type, templateId, action, dueAt } = await request.json();

    if (!contactId || !type) {
      return NextResponse.json(
        { error: 'contactId and type (email or linkedin) are required' },
        { status: 400 }
      );
    }

    const due = dueAt ? new Date(dueAt) : new Date();

    let task;
    if (type === 'email') {
      task = await outreachService.createEmailTask(
        params.ventureId,
        contactId,
        templateId || 'intro-1',
        due
      );
    } else if (type === 'linkedin') {
      task = await outreachService.createLinkedInTask(
        params.ventureId,
        contactId,
        action || 'connect',
        due
      );
    } else {
      return NextResponse.json(
        { error: 'type must be email or linkedin' },
        { status: 400 }
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
