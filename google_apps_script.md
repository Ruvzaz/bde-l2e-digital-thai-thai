# สคริปต์จัดการสถานะและชื่อไฟล์เมื่อส่ง Google Form (Google Apps Script)

สคริปต์นี้จะทำงานอัตโนมัติเมื่อมีผู้เข้าร่วมกดส่ง Google Form โดยมีเงื่อนไขดังนี้:
1. **เปลี่ยนชื่อไฟล์อัปโหลด** ให้เป็นรูปแบบ `[รหัสศูนย์]-[ชื่อศูนย์]-[ประเภทเอกสาร]`
2. **อัปเดตสถานะการคัดเลือก (Column J)** ในชีท `Main BE`:
   - หากสถานะเดิมอยู่ในกลุ่ม **ยกเว้น** 3 สถานะนี้ -> **ข้าม ไม่เปลี่ยนสถานะ** (คงเดิมไว้):
     1. `"อนุมัติเข้าร่วมกิจกรรม"`
     2. `"อนุมัติเข้าร่วมกิจกรรม (ลำดับสำรอง)"`
     3. `"ยืนยันไม่เข้าร่วมกิจกรรม"`
   - หากสถานะเดิมเป็นอย่างอื่น เช่น **"ไม่อนุมัติ เอกสารไม่ครบถ้วน"**, **"ยังไม่ส่งแผน"**, หรือ **ช่องว่าง** -> **ปรับสถานะเป็น "รอตรวจเอกสาร"** เพื่อให้ Staff มาตรวจเอกสารรอบใหม่อีกครั้ง

---

## 💻 โค้ด Apps Script ฉบับปรับปรุงใหม่ล่าสุด (เพิ่ม 3 สถานะยกเว้น)

