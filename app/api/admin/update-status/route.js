import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { sheetRowIndex, status, note } = await req.json();

    if (!sheetRowIndex || status === undefined) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (ต้องการ sheetRowIndex และ status)' },
        { status: 400 }
      );
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { error: 'ไม่มีข้อมูลตั้งค่า Google Sheets API credentials ในระบบ' },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Range D to E (Col D = สถานะตรวจรายงาน, Col E = หมายเหตุตรวจผลงาน)
    const range = `'Main Report'!D${sheetRowIndex}:E${sheetRowIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[status, note || '']],
      },
    });

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะตรวจรายงานและหมายเหตุเรียบร้อยแล้ว`,
      sheetRowIndex,
      status,
      note,
      updatedRange: range,
    });
  } catch (error) {
    console.error('Error updating status in Google Sheet:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลไปยัง Google Sheet' },
      { status: 500 }
    );
  }
}
