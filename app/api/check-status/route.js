import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// ==========================================
// ⚙️ ตั้งค่าคอลัมน์ใน Sheet "Form Responses 1"
// (ใส่เลขคอลัมน์โดยเริ่มนับจาก 0: A=0, B=1, C=2, ...)
// ==========================================
const CONFIG = {
  SHEET_NAME: 'Form Responses 1',
  NAME_COL: 7,     // คอลัมน์ "ชื่อ-นามสกุล"
  EMAIL_COL: 10,    // คอลัมน์ "อีเมล"
  PHONE_COL: 9,    // คอลัมน์ "เบอร์โทรศัพท์"
  STATUS_COL: 17,   // คอลัมน์ "สถานะ (ผู้สมัครหลัก/สำรอง)"
};

export async function POST(request) {
  try {
    const { searchKey } = await request.json();

    if (!searchKey || searchKey.trim() === '') {
      return NextResponse.json({ error: 'Please provide a search key' }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // ดึงข้อมูลทั้งหมดจาก Form Responses 1
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CONFIG.SHEET_NAME}!A:Z`,
    });

    const rows = response.data.values || [];
    const query = searchKey.toString().trim();

    // ค้นหาข้อมูลแบบ Exact Match
    let foundData = null;

    // เริ่มจากแถวที่ 1 (ข้าม Header แถวที่ 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = (row[CONFIG.NAME_COL] || '').toString().trim();
      const email = (row[CONFIG.EMAIL_COL] || '').toString().trim();
      const phone = (row[CONFIG.PHONE_COL] || '').toString().trim();

      // เช็คว่าตรงแบบเป๊ะๆ กับช่องใดช่องหนึ่งหรือไม่
      if (
        (name !== '' && name === query) ||
        (email !== '' && email === query) ||
        (phone !== '' && phone === query)
      ) {
        foundData = {
          name: name,
          status: (row[CONFIG.STATUS_COL] || 'รอดำเนินการ').toString().trim()
        };
        break; // เจอแล้วหยุดหา
      }
    }

    if (foundData) {
      return NextResponse.json({ found: true, data: foundData });
    } else {
      return NextResponse.json({ found: false });
    }

  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