```javascript
/**
 * ฟังก์ชันนี้จะทำงานอัตโนมัติเมื่อมีคนส่ง Google Form
 * ทำหน้าที่:
 * 1. เปลี่ยนชื่อไฟล์อัปโหลดเป็น [รหัสศูนย์]-[ชื่อศูนย์]-[ชื่อเอกสาร]
 * 2. อัปเดตสถานะใน Main BE เป็น "รอตรวจเอกสาร"
 *    (ยกเว้น 3 สถานะ: อนุมัติเข้าร่วมกิจกรรม, อนุมัติเข้าร่วมกิจกรรม (ลำดับสำรอง), ยืนยันไม่เข้าร่วมกิจกรรม)
 */
function onFormSubmit(e) {
  // Guard Clause: ป้องกัน Error เวลาเผลอกด Run ใน Apps Script Editor
  if (!e || !e.range) {
    console.log("ฟังก์ชันนี้ทำงานผ่าน Trigger การส่ง Google Form เท่านั้น");
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("#1 ส่งแผน") || e.range.getSheet(); 
  var mainBeSheet = ss.getSheetByName("Main BE");
  
  if (!mainBeSheet) {
    console.log("Error: ไม่พบชีท Main BE");
    return;
  }
  
  var range = e.range;
  var row = range.getRow();
  
  // -----------------------------------------
  // 1. ดึงข้อมูลจาก Form Responses 1
  // -----------------------------------------
  var lastCol = sourceSheet.getLastColumn();
  var headers = sourceSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rowValues = sourceSheet.getRange(row, 1, 1, lastCol).getValues()[0];
  
  var centerCode = "";
  var centerName = "";
  var participantFileUrl = "";
  var financeFileUrl = "";
  
  // หาคอลัมน์ใน Form Responses 1
  for (var i = 0; i < headers.length; i++) {
    var headerText = headers[i].toString().trim();
    if (headerText === "รหัสศูนย์ดิจิทัลชุมชน") {
      centerCode = rowValues[i];
    } else if (headerText === "ชื่อศูนย์ดิจิทัลชุมชน") {
      centerName = rowValues[i];
    } else if (headerText.indexOf("ไฟล์รายชื่อผู้เข้าร่วมอบรม") !== -1) {
      participantFileUrl = rowValues[i];
    } else if (headerText.indexOf("อัพโหลดใบสำคัญรับเงิน") !== -1 || headerText.indexOf("ใบสำคัญรับเงิน") !== -1) {
      financeFileUrl = rowValues[i];
    }
  }
  
  if (!centerCode) return; // ถ้ารหัสว่างเปล่า ไม่ทำต่อ
  
  // -----------------------------------------
  // 2. เปลี่ยนชื่อไฟล์ที่อัปโหลด
  // -----------------------------------------
  renameFiles(participantFileUrl, centerCode, centerName, "ไฟล์รายชื่อเข้าร่วม");
  renameFiles(financeFileUrl, centerCode, centerName, "เอกสารการเงิน");
  
  // -----------------------------------------
  // 3. อัปเดตสถานะใน Main BE เป็น "รอตรวจเอกสาร"
  // -----------------------------------------
  var mainLastCol = mainBeSheet.getLastColumn();
  var mainLastRow = mainBeSheet.getLastRow();
  if (mainLastCol < 1 || mainLastRow < 2) return;
  
  var mainHeaders = mainBeSheet.getRange(1, 1, 1, mainLastCol).getValues()[0];
  var mainCodeCol = -1;
  var mainStatusCol = -1;
  
  // หาคอลัมน์ รหัส และ สถานะ ใน Main BE
  for (var m = 0; m < mainHeaders.length; m++) {
    var mText = mainHeaders[m].toString().trim();
    if (mText === "รหัส" || mText === "รหัสศูนย์") {
      mainCodeCol = m + 1;
    } else if (mText === "สถานะการคัดเลือก" || mText === "สถานะ") {
      mainStatusCol = m + 1;
    }
  }
  
  if (mainCodeCol !== -1 && mainStatusCol !== -1) {
    var codeValues = mainBeSheet.getRange(2, mainCodeCol, mainLastRow - 1, 1).getValues();
    
    for (var r = 0; r < codeValues.length; r++) {
      if (codeValues[r][0].toString().trim() === centerCode.toString().trim()) {
        var targetRow = r + 2; // คำนวณแถวที่พบใน Main BE
        
        // 🔹 ดึงค่าสถานะปัจจุบันมาเช็ค
        var currentStatusCell = mainBeSheet.getRange(targetRow, mainStatusCol);
        var currentStatus = currentStatusCell.getValue().toString().trim();
        
        // 🔹 [ปรับแก้ใหม่]: เพิ่ม 3 สถานะยกเว้นที่ไม่ต้องเปลี่ยนกลับเป็น "รอตรวจเอกสาร"
        var isProtected = (
          currentStatus === "อนุมัติเข้าร่วมกิจกรรม" ||
          currentStatus === "อนุมัติเข้าร่วมกิจกรรม (ลำดับสำรอง)" ||
          currentStatus === "ยืนยันไม่เข้าร่วมกิจกรรม"
        );
        
        if (!isProtected) {
          currentStatusCell.setValue("รอตรวจเอกสาร");
          console.log("อัปเดตศูนย์ " + centerCode + " เป็น 'รอตรวจเอกสาร' สำเร็จ (สถานะเดิม: '" + currentStatus + "')");
        } else {
          console.log("ข้ามการอัปเดตศูนย์ " + centerCode + " เนื่องจากอยู่ในสถานะยกเว้น: '" + currentStatus + "'");
        }
        
        break; // ทำแค่ 1 ศูนย์ที่เจออันแรก แล้วหยุดหา
      }
    }
  }
}

/**
 * ฟังก์ชันสำหรับเปลี่ยนชื่อไฟล์ให้เป็นรูปแบบที่กำหนด
 */
function renameFiles(fileUrls, centerCode, centerName, suffixName) {
  if (!fileUrls || fileUrls.toString().trim() === "") return;
  
  try {
    var urls = fileUrls.toString().split(",");
    
    for (var u = 0; u < urls.length; u++) {
      var url = urls[u].trim();
      var fileId = "";
      
      if (url.indexOf("id=") !== -1) {
        fileId = url.split("id=")[1].split("&")[0];
      } else if (url.indexOf("/d/") !== -1) {
        fileId = url.split("/d/")[1].split("/")[0];
      }
      
      if (fileId) {
        var file = DriveApp.getFileById(fileId);
        var originalName = file.getName();
        var extension = "";
        var lastDotIndex = originalName.lastIndexOf(".");
        if (lastDotIndex > -1) {
          extension = originalName.substring(lastDotIndex);
        }
        
        var newFileName = centerCode + "-" + centerName + "-" + suffixName;
        if (urls.length > 1) newFileName += " (" + (u + 1) + ")";
        
        file.setName(newFileName + extension);
      }
    }
  } catch (e) {
    console.log("Error renaming file: " + e.message);
  }
}
```
