'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateClientWordDoc } from '@/utils/clientWordExport';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ headers: [], rows: [], total: 0, sheetName: 'Main Report' });
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('REPORTS'); // 'REPORTS' | 'VIDEOS'
  const [selectedRow, setSelectedRow] = useState(null); // For Modal detail view
  const [activeTab, setActiveTab] = useState('INFO'); // Modal tabs: 'INFO', 'FILES', 'CONTEST', 'PARTICIPANTS'
  const [activeImagePreview, setActiveImagePreview] = useState(null); // Lightbox zoom modal
  const [activeVideoModal, setActiveVideoModal] = useState(null); // Dedicated video popup + quick audit modal
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [auditNote, setAuditNote] = useState(''); // Note for Column E "หมายเหตุตรวจผลงาน"
  const [generatingWord, setGeneratingWord] = useState(false);

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
    if (selectedRow || activeImagePreview || activeVideoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedRow, activeImagePreview, activeVideoModal]);

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
    const isSub = checkIsSubmitted(row);
    if (!status && !isSub) {
      return { status: 'ยังไม่ส่ง', type: 'NOT_SUBMITTED', label: 'ยังไม่ส่ง', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium', dotClass: 'bg-slate-400' };
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

  // Helper to extract Column V "วิดีโอ (Digital Thai Thai)" video URL
  const getColVVideoUrl = (row) => {
    if (!row) return '';
    const val =
      getVal(row, 'วิดีโอ (Digital Thai Thai)') ||
      getVal(row, 'Digital Thai Thai') ||
      getVal(row, 'วิดีโอ');
    if (val && val !== 'ไม่พบข้อมูล' && val !== '-' && val !== 'ไม่มี') {
      const urls = val.match(/https?:\/\/[^\s,"]+/g);
      return urls && urls.length > 0 ? urls[0] : val.trim();
    }
    return '';
  };

  // Helper to open dedicated video popup modal + quick audit
  const openVideoModal = (row) => {
    const videoUrl = getColVVideoUrl(row);
    if (!videoUrl) return;
    const driveId = getDriveFileId(videoUrl);
    const ytId = getYouTubeVideoId(videoUrl);
    const isMp4 = /\.(mp4|webm|mov)($|\?)/i.test(videoUrl);
    const currentAuditStatus = getVal(row, 'สถานะตรวจรายงาน');
    const currentNote = getVal(row, 'หมายเหตุตรวจผลงาน');

    setAuditNote(currentNote || '');
    setStatusNotification(null);
    setActiveVideoModal({
      row,
      videoUrl,
      driveId,
      ytId,
      isMp4,
      auditStatus: currentAuditStatus,
    });
  };

  // Extract unique provinces for Column B Filter
  const uniqueProvinces = Array.from(
    new Set(
      data.rows
        .map((r) => getVal(r, 'จังหวัด'))
        .filter((p) => p && p !== 'ไม่พบข้อมูล' && p !== '-')
    )
  ).sort((a, b) => a.localeCompare(b, 'th'));

  // Total count of Column V videos
  const totalVideoCount = data.rows.filter((r) => getColVVideoUrl(r) !== '').length;

  // Filter rows based on search, status, province, and viewMode
  const filteredRows = data.rows.filter((row) => {
    const code = getVal(row, 'รหัส');
    const name = getVal(row, 'ชื่อศูนย์');
    const province = getVal(row, 'จังหวัด');
    const adminName = getVal(row, 'ชื่อผู้ดูแล');
    const isSub = checkIsSubmitted(row);
    const auditInfo = getAuditStatusInfo(row);
    const colVVideo = getColVVideoUrl(row);

    // If in VIDEOS view mode, row MUST have a Column V video URL
    if (viewMode === 'VIDEOS' && !colVVideo) {
      return false;
    }

    // Filter by Province (Column B)
    const matchesProvince =
      provinceFilter === 'ALL' || province === provinceFilter;

    // Filter by Search Query
    const matchesSearch =
      !searchQuery.trim() ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adminName.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by Status
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUBMITTED' && isSub) ||
      (statusFilter === 'EMPTY' && !isSub) ||
      (statusFilter === 'PASSED' && auditInfo.type === 'PASSED') ||
      (statusFilter === 'FAILED' && auditInfo.type === 'FAILED') ||
      (statusFilter === 'REVISE' && auditInfo.type === 'REVISE') ||
      (statusFilter === 'PENDING' && isSub && auditInfo.type === 'PENDING');

    return matchesProvince && matchesSearch && matchesStatus;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Auto-reset page when search, filter or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, provinceFilter, viewMode, itemsPerPage]);

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
  // Multi-Image Preview Card with Prev/Next Sliding Navigation
  const MultiImageCard = ({ label, rawUrl }) => {
    const urls = (rawUrl || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http://') || s.startsWith('https://'));

    const [currentIndex, setCurrentIndex] = useState(0);

    if (urls.length === 0) {
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

    const safeIndex = Math.min(Math.max(0, currentIndex), urls.length - 1);
    const currentUrl = urls[safeIndex] || urls[0];
    const driveId = getDriveFileId(currentUrl);
    const imgSrc = driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600` : currentUrl;

    const handleNext = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % urls.length);
    };

    const handlePrev = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
    };

    return (
      <div className="glass-card p-5 rounded-3xl bg-surface-container-high/30 flex flex-col gap-3 border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
          <div className="flex items-center gap-2 truncate">
            <p className="text-sm font-bold text-on-surface truncate">{label}</p>
            {urls.length > 1 && (
              <span className="bg-primary/10 text-primary text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border border-primary/20 shrink-0">
                {safeIndex + 1} / {urls.length}
              </span>
            )}
          </div>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
          >
            <span>เปิดลิงก์รูปนี้</span>
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
        </div>

        <div
          onClick={() =>
            setActiveImagePreview({
              src: imgSrc,
              title: `${label} (รูปที่ ${safeIndex + 1} / ${urls.length})`,
            })
          }
          className="relative w-full h-[170px] sm:h-[190px] rounded-2xl overflow-hidden bg-slate-950/90 border border-outline-variant/20 group flex items-center justify-center cursor-pointer shadow-md select-none"
          title="คลิกเพื่อดูภาพขยายใหญ่เต็มหน้าจอ"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={imgSrc}
            src={imgSrc}
            alt={`${label} ${safeIndex + 1}`}
            className="w-full h-full object-contain rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
            onError={(e) => {
              if (driveId) {
                e.target.onerror = null;
                e.target.src = `https://lh3.googleusercontent.com/d/${driveId}`;
              }
            }}
          />

          {/* Previous Arrow Button */}
          {urls.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
              title="ดูรูปก่อนหน้า"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>
          )}

          {/* Next Arrow Button */}
          {urls.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
              title="ดูรูปถัดไป"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            </button>
          )}

          {/* Dot Indicators */}
          {urls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              {urls.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    safeIndex === idx
                      ? 'bg-emerald-400 w-5'
                      : 'bg-white/40 hover:bg-white/80 w-2'
                  }`}
                  title={`ไปยังรูปที่ ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Hover Zoom Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[1px] pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">fullscreen</span>
            <span>คลิกเพื่อดูเต็มหน้าจอ</span>
          </div>
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

    // Extract first URL for type check
    const firstUrl = url.split(',')[0].trim();
    const driveId = getDriveFileId(firstUrl);
    const ytId = getYouTubeVideoId(firstUrl);
    const isDirectVideo = /\.(mp4|webm|mov)($|\?)/i.test(firstUrl);

    // Embedded Video (YouTube)
    if (ytId) {
      return (
        <div className="glass-card p-5 rounded-3xl bg-surface-container-high/30 flex flex-col gap-3 border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
            <p className="text-sm font-bold text-on-surface truncate">{label}</p>
            <a
              href={firstUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
            >
              <span>เปิดลิงก์ต้นฉบับ</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </a>
          </div>
          <div
            onClick={() =>
              setActiveImagePreview({
                type: 'video_yt',
                src: firstUrl,
                ytId,
                title: label,
              })
            }
            className="relative w-full h-[170px] sm:h-[190px] rounded-2xl overflow-hidden shadow-lg bg-black border border-outline-variant/20 cursor-pointer group flex items-center justify-center"
            title="คลิกเพื่อเล่นวิดีโอเต็มหน้าจอ"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              alt={label}
              className="w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-90"
            />
            <div className="absolute z-10 w-12 h-12 rounded-full bg-rose-600/90 group-hover:bg-rose-600 text-white flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[28px] translate-x-0.5">play_arrow</span>
            </div>
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 text-white font-bold text-xs backdrop-blur-[1px]">
              <span className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-white/20">
                <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                <span>คลิกเพื่อดูเต็มหน้าจอ</span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Direct Video (.mp4 / .webm)
    if (isDirectVideo) {
      return (
        <div className="glass-card p-5 rounded-3xl bg-surface-container-high/30 flex flex-col gap-3 border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
            <p className="text-sm font-bold text-on-surface truncate">{label}</p>
            <a
              href={firstUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
            >
              <span>เปิดลิงก์ต้นฉบับ</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </a>
          </div>
          <div
            onClick={() =>
              setActiveImagePreview({
                type: 'video_mp4',
                src: firstUrl,
                title: label,
              })
            }
            className="relative w-full h-[170px] sm:h-[190px] rounded-2xl overflow-hidden shadow-lg bg-black border border-outline-variant/20 cursor-pointer group flex items-center justify-center"
            title="คลิกเพื่อเล่นวิดีโอเต็มหน้าจอ"
          >
            <video
              src={firstUrl}
              className="w-full h-full object-cover rounded-2xl opacity-70 group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute z-10 w-12 h-12 rounded-full bg-primary/90 group-hover:bg-primary text-on-primary flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[28px] translate-x-0.5">play_arrow</span>
            </div>
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 text-white font-bold text-xs backdrop-blur-[1px]">
              <span className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-white/20">
                <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                <span>คลิกเพื่อดูเต็มหน้าจอ</span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Embedded Google Drive Video or PDF Viewer
    if (driveId && isVideo) {
      return (
        <div className="glass-card p-5 rounded-3xl bg-surface-container-high/30 flex flex-col gap-3 border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
            <p className="text-sm font-bold text-on-surface truncate">{label}</p>
            <a
              href={firstUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
            >
              <span>เปิดลิงก์ต้นฉบับ</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </a>
          </div>
          <div
            onClick={() =>
              setActiveImagePreview({
                type: 'video_drive',
                src: firstUrl,
                driveId,
                title: label,
              })
            }
            className="relative w-full h-[170px] sm:h-[190px] rounded-2xl overflow-hidden shadow-lg bg-slate-900 border border-outline-variant/20 cursor-pointer group flex items-center justify-center"
            title="คลิกเพื่อเล่นวิดีโอเต็มหน้าจอ"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`}
              alt={label}
              className="w-full h-full object-cover rounded-2xl opacity-75 group-hover:opacity-90 transition-opacity"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://lh3.googleusercontent.com/d/${driveId}`;
              }}
            />
            <div className="absolute z-10 w-12 h-12 rounded-full bg-emerald-600/90 group-hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[28px] translate-x-0.5">play_arrow</span>
            </div>
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 text-white font-bold text-xs backdrop-blur-[1px]">
              <span className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-white/20">
                <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                <span>คลิกเพื่อดูเต็มหน้าจอ</span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    // PDF Viewer (Inline Preview Frame)
    if (driveId && isPdf) {
      return (
        <div className="glass-card p-5 rounded-3xl bg-surface-container-high/30 flex flex-col gap-3 border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
            <p className="text-sm font-bold text-on-surface truncate">{label}</p>
            <a
              href={firstUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
            >
              <span>เปิดลิงก์ต้นฉบับ</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </a>
          </div>
          <div className="relative w-full h-[180px] sm:h-[200px] rounded-2xl overflow-hidden shadow-lg bg-slate-900 border border-outline-variant/20">
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              title={label}
              className="w-full h-full border-0"
              allow="autoplay"
            ></iframe>
          </div>
        </div>
      );
    }

    // Standard / Multi-Image Card
    return <MultiImageCard label={label} rawUrl={url} />;
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
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`glass-card p-5 rounded-3xl bg-surface-container-lowest border transition-all cursor-pointer flex items-center gap-4 hover:shadow-md ${
              statusFilter === 'ALL' ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-outline-variant/30'
            }`}
          >
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

          <div
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`glass-card p-5 rounded-3xl bg-surface-container-lowest border transition-all cursor-pointer flex items-center gap-4 hover:shadow-md ${
              statusFilter === 'SUBMITTED' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' : 'border-outline-variant/30'
            }`}
          >
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

          <div
            onClick={() => setStatusFilter('PASSED')}
            className={`glass-card p-5 rounded-3xl bg-surface-container-lowest border transition-all cursor-pointer flex items-center gap-4 hover:shadow-md ${
              statusFilter === 'PASSED' ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-md' : 'border-outline-variant/30'
            }`}
          >
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

          <div
            onClick={() => setStatusFilter('PENDING')}
            className={`glass-card p-5 rounded-3xl bg-surface-container-lowest border transition-all cursor-pointer flex items-center gap-4 hover:shadow-md ${
              statusFilter === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' : 'border-outline-variant/30'
            }`}
          >
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

        {/* Navigation View Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-2 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('REPORTS')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'REPORTS'
                  ? 'bg-primary text-on-primary shadow-md scale-102'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">table_chart</span>
              <span>รายงานผลการจัดกิจกรรมทั้งหมด</span>
              <span className="bg-white/20 text-[11px] px-2 py-0.5 rounded-full font-mono">
                {data.total}
              </span>
            </button>

            <button
              onClick={() => setViewMode('VIDEOS')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'VIDEOS'
                  ? 'bg-rose-600 text-white shadow-md scale-102'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">movie</span>
              <span>วิดีโอ (Digital Thai Thai) Column V</span>
              <span className="bg-white/20 text-[11px] px-2 py-0.5 rounded-full font-mono">
                {totalVideoCount}
              </span>
            </button>
          </div>

          <div className="text-xs font-semibold text-on-surface-variant px-3 py-1 bg-surface-container-high/40 rounded-xl">
            {viewMode === 'VIDEOS' ? `คลังคลิปวิดีโอ (${filteredRows.length} รายการ)` : `ตารางรายงานทั้งหมด (${filteredRows.length} รายการ)`}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-card p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
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

            {/* Province Filter Dropdown (Column B) */}
            <div className="relative w-full sm:w-auto">
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="w-full sm:w-auto bg-surface-container-high/60 border border-outline-variant/40 rounded-2xl px-4 py-2 text-sm text-on-surface font-semibold focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">📍 จังหวัดทั้งหมด ({uniqueProvinces.length} จังหวัด)</option>
                {uniqueProvinces.map((prov) => (
                  <option key={prov} value={prov}>
                    📍 {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-surface-container-high/60 border border-outline-variant/40 rounded-2xl px-4 py-2 text-sm text-on-surface font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="SUBMITTED">เฉพาะศูนย์ที่มีรายงานผลแล้ว</option>
              <option value="EMPTY">เฉพาะศูนย์ยังไม่มีรายงานผล</option>
              <option value="PASSED">🟢 ผ่านการตรวจ</option>
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

        {/* Content Container (Table View vs Video Grid View) */}
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
                {searchQuery ? `ไม่พบข้อมูลที่ตรงกับคำว่า "${searchQuery}"` : 'ยังไม่มีข้อมูลรายงานผลหรือคลิปวิดีโอในหมวดนี้'}
              </p>
            </div>
          ) : viewMode === 'VIDEOS' ? (
            /* Dedicated Video Gallery View */
            <>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedRows.map((row) => {
                    const code = getVal(row, 'รหัส') || '-';
                    const name = getVal(row, 'ชื่อศูนย์') || '-';
                    const province = getVal(row, 'จังหวัด') || '-';
                    const rawAdminName = getVal(row, 'ชื่อผู้ดูแล');
                    const cleanAdminName = (rawAdminName && rawAdminName !== 'ไม่พบข้อมูล' && rawAdminName !== '-') ? rawAdminName : '-';
                    const videoUrl = getColVVideoUrl(row);
                    const ytId = getYouTubeVideoId(videoUrl);
                    const driveId = getDriveFileId(videoUrl);
                    const auditInfo = getAuditStatusInfo(row);
                    const note = getVal(row, 'หมายเหตุตรวจผลงาน');

                    return (
                      <div
                        key={row._id}
                        className="glass-card rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 transition-all shadow-sm hover:shadow-lg overflow-hidden flex flex-col justify-between group"
                      >
                        <div>
                          {/* Video Thumbnail Box */}
                          <div
                            onClick={() => openVideoModal(row)}
                            className="relative w-full h-[200px] bg-slate-900 overflow-hidden cursor-pointer group/vid flex items-center justify-center"
                            title="คลิกเพื่อรับชมคลิปวิดีโอ"
                          >
                            {ytId ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                alt={name}
                                className="w-full h-full object-cover group-hover/vid:scale-105 transition-transform duration-300 opacity-80 group-hover/vid:opacity-90"
                              />
                            ) : driveId ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={`/api/admin/drive-image?id=${driveId}`}
                                alt={name}
                                className="w-full h-full object-cover group-hover/vid:scale-105 transition-transform duration-300 opacity-80 group-hover/vid:opacity-90"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-rose-950 flex flex-col items-center justify-center p-4 text-center">
                                <span className="material-symbols-outlined text-[48px] text-rose-500 mb-1">movie</span>
                                <span className="text-xs font-bold text-white/80 line-clamp-1">{videoUrl}</span>
                              </div>
                            )}

                            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white font-mono font-bold text-xs px-3 py-1 rounded-xl border border-white/20">
                              {code}
                            </div>

                            <div className="absolute top-3 right-3 bg-rose-600/90 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-md">
                              📍 {province}
                            </div>

                            <div className="absolute z-10 w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl backdrop-blur-sm group-hover/vid:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-[32px] translate-x-0.5">play_arrow</span>
                            </div>

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-end justify-center pb-3 text-white font-bold text-xs">
                              <span className="flex items-center gap-1 bg-black/70 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                                <span>คลิกเพื่อรับชมคลิปวิดีโอ</span>
                              </span>
                            </div>
                          </div>

                          {/* Center Info */}
                          <div className="p-5 space-y-3">
                            <div>
                              <h4 className="text-base font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                                {name}
                              </h4>
                              <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">person</span>
                                <span>ผู้ดูแล: {cleanAdminName}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border shadow-xs ${auditInfo.badgeClass}`}>
                                <span className={`w-2 h-2 rounded-full ${auditInfo.dotClass}`}></span>
                                <span>{auditInfo.label}</span>
                              </span>

                              {note && (
                                <span className="text-xs text-on-surface-variant/80 italic truncate max-w-[140px]" title={note}>
                                  📝 {note}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="p-4 bg-surface-container-high/30 border-t border-outline-variant/20">
                          <button
                            onClick={() => openVideoModal(row)}
                            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">play_circle</span>
                            <span>เปิดดูคลิปวิดีโอ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {renderPaginationControls()}
            </>
          ) : (
            /* Standard Data Table View */
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

                      const isSubmitted = checkIsSubmitted(row);
                      const auditInfo = getAuditStatusInfo(row);
                      const metrics = row._mainBeMetrics || {};
                      const count = metrics.traineeCount || getVal(row, 'จำนวนผู้เข้าอบรม') || getVal(row, 'จำนวนผู้อบรม') || '-';

                      return (
                        <tr
                          key={row._id || idx}
                          className="hover:bg-surface-container-high/40 transition-colors group cursor-pointer"
                        >
                          <td className="py-3.5 px-4 text-center text-on-surface-variant font-mono text-xs">
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

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      setGeneratingWord(true);
                      await generateClientWordDoc(selectedRow);
                    } catch (err) {
                      console.error('Word export error:', err);
                      alert('เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร Word: ' + err.message);
                    } finally {
                      setGeneratingWord(false);
                    }
                  }}
                  disabled={generatingWord}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="ดาวน์โหลดรายงาน Word (.docx) ของศูนย์นี้ทันที"
                >
                  <span className={`material-symbols-outlined text-[18px] ${generatingWord ? 'animate-spin' : ''}`}>
                    {generatingWord ? 'refresh' : 'description'}
                  </span>
                  <span>{generatingWord ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลดรายงาน Word (.docx)'}</span>
                </button>

                <button
                  onClick={() => setSelectedRow(null)}
                  className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
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

              <button
                onClick={() => setActiveTab('METRICS')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'METRICS'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">equalizer</span>
                <span>5. สรุปข้อมูลอบรม & ประเมินผล</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

              {/* TAB 5: METRICS / EVALUATION */}
              {activeTab === 'METRICS' && (() => {
                const metrics = selectedRow._mainBeMetrics || {};
                const mTraineeRaw = metrics.traineeCount || getVal(selectedRow, 'จำนวนผู้เข้าอบรม') || getVal(selectedRow, 'จำนวนผู้อบรม');
                const mPreRaw = metrics.preTestCount;
                const mPostRaw = metrics.postTestCount;
                const mSatRaw = metrics.satisfactionCount;

                const mTrainee = (mTraineeRaw && mTraineeRaw !== '#N/A' && mTraineeRaw !== 'ไม่พบข้อมูล' && mTraineeRaw !== '-') ? mTraineeRaw : '-';
                const mPre = (mPreRaw && mPreRaw !== '#N/A' && mPreRaw !== 'ไม่พบข้อมูล' && mPreRaw !== '-') ? mPreRaw : '-';
                const mPost = (mPostRaw && mPostRaw !== '#N/A' && mPostRaw !== 'ไม่พบข้อมูล' && mPostRaw !== '-') ? mPostRaw : '-';
                const mSat = (mSatRaw && mSatRaw !== '#N/A' && mSatRaw !== 'ไม่พบข้อมูล' && mSatRaw !== '-') ? mSatRaw : '-';

                return (
                  <div className="space-y-6">
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm text-center">
                      <p className="text-sm font-bold text-primary uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[24px]">equalizer</span>
                        <span>สรุปข้อมูลการอบรม & การประเมินผล</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. จำนวนผู้อบรม */}
                        <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
                          <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-700 dark:text-emerald-300 mb-3">
                            <span className="material-symbols-outlined text-[26px]">groups</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">จำนวนผู้อบรม</span>
                          <span className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 font-mono mt-1 mb-0.5">
                            {mTrainee}
                          </span>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">ท่าน</span>
                        </div>

                        {/* 2. Pre-Test */}
                        <div className="bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
                          <div className="bg-sky-500/20 p-3 rounded-full text-sky-700 dark:text-sky-300 mb-3">
                            <span className="material-symbols-outlined text-[26px]">quiz</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-sky-900 dark:text-sky-300">Pre-Test</span>
                          <span className="text-3xl font-extrabold text-sky-950 dark:text-sky-100 font-mono mt-1 mb-0.5">
                            {mPre}
                          </span>
                          <span className="text-xs text-sky-700 dark:text-sky-400 font-medium">ชุด</span>
                        </div>

                        {/* 3. Post-Test */}
                        <div className="bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
                          <div className="bg-indigo-500/20 p-3 rounded-full text-indigo-700 dark:text-indigo-300 mb-3">
                            <span className="material-symbols-outlined text-[26px]">assignment_turned_in</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-300">Post-Test</span>
                          <span className="text-3xl font-extrabold text-indigo-950 dark:text-indigo-100 font-mono mt-1 mb-0.5">
                            {mPost}
                          </span>
                          <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">ชุด</span>
                        </div>

                        {/* 4. ความพึงพอใจ */}
                        <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
                          <div className="bg-amber-500/20 p-3 rounded-full text-amber-700 dark:text-amber-300 mb-3">
                            <span className="material-symbols-outlined text-[26px]">sentiment_satisfied</span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">ความพึงพอใจ</span>
                          <span className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 font-mono mt-1 mb-0.5">
                            {mSat}
                          </span>
                          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">ชุด</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

      {/* Fullscreen Lightbox Media & Video Modal */}
      {activeImagePreview && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setActiveImagePreview(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-2 text-white">
              <div className="flex items-center gap-2 truncate max-w-xl">
                <span className="material-symbols-outlined text-[24px]">
                  {activeImagePreview.type?.startsWith('video') ? 'play_circle' : 'image'}
                </span>
                <h4 className="text-base sm:text-lg font-bold truncate">
                  {activeImagePreview.title}
                </h4>
              </div>
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

            <div className="relative w-full max-h-[82vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black/90">
              {activeImagePreview.type === 'video_yt' ? (
                <div className="w-full aspect-video max-h-[80vh]">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeImagePreview.ytId}?autoplay=1`}
                    title={activeImagePreview.title}
                    className="w-full h-full border-0 rounded-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : activeImagePreview.type === 'video_mp4' ? (
                <video
                  src={activeImagePreview.src}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] aspect-video object-contain rounded-2xl bg-black"
                ></video>
              ) : activeImagePreview.type === 'video_drive' ? (
                <div className="w-full h-[78vh] rounded-2xl overflow-hidden bg-slate-900">
                  <iframe
                    src={`https://drive.google.com/file/d/${activeImagePreview.driveId}/preview`}
                    title={activeImagePreview.title}
                    className="w-full h-full border-0 rounded-2xl"
                    allow="autoplay"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeImagePreview.src}
                  alt={activeImagePreview.title}
                  className="max-h-[80vh] max-w-full object-contain rounded-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Video Popup & Quick Audit Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="bg-surface-container-lowest dark:bg-surface-container-lowest border border-outline-variant/30 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-outline-variant/30 flex items-start justify-between gap-4 bg-surface-container-high/30">
              <div className="flex items-center gap-3">
                <div className="bg-rose-600/10 p-3 rounded-2xl text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <span className="material-symbols-outlined text-[28px]">movie</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-primary/10 text-primary text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border border-primary/20">
                      {getVal(activeVideoModal.row, 'รหัส')}
                    </span>
                    <span className="bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                      📍 {getVal(activeVideoModal.row, 'จังหวัด')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mt-1">
                    {getVal(activeVideoModal.row, 'ชื่อศูนย์')}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveVideoModal(null)}
                className="bg-surface-container-high hover:bg-surface-container-highest p-2 rounded-full text-on-surface-variant transition-all shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body: Video Player + Audit Panel */}
            <div className="p-5 sm:p-6 space-y-6">
              {/* Status Notification */}
              {statusNotification && (
                <div
                  className={`p-4 rounded-2xl text-sm font-bold flex items-center justify-between gap-3 shadow-sm ${
                    statusNotification.type === 'success'
                      ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                      : 'bg-rose-100 text-rose-950 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60'
                  }`}
                >
                  <span>{statusNotification.message}</span>
                  <button onClick={() => setStatusNotification(null)}>
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {/* Video Player Container */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-rose-600">play_circle</span>
                    <span>วิดีโอ (Digital Thai Thai) Column V</span>
                  </p>
                  <a
                    href={activeVideoModal.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all hover:bg-primary/20"
                  >
                    <span>เปิดลิงก์ต้นฉบับ</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>

                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black border border-outline-variant/30">
                  {activeVideoModal.ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${activeVideoModal.ytId}?autoplay=1`}
                      title="YouTube Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : activeVideoModal.isMp4 ? (
                    <video
                      src={activeVideoModal.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    ></video>
                  ) : activeVideoModal.driveId ? (
                    <video
                      src={`/api/admin/drive-image?id=${activeVideoModal.driveId}`}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                      onError={(e) => {
                        // Fallback to Google Drive Preview iframe if direct stream is unsupported
                        e.currentTarget.style.display = 'none';
                        const fallbackIframe = document.getElementById(`drive-fallback-${activeVideoModal.driveId}`);
                        if (fallbackIframe) fallbackIframe.style.display = 'block';
                      }}
                    ></video>
                  ) : (
                    <iframe
                      src={activeVideoModal.videoUrl}
                      title="Video Preview"
                      className="w-full h-full border-0"
                      allow="autoplay"
                    ></iframe>
                  )}
                  {activeVideoModal.driveId && (
                    <iframe
                      id={`drive-fallback-${activeVideoModal.driveId}`}
                      src={`https://drive.google.com/file/d/${activeVideoModal.driveId}/preview`}
                      title="Google Drive Video Fallback"
                      className="w-full h-full border-0 hidden"
                      allow="autoplay"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-outline-variant/30 bg-surface-container-high/30 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedRow(activeVideoModal.row);
                  setActiveVideoModal(null);
                }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">article</span>
                <span>เปิดดูรายงานฉบับเต็ม</span>
              </button>

              <button
                onClick={() => setActiveVideoModal(null)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
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
