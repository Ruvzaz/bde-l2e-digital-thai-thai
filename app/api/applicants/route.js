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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Main BE!A:Z', // เปลี่ยนเป้าหมายไปดึงจาก Main BE
    });

    const rows = response.data.values || [];

    let mainCount = 0;
    let reserveCount = 0;

    // ==========================================
    // ⚙️ ตั้งค่าคอลัมน์สถานะใน Main BE (Column J = index 9)
    // ==========================================
    const STATUS_COL = 9;

    // Start from 1 to skip header
    for (let i = 1; i < rows.length; i++) {
      // ข้ามแถวที่ข้อมูลยังเป็น #N/A หรือว่าง
      const status = (rows[i][STATUS_COL] || '').toString().trim();
      
      if (status === '' || status === '#N/A') continue;

      if (status.includes('สำรอง')) {
        reserveCount++;
      } else if (status === 'อนุมัติเข้าร่วมกิจกรรม' || status.includes('อนุมัติเข้าร่วมกิจกรรม')) {
        // เช็คว่าถ้ามีคำว่า 'สำรอง' จะเข้าเงื่อนไขบนไปแล้ว ส่วนอันนี้คือตัวจริง
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
