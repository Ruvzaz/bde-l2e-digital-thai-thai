import { google } from 'googleapis';
import { NextResponse } from 'next/server';

let driveClient = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file id' }, { status: 400 });
    }

    // 1. Try Service Account download (Instant & Authorized)
    try {
      const drive = getDriveClient();
      if (drive) {
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        if (response.data && response.data.byteLength > 500) {
          const buffer = Buffer.from(response.data);
          const contentType = response.headers['content-type'] || 'image/jpeg';
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
          });
        }
      }
    } catch (err) {
      console.warn(`[Drive Proxy] Service Account fetch failed for ${fileId}:`, err.message);
    }

    // 2. Server-side Public Thumbnail Fallback (Avoids CORS redirect errors in browser)
    const fallbackUrls = [
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://drive.google.com/uc?export=download&id=${fileId}`,
    ];

    for (const fUrl of fallbackUrls) {
      try {
        const res = await fetch(fUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 500) {
            const contentType = res.headers.get('content-type') || 'image/jpeg';
            return new NextResponse(Buffer.from(buf), {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
              },
            });
          }
        }
      } catch (e) {
        // Try next fallback
      }
    }

    return NextResponse.json({ error: 'Failed to retrieve image data' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
