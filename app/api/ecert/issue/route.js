import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function generateCertCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `L2E-2026-${randomStr}`;
}

export async function POST(request) {
  try {
    const { centerCode, centerName, adminName, adminEmail, recipients, activityDate } = await request.json();

    if (!centerCode || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสศูนย์และรายชื่อผู้รับใบประกาศ' },
        { status: 400 }
      );
    }

    const cleanCenterCode = centerCode.toString().trim();
    const cleanCenterName = (centerName || '').toString().trim();
    const cleanAdminName = (adminName || '').toString().trim();
    const cleanAdminEmail = (adminEmail || '').toString().trim().toLowerCase();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const sheetName = 'E-Cert Logs';

    // 1. Check if sheet tab "E-Cert Logs" exists, if not create it with 11 headers
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetExists = spreadsheetInfo.data.sheets.some(
        (s) => s.properties.title === sheetName
      );

      if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetName },
                },
              },
            ],
          },
        });

        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:K1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                'Cert Code',
                'Center Code',
                'Center Name',
                'Admin Name',
                'Admin Email',
                'Prefix',
                'First Name',
                'Last Name',
                'Full Name',
                'Issue Date',
                'Verify Link',
              ],
            ],
          },
        });
      }
    } catch (e) {
      console.warn('Sheet tab check/create notice:', e.message);
    }

    // 2. Fetch existing logs for duplicate check & code reuse
    let existingRows = [];
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:K`,
      });
      existingRows = res.data.values || [];
    } catch (e) {
      console.warn('Error reading existing logs:', e.message);
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const newRowsToAppend = [];
    const resultCertificates = [];
    const nowStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const chosenIssueDate = (activityDate && activityDate.trim()) ? activityDate.trim() : nowStr;

    for (const item of recipients) {
      const prefix = (item.prefix || '').trim();
      const firstName = (item.firstName || '').trim();
      const lastName = (item.lastName || '').trim();
      const fullName = `${prefix}${prefix ? ' ' : ''}${firstName} ${lastName}`.trim();

      if (!firstName) continue;

      // Check if certificate already issued for this center + full name
      let foundCertCode = null;
      let foundIssueDate = null;

      for (let i = 1; i < existingRows.length; i++) {
        const row = existingRows[i];
        const rowCenterCode = (row[1] || '').trim();
        const rowFullName = (row[8] || row[7] || '').trim();

        if (rowCenterCode === cleanCenterCode && rowFullName === fullName) {
          foundCertCode = row[0];
          foundIssueDate = row[9] || row[8];
          break;
        }
      }

      if (foundCertCode) {
        // Reuse existing cert code
        const verifyLink = `${baseUrl}/verify/${foundCertCode}`;
        resultCertificates.push({
          certCode: foundCertCode,
          centerCode: cleanCenterCode,
          centerName: cleanCenterName,
          adminName: cleanAdminName,
          adminEmail: cleanAdminEmail,
          prefix,
          firstName,
          lastName,
          fullName,
          issueDate: chosenIssueDate || foundIssueDate || nowStr,
          verifyLink,
          isReissued: true,
        });
      } else {
        // Issue new cert code
        const newCertCode = generateCertCode();
        const verifyLink = `${baseUrl}/verify/${newCertCode}`;

        const rowArray = [
          newCertCode,
          cleanCenterCode,
          cleanCenterName,
          cleanAdminName,
          cleanAdminEmail,
          prefix,
          firstName,
          lastName,
          fullName,
          chosenIssueDate,
          verifyLink,
        ];

        newRowsToAppend.push(rowArray);
        existingRows.push(rowArray);

        resultCertificates.push({
          certCode: newCertCode,
          centerCode: cleanCenterCode,
          centerName: cleanCenterName,
          adminName: cleanAdminName,
          adminEmail: cleanAdminEmail,
          prefix,
          firstName,
          lastName,
          fullName,
          issueDate: chosenIssueDate,
          verifyLink,
          isReissued: false,
        });
      }
    }

    // 3. Save new cert rows to Google Sheet
    if (newRowsToAppend.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:K`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: newRowsToAppend,
        },
      });
    }

    return NextResponse.json({
      success: true,
      certificates: resultCertificates,
    });
  } catch (error) {
    console.error('Error issuing E-Cert:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถออกใบประกาศนียบัตรได้', details: error.message },
      { status: 500 }
    );
  }
}
