import { NextRequest, NextResponse } from 'next/server';
import { contactService } from '@/lib/service/contact.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string; contactId: string } }
) {
  try {
    const { stageName } = await request.json();

    if (!stageName) {
      return NextResponse.json(
        { error: 'Stage name is required' },
        { status: 400 }
      );
    }

    const contact = await contactService.moveToCustomStage(
      params.contactId,
      stageName
    );

    if (contact.ventureId !== params.ventureId) {
      return NextResponse.json(
        { error: 'Contact not found in this venture' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move contact to stage';
    console.error('Failed to move contact to stage:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
