import JSZip from 'jszip';

export async function generateClientWordDoc(row) {
  if (!row) return;

  // 1. Fetch template from /templates/DTT02.docx
  const response = await fetch('/templates/DTT02.docx');
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดไฟล์แม่แบบ DTT02.docx ได้ (Status ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();

  // 2. Unzip using JSZip
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXmlFile = zip.file('word/document.xml');
  const relsXmlFile = zip.file('word/_rels/document.xml.rels');

  if (!docXmlFile || !relsXmlFile) {
    throw new Error('ไม่พบโครงสร้างเอกสาร Word ในแบบฟอร์ม');
  }

  let xmlText = await docXmlFile.async('string');
  let relsXmlText = await relsXmlFile.async('string');

  const getVal = (r, partialKey) => {
    if (!r) return '';
    const key = Object.keys(r).find(k => k.toLowerCase().includes(partialKey.toLowerCase()));
    const val = key && r[key] ? r[key].toString().trim() : '';
    return (val && val !== 'ไม่พบข้อมูล' && val !== '#N/A') ? val : '';
  };

  const xmlEscape = (str) => {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const centerCode = xmlEscape(getVal(row, 'รหัส') || row.center_code || '66100000');
  const centerName = xmlEscape(getVal(row, 'ชื่อศูนย์') || row.center_name || 'ศูนย์ดิจิทัลชุมชน');
  const province = xmlEscape(getVal(row, 'จังหวัด') || row.province || '-');
  const district = xmlEscape(getVal(row, 'อำเภอ') || row.district || (row._mainBeMetrics ? row._mainBeMetrics.district : '') || '-');

  const adminPrefix = getVal(row, 'คำนำหน้า ผู้ดูแล') || getVal(row, 'คำนำหน้าผู้ดูแล') || '';
  const adminNameRaw = getVal(row, 'ชื่อผู้ดูแล') || '-';
  const adminName = xmlEscape(adminNameRaw !== '-' ? `${adminPrefix} ${adminNameRaw}`.trim() : '-');

  const email = xmlEscape(getVal(row, 'Email') || row.email || '-');
  const phone = xmlEscape(getVal(row, 'เบอร์โทรศัพท์') || row.phone || '-');
  const submitDate = xmlEscape(getVal(row, 'ประทับเวลา') || '11 สิงหาคม 2569');

  // Parse XMLs
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  const relsDoc = parser.parseFromString(relsXmlText, 'application/xml');

  const tables = xmlDoc.getElementsByTagName('w:tbl');

  // --- TABLE 1: ข้อมูลศูนย์ดิจิทัลชุมชน (DOM <w:tc> Indices) ---
  if (tables[0]) {
    const t1 = tables[0];
    const getCellNode = (r, c) => {
      const rows = t1.getElementsByTagName('w:tr');
      if (!rows[r]) return null;
      const cells = rows[r].getElementsByTagName('w:tc');
      return cells[c] || null;
    };

    // Row 0: Center Code (tc[1]) & Submit Date (tc[3])
    setCellTextXML(getCellNode(0, 1), centerCode, 14, false);
    setCellTextXML(getCellNode(0, 3), submitDate, 14, false);

    // Row 1: Center Name (tc[1])
    setCellTextXML(getCellNode(1, 1), centerName, 14, false);

    // Row 2: Province (tc[1])
    setCellTextXML(getCellNode(2, 1), province, 14, false);

    // Row 3: Admin Name (tc[1])
    setCellTextXML(getCellNode(3, 1), adminName, 14, false);

    // Row 4: Email (tc[1]) & Phone Number (tc[3])
    setCellTextXML(getCellNode(4, 1), email, 14, false);
    setCellTextXML(getCellNode(4, 3), phone, 14, false);
  }

  // --- TABLE 2: รายชื่อผู้เข้าอบรม (20 แถว) ---
  if (tables[1]) {
    const t2Rows = tables[1].getElementsByTagName('w:tr');
    const participants = row._participants || [];

    for (let idx = 0; idx < 20; idx++) {
      const rIdx = idx + 1;
      if (rIdx < t2Rows.length) {
        const cells = t2Rows[rIdx].getElementsByTagName('w:tc');
        const p = participants[idx] || {};

        if (cells[0]) setCellTextXML(cells[0], String(idx + 1), 12, false, 'center');
        if (cells[1]) setCellTextXML(cells[1], p.prefix || '', 12, false, 'left');
        if (cells[2]) setCellTextXML(cells[2], p.name || '', 12, false, 'left');
        if (cells[3]) setCellTextXML(cells[3], p.phone || '', 12, false, 'left');
        if (cells[4]) setCellTextXML(cells[4], p.type || '', 12, false, 'left');
      }
    }
  }

  // Extract media URLs
  const overviewUrls = extractUrls(getVal(row, 'ภาพรวมการจัดกิจกรรม'));
  const workshopUrls = extractUrls(getVal(row, 'บรรยากาศอบรม'));
  const snackUrls = extractUrls(getVal(row, 'อาหารเบรค'));
  const lunchUrls = extractUrls(getVal(row, 'อาหารกลางวัน'));
  const videoUrls = extractUrls(getVal(row, 'วิดีโอ (บรรยากาศ') || getVal(row, 'วิดีโอ'));

  // Pre-fetch ALL images concurrently in parallel (5X speedup!)
  const allImageUrls = Array.from(new Set([
    ...overviewUrls.slice(0, 2),
    ...workshopUrls.slice(0, 4),
    ...snackUrls.slice(0, 2),
    ...lunchUrls.slice(0, 1),
  ]));

  const imageMap = {};
  await Promise.all(
    allImageUrls.map(async (url) => {
      const driveId = getDriveFileId(url);
      if (!driveId) return;
      try {
        const proxyRes = await fetch(`/api/admin/drive-image?id=${driveId}`);
        if (proxyRes.ok) {
          const buf = await proxyRes.arrayBuffer();
          if (buf.byteLength > 500) {
            imageMap[url] = buf;
          }
        }
      } catch (e) {
        // Fallback handled gracefully
      }
    })
  );

  // Synchronous cell image embedding helper
  let imgCounter = 0;
  const embedImageToCell = (cellNode, driveUrl, maxWInches = 3.2, maxHInches = 2.5) => {
    if (!cellNode || !driveUrl) return;

    const imgBuffer = imageMap[driveUrl];
    if (!imgBuffer) {
      setCellTextXML(cellNode, `📷 [ลิงก์รูปภาพ]\n${driveUrl}`, 10, false, 'center');
      return;
    }

    try {
      imgCounter++;
      const mediaFileName = `image_${imgCounter}.jpg`;
      const relId = `rIdImg_${imgCounter}`;

      zip.file(`word/media/${mediaFileName}`, imgBuffer);

      const relsRoot = relsDoc.getElementsByTagName('Relationships')[0];
      const newRel = relsDoc.createElementNS(
        'http://schemas.openxmlformats.org/package/2006/relationships',
        'Relationship'
      );
      newRel.setAttribute('Id', relId);
      newRel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
      newRel.setAttribute('Target', `media/${mediaFileName}`);
      relsRoot.appendChild(newRel);

      setCellImageXML(cellNode, relId, maxWInches, maxHInches);
    } catch (e) {
      console.warn(`Failed to embed image for ${driveUrl}:`, e);
      setCellTextXML(cellNode, `📷 [ลิงก์รูปภาพ]\n${driveUrl}`, 10, false, 'center');
    }
  };

  // Table 3: 3.1 Overview Images (2)
  if (tables[2]) {
    const cells = tables[2].getElementsByTagName('w:tc');
    if (overviewUrls[0]) embedImageToCell(cells[0], overviewUrls[0], 3.2, 2.5);
    if (overviewUrls[1]) embedImageToCell(cells[1], overviewUrls[1], 3.2, 2.5);
  }

  // Table 4: 3.2 Workshop Images (4)
  if (tables[3]) {
    const cells = tables[3].getElementsByTagName('w:tc');
    for (let i = 0; i < Math.min(4, workshopUrls.length); i++) {
      if (cells[i]) embedImageToCell(cells[i], workshopUrls[i], 3.2, 2.5);
    }
  }

  // Table 5: 3.3 Snack Images (2)
  if (tables[4]) {
    const cells = tables[4].getElementsByTagName('w:tc');
    if (snackUrls[0]) embedImageToCell(cells[0], snackUrls[0], 3.2, 2.5);
    if (snackUrls[1]) embedImageToCell(cells[1], snackUrls[1], 3.2, 2.5);
  }

  // Table 6: 3.4 Lunch Image (1)
  if (tables[5]) {
    const cells = tables[5].getElementsByTagName('w:tc');
    if (lunchUrls[0]) embedImageToCell(cells[0], lunchUrls[0], 3.5, 2.5);
  }

  // Table 7: Video Links
  if (tables[6]) {
    const t7Rows = tables[6].getElementsByTagName('w:tr');
    if (t7Rows[0]) {
      const cells = t7Rows[0].getElementsByTagName('w:tc');
      const c = cells.length > 1 ? cells[1] : cells[0];
      if (c) setCellTextXML(c, videoUrls[0] || '-', 12, false, 'left');
    }
    if (t7Rows[1]) {
      const cells = t7Rows[1].getElementsByTagName('w:tc');
      const c = cells.length > 1 ? cells[1] : cells[0];
      if (c) setCellTextXML(c, videoUrls[1] || '-', 12, false, 'left');
    }
  }

  // Table 8: Contest Info
  if (tables[7]) {
    const t8Rows = tables[7].getElementsByTagName('w:tr');
    const contestTitle = getVal(row, 'ชื่อผลงาน') || '-';
    const contestConcept = getVal(row, 'เเนวคิด') || getVal(row, 'แนวคิด') || '-';
    const contestVideo = getVal(row, 'Digital Thai Thai') || getVal(row, 'วิดีโอ (Digital') || '-';

    if (t8Rows[0]) {
      const cells = t8Rows[0].getElementsByTagName('w:tc');
      const c = cells.length > 1 ? cells[1] : cells[0];
      if (c) setCellTextXML(c, contestTitle, 12, true, 'left');
    }
    if (t8Rows[1]) {
      const cells = t8Rows[1].getElementsByTagName('w:tc');
      const c = cells.length > 1 ? cells[1] : cells[0];
      if (c) setCellTextXML(c, contestConcept, 12, false, 'left');
    }
    if (t8Rows[2]) {
      const cells = t8Rows[2].getElementsByTagName('w:tc');
      const c = cells.length > 1 ? cells[1] : cells[0];
      if (c) setCellTextXML(c, contestVideo, 12, false, 'left');
    }
  }

  // Re-serialize XML files back to zip
  const serializer = new XMLSerializer();
  zip.file('word/document.xml', serializer.serializeToString(xmlDoc));
  zip.file('word/_rels/document.xml.rels', serializer.serializeToString(relsDoc));

  // Generate blob and trigger browser download
  const outBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const rawCode = getVal(row, 'รหัส') || row.center_code || '66100000';
  const rawName = getVal(row, 'ชื่อศูนย์') || row.center_name || 'ศูนย์ดิจิทัลชุมชน';
  const sanitizedName = rawName.replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `${rawCode}_${sanitizedName}.docx`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(outBlob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function setCellTextXML(cellNode, text, fontSize = 14, bold = false, align = 'left') {
  if (!cellNode) return;
  const pList = cellNode.getElementsByTagName('w:p');
  if (pList.length === 0) return;
  const pNode = pList[0];

  // Remove existing runs
  const rList = Array.from(pNode.getElementsByTagName('w:r'));
  rList.forEach(r => pNode.removeChild(r));

  // Set Alignment
  let pPr = pNode.getElementsByTagName('w:pPr')[0];
  if (!pPr) {
    pPr = cellNode.ownerDocument.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:pPr');
    pNode.insertBefore(pPr, pNode.firstChild);
  }
  let jc = pPr.getElementsByTagName('w:jc')[0];
  if (!jc) {
    jc = cellNode.ownerDocument.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:jc');
    pPr.appendChild(jc);
  }
  jc.setAttribute('w:val', align);

  // Create new run
  const doc = cellNode.ownerDocument;
  const r = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:r');
  const rPr = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:rPr');

  const rFonts = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:rFonts');
  rFonts.setAttribute('w:ascii', 'TH Sarabun PSK');
  rFonts.setAttribute('w:hAnsi', 'TH Sarabun PSK');
  rPr.appendChild(rFonts);

  const sz = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:sz');
  sz.setAttribute('w:val', String(fontSize * 2));
  rPr.appendChild(sz);

  const szCs = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:szCs');
  szCs.setAttribute('w:val', String(fontSize * 2));
  rPr.appendChild(szCs);

  if (bold) {
    const b = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:b');
    rPr.appendChild(b);
  }

  const color = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:color');
  color.setAttribute('w:val', '000000');
  rPr.appendChild(color);

  r.appendChild(rPr);

  const t = doc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:t');
  t.textContent = text !== undefined && text !== null ? String(text) : '';
  r.appendChild(t);
  pNode.appendChild(r);
}

function setCellImageXML(cellNode, relId, widthInches = 3.0, heightInches = 2.2) {
  const pList = cellNode.getElementsByTagName('w:p');
  if (pList.length === 0) return;
  const pNode = pList[0];

  const rList = Array.from(pNode.getElementsByTagName('w:r'));
  rList.forEach(r => pNode.removeChild(r));

  const cx = Math.round(widthInches * 914400);
  const cy = Math.round(heightInches * 914400);

  const drawingXml = `
    <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="${cx}" cy="${cy}"/>
          <wp:docPr id="1" name="Picture"/>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic>
                <pic:nvPicPr>
                  <pic:cNvPr id="0" name="Picture"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="${relId}"/>
                  <a:stretch><a:fillRect/></a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="${cx}" cy="${cy}"/>
                  </a:xfrm>
                  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>
  `;

  const parser = new DOMParser();
  const drawDoc = parser.parseFromString(drawingXml, 'application/xml');
  const rNode = cellNode.ownerDocument.importNode(drawDoc.documentElement, true);
  pNode.appendChild(rNode);
}

function extractUrls(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/https?:\/\/[^\s,"]+/g);
  return matches || [];
}

function getDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) return matchD[1];
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  return null;
}
