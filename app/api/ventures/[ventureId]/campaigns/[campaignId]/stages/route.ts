import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { ventureId: string; campaignId: string } }
) {
  try {
    const stages = await prisma.campaignStage.findMany({
      where: { campaignId: params.campaignId },
      orderBy: { order: 'asc' },
    });

    // Verify campaign belongs to venture
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.campaignId },
    });

    if (!campaign || campaign.ventureId !== params.ventureId) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stages);
  } catch (error) {
    console.error('Failed to list stages:', error);
    return NextResponse.json(
      { error: 'Failed to list stages' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string; campaignId: string } }
) {
  try {
    const { name, order } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Stage name is required' },
        { status: 400 }
      );
    }

    // Verify campaign belongs to venture
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.campaignId },
    });

    if (!campaign || campaign.ventureId !== params.ventureId) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // If order not provided, append to end
    let stageOrder = order;
    if (stageOrder === undefined) {
      const maxOrder = await prisma.campaignStage.findFirst({
        where: { campaignId: params.campaignId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      stageOrder = (maxOrder?.order ?? -1) + 1;
    }

    const stage = await prisma.campaignStage.create({
      data: {
        campaignId: params.campaignId,
        name,
        order: stageOrder,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create stage';
    console.error('Failed to create stage:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
