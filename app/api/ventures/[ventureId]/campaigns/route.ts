import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { ventureId: params.ventureId },
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Failed to list campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to list campaigns' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const { name, description, stages } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    // stages is array of strings: ["Lead Qualified", "Demo Scheduled", "Proposal Sent"]
    const campaign = await prisma.campaign.create({
      data: {
        ventureId: params.ventureId,
        name,
        description: description || null,
        stages: {
          createMany: {
            data: (stages || []).map((stageName: string, index: number) => ({
              name: stageName,
              order: index,
            })),
          },
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create campaign';
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
