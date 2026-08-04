import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const referer = request.headers.get('referer') || '';
    const secFetchDest = request.headers.get('sec-fetch-dest') || '';
    const secFetchMode = request.headers.get('sec-fetch-mode') || '';
    const host = request.headers.get('host') || '';

    // 1. BLOCK Direct Browser Navigation / Opening in New Tab
    if (secFetchDest === 'document' || secFetchMode === 'navigate') {
      return NextResponse.json(
        { error: 'Direct access to certificate template is strictly forbidden.' },
        { status: 403 }
      );
    }

    // 2. BLOCK Requests without valid local Referer (Direct URL typing or external stealing)
    const isLocalReferer = referer && (referer.includes(host) || referer.includes('localhost') || referer.includes('127.0.0.1') || referer.includes('l2e-dtt.online'));
    
    if (!isLocalReferer && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized access origin.' },
        { status: 403 }
      );
    }

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
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'X-Content-Type-Options': 'nosniff',
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
