import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Cache this API response for 1 hour (3600 seconds) since center list rarely changes
export const revalidate = 3600; 

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

    // Fetch data from Google Sheet. Range: รายชื่อศูนย์!A:C
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'รายชื่อศูนย์!A:C',
    });

    const rows = response.data.values || [];
    
    // Skip header row if exists, map data
    const centers = [];
    for (let i = 0; i < rows.length; i++) {
      // Assuming first row is header if it contains "รหัส"
      if (i === 0 && rows[i][0] && rows[i][0].toString().includes('รหัส')) {
        continue;
      }
      
      const code = rows[i][0] || '';
      const province = rows[i][1] || '';
      const name = rows[i][2] || '';
      
      if (code || name) {
        centers.push({ code, province, name });
      }
    }

    return NextResponse.json({ centers });
  } catch (error) {
    console.error('Error fetching Center list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch centers', details: error.message },
      { status: 500 }
    );
  }
}
