import { NextRequest, NextResponse } from 'next/server';
import { contactService } from '@/lib/service/contact.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { ventureId: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    const csvData = await file.text();
    const result = await contactService.importContactsCSV(params.ventureId, csvData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import contacts';
    console.error('Failed to import contacts:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
