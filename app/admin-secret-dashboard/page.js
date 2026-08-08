'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ headers: [], rows: [], total: 0, sheetName: 'Main Report' });
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRow, setSelectedRow] = useState(null); // For Modal detail view
  const [activeTab, setActiveTab] = useState('INFO'); // Modal tabs: 'INFO', 'FILES', 'CONTEST', 'PARTICIPANTS'
  const [activeImagePreview, setActiveImagePreview] = useState(null); // Lightbox zoom modal
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [auditNote, setAuditNote] = useState(''); // Note for Column E "หมายเหตุตรวจผลงาน"

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reports');
      const result = await res.json();

      if (res.ok && result.success) {
        setData(result);
        setLastRefreshed(new Date().toLocaleTimeString('th-TH'));
      } else {
        setError(result.error || result.message || 'ไม่สามารถโหลดข้อมูลจากชีท Main Report ได้');
        if (result.headers) {
          setData(result);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Lock background body scroll when modal or lightbox is active
  useEffect(() => {
    if (selectedRow || activeImagePreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedRow, activeImagePreview]);

  // Helper to find cell value by partial header match
  const getVal = (row, partialHeader) => {
    if (!row) return '';
    const key = Object.keys(row).find((k) =>
      k.toLowerCase().includes(partialHeader.toLowerCase())
    );
    return key && row[key] ? row[key].toString().trim() : '';
  };

  // Helper to extract Google Drive File ID
  const getDriveFileId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFileD) return matchFileD[1];
    const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchIdParam) return matchIdParam[1];
    return null;
  };

  // Helper to extract YouTube Video ID
  const getYouTubeVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const matchStandard = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return matchStandard ? matchStandard[1] : null;
  };

  // Helper to check if a row has submitted a report
  const checkIsSubmitted = (row) => {
    if (!row) return false;
    const status = getVal(row, 'สถานะการส่ง');
    
    // 1. Check status string directly
    if (status && (status.includes('ส่งรายงานแล้ว') || status === 'ส่งแล้ว' || status === 'เรียบร้อย')) {
      return true;
    }
    if (status && (status.includes('ยังไม่ส่ง') || status === 'ไม่พบข้อมูล' || status === '-')) {
      return false;
    }

    // 2. Fallback: Check valid email or signature file
    const email = getVal(row, 'Email');
    const signature = getVal(row, 'ใบเซ็นชื่อ');
    const hasEmail = email && email !== 'ไม่พบข้อมูล' && email !== '-' && email.includes('@');
    const hasSignature = signature && signature !== 'ไม่พบข้อมูล' && signature !== '-' && signature.startsWith('http');

    return hasEmail || hasSignature;
  };

  // Helper to extract Audit Status ("สถานะตรวจรายงาน")
  const getAuditStatusInfo = (row) => {
    const status = getVal(row, 'สถานะตรวจรายงาน');
    if (status.includes('ผ่าน') && !status.includes('ไม่')) {
      return { status: 'ผ่าน', type: 'PASSED', label: 'ผ่านการตรวจ', badgeClass: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 font-extrabold', dotClass: 'bg-emerald-500' };
    }
    if (status.includes('ไม่ผ่าน')) {
      return { status: 'ไม่ผ่าน', type: 'FAILED', label: 'ไม่ผ่าน', badgeClass: 'bg-rose-100 text-rose-950 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 font-extrabold', dotClass: 'bg-rose-500' };
    }
    if (status.includes('แก้ไข')) {
      return { status: 'ต้องแก้ไข', type: 'REVISE', label: 'ต้องแก้ไข', badgeClass: 'bg-sky-100 text-sky-950 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-700/60 font-extrabold', dotClass: 'bg-sky-500' };
    }
    return { status: 'รอตรวจ', type: 'PENDING', label: 'รอตรวจ', badgeClass: 'bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 font-semibold', dotClass: 'bg-amber-500' };
  };

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);

  const handleUpdateAuditStatus = async (targetRow, newStatus) => {
    if (!targetRow || !targetRow._sheetRowIndex) return;
    setUpdatingStatus(true);
    setStatusNotification(null);

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetRowIndex: targetRow._sheetRowIndex,
          status: newStatus,
          note: auditNote,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        const updatedRows = data.rows.map((r) => {
          if (r._id === targetRow._id) {
            return { ...r, 'สถานะตรวจรายงาน': newStatus, 'หมายเหตุตรวจผลงาน': auditNote };
          }
          return r;
        });

        setData((prev) => ({ ...prev, rows: updatedRows }));
        if (selectedRow && selectedRow._id === targetRow._id) {
          setSelectedRow((prev) => ({ ...prev, 'สถานะตรวจรายงาน': newStatus, 'หมายเหตุตรวจผลงาน': auditNote }));
        }

        setStatusNotification({ type: 'success', message: `บันทึกสถานะ "${newStatus}" และหมายเหตุลง Google Sheet สำเร็จ!` });
      } else {
        setStatusNotification({ type: 'error', message: result.error || 'ไม่สามารถอัปเดตข้อมูลได้' });
      }
    } catch (err) {
      console.error('Update status error:', err);
      setStatusNotification({ type: 'error', message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter rows based on search and status
  const filteredRows = data.rows.filter((row) => {
    const code = getVal(row, 'รหัส');
    const name = getVal(row, 'ชื่อศูนย์');
    const province = getVal(row, 'จังหวัด');
    const adminName = getVal(row, 'ชื่อผู้ดูแล');
    const isSub = checkIsSubmitted(row);
    const auditInfo = getAuditStatusInfo(row);

    const matchesSearch =
      !searchQuery.trim() ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adminName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUBMITTED' && isSub) ||
      (statusFilter === 'EMPTY' && !isSub) ||
      (statusFilter === 'PASSED' && auditInfo.type === 'PASSED') ||
      (statusFilter === 'FAILED' && auditInfo.type === 'FAILED') ||
      (statusFilter === 'REVISE' && auditInfo.type === 'REVISE') ||
      (statusFilter === 'PENDING' && auditInfo.type === 'PENDING');

    return matchesSearch && matchesStatus;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Auto-reset page when search, filter or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  // Calculate pagination parameters
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRows.length);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  // Calculate statistics accurately
  const totalSubmittedCount = data.rows.filter(r => checkIsSubmitted(r)).length;
  const auditPassedCount = data.rows.filter(r => getAuditStatusInfo(r).type === 'PASSED').length;
  const auditPendingCount = data.rows.filter(r => checkIsSubmitted(r) && getAuditStatusInfo(r).type === 'PENDING').length;
  const selectedAuditInfo = selectedRow ? getAuditStatusInfo(selectedRow) : null;

  // Render Pagination Navigation Controls
  const renderPaginationControls = () => {
    if (filteredRows.length === 0) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startP = Math.max(1, safeCurrentPage - 2);
    let endP = Math.min(totalPages, startP + maxVisiblePages - 1);
    if (endP - startP < maxVisiblePages - 1) {
      startP = Math.max(1, endP - maxVisiblePages + 1);
    }
    for (let i = startP; i <= endP; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-outline-variant/30 bg-surface-container-high/20">
        {/* Info & Items Per Page Selector */}
        <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
          <span>แสดง {filteredRows.length > 0 ? startIndex + 1 : 0} - {endIndex} จาก {filteredRows.length} รายการ</span>
          <div className="h-4 w-[1px] bg-outline-variant/40 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <span>แสดงหน้าละ:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-surface-container-high border border-outline-variant/40 rounded-xl px-2.5 py-1 text-xs text-on-surface font-bold focus:outline-none cursor-pointer"
            >
              <option value={25}>25 รายการ</option>
              <option value={50}>50 รายการ</option>
              <option value={100}>100 รายการ</option>
              <option value={250}>250 รายการ</option>
            </select>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-xl hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none text-on-surface-variant transition-all"
            title="หน้าแรก"
          >
            <span className="material-symbols-outlined text-[20px]">first_page</span>
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-on-surface transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>ก่อนหน้า</span>
          </button>

          {/* Page Buttons */}
          <div className="hidden md:flex items-center gap-1">
            {startP > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-8 h-8 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
                >
                  1
                </button>
                {startP > 2 && <span className="text-xs text-on-surface-variant px-1">...</span>}
              </>
            )}

            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  safeCurrentPage === p
                    ? 'bg-primary text-on-primary shadow-sm scale-105'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {p}
              </button>
            ))}

            {endP < totalPages && (
              <>
                {endP < totalPages - 1 && <span className="text-xs text-on-surface-variant px-1">...</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Current Page Label on Mobile */}
          <span className="md:hidden text-xs font-bold px-2 text-on-surface">
            {safeCurrentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-on-surface transition-all border border-outline-variant/30"
          >
            <span>ถัดไป</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-xl hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none text-on-surface-variant transition-all"
            title="หน้าสุดท้าย"
          >
            <span className="material-symbols-outlined text-[20px]">last_page</span>
          </button>
        </div>
      </div>
    );
  };
  // Media Preview Card Helper (Large, Un-cropped, High-Res Previews)
  const renderMediaPreviewCard = (label, url, isVideo = false, isPdf = false) => {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return (
        <div className="glass-card p-5 rounded-3xl bg-surface-container-high/30 flex flex-col gap-2 border border-outline-variant/30">
          <p className="text-sm font-bold text-on-surface-variant">{label}</p>
          <div className="flex items-center justify-center p-8 border border-dashed border-outline-variant/40 rounded-2xl bg-surface-container-high/20 text-on-surface-variant/50 text-xs font-medium gap-1.5 min-h-[200px]">
            <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            <span>ยังไม่มีไฟล์</span>
          </div>
        </div>
      );
    }

    const driveId = getDriveFileId(url);
    const ytId = getYouTubeVideoId(url);
    const isDirectImage = /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url) || url.includes('googleusercontent.com');
    const isDirectVideo = /\.(mp4|webm|mov)($|\?)/i.test(url);

    return (
      <div className="glass-card p-5 rounded-3xl bg-surface-container-high/30 flex flex-col gap-3 border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
          <p className="text-sm font-bold text-on-surface truncate">{label}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
          >
            <span>เปิดลิงก์ต้นฉบับ</span>
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
        </div>

        {/* Embedded Video (YouTube) */}
        {ytId && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-black border border-outline-variant/20 min-h-[280px]">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={label}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* Direct Video (.mp4 / .webm) */}
        {!ytId && isDirectVideo && (
          <video
            src={url}
            controls
            className="w-full rounded-2xl min-h-[280px] max-h-[450px] object-contain shadow-lg bg-black border border-outline-variant/20"
          ></video>
        )}

        {/* Embedded Google Drive Video or PDF Viewer (Large height) */}
        {!ytId && !isDirectVideo && driveId && (isVideo || isPdf) && (
          <div className="relative w-full h-[360px] sm:h-[450px] rounded-2xl overflow-hidden shadow-lg bg-slate-900 border border-outline-variant/20">
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              title={label}
              className="w-full h-full border-0"
              allow="autoplay"
            ></iframe>
          </div>
        )}

        {/* Image Preview (Uncropped, Full Image View, Large Container) */}
        {!ytId && !isDirectVideo && !isVideo && !isPdf && (
          <div
            onClick={() =>
              setActiveImagePreview({
                src: driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600` : url,
                title: label,
              })
            }
            className="relative w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden bg-slate-950/80 border border-outline-variant/20 group flex items-center justify-center cursor-pointer shadow-md"
            title="คลิกเพื่อดูภาพขยายใหญ่เต็มหน้าจอ"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600` : url}
              alt={label}
              className="w-full h-full object-contain rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                if (driveId) {
                  e.target.onerror = null;
                  e.target.src = `https://lh3.googleusercontent.com/d/${driveId}`;
                }
              }}
            />
            {/* Hover Zoom Overlay */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm backdrop-blur-[2px]">
              <span className="material-symbols-outlined text-[24px]">fullscreen</span>
              <span>คลิกเพื่อดูเต็มหน้าจอ</span>
            </div>
          </div>
        )}

        {/* Generic Fallback Link Card if no preview match */}
        {!ytId && !isDirectVideo && !driveId && !isDirectImage && (
          <div className="p-4 bg-surface-container-high/60 rounded-2xl flex items-center justify-between gap-3 border border-outline-variant/30">
            <span className="text-xs font-mono text-on-surface-variant truncate">{url}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shrink-0"
            >
              <span>เปิดดู</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dim text-on-surface p-4 sm:p-8 font-sans">
      {/* Top Bar Navigation */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-surface-container-lowest/80 dark:bg-surface-container-lowest/40 backdrop-blur-xl p-6 rounded-3xl border border-outline-variant/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/10 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="material-symbols-outlined text-[32px]">analytics</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-headline-md">Admin Dashboard</h1>
              <span className="bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300/50">
                Secret Path
              </span>
            </div>
            <p className="text-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <span>รายงานผลการจัดกิจกรรม (Google Sheet:</span>
              <span className="font-semibold text-primary">Main Report</span>
              <span>)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm px-5 py-2.5 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>รีเฟรชข้อมูล</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-sm px-4 py-2.5 rounded-2xl transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>หน้าหลัก</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-4">
            <div className="bg-primary/10 text-primary w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">domain</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">ศูนย์ทั้งหมดในระบบ</p>
              <h3 className="text-xl font-bold text-on-surface mt-0.5">
                {loading ? '...' : data.total} <span className="text-xs font-normal text-on-surface-variant">ศูนย์</span>
              </h3>
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-600/10 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">assignment_turned_in</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">ส่งรายงานผลเรียบร้อยแล้ว</p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {loading ? '...' : totalSubmittedCount} <span className="text-xs font-normal text-on-surface-variant">ศูนย์</span>
              </h3>
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">verified</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">🟢 ผ่านการตรวจรายงาน</p>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {loading ? '...' : auditPassedCount} <span className="text-xs font-normal text-on-surface-variant">ศูนย์</span>
              </h3>
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-4">
            <div className="bg-amber-500/10 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">pending_actions</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">🟡 ส่งแล้ว (รอตรวจรายงาน)</p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {loading ? '...' : auditPendingCount} <span className="text-xs font-normal text-on-surface-variant">ศูนย์</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-card p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส, ชื่อศูนย์, จังหวัด, ผู้ดูแล..."
                className="w-full bg-surface-container-high/60 border border-outline-variant/40 rounded-2xl pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-surface-container-high/60 border border-outline-variant/40 rounded-2xl px-4 py-2 text-sm text-on-surface font-medium focus:outline-none focus:border-primary"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="SUBMITTED">เฉพาะศูนย์ที่มีรายงานผลแล้ว</option>
              <option value="EMPTY">เฉพาะศูนย์ยังไม่มีรายงานผล</option>
              <option value="PASSED">🟢 ธรรมดาผ่านการตรวจ</option>
              <option value="FAILED">🔴 ไม่ผ่านการตรวจ</option>
              <option value="REVISE">🔵 แจ้งกลับให้แก้ไข</option>
              <option value="PENDING">🟡 ส่งแล้ว (รอตรวจรายงาน)</option>
            </select>
          </div>

          <div className="text-xs text-on-surface-variant font-medium self-end sm:self-center">
            แสดง {filteredRows.length} จาก {data.total} รายการ
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-4 rounded-2xl text-amber-900 dark:text-amber-200 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0">warning</span>
            <div>
              <p className="font-bold">หมายเหตุ:</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Structured Data Table View */}
        <div className="glass-card rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
              <p className="text-sm font-medium text-on-surface-variant">กำลังโหลดข้อมูลชีท Main Report...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="bg-surface-container-high p-4 rounded-full text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[36px]">find_in_page</span>
              </div>
              <h4 className="text-base font-bold text-on-surface">ไม่พบข้อมูลตามเงื่อนไขที่ระบุ</h4>
              <p className="text-sm text-on-surface-variant max-w-md">
                {searchQuery ? `ไม่พบข้อมูลที่ตรงกับคำว่า "${searchQuery}"` : 'ยังไม่มีข้อมูลรายงานผลในระบบ'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface-container-high/80 sticky top-0 backdrop-blur-md z-10 border-b border-outline-variant/30 text-on-surface-variant font-bold">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">รหัสศูนย์</th>
                      <th className="py-3.5 px-4">ชื่อศูนย์ดิจิทัลชุมชน / จังหวัด</th>
                      <th className="py-3.5 px-4">ผู้ดูแลศูนย์</th>
                      <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                      <th className="py-3.5 px-4 text-center">จำนวนผู้เข้าอบรม</th>
                      <th className="py-3.5 px-4 text-center">สถานะการส่ง</th>
                      <th className="py-3.5 px-4 text-center">สถานะตรวจรายงาน</th>
                      <th className="py-3.5 px-4 text-center">รายละเอียด & ตรวจงาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {paginatedRows.map((row, idx) => {
                      const code = getVal(row, 'รหัส') || '-';
                      const name = getVal(row, 'ชื่อศูนย์') || '-';
                      const province = getVal(row, 'จังหวัด') || '-';
                      
                      const adminPrefix = getVal(row, 'คำนำหน้า ผู้ดูแล') || getVal(row, 'คำนำหน้า');
                      const rawAdminName = getVal(row, 'ชื่อผู้ดูแล');
                      const cleanAdminName = (rawAdminName && rawAdminName !== 'ไม่พบข้อมูล' && rawAdminName !== '-') ? rawAdminName : '';
                      const cleanPrefix = (adminPrefix && adminPrefix !== 'ไม่พบข้อมูล' && adminPrefix !== '-') ? adminPrefix : '';
                      const fullAdmin = `${cleanPrefix} ${cleanAdminName}`.trim() || '-';

                      const rawPhone = getVal(row, 'เบอร์โทรศัพท์');
                      const phone = (rawPhone && rawPhone !== 'ไม่พบข้อมูล' && rawPhone !== '-') ? rawPhone : '-';

                      const rawCount = getVal(row, 'จำนวนผู้เข้าอบรม');
                      const count = (rawCount && rawCount !== 'ไม่พบข้อมูล' && rawCount !== '-') ? rawCount : '-';

                      const isSubmitted = checkIsSubmitted(row);
                      const auditInfo = getAuditStatusInfo(row);

                      return (
                        <tr
                          key={row._id || idx}
                          className="hover:bg-surface-container-high/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-semibold text-on-surface-variant/70">
                            {startIndex + idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-primary">
                            {code}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-on-surface">{name}</div>
                            <div className="text-xs text-on-surface-variant">{province}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-on-surface">
                            {fullAdmin}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                            {phone}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold">
                            {count !== '-' ? `${count} คน` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>ส่งรายงานแล้ว</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span>ยังไม่ส่งรายงาน</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border shadow-xs ${auditInfo.badgeClass}`}>
                                <span className={`w-2 h-2 rounded-full ${auditInfo.dotClass}`}></span>
                                <span>{auditInfo.label}</span>
                              </span>
                              {getVal(row, 'หมายเหตุตรวจผลงาน') && (
                                <span className="text-[11px] font-normal text-on-surface-variant/80 italic max-w-[140px] truncate" title={getVal(row, 'หมายเหตุตรวจผลงาน')}>
                                  📝 {getVal(row, 'หมายเหตุตรวจผลงาน')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedRow(row);
                                setAuditNote(getVal(row, 'หมายเหตุตรวจผลงาน'));
                                setActiveTab('INFO');
                                setStatusNotification(null);
                              }}
                              className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all border border-primary/20"
                            >
                              <span className="material-symbols-outlined text-[16px]">rate_review</span>
                              <span>ตรวจงาน & รายละเอียด</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {renderPaginationControls()}
            </>
          )}
        </div>
      </main>

      {/* Detail Modal Drawer */}
      {selectedRow && selectedAuditInfo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-surface-container-lowest dark:bg-surface-container-lowest/95 rounded-3xl border border-outline-variant/40 shadow-2xl max-w-[96vw] w-full h-[92vh] max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant/30 flex items-start justify-between bg-surface-container-high/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary font-mono font-bold text-sm px-3 py-1 rounded-lg border border-primary/20">
                    {getVal(selectedRow, 'รหัส') || 'ไม่ระบุรหัส'}
                  </span>
                  <h3 className="text-xl font-bold text-on-surface">
                    {getVal(selectedRow, 'ชื่อศูนย์') || 'รายละเอียดศูนย์'}
                  </h3>
                </div>
                <p className="text-sm text-on-surface-variant mt-1">
                  จังหวัด: <span className="font-semibold">{getVal(selectedRow, 'จังหวัด') || '-'}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedRow(null)}
                className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Admin Audit Action Control Bar */}
            <div className="bg-surface-container-high/60 border-b border-outline-variant/30 px-6 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-on-surface-variant">สถานะปัจจุบัน:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${selectedAuditInfo.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${selectedAuditInfo.dotClass}`}></span>
                  <span>{selectedAuditInfo.label}</span>
                </span>
                {getVal(selectedRow, 'หมายเหตุตรวจผลงาน') && (
                  <span className="text-xs text-on-surface-variant/80 italic bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant/30">
                    "{getVal(selectedRow, 'หมายเหตุตรวจผลงาน')}"
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <input
                  type="text"
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  placeholder="กรอกหมายเหตุตรวจผลงาน ( Col E )..."
                  className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3.5 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
                />

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateAuditStatus(selectedRow, 'ผ่าน')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-50 ${
                      selectedAuditInfo.type === 'PASSED'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                    }`}
                  >
                    <span>🟢 ให้ผ่าน</span>
                  </button>

                  <button
                    onClick={() => handleUpdateAuditStatus(selectedRow, 'ไม่ผ่าน')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-50 ${
                      selectedAuditInfo.type === 'FAILED'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                    }`}
                  >
                    <span>🔴 ไม่ผ่าน</span>
                  </button>

                  <button
                    onClick={() => handleUpdateAuditStatus(selectedRow, 'ต้องแก้ไข')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-50 ${
                      selectedAuditInfo.type === 'REVISE'
                        ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border border-sky-500/30'
                    }`}
                  >
                    <span>🔵 ให้แก้ไข</span>
                  </button>

                  <button
                    onClick={() => handleUpdateAuditStatus(selectedRow, 'รอตรวจ')}
                    disabled={updatingStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-50 ${
                      selectedAuditInfo.type === 'PENDING'
                        ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                    }`}
                  >
                    <span>🟡 รอตรวจ</span>
                  </button>
                </div>
              </div>
            </div>

              {/* Status Notification Alert */}
              {statusNotification && (
                <div className={`px-6 py-2 text-xs font-bold flex items-center justify-between gap-2 border-b border-outline-variant/20 animate-fade-in ${
                  statusNotification.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      {statusNotification.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span>{statusNotification.message}</span>
                  </div>
                  <button onClick={() => setStatusNotification(null)} className="hover:opacity-75">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

            {/* Modal Tabs */}
            <div className="flex border-b border-outline-variant/30 bg-surface-container-high/20 px-6 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('INFO')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'INFO'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>1. ข้อมูลทั่วไป</span>
              </button>

              <button
                onClick={() => setActiveTab('FILES')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'FILES'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">folder_zip</span>
                <span>2. เอกสาร & รูปภาพ</span>
              </button>

              <button
                onClick={() => setActiveTab('CONTEST')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'CONTEST'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
                <span>3. สื่อประกวด</span>
              </button>

              <button
                onClick={() => setActiveTab('PARTICIPANTS')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'PARTICIPANTS'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>4. รายชื่อผู้เข้าร่วม ({selectedRow._participants?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
              {/* TAB 1: INFO */}
              {activeTab === 'INFO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30">
                    <p className="text-xs text-on-surface-variant">รหัสศูนย์ดิจิทัลชุมชน</p>
                    <p className="text-base font-bold font-mono text-primary mt-1">{getVal(selectedRow, 'รหัส') || '-'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30">
                    <p className="text-xs text-on-surface-variant">จังหวัด</p>
                    <p className="text-base font-bold text-on-surface mt-1">{getVal(selectedRow, 'จังหวัด') || '-'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30 md:col-span-2">
                    <p className="text-xs text-on-surface-variant">ชื่อศูนย์ดิจิทัลชุมชน</p>
                    <p className="text-lg font-bold text-on-surface mt-1">{getVal(selectedRow, 'ชื่อศูนย์') || '-'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30">
                    <p className="text-xs text-on-surface-variant">ผู้ดูแลศูนย์</p>
                    <p className="text-base font-bold text-on-surface mt-1">
                      {getVal(selectedRow, 'คำนำหน้า ผู้ดูแล')} {getVal(selectedRow, 'ชื่อผู้ดูแล')}
                    </p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30">
                    <p className="text-xs text-on-surface-variant">เบอร์โทรศัพท์ผู้ดูแล</p>
                    <p className="text-base font-bold font-mono text-on-surface mt-1">{getVal(selectedRow, 'เบอร์โทรศัพท์') || '-'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30">
                    <p className="text-xs text-on-surface-variant">Email Address</p>
                    <p className="text-base font-bold font-mono text-on-surface mt-1">{getVal(selectedRow, 'Email') || '-'}</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30">
                    <p className="text-xs text-on-surface-variant">ครั้งที่อบรม & จำนวนผู้เข้าอบรม</p>
                    <p className="text-base font-bold text-on-surface mt-1">
                      อบรมครั้งที่: {getVal(selectedRow, 'ครั้งที่อบรม') || '-'} | จำนวน: {getVal(selectedRow, 'จำนวนผู้เข้าอบรม') || '-'} ท่าน
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: FILES */}
              {activeTab === 'FILES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderMediaPreviewCard('ใบเซ็นชื่อผู้เข้าร่วมอบรม (PDF)', getVal(selectedRow, 'ใบเซ็นชื่อ'), false, true)}
                  {renderMediaPreviewCard('ภาพรวมการจัดกิจกรรม (2 ภาพ)', getVal(selectedRow, 'ภาพรวมการจัดกิจกรรม'))}
                  {renderMediaPreviewCard('ภาพบรรยากาศอบรม (4 ภาพ)', getVal(selectedRow, 'บรรยากาศอบรม'))}
                  {renderMediaPreviewCard('รูปภาพอาหารเบรค (2 ภาพ)', getVal(selectedRow, 'อาหารเบรค'))}
                  {renderMediaPreviewCard('รูปภาพอาหารกลางวัน (1 ภาพ)', getVal(selectedRow, 'อาหารกลางวัน'))}
                  {renderMediaPreviewCard('วิดีโอบรรยากาศการจัดฝึกอบรม', getVal(selectedRow, 'วิดีโอ (บรรยากาศ'), true, false)}
                  {renderMediaPreviewCard('ไฟล์สแกนใบรับของ (PDF)', getVal(selectedRow, 'ใบรับของ'), false, true)}
                </div>
              )}

              {/* TAB 3: CONTEST */}
              {activeTab === 'CONTEST' && (
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30 border border-outline-variant/30">
                    <p className="text-xs text-on-surface-variant font-bold">ชื่อผลงานสื่อสร้างสรรค์</p>
                    <p className="text-base font-bold text-on-surface mt-1">{getVal(selectedRow, 'ชื่อผลงาน') || '-'}</p>
                  </div>

                  <div className="glass-card p-4 rounded-2xl bg-surface-container-high/30 border border-outline-variant/30">
                    <p className="text-xs text-on-surface-variant font-bold">แนวคิดผลงาน</p>
                    <p className="text-sm text-on-surface mt-1 leading-relaxed">{getVal(selectedRow, 'เเนวคิด') || getVal(selectedRow, 'แนวคิด') || '-'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderMediaPreviewCard('คลิปวิดีโอ Digital Thai Thai', getVal(selectedRow, 'Digital Thai Thai'), true, false)}
                    {renderMediaPreviewCard('คลิปวิดีโอเพิ่มเติม', getVal(selectedRow, 'คลิปวีดิโอเพิ่มเติม'), true, false)}
                  </div>
                </div>
              )}

              {/* TAB 4: PARTICIPANTS */}
              {activeTab === 'PARTICIPANTS' && (
                <div>
                  {selectedRow._participants && selectedRow._participants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedRow._participants.map((p, idx) => (
                        <div key={idx} className="glass-card p-3.5 rounded-2xl bg-surface-container-high/30 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mr-2">
                              คนที่ {p.index}
                            </span>
                            <span className="text-sm font-bold text-on-surface">
                              {p.prefix} {p.name}
                            </span>
                            {p.phone && <p className="text-xs text-on-surface-variant font-mono mt-0.5">โทร: {p.phone}</p>}
                          </div>
                          {p.type && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                              {p.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-on-surface-variant text-sm">
                      ไม่พบข้อมูลผู้เข้าร่วมอบรมในรายการนี้
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-outline-variant/30 bg-surface-container-high/30 flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="bg-primary text-on-primary font-bold text-sm px-6 py-2 rounded-2xl hover:bg-primary-container transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Image Modal */}
      {activeImagePreview && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setActiveImagePreview(null)}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-2 text-white">
              <h4 className="text-base sm:text-lg font-bold truncate max-w-xl">
                {activeImagePreview.title}
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href={activeImagePreview.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1 backdrop-blur-sm transition-all"
                >
                  <span>เปิดไฟล์เต็ม</span>
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
                <button
                  onClick={() => setActiveImagePreview(null)}
                  className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
            </div>

            <div className="relative w-full max-h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImagePreview.src}
                alt={activeImagePreview.title}
                className="max-h-[80vh] max-w-full object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
