# สคริปต์จัดการสถานะผู้สมัคร (Google Apps Script)

สคริปต์นี้จะทำงานอัตโนมัติเมื่อมีคนกดส่ง Google Form โดยจะเช็คเงื่อนไขที่คุณต้องการ:
1. ต้องอยู่ในโควตา **1722 คนแรก**
2. **เลขศูนย์ต้องไม่ซ้ำ** กับคนที่ได้สิทธิ์ไปแล้ว
3. เลขศูนย์ **ต้องอยู่ในรายชื่อศูนย์ที่กำหนดไว้**

---

## 🛠️ วิธีติดตั้ง Script ใน Google Sheet

1. เปิด Google Sheet ที่รับข้อมูลจากฟอร์ม
2. ไปที่เมนู **ส่วนขยาย (Extensions)** -> **Apps Script**
3. ลบโค้ดเดิมทั้งหมด แล้ว **คัดลอกโค้ดด้านล่างนี้ไปวาง**
4. แก้ไขตัวแปรด้านบนของโค้ดให้ตรงกับ Column ใน Sheet ของคุณ
5. กดปุ่ม **บันทึก (Save)** 💾
6. ไปที่เมนู **ทริกเกอร์ (Triggers)** (ไอคอนรูปนาฬิกาด้านซ้าย) -> กด **+ เพิ่มทริกเกอร์ (+ Add Trigger)**
   - เลือกฟังก์ชันที่ให้ทำงาน: `onFormSubmit`
   - เลือกประเภทเหตุการณ์: **เมื่อส่งฟอร์ม (On form submit)**
   - กดบันทึกและกดยอมรับสิทธิ์ (Allow)

---

## 💻 โค้ด Apps Script

```javascript
// ==========================================
// ⚙️ ตั้งค่าคอลัมน์และชื่อชีต (แก้ไขให้ตรงกับของจริง)
// ==========================================
const CONFIG = {
  MAIN_SHEET_NAME: "Form Responses 1", // ชื่อชีตที่รับข้อมูลฟอร์ม
  CENTER_LIST_SHEET_NAME: "รายชื่อศูนย์", // ชื่อชีตที่มีรายชื่อศูนย์ที่อนุญาต
  
  // ตำแหน่งคอลัมน์ (นับจากซ้าย A=1, B=2, C=3, ...)
  CENTER_CODE_COL: 3,        // คอลัมน์ที่ผู้สมัครกรอก "เลขศูนย์"
  STATUS_COL: 5,             // คอลัมน์ใหม่ที่จะให้สคริปต์เติมคำว่า "ผู้สมัครหลัก/สำรอง" (ต้องสร้างคอลัมน์นี้เตรียมไว้)
  
  // ตำแหน่งคอลัมน์ในชีต "รายชื่อศูนย์"
  ALLOWED_CENTER_COL: 1,     // คอลัมน์ที่มีเลขศูนย์ที่ถูกต้องเรียงกันอยู่
  
  MAX_MAIN_APPLICANTS: 1722  // โควตาสูงสุด
};

function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.MAIN_SHEET_NAME);
  const row = e.range.getRow(); // แถวล่าสุดที่เพิ่งส่งฟอร์มเข้ามา
  
  processRow(sheet, row);
}

// ฟังก์ชันหลักสำหรับประมวลผล (สามารถกด Run เพื่อทดสอบแถวที่กำหนดได้)
function processRow(sheet, targetRow) {
  // 1. ดึงข้อมูลเลขศูนย์ที่เพิ่งสมัครเข้ามา
  const centerCode = sheet.getRange(targetRow, CONFIG.CENTER_CODE_COL).getValue().toString().trim();
  
  if (!centerCode) return; // ถ้าไม่มีเลขศูนย์ ให้ข้ามไป
  
  // 2. เช็คว่า "เลขศูนย์" นี้ อยู่ในรายชื่อที่กำหนดหรือไม่?
  const isAllowed = checkAllowedCenter(centerCode);
  
  if (!isAllowed) {
    sheet.getRange(targetRow, CONFIG.STATUS_COL).setValue("ผู้สมัครสำรอง (ไม่อยู่ในรายชื่อศูนย์)");
    return;
  }
  
  // 3. ดึงข้อมูลผู้สมัครทั้งหมดที่ผ่านมา เพื่อเช็ค "จำนวน 1722" และ "ศูนย์ซ้ำ"
  const allData = sheet.getRange(2, 1, Math.max(1, targetRow - 2), sheet.getLastColumn()).getValues();
  
  let currentMainCount = 0;
  let isCenterDuplicated = false;
  
  for (let i = 0; i < allData.length; i++) {
    const status = allData[i][CONFIG.STATUS_COL - 1]; // -1 เพราะ array เริ่มที่ 0
    const existingCenter = allData[i][CONFIG.CENTER_CODE_COL - 1]?.toString().trim();
    
    if (status === "ผู้สมัครหลัก") {
      currentMainCount++;
      // เช็คว่าศูนย์นี้เคยได้สิทธิ์ "ผู้สมัครหลัก" ไปแล้วหรือยัง
      if (existingCenter === centerCode) {
        isCenterDuplicated = true;
      }
    }
  }
  
  // 4. ตัดสินใจสถานะ
  let finalStatus = "";
  
  if (isCenterDuplicated) {
    finalStatus = "ผู้สมัครสำรอง (ศูนย์ซ้ำ)";
  } else if (currentMainCount >= CONFIG.MAX_MAIN_APPLICANTS) {
    finalStatus = "ผู้สมัครสำรอง (โควตาเต็ม)";
  } else {
    finalStatus = "ผู้สมัครหลัก";
  }
  
  // 5. บันทึกผลลงไปในคอลัมน์สถานะ
  sheet.getRange(targetRow, CONFIG.STATUS_COL).setValue(finalStatus);
}

// ฟังก์ชันสำหรับเช็คว่าเลขศูนย์อยู่ในชีต "รายชื่อศูนย์" หรือไม่
function checkAllowedCenter(centerCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allowedSheet = ss.getSheetByName(CONFIG.CENTER_LIST_SHEET_NAME);
  
  if (!allowedSheet) {
    // ถ้าหาชีตไม่เจอ อนุโลมให้ผ่าน (หรือจะ return false ก็ได้)
    return true; 
  }
  
  const lastRow = allowedSheet.getLastRow();
  if (lastRow < 2) return false;
  
  const allowedCenters = allowedSheet.getRange(2, CONFIG.ALLOWED_CENTER_COL, lastRow - 1, 1).getValues();
  
  // ตรวจสอบว่ามีเลขศูนย์ตรงกันไหม
  for (let i = 0; i < allowedCenters.length; i++) {
    if (allowedCenters[i][0].toString().trim() === centerCode) {
      return true;
    }
  }
  
  return false;
}
```

---

## 📝 คำแนะนำเพิ่มเติม (สำหรับเว็บ Next.js ของคุณ)

ตอนนี้ระบบฝั่ง Next.js (`app/api/applicants/route.js`) ดึงข้อมูลการนับแถวทั้งหมด `(rows.length - 1)` มาโชว์เป็น "ผู้สมัครทั้งหมด"

ถ้าในอนาคตคุณอยากให้เว็บ **แยกโชว์** ว่ามี "ผู้สมัครหลัก" กี่คน และ "ผู้สมัครสำรอง" กี่คน เราสามารถแก้โค้ด API ให้ไปนับเฉพาะคำว่า "ผู้สมัครหลัก" จากคอลัมน์สถานะได้เลยครับ ถ้าต้องการให้ผมปรับ API ให้รองรับ แจ้งได้เลยนะครับ!
