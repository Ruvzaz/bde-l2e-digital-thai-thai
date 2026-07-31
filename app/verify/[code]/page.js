"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import ECertCanvas from "@/components/ECertCanvas";

export default function VerifyPage({ params }) {
  const resolvedParams = use(params);
  const code = resolvedParams?.code;

  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;

    async function fetchVerification() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/ecert/verify?code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (!res.ok || !data.found) {
          throw new Error(data.message || "ไม่พบใบประกาศนี้ในระบบ หรือรหัสไม่ถูกต้อง");
        }

        setCertData(data.cert);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVerification();
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50/40 to-teal-50 text-emerald-950 font-sans pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm sticky top-0 z-30">
        <div className="w-full px-6 sm:px-10 lg:px-12 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-semibold transition-colors text-sm sm:text-base"
          >
            ← กลับสู่หน้าหลัก
          </Link>
          <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
            ระบบตรวจสอบใบประกาศ E-Cert
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-10">
        {loading ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-100 p-12 text-center shadow-lg space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold text-emerald-800">กำลังตรวจสอบข้อมูลรหัส {code}...</p>
          </div>
        ) : error ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-red-200 p-8 text-center shadow-lg space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✕
            </div>
            <h2 className="text-2xl font-extrabold text-red-900">ไม่พบข้อมูลใบประกาศ</h2>
            <p className="text-red-700 text-sm max-w-md mx-auto">{error}</p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md"
              >
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Authenticity Verified Badge Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-lg text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2 border border-emerald-200">
                ✓ Authentic Certificate Verified
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
                ใบประกาศนียบัตรนี้ถูกต้องและมีผลสมบูรณ์
              </h1>
              <p className="text-emerald-700 text-sm mt-1">
                ออกโดยโครงการส่งเสริมการเรียนรู้ดิจิทัล (Learn to Earn) สดช.
              </p>

              {/* Detail Table */}
              <div className="mt-6 text-left rounded-xl bg-emerald-50/60 border border-emerald-100 p-4 space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-100/80 pb-2">
                  <span className="text-emerald-700 font-medium">รหัสใบประกาศ:</span>
                  <span className="font-mono font-bold text-emerald-900">{certData.certCode}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-100/80 pb-2">
                  <span className="text-emerald-700 font-medium">ชื่อผู้ได้รับใบประกาศ:</span>
                  <span className="font-bold text-emerald-950 text-base">{certData.fullName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-100/80 pb-2">
                  <span className="text-emerald-700 font-medium">ศูนย์ที่ออกใบประกาศ:</span>
                  <span className="font-bold text-emerald-900">{certData.centerName} ({certData.centerCode})</span>
                </div>
                {certData.adminName && certData.adminName !== '-' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-100/80 pb-2">
                    <span className="text-emerald-700 font-medium">ผู้ดูแลศูนย์ผู้ดำเนินการ:</span>
                    <span className="font-semibold text-emerald-900">{certData.adminName}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-100/80 pb-2">
                  <span className="text-emerald-700 font-medium">อีเมลผู้ดูแลศูนย์:</span>
                  <span className="font-medium text-emerald-800">{certData.adminEmail}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <span className="text-emerald-700 font-medium">วันที่ออกเอกสาร:</span>
                  <span className="font-semibold text-emerald-900">{certData.issueDate}</span>
                </div>
              </div>
            </div>

            {/* Live Certificate Renderer */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-100 p-6 shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-emerald-900 text-center">
                สำเนาใบประกาศนียบัตรอิเล็กทรอนิกส์
              </h2>
              <ECertCanvas certData={certData} showDownloadBtn={true} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
