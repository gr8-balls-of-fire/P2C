import { NextRequest, NextResponse } from 'next/server';
import { contactService } from '@/lib/service/contact.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string; contactId: string } }
) {
  try {
    const contact = await contactService.verifyEmail(params.contactId);

    if (contact.ventureId !== params.ventureId) {
      return NextResponse.json(
        { error: 'Contact not found in this venture' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify email';
    console.error('Failed to verify email:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
