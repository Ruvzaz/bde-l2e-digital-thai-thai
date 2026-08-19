import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { 
          error: 'Google Sheets API credentials or Sheet ID missing in environment variables.',
          headers: [],
          rows: [],
          total: 0 
        },
        { status: 500 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch data from sheet "Main Report" and "Main BE" concurrently
    const [response, mainBeRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'Main Report'!A1:CW`,
      }).catch(err => {
        console.warn('Could not fetch sheet "Main Report":', err.message);
        return null;
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'Main BE'!A:AD`,
      }).catch(err => {
        console.warn('Could not fetch sheet "Main BE" in admin reports:', err.message);
        return null;
      }),
    ]);

    if (!response || !response.data.values || response.data.values.length === 0) {
      return NextResponse.json({
        success: true,
        sheetName: 'Main Report',
        headers: [],
        rows: [],
        total: 0,
        message: 'ไม่พบข้อมูล หรือ ชีท "Main Report" ยังไม่มีข้อมูลแถวตอบกลับ',
      });
    }

    const allValues = response.data.values;
    const mainBeValues = mainBeRes?.data?.values || [];
    const rawHeaders = allValues[0] || [];
    
    // Normalize headers (clean whitespace & line breaks)
    const headers = rawHeaders.map((h, i) => {
      const cleanH = (h || `Col_${i + 1}`).toString().replace(/[\r\n]+/g, ' ').trim();
      return cleanH;
    });

    const dataRows = allValues.slice(1);

    // Format rows into structured objects
    const formattedRows = dataRows.map((row, idx) => {
      const rowObj = { _id: idx + 1, _sheetRowIndex: idx + 2, _rawRow: row };
      
      headers.forEach((h, colIdx) => {
        const val = row[colIdx] !== undefined ? row[colIdx].toString().trim() : '';
        rowObj[h] = val;
      });

      // Find corresponding row in Main BE
      const centerCode = (row[0] || '').toString().trim();
      let beRow = mainBeValues[idx + 1]; // Try index match (header is row 0)
      if (!beRow || (centerCode && (beRow[0] || '').toString().trim() !== centerCode)) {
        beRow = mainBeValues.find((r, rIdx) => rIdx > 0 && centerCode && (r[0] || '').toString().trim() === centerCode);
      }

      // Attach Main BE summary metrics (Col AA=26, AB=27, AC=28, AD=29)
      rowObj._mainBeMetrics = {
        traineeCount: beRow ? (beRow[26] || '').toString().trim() : '',
        preTestCount: beRow ? (beRow[27] || '').toString().trim() : '',
        postTestCount: beRow ? (beRow[28] || '').toString().trim() : '',
        satisfactionCount: beRow ? (beRow[29] || '').toString().trim() : '',
      };

      // Extract structured participants array (Up to 20 participants)
      const participants = [];
      for (let p = 1; p <= 20; p++) {
        // Find indices matching participant p
        const pNameKey = headers.find(h => h.includes(`ผู้เข้าร่วมคนที่ ${p}`) || h.includes(`ผู้เข้าร่วมคนที่${p}`));
        if (pNameKey && rowObj[pNameKey]) {
          const nameVal = rowObj[pNameKey];
          if (nameVal && nameVal !== 'ไม่พบข้อมูล' && nameVal !== '-') {
            // Find prefix, phone, type near this participant
            const pIdx = headers.indexOf(pNameKey);
            const prefix = pIdx > 0 ? (row[pIdx - 1] || '') : '';
            const phone = pIdx + 1 < row.length ? (row[pIdx + 1] || '') : '';
            const pType = pIdx + 2 < row.length ? (row[pIdx + 2] || '') : '';

            participants.push({
              index: p,
              prefix: prefix,
              name: nameVal,
              phone: phone,
              type: pType,
            });
          }
        }
      }
      rowObj._participants = participants;

      return rowObj;
    });

    return NextResponse.json({
      success: true,
      sheetName: 'Main Report',
      headers: headers,
      rows: formattedRows,
      total: formattedRows.length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching Main Report sheet:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch data from Main Report sheet',
        headers: [],
        rows: [],
        total: 0 
      },
      { status: 500 }
    );
  }
}
