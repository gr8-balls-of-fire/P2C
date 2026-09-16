import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const ventures = await prisma.venture.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(ventures);
  } catch (error) {
    console.error('Failed to fetch ventures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ventures' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icpNotes } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const venture = await prisma.venture.create({
      data: {
        name,
        icpNotes: icpNotes || null,
      },
    });

    return NextResponse.json(venture, { status: 201 });
  } catch (error) {
    console.error('Failed to create venture:', error);
    return NextResponse.json(
      { error: 'Failed to create venture' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
