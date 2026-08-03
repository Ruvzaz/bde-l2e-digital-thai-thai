import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-Memory Cache for Center List
let centersCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.com';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  const maskedName = name[0] + '*'.repeat(Math.max(2, name.length - 2)) + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

async function getCentersMap(sheets, spreadsheetId) {
  const now = Date.now();
  if (centersCache && now - lastCacheTime < CACHE_TTL_MS) {
    return centersCache;
  }

  try {
    const centersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'รายชื่อศูนย์!A:C',
    });
    const rows = centersRes.data.values || [];
    const map = new Map();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = (row[0] || '').toString().trim();
      const province = (row[1] || '').toString().trim();
      const name = (row[2] || '').toString().trim();

      if (code) {
        let fullName = name || `ศูนย์ดิจิทัลชุมชน (${code})`;
        if (province) {
          fullName += ` จ.${province}`;
        }
        map.set(code, fullName);
      }
    }

    centersCache = map;
    lastCacheTime = now;
    return map;
  } catch (e) {
    console.warn('Error building centers cache:', e.message);
    return centersCache || new Map();
  }
}

export async function POST(request) {
  try {
    const { centerCode, email, adminName } = await request.json();

    if (!centerCode || !email) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสศูนย์และอีเมลผู้ดูแลศูนย์' },
        { status: 400 }
      );
    }

    const cleanCenterCode = centerCode.toString().trim();
    const cleanEmail = email.toString().trim().toLowerCase();
    const inputAdminName = adminName ? adminName.toString().trim() : '';

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 1. Fast In-Memory Map Lookup for Center Code
    const centersMap = await getCentersMap(sheets, spreadsheetId);
    const verifiedCenterName = centersMap.get(cleanCenterCode);

    if (!verifiedCenterName) {
      return NextResponse.json(
        {
          valid: false,
          error: `ไม่พบรหัสศูนย์ "${cleanCenterCode}" ในระบบรายชื่อศูนย์ที่ได้รับอนุญาต กรุณาตรวจสอบรหัสศูนย์อีกครั้ง`,
        },
        { status: 400 }
      );
    }

    // 1.5 Check Approval Status in Sheet "Main BE" (Column J = Index 9)
    let mainBeStatus = null;
    let foundInMainBe = false;

    try {
      const mainBeRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Main BE!A:Z',
      });
      const mainBeRows = mainBeRes.data.values || [];

      for (let i = 1; i < mainBeRows.length; i++) {
        const row = mainBeRows[i];
        const status = (row[9] || '').toString().trim(); // Column J
        const rowString = row.join(' ');

        if (rowString.includes(cleanCenterCode)) {
          foundInMainBe = true;
          mainBeStatus = status;
          break;
        }
      }
    } catch (e) {
      console.warn('Error reading Main BE status:', e.message);
    }

    if (foundInMainBe && mainBeStatus !== 'อนุมัติเข้าร่วมกิจกรรม') {
      const currentStatusText = mainBeStatus || 'ยังไม่อนุมัติ';
      return NextResponse.json(
        {
          valid: false,
          error: `รหัสศูนย์ ${cleanCenterCode} ยังไม่ได้รับการอนุมัติเข้าร่วมกิจกรรม (สถานะปัจจุบัน: "${currentStatusText}") จึงยังไม่สามารถใช้งานระบบออกใบประกาศ E-Cert ได้`,
        },
        { status: 400 }
      );
    }

    // 2. Search for registered Email and existing Admin Name in "E-Cert Admin Logs" or "E-Cert Logs"
    const adminLogSheetName = 'E-Cert Admin Logs';
    let registeredEmail = null;
    let savedAdminName = null;

    try {
      const logsRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${adminLogSheetName}!A:F`,
      });
      const logRows = logsRes.data.values || [];

      for (let i = 1; i < logRows.length; i++) {
        const row = logRows[i];
        const rowCode = (row[1] || '').toString().trim();
        const rowAdminName = (row[3] || '').toString().trim();
        const rowEmail = (row[4] || '').toString().trim().toLowerCase();

        if (rowCode === cleanCenterCode && rowEmail) {
          if (!registeredEmail) registeredEmail = rowEmail;
          if (rowAdminName && rowAdminName !== '-' && !savedAdminName) {
            savedAdminName = rowAdminName;
          }
        }
      }
    } catch (e) {
      console.log('E-Cert Admin Logs sheet not created yet');
    }

    // Fallback check in "E-Cert Logs" if not found in Admin Logs
    if (!registeredEmail || !savedAdminName) {
      try {
        const ecertLogsRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'E-Cert Logs!A:K',
        });
        const ecertRows = ecertLogsRes.data.values || [];
        for (let i = 1; i < ecertRows.length; i++) {
          const row = ecertRows[i];
          const rowCode = (row[1] || '').toString().trim();
          const has11Cols = row.length >= 11 || (row[3] && !row[3].includes('@'));
          const rowAdminName = has11Cols ? (row[3] || '').trim() : '';
          const rowEmail = (has11Cols ? row[4] : row[3] || '').toString().trim().toLowerCase();

          if (rowCode === cleanCenterCode && rowEmail.includes('@')) {
            if (!registeredEmail) registeredEmail = rowEmail;
            if (rowAdminName && rowAdminName !== '-' && !savedAdminName) {
              savedAdminName = rowAdminName;
            }
          }
        }
      } catch (e) {
        console.log('E-Cert Logs sheet not created yet');
      }
    }

    // 3. Email Authentication Check
    if (registeredEmail && registeredEmail !== cleanEmail) {
      const hint = maskEmail(registeredEmail);
      return NextResponse.json(
        {
          valid: false,
          error: `อีเมลไม่ถูกต้อง! รหัสศูนย์ ${cleanCenterCode} ถูกลงทะเบียนเข้าใช้งานไว้ด้วยอีเมล "${hint}" กรุณากรอกอีเมลให้ตรงกับที่ลงทะเบียนไว้ครั้งแรกเพื่อเข้าถึงข้อมูล`,
        },
        { status: 400 }
      );
    }

    // 4. Admin Name Prompt Check (if no saved admin name and user didn't provide one)
    const effectiveAdminName = savedAdminName || inputAdminName;

    if (!effectiveAdminName) {
      // First time user, needs to enter Admin Name
      return NextResponse.json({
        valid: true,
        requiresAdminName: true,
        center: {
          code: cleanCenterCode,
          name: verifiedCenterName,
          email: cleanEmail,
        },
      });
    }

    // 5. If new adminName was provided and not saved before, append log to Google Sheet
    if (inputAdminName && (!savedAdminName || savedAdminName !== inputAdminName)) {
      (async () => {
        try {
          const nowStr = new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          try {
            await sheets.spreadsheets.values.append({
              spreadsheetId,
              range: `${adminLogSheetName}!A:F`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [
                  [
                    nowStr,
                    cleanCenterCode,
                    verifiedCenterName,
                    effectiveAdminName,
                    cleanEmail,
                    'ยืนยันตัวตนสำเร็จ (Step 1)',
                  ],
                ],
              },
            });
          } catch (err) {
            console.error('Log append error:', err.message);
          }
        } catch (err) {
          console.error('Log error:', err.message);
        }
      })();
    }

    // 6. Fetch history of certificates for this authenticated center
    let history = [];
    try {
      const certsRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'E-Cert Logs!A:K',
      });
      const certRows = certsRes.data.values || [];

      for (let i = 1; i < certRows.length; i++) {
        const row = certRows[i];
        const logCenterCode = (row[1] || '').toString().trim();
        if (logCenterCode === cleanCenterCode) {
          const has11Cols = row.length >= 11 || (row[3] && !row[3].includes('@'));
          history.push({
            certCode: row[0] || '',
            centerCode: row[1] || '',
            centerName: row[2] || '',
            adminName: has11Cols ? row[3] || '' : effectiveAdminName,
            adminEmail: has11Cols ? row[4] || '' : row[3] || '',
            prefix: has11Cols ? row[5] || '' : row[4] || '',
            firstName: has11Cols ? row[6] || '' : row[5] || '',
            lastName: has11Cols ? row[7] || '' : row[6] || '',
            fullName: has11Cols ? row[8] || '' : row[7] || '',
            issueDate: has11Cols ? row[9] || '' : row[8] || '',
            verifyLink: has11Cols ? row[10] || '' : row[9] || '',
          });
        }
      }
    } catch (e) {
      console.log('No cert logs available');
    }

    return NextResponse.json({
      valid: true,
      requiresAdminName: false,
      center: {
        code: cleanCenterCode,
        name: verifiedCenterName,
        adminName: effectiveAdminName,
        email: cleanEmail,
      },
      history: history.reverse(),
    });
  } catch (error) {
    console.error('Error in verify-admin:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถตรวจสอบข้อมูลศูนย์ได้', details: error.message },
      { status: 500 }
    );
  }
}
