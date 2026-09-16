import { NextRequest, NextResponse } from 'next/server';
import { contactService } from '@/lib/service/contact.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string; contactId: string } }
) {
  try {
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    const contact = await contactService.disqualifyContact(params.contactId, reason);

    if (contact.ventureId !== params.ventureId) {
      return NextResponse.json(
        { error: 'Contact not found in this venture' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to disqualify contact';
    console.error('Failed to disqualify contact:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
