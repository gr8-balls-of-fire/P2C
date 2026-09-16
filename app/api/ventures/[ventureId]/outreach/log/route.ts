import { NextRequest, NextResponse } from 'next/server';
import { outreachService } from '@/lib/service/outreach.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { contactId, type, action, outcome, templateId, messageId } =
      await request.json();

    if (!contactId || !type) {
      return NextResponse.json(
        { error: 'contactId and type (email or linkedin) required' },
        { status: 400 }
      );
    }

    if (type === 'email') {
      await outreachService.logEmailSent(
        params.ventureId,
        contactId,
        templateId || 'intro-1',
        messageId
      );
    } else if (type === 'linkedin') {
      await outreachService.logLinkedInOutcome(
        params.ventureId,
        contactId,
        action || 'connect',
        outcome || 'success'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to log';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
