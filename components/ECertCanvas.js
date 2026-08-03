"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

function extractDayNumber(dateStr) {
  if (!dateStr) return "31";
  const match = dateStr.match(/\d+/);
  return match ? match[0] : "31";
}

export default function ECertCanvas({
  certData,
  onRendered = null,
  className = "",
  showDownloadBtn = true,
}) {
  const canvasRef = useRef(null);
  const [isRendering, setIsRendering] = useState(true);

  const {
    certCode = "L2E-2026-DEMO",
    prefix = "",
    firstName = "",
    lastName = "",
    fullName = "นายสมชาย ใจดี",
    centerName = "ศูนย์ดิจิทัลชุมชนตัวอย่าง",
    centerCode = "0000",
    issueDate = "31 กรกฎาคม 2569",
    verifyLink = "",
  } = certData || {};

  // Display Name WITH prefix attached directly to firstName without space (e.g. นายสมชาย ใจดี, Mr.John Smith)
  const p = (prefix || "").trim();
  const fn = (firstName || "").trim();
  const ln = (lastName || "").trim();

  let displayName = "";
  if (p || fn || ln) {
    displayName = `${p}${fn}${ln ? ' ' + ln : ''}`.trim();
  } else {
    displayName = (fullName || "").trim();
  }

  useEffect(() => {
    let isMounted = true;

    async function drawCertificate() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const width = 2000;
      const height = 1414;

      canvas.width = width;
      canvas.height = height;

      // Try loading private Template.png via Secure API (/api/ecert/template)
      let hasTemplateImg = false;
      const templateImg = new Image();
      templateImg.src = "/api/ecert/template";

      await new Promise((resolve) => {
        templateImg.onload = () => {
          hasTemplateImg = true;
          resolve();
        };
        templateImg.onerror = () => {
          hasTemplateImg = false;
          resolve();
        };
      });

      // Ensure web fonts (Prompt / Be Vietnam Pro) are fully loaded before rendering text on Canvas
      if (typeof document !== "undefined" && document.fonts) {
        try {
          await document.fonts.ready;
          await document.fonts.load("bold 65px 'Prompt'");
        } catch (e) {
          // Continue if font load API is not available
        }
      }

      if (!isMounted) return;

      if (hasTemplateImg && templateImg.width > 0) {
        // -------------------------------------------------------------
        // OPTION A: OFFICIAL TEMPLATE IMAGE MODE (Using Template.png)
        // -------------------------------------------------------------
        // Draw the Official Template.png as the base image
        ctx.drawImage(templateImg, 0, 0, width, height);

        // 1. Recipient Full Name with prefix attached to first name
        const nameY = 640;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 65px 'Prompt', 'Be Vietnam Pro', 'Sarabun', sans-serif";
        ctx.fillStyle = "#151e15";
        ctx.fillText(displayName, 1000, nameY);

        // 2. Day Number only (Positioned in the blank gap of "ให้ ณ วันที่ [  ] สิงหาคม พ.ศ. 2569")
        const dayNumber = extractDayNumber(issueDate);
        const dayX = 945;
        const dayY = 1006;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 32px 'Prompt', 'Be Vietnam Pro', 'Sarabun', sans-serif";
        ctx.fillStyle = "#151e15";
        ctx.fillText(dayNumber, dayX, dayY);
      } else {
        // -------------------------------------------------------------
        // OPTION B: FALLBACK VECTOR CANVAS MODE (If Template.png not found)
        // -------------------------------------------------------------
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#f3fcee");
        bgGrad.addColorStop(0.5, "#ffffff");
        bgGrad.addColorStop(1, "#edf6e8");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Outer Borders
        ctx.lineWidth = 14;
        ctx.strokeStyle = "#cbab00";
        ctx.strokeRect(35, 35, width - 70, height - 70);

        ctx.lineWidth = 6;
        ctx.strokeStyle = "#006e2a";
        ctx.strokeRect(55, 55, width - 110, height - 110);

        // Certificate Title
        ctx.font = "bold 84px 'Prompt', sans-serif";
        ctx.fillStyle = "#006e2a";
        ctx.textAlign = "center";
        ctx.fillText("ใบประกาศนียบัตร", width / 2, 260);

        ctx.font = "600 38px 'Prompt', sans-serif";
        ctx.fillStyle = "#003913";
        ctx.fillText("โครงการส่งเสริมและพัฒนาดิจิทัลชุมชน", width / 2, 340);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#cbab00";
        ctx.beginPath();
        ctx.moveTo(width / 2 - 350, 380);
        ctx.lineTo(width / 2 + 350, 380);
        ctx.stroke();

        ctx.font = "400 36px 'Prompt', sans-serif";
        ctx.fillStyle = "#3c4a3c";
        ctx.fillText("ขอมอบใบประกาศนียบัตรนี้เพื่อแสดงว่า", width / 2, 490);

        // Recipient Name (Fallback Mode)
        ctx.font = "bold 74px 'Prompt', sans-serif";
        ctx.fillStyle = "#002106";
        ctx.fillText(displayName, width / 2, 600);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#006e2a";
        ctx.beginPath();
        ctx.moveTo(width / 2 - 450, 645);
        ctx.lineTo(width / 2 + 450, 645);
        ctx.stroke();

        ctx.font = "400 34px 'Prompt', sans-serif";
        ctx.fillStyle = "#3c4a3c";
        ctx.fillText("ได้ผ่านการอบรมเชิงปฏิบัติการ การสร้างทักษะดิจิทัลเพื่อชุมชน", width / 2, 730);

        ctx.font = "500 32px 'Prompt', sans-serif";
        ctx.fillStyle = "#006e2a";
        ctx.fillText(`ณ ${centerName}`, width / 2, 800);

        ctx.font = "400 30px 'Prompt', sans-serif";
        ctx.fillStyle = "#414941";
        ctx.fillText(`ให้ไว้ ณ วันที่ ${issueDate || '31 สิงหาคม พ.ศ. 2569'}`, width / 2, 870);
      }

      // -------------------------------------------------------------
      // QR CODE & VERIFICATION CODE OVERLAY (Applied to both Modes)
      // -------------------------------------------------------------
      const certCodeToUse = certCode || "PREVIEW";
      const qrTargetUrl =
        verifyLink ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/verify/${certCodeToUse}`
          : `https://digital-thai-thai.com/verify/${certCodeToUse}`);

      try {
        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, qrTargetUrl, {
          width: 170,
          margin: 1,
          color: {
            dark: "#006e2a",
            light: "#ffffff",
          },
        });

        const qrX = width - 330;
        const qrY = height - 340;

        // Draw QR Background Box
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX - 10, qrY - 10, 190, 190);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#bbcbb8";
        ctx.strokeRect(qrX - 10, qrY - 10, 190, 190);

        // Draw QR Image
        ctx.drawImage(qrCanvas, qrX, qrY, 170, 170);

        // QR Code Label
        ctx.font = "600 17px 'Be Vietnam Pro', 'Prompt', sans-serif";
        ctx.fillStyle = "#006e2a";
        ctx.textAlign = "center";
        ctx.fillText("สแกนเพื่อตรวจสอบ", qrX + 85, qrY + 208);

        ctx.font = "400 15px monospace";
        ctx.fillStyle = "#3c4a3c";
        ctx.fillText(`ID: ${certCode}`, qrX + 85, qrY + 230);
      } catch (err) {
        console.error("QR Render Error:", err);
      }

      if (isMounted) {
        setIsRendering(false);
        if (onRendered && canvas) {
          onRendered(canvas.toDataURL("image/png"));
        }
      }
    }

    drawCertificate();

    return () => {
      isMounted = false;
    };
  }, [certCode, displayName, centerName, centerCode, issueDate, verifyLink]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `E-Cert_${certCode}_${displayName.replace(/\s+/g, "_")}.png`;
    link.click();
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative w-full overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-md">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <span className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin"></span>
              กำลังสร้างใบประกาศ...
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-auto block rounded-lg shadow-inner"
        />
      </div>

      {showDownloadBtn && (
        <button
          onClick={handleDownloadPNG}
          disabled={isRendering}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md hover:shadow-emerald-200 disabled:opacity-50 cursor-pointer"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          ดาวน์โหลดใบประกาศ (PNG)
        </button>
      )}
    </div>
  );
}
