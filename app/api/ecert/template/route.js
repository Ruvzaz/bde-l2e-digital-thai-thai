import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const templatePath = path.join(process.cwd(), 'assets', 'Template.png');

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template image not found' },
        { status: 404 }
      );
    }

    const imageBuffer = await fs.promises.readFile(templatePath);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving template:', error);
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    );
  }
}
