import { NextRequest, NextResponse } from 'next/server';
import { contactService } from '@/lib/service/contact.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { ventureId: string; contactId: string } }
) {
  try {
    const contact = await contactService.getContactWithHistory(params.contactId);

    if (contact.ventureId !== params.ventureId) {
      return NextResponse.json(
        { error: 'Contact not found in this venture' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Failed to get contact:', error);
    return NextResponse.json(
      { error: 'Contact not found' },
      { status: 404 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { ventureId: string; contactId: string } }
) {
  try {
    const body = await request.json();

    const contact = await contactService.enrichContact(params.contactId, body);

    if (contact.ventureId !== params.ventureId) {
      return NextResponse.json(
        { error: 'Contact not found in this venture' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update contact';
    console.error('Failed to update contact:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
