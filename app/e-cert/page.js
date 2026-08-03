"use client";

import { useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import QRCode from "qrcode";

import ECertCanvas from "@/components/ECertCanvas";

const PREFIX_OPTIONS = [
  "นาย",
  "นาง",
  "นางสาว",
  "เด็กชาย",
  "เด็กหญิง",
  "Mr.",
  "Mrs.",
  "Ms.",
  "อื่นๆ",
];

const ACTIVITY_DATE_OPTIONS = [
  { value: "3 สิงหาคม 2569", label: "3 สิงหาคม 2569 (ครั้งที่ 1 - ภาคเหนือ)" },
  { value: "10 สิงหาคม 2569", label: "10 สิงหาคม 2569 (ครั้งที่ 2 - ภาคกลาง)" },
  { value: "11 สิงหาคม 2569", label: "11 สิงหาคม 2569 (ครั้งที่ 3 - ภาคอีสาน)" },
  { value: "14 สิงหาคม 2569", label: "14 สิงหาคม 2569 (ครั้งที่ 4 - ภาคใต้)" },
];

export default function ECertPage() {
  const [step, setStep] = useState(1);

  // Step 1 State: Admin Auth & Center Info
  const [centerCode, setCenterCode] = useState("");
  const [centerName, setCenterName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState("");
  const [verifiedCenter, setVerifiedCenter] = useState(null);
  const [certHistory, setCertHistory] = useState([]);

  // Step 2 State: Recipients Form & Activity Date
  const [selectedActivityDate, setSelectedActivityDate] = useState("3 สิงหาคม 2569");
  const [recipientCount, setRecipientCount] = useState(1);
  const [recipients, setRecipients] = useState([
    { id: 1, prefix: "นาย", firstName: "", lastName: "" },
  ]);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);

  // Step 3 State: Issued Certificates & Download
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [issuedCerts, setIssuedCerts] = useState([]);
  const [activePreviewCert, setActivePreviewCert] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  // Handlers for Step 1: Admin Verification
  const handleVerifyAdmin = async (e) => {
    e.preventDefault();
    if (!centerCode.trim() || !adminEmail.trim()) {
      setAdminAuthError("กรุณากรอกรหัสศูนย์และอีเมลผู้ดูแลศูนย์ให้ครบถ้วน");
      return;
    }

    if (showNameField && !adminName.trim()) {
      setAdminAuthError("กรุณากรอก ชื่อ-นามสกุล ผู้ดูแลศูนย์ (สำหรับการลงทะเบียนครั้งแรก)");
      return;
    }

    setIsVerifyingAdmin(true);
    setAdminAuthError("");

    try {
      const res = await fetch("/api/ecert/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerCode: centerCode.trim(),
          centerName: centerName.trim(),
          adminName: adminName.trim(),
          email: adminEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.error || "ไม่สามารถยืนยันสิทธิ์ศูนย์ได้");
      }

      if (data.requiresAdminName) {
        setShowNameField(true);
        setAdminAuthError("🔔 ตรวจพบการเข้าใช้งานครั้งแรกของศูนย์นี้ กรุณากรอก ชื่อ-นามสกุล ผู้ดูแลศูนย์ เพิ่มเติมเพื่อบันทึกประวัติ");
        return;
      }

      setVerifiedCenter(data.center);
      setCertHistory(data.history || []);
      setShowNameField(false);
    } catch (err) {
      setAdminAuthError(err.message);
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  const handleResetCenter = () => {
    setVerifiedCenter(null);
    setCenterCode("");
    setCenterName("");
    setAdminName("");
    setAdminEmail("");
    setShowNameField(false);
    setAdminAuthError("");
    setStep(1);
  };

  // Handlers for Step 2: Recipient Quantity & Field Adjustments
  const handleQuantityChange = (count) => {
    const qty = Math.max(1, Math.min(50, Number(count) || 1));
    setRecipientCount(qty);

    setRecipients((prev) => {
      if (qty > prev.length) {
        const next = [...prev];
        for (let i = prev.length + 1; i <= qty; i++) {
          next.push({ id: i, prefix: "นาย", customPrefix: "", firstName: "", lastName: "" });
        }
        return next;
      } else {
        return prev.slice(0, qty);
      }
    });
  };

  const handleRecipientChange = (index, field, value) => {
    const next = [...recipients];
    next[index][field] = value;
    setRecipients(next);

    // Live Check for Duplicate Names
    const nameCounts = {};
    const dups = [];

    next.forEach((item, idx) => {
      const activePrefix = item.prefix === "อื่นๆ" ? (item.customPrefix || "").trim() : item.prefix;
      const full = `${activePrefix}${activePrefix ? ' ' : ''}${item.firstName.trim()} ${item.lastName.trim()}`.trim();
      if (item.firstName.trim()) {
        if (nameCounts[full]) {
          dups.push(full);
        } else {
          nameCounts[full] = 1;
        }
      }
    });

    setDuplicateWarnings(dups);
  };

  // Step 2 Submission: Issue Certificates
  const handleIssueCertificates = async () => {
    // Validate that at least first recipient has name and resolve customPrefix if selected
    const validRecipients = recipients
      .filter((r) => r.firstName.trim() !== "")
      .map((r) => {
        const finalPrefix = r.prefix === "อื่นๆ" ? (r.customPrefix || "").trim() : r.prefix;
        return {
          ...r,
          prefix: finalPrefix,
        };
      });

    if (validRecipients.length === 0) {
      setIssueError("กรุณากรอกชื่อและนามสกุลของผู้รับใบประกาศอย่างน้อย 1 ท่าน");
      return;
    }

    setIsIssuing(true);
    setIssueError("");

    try {
      const res = await fetch("/api/ecert/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerCode: verifiedCenter.code,
          centerName: verifiedCenter.name,
          adminName: verifiedCenter.adminName,
          adminEmail: verifiedCenter.email,
          recipients: validRecipients,
          activityDate: selectedActivityDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ออกใบประกาศนียบัตรไม่สำเร็จ");
      }

      setIssuedCerts(data.certificates);
      setStep(3);
    } catch (err) {
      setIssueError(err.message);
    } finally {
      setIsIssuing(false);
    }
  };

  // ZIP Download Handler using JSZip
  const handleDownloadAllZip = async (targetCerts = null) => {
    const listToZip = Array.isArray(targetCerts) ? targetCerts : (issuedCerts || []);
    if (!Array.isArray(listToZip) || listToZip.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`ECerts_${verifiedCenter?.code || "L2E"}`);

      // Render each cert on hidden canvas to capture PNG
      for (const cert of listToZip) {
        const dataUrl = await generateCanvasDataUrl(cert);
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const rawName = cert.fullName || cert.firstName || "Certificate";
        const safeName = rawName.replace(/[\/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_");
        const fileName = `E-Cert_${cert.certCode || "L2E"}_${safeName}.png`;
        folder.file(fileName, base64Data, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `E-Certificates_Center_${verifiedCenter?.code || "L2E"}.zip`;
      link.click();
    } catch (err) {
      console.error("ZIP Generation Error:", err);
      alert("เกิดข้อผิดพลาดในการรวมไฟล์ ZIP");
    } finally {
      setIsZipping(false);
    }
  };

  // Helper to generate canvas image programmatically for ZIP export
  const generateCanvasDataUrl = (cert) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 2000;
      canvas.height = 1414;
      const ctx = canvas.getContext("2d");

      // Extract display name with prefix attached directly to first name
      const p = (cert.prefix || "").trim();
      const fn = (cert.firstName || "").trim();
      const ln = (cert.lastName || "").trim();

      let displayName = "";
      if (p || fn || ln) {
        displayName = `${p}${fn}${ln ? ' ' + ln : ''}`.trim();
      } else {
        displayName = (cert.fullName || "").trim();
      }

      // Extract day number
      const dayMatch = (cert.issueDate || "").match(/\d+/);
      const dayNumber = dayMatch ? dayMatch[0] : "31";

      const templateImg = new Image();
      templateImg.src = "/api/ecert/template";

      templateImg.onload = async () => {
        // Draw Template Image as background
        ctx.drawImage(templateImg, 0, 0, 2000, 1414);

        // Recipient Name
        const nameY = 640;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 65px 'Prompt', 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#151e15";
        ctx.fillText(displayName, 1000, nameY);

        // Day Number
        const dayX = 945;
        const dayY = 1006;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 32px 'Prompt', 'Be Vietnam Pro', sans-serif";
        ctx.fillStyle = "#151e15";
        ctx.fillText(dayNumber, dayX, dayY);

        // QR Code overlay
        const qrTargetUrl =
          cert.verifyLink || `${window.location.origin}/verify/${cert.certCode}`;

        try {
          const qrCanvas = document.createElement("canvas");
          await QRCode.toCanvas(qrCanvas, qrTargetUrl, {
            width: 170,
            margin: 1,
            color: { dark: "#006e2a", light: "#ffffff" },
          });

          const qrX = 2000 - 330;
          const qrY = 1414 - 340;

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(qrX - 10, qrY - 10, 190, 190);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#bbcbb8";
          ctx.strokeRect(qrX - 10, qrY - 10, 190, 190);

          ctx.drawImage(qrCanvas, qrX, qrY, 170, 170);

          ctx.font = "600 17px 'Be Vietnam Pro', 'Prompt', sans-serif";
          ctx.fillStyle = "#006e2a";
          ctx.textAlign = "center";
          ctx.fillText("สแกนเพื่อตรวจสอบ", qrX + 85, qrY + 208);

          ctx.font = "400 15px monospace";
          ctx.fillStyle = "#3c4a3c";
          ctx.fillText(`ID: ${cert.certCode}`, qrX + 85, qrY + 230);
        } catch (e) {
          console.error("QR Zip Error:", e);
        }

        resolve(canvas.toDataURL("image/png"));
      };

      templateImg.onerror = () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 2000, 1414);
        ctx.textAlign = "center";
        ctx.font = "bold 56px sans-serif";
        ctx.fillStyle = "#151e15";
        ctx.fillText(displayName, 1000, 640);
        resolve(canvas.toDataURL("image/png"));
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50/40 to-teal-50 text-emerald-950 font-sans pb-20">
      {/* Header Banner */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="w-full px-6 sm:px-10 lg:px-12 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
          <div className="flex items-center gap-2 bg-emerald-100/60 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-emerald-800">
              ระบบออกใบประกาศ E-Cert
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Title Card */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-900 tracking-tight">
            ระบบออกใบประกาศนียบัตรอิเล็กทรอนิกส์ (E-Cert)
          </h1>
          <p className="mt-2 text-emerald-700 font-medium">
            สำหรับผู้ดูแลศูนย์ดิจิทัลชุมชน ออกใบประกาศนียบัตรพร้อม QR Code ยืนยันสิทธิ์
          </p>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="mb-10 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold">
            <div
              className={`py-2.5 rounded-xl transition-all ${step === 1
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : step > 1
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-emerald-50/50 text-emerald-400"
                }`}
            >
              1. ยืนยันสิทธิ์ผู้ดูแลศูนย์
            </div>
            <div
              className={`py-2.5 rounded-xl transition-all ${step === 2
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : step > 2
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-emerald-50/50 text-emerald-400"
                }`}
            >
              2. กรอกรายชื่อผู้รับใบประกาศ
            </div>
            <div
              className={`py-2.5 rounded-xl transition-all ${step === 3
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "bg-emerald-50/50 text-emerald-400"
                }`}
            >
              3. รับใบประกาศ & ดาวน์โหลด
            </div>
          </div>
        </div>

        {/* ================= STEP 1: ADMIN VERIFICATION & HISTORY ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-100 p-6 sm:p-8 shadow-lg">
              <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  1
                </span>
                ยืนยันตัวตนผู้ดูแลศูนย์ (Step 1)
              </h2>

              {!verifiedCenter ? (
                <form onSubmit={handleVerifyAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-1.5">
                      รหัสศูนย์ดิจิทัลชุมชน *
                    </label>
                    <input
                      type="text"
                      placeholder="กรอกรหัสศูนย์ (เช่น 1001 หรือ 0101)"
                      value={centerCode}
                      onChange={(e) => setCenterCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono font-semibold"
                      required
                    />
                    <p className="text-xs text-emerald-600 mt-1">
                      * ระบบจะตรวจสอบรหัสศูนย์กับฐานข้อมูล "รายชื่อศูนย์" และดึงชื่อศูนย์ให้อัตโนมัติ
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-1.5">
                      อีเมลผู้ดูแลศูนย์ *
                    </label>
                    <input
                      type="email"
                      placeholder="เช่น admin@center.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      required
                    />
                  </div>

                  {showNameField && (
                    <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2 animate-fadeIn">
                      <label className="block text-sm font-bold text-amber-900">
                        ชื่อ-นามสกุล ผู้ดูแลศูนย์ * (ลงทะเบียนครั้งแรก)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น นายสมชาย ใจดี"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-amber-950"
                        required={showNameField}
                        autoFocus
                      />
                      <p className="text-xs text-amber-800 font-medium">
                        * กรอกเพื่อบันทึกสิทธิ์ผู้ดูแลศูนย์ในครั้งแรก ครั้งถัดไปจะดึงชื่อนี้ให้อัตโนมัติ
                      </p>
                    </div>
                  )}

                  {adminAuthError && (
                    <div className={`p-3.5 rounded-xl text-sm font-medium border ${adminAuthError.startsWith('🔔')
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                      {adminAuthError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifyingAdmin}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md hover:shadow-emerald-200 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingAdmin
                      ? "กำลังตรวจสอบ..."
                      : showNameField
                        ? "ยืนยันการลงทะเบียนชื่อและดึงข้อมูลศูนย์ →"
                        : "ตรวจสอบสิทธิ์เข้าใช้งาน"}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Verified Center Badge Card */}
                  <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/60 pb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-200/70 text-emerald-800 font-bold text-xs">
                          ✓ พบศูนย์ในระบบแล้ว
                        </div>
                        <h3 className="text-xl font-bold text-emerald-950 mt-2">
                          {verifiedCenter.name}
                        </h3>
                        <p className="text-sm text-emerald-800 mt-0.5">
                          รหัสศูนย์: <span className="font-mono font-bold text-emerald-900">{verifiedCenter.code}</span>
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          ผู้ดำเนินการ: <span className="font-semibold">{verifiedCenter.adminName}</span> ({verifiedCenter.email})
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          onClick={() => setStep(2)}
                          className="px-6 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer text-center"
                        >
                          ไปที่ขั้นตอนกรอกรายชื่อ (Step 2) →
                        </button>
                      </div>
                    </div>

                    {/* Reset Button if typed wrong center code */}
                    <div className="flex items-center justify-between text-xs text-emerald-700 pt-1">
                      <span>พิมพ์รหัสศูนย์ผิด หรือ ต้องการเปลี่ยนศูนย์?</span>
                      <button
                        type="button"
                        onClick={handleResetCenter}
                        className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        ลบข้อมูลที่กรอกเมื่อกี้ / กรอกใหม่
                      </button>
                    </div>
                  </div>

                  {/* Previously Issued Certificates Recovery Section */}
                  {certHistory.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-100/60 p-4 rounded-xl border border-emerald-200">
                        <div>
                          <h3 className="font-bold text-emerald-950 text-base">
                            📜 ใบประกาศนียบัตรที่เคยออกไปแล้วสำหรับศูนย์นี้
                          </h3>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            ออกไว้แล้วจำนวน <span className="font-bold">{certHistory.length} ใบ</span> (ข้อมูลถูกดึงมาแสดงอัตโนมัติ)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadAllZip(certHistory)}
                          disabled={isZipping}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                          {isZipping ? "กำลังสร้าง ZIP..." : "📦 ดาวน์โหลดทั้งหมดที่เคยออกแล้ว (ZIP)"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                        {certHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between gap-2 hover:border-emerald-300 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-mono font-bold text-emerald-700 truncate">
                                {item.certCode}
                              </p>
                              <p className="font-bold text-emerald-950 text-sm truncate">
                                {item.fullName}
                              </p>
                              <p className="text-[11px] text-emerald-600">
                                {item.issueDate}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setActivePreviewCert(item)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shrink-0 cursor-pointer"
                            >
                              👁️ ดู / โหลด
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 2: RECIPIENT INFORMATION ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-100 p-6 sm:p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                      2
                    </span>
                    กรอกรายชื่อผู้รับใบประกาศ (Step 2)
                  </h2>
                  <p className="text-sm text-emerald-700 mt-1">
                    ศูนย์: <span className="font-bold">{verifiedCenter?.name}</span> ({verifiedCenter?.code})
                  </p>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="text-sm font-semibold text-emerald-700 hover:underline"
                >
                  ← ย้อนกลับ
                </button>
              </div>

              {/* Activity Date Selector */}
              <div className="mb-4 p-4 rounded-xl bg-teal-50/80 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="font-bold text-teal-950 block">
                    📅 เลือกวันที่เข้าร่วมกิจกรรมอบรม:
                  </label>
                  <p className="text-xs text-teal-700 mt-0.5">
                    * อิงตามกำหนดการโครงการ 4 วัน (วันที่เลือกจะถูกนำไปประทับบนใบประกาศ)
                  </p>
                </div>
                <select
                  value={selectedActivityDate}
                  onChange={(e) => setSelectedActivityDate(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-teal-300 bg-white text-sm font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                >
                  {ACTIVITY_DATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity selector */}
              <div className="mb-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="font-bold text-emerald-900">
                  เลือกจำนวนผู้รับใบประกาศที่ต้องการออก:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={recipientCount}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg border border-emerald-300 font-bold text-center bg-white"
                  />
                  <span className="text-sm font-medium text-emerald-700">คน</span>
                </div>
              </div>

              {/* Duplicate Warnings Alert */}
              {duplicateWarnings.length > 0 && (
                <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                  ⚠️ <strong>พบชื่อซ้ำในรายการ:</strong> {duplicateWarnings.join(", ")} (โปรดตรวจสอบอีกครั้ง)
                </div>
              )}

              {/* Recipients Input Table */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {recipients.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                      {index + 1}
                    </div>

                    <div className="w-full sm:w-36 shrink-0 flex flex-col gap-1.5">
                      <select
                        value={item.prefix}
                        onChange={(e) =>
                          handleRecipientChange(index, "prefix", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {PREFIX_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>

                      {item.prefix === "อื่นๆ" && (
                        <input
                          type="text"
                          placeholder="ระบุคำนำหน้า..."
                          value={item.customPrefix || ""}
                          onChange={(e) =>
                            handleRecipientChange(index, "customPrefix", e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-amber-50/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 animate-fadeIn"
                          autoFocus
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="ชื่อ *"
                        value={item.firstName}
                        onChange={(e) =>
                          handleRecipientChange(index, "firstName", e.target.value)
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-emerald-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="นามสกุล"
                        value={item.lastName}
                        onChange={(e) =>
                          handleRecipientChange(index, "lastName", e.target.value)
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-emerald-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {issueError && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                  ⚠️ {issueError}
                </div>
              )}

              <button
                onClick={handleIssueCertificates}
                disabled={isIssuing}
                className="mt-6 w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 cursor-pointer text-base"
              >
                {isIssuing ? "กำลังออกใบประกาศ..." : "ยืนยันและสร้างใบประกาศ (Step 3) →"}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ISSUED CERTS & BATCH DOWNLOAD ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-100 p-6 sm:p-8 shadow-lg text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold text-emerald-900">
                สร้างใบประกาศนียบัตรสำเร็จเรียบร้อย!
              </h2>
              <p className="text-emerald-700 mt-1">
                ออกใบประกาศจำนวน{" "}
                <span className="font-bold text-emerald-800">
                  {issuedCerts.length} ใบ
                </span>{" "}
                สำหรับ {verifiedCenter?.name}
              </p>

              {/* Download All ZIP Button */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isZipping ? "กำลังบีบอัดไฟล์ ZIP..." : "📦 ดาวน์โหลดใบประกาศทั้งหมด (ZIP)"}
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                >
                  + ออกใบประกาศเพิ่ม
                </button>
              </div>
            </div>

            {/* Certificate Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issuedCerts.map((cert, idx) => (
                <div
                  key={idx}
                  className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                        {cert.certCode}
                      </span>
                      {cert.isReissued && (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                          ใบเดิมที่เคยออกแล้ว
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-emerald-950">
                      {cert.fullName}
                    </h3>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      วันที่ออก: {cert.issueDate}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center gap-2">
                    <button
                      onClick={() => setActivePreviewCert(cert)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors text-center"
                    >
                      👁️ ดูตัวอย่างใบประกาศ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Preview Certificate Modal */}
      {activePreviewCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-emerald-900">
                ตัวอย่างใบประกาศ: {activePreviewCert.fullName}
              </h3>
              <button
                onClick={() => setActivePreviewCert(null)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <ECertCanvas certData={activePreviewCert} showDownloadBtn={true} />

            <div className="text-center pt-2">
              <button
                onClick={() => setActivePreviewCert(null)}
                className="px-6 py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
