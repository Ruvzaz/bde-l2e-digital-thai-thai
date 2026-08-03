import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสใบประกาศ (code)' },
        { status: 400 }
      );
    }

    const cleanCode = code.toString().trim().toUpperCase();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const sheetName = 'E-Cert Logs';

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:L`,
    });

    const rows = res.data.values || [];

    let foundCert = null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const certCode = (row[0] || '').toString().trim().toUpperCase();

      if (certCode === cleanCode) {
        // If 11+ columns used: [0:Cert, 1:CenterCode, 2:CenterName, 3:AdminName, 4:AdminEmail, 5:Prefix, 6:First, 7:Last, 8:Full, 9:Date, 10:Link, 11:Timestamp]
        const has11Cols = row.length >= 11 || (row[3] && !row[3].includes('@'));
        foundCert = {
          certCode: row[0] || '',
          centerCode: row[1] || '',
          centerName: row[2] || '',
          adminName: has11Cols ? row[3] || '' : '-',
          adminEmail: has11Cols ? row[4] || '' : row[3] || '',
          prefix: has11Cols ? row[5] || '' : row[4] || '',
          firstName: has11Cols ? row[6] || '' : row[5] || '',
          lastName: has11Cols ? row[7] || '' : row[6] || '',
          fullName: has11Cols ? row[8] || '' : row[7] || '',
          issueDate: has11Cols ? row[9] || '' : row[8] || '',
          verifyLink: has11Cols ? row[10] || '' : row[9] || '',
          timestamp: row[11] || '',
        };
        break;
      }
    }

    if (foundCert) {
      return NextResponse.json({ found: true, cert: foundCert });
    } else {
      return NextResponse.json({ found: false, message: 'ไม่พบใบประกาศนี้ในระบบ' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error verifying E-Cert:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถตรวจสอบใบประกาศได้', details: error.message },
      { status: 500 }
    );
  }
}
