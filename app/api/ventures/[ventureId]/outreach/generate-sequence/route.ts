import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/service/outreach.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { contactId, includeEmail, includeLinkedIn, emailTemplate } =
      await request.json();

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      );
    }

    const tasks = await outreachService.generateOutreachSequence(
      params.ventureId,
      contactId,
      {
        includeEmail: includeEmail !== false,
        includeLinkedIn: includeLinkedIn !== false,
        emailTemplate,
      }
    );

    return NextResponse.json(
      {
        generated: tasks.length,
        tasks,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate sequence';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
