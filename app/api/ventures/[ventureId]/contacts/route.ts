import { NextRequest, NextResponse } from 'next/server';
import { contactService } from '@/lib/service/contact.service';
import { State, ProspectState } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const state = searchParams.get('state') as State | null;
    const prospectState = searchParams.get('prospectState') as ProspectState | null;
    const source = searchParams.get('source');

    const result = await contactService.listContactsByVenture(
      params.ventureId,
      {
        state: state || undefined,
        prospectState: prospectState || undefined,
        source: source || undefined,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list contacts:', error);
    return NextResponse.json(
      { error: 'Failed to list contacts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const body = await request.json();

    const contact = await contactService.createContact(params.ventureId, body);

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contact';
    console.error('Failed to create contact:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
