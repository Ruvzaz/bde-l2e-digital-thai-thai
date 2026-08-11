import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// ==========================================
// ⚙️ ตั้งค่าคอลัมน์ใน Sheet "Main BE"
// (ใส่เลขคอลัมน์โดยเริ่มนับจาก 0: A=0, B=1, C=2, ...)
// ==========================================
const CONFIG = {
  SHEET_NAME: 'Main BE',
  NAME_COL: 4,     // คอลัมน์ E "ชื่อ-นามสกุล"
  PHONE_COL: 5,    // คอลัมน์ F "โทรศัพท์"
  EMAIL_COL: 6,    // คอลัมน์ G "Email"
  STATUS_COL: 9,   // คอลัมน์ J "สถานะการคัดเลือก"
  REMARK_COL: 10,  // คอลัมน์ K "หมายเหตุ"
  TRANSFER_STATUS_COL: 19, // คอลัมน์ T "สถานะการโอน"
  CERT_TRACKING_COL: 23,  // คอลัมน์ X "เลข Tracking ใบประกาศ"
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

    // ดึงข้อมูลทั้งหมดจาก Main BE
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CONFIG.SHEET_NAME}!A:AZ`,
    });

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const query = searchKey.toString().trim();

    // ค้นหาข้อมูลแบบ Exact Match
    let foundData = null;

    // เริ่มจากแถวที่ 1 (ข้าม Header แถวที่ 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = (row[CONFIG.NAME_COL] || '').toString().trim();
      const email = (row[CONFIG.EMAIL_COL] || '').toString().trim();
      const phone = (row[CONFIG.PHONE_COL] || '').toString().trim();
      const status = (row[CONFIG.STATUS_COL] || '').toString().trim();
      const remark = (row[CONFIG.REMARK_COL] || '').toString().trim();
      const transferStatusRaw = (row[CONFIG.TRANSFER_STATUS_COL] || '').toString().trim();
      const transferStatus = transferStatusRaw === '#N/A' ? '' : transferStatusRaw;

      const transferDateRaw = (row[20] || '').toString().trim(); // Column U "วันที่โอน"
      const transferDate = transferDateRaw === '#N/A' ? '' : transferDateRaw;

      const certTrackingRaw = (row[CONFIG.CERT_TRACKING_COL] || '').toString().trim(); // Column X "เลข Tracking ใบประกาศ"
      const certTracking = (certTrackingRaw === '#N/A' || certTrackingRaw === '-') ? '' : certTrackingRaw;

      const reportStatusRaw = (row[25] || '').toString().trim(); // Column Z "สถานะรายงานผล"
      const hasReported = reportStatusRaw.includes('รายงานผลแล้ว');

      const colAARaw = hasReported ? (row[26] || '').toString().trim() : '';
      const colABRaw = hasReported ? (row[27] || '').toString().trim() : '';
      const colACRaw = hasReported ? (row[28] || '').toString().trim() : '';
      const colADRaw = hasReported ? (row[29] || '').toString().trim() : '';

      const colAA = (colAARaw === '#N/A' || colAARaw === '-') ? '' : colAARaw;
      const colAB = (colABRaw === '#N/A' || colABRaw === '-') ? '' : colABRaw;
      const colAC = (colACRaw === '#N/A' || colACRaw === '-') ? '' : colACRaw;
      const colAD = (colADRaw === '#N/A' || colADRaw === '-') ? '' : colADRaw;

      // ข้ามแถวที่ข้อมูลเป็น #N/A (หมายความว่ายังไม่มีคนกรอกข้อมูลสำหรับศูนย์นี้)
      if (name === '#N/A' || phone === '#N/A' || email === '#N/A') continue;

      // เช็คว่าตรงแบบเป๊ะๆ กับช่องใดช่องหนึ่งหรือไม่
      if (
        (name !== '' && name === query) ||
        (email !== '' && email === query) ||
        (phone !== '' && phone === query)
      ) {
        foundData = {
          name: name,
          status: status || 'ยังไม่ส่งแผน',
          remark: remark, // ส่งหมายเหตุไปด้วย
          transferStatus: transferStatus, // สถานะการโอนจาก Column T
          transferDate: transferDate, // วันที่โอนจาก Column U
          certTracking: certTracking, // เลข Tracking ใบประกาศจาก Column X
          reportStatus: reportStatusRaw, // Column Z
          hasReported: hasReported,
          traineeCount: colAA,
          preTestCount: colAB,
          postTestCount: colAC,
          satisfactionCount: colAD,
          extraCols: {
            aa: { label: headers[26] || 'จำนวนผู้อบรม', value: colAA },
            ab: { label: headers[27] || 'Pre-Test', value: colAB },
            ac: { label: headers[28] || 'Post-Test', value: colAC },
            ad: { label: headers[29] || 'ความพึงพอใจ', value: colAD },
          }
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
