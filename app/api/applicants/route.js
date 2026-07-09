import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Fetch data from Google Sheet. Range: Form Responses 1!A:Z
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Form Responses 1!A:Z',
    });

    const rows = response.data.values || [];

    let mainCount = 0;
    let reserveCount = 0;

    // Start from 1 to skip header
    for (let i = 1; i < rows.length; i++) {
      const status = (rows[i][17] || '').toString().trim();
      if (status.includes('สำรอง')) {
        reserveCount++;
      } else if (status.includes('ศูนย์ได้รับการคัดเลือก')) {
        mainCount++;
      }
    }

    return NextResponse.json(
      {
        count: mainCount,
        reserveCount: reserveCount
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicants', details: error.message },
      { status: 500 }
    );
  }
}
