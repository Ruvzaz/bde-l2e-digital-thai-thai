"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// วางลิงก์ Google Form ของคุณที่นี่ 👇
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfnb_lfCQB87XVmLcqkdEprON7QNem1-4x_rhVFA0EcVxdB2Q/viewform?usp=dialog";

export default function Home() {
  const [applicantCount, setApplicantCount] = useState(null);
  const [reserveCount, setReserveCount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Schedule Popup State
  const [selectedScheduleImg, setSelectedScheduleImg] = useState(null);

  // Mobile Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Center Search State
  const [centers, setCenters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCenters, setLoadingCenters] = useState(false);

  // Status Check State
  const [statusSearchKey, setStatusSearchKey] = useState("");
  const [statusResult, setStatusResult] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (!statusSearchKey.trim()) return;

    setCheckingStatus(true);
    setStatusResult(null);
    try {
      const res = await fetch("/api/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchKey: statusSearchKey })
      });
      const data = await res.json();
      setStatusResult(data);
    } catch (error) {
      console.error("Error checking status:", error);
      setStatusResult({ error: true });
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    async function fetchApplicants() {
      try {
        const res = await fetch("/api/applicants", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setApplicantCount(data.count);
          setReserveCount(data.reserveCount);
        }
      } catch (error) {
        console.error("Failed to fetch applicants:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCenters() {
      setLoadingCenters(true);
      try {
        const res = await fetch("/api/centers");
        if (res.ok) {
          const data = await res.json();
          if (data.centers) {
            setCenters(data.centers);
          }
        }
      } catch (error) {
        console.error("Failed to fetch centers:", error);
      } finally {
        setLoadingCenters(false);
      }
    }

    fetchApplicants();
    fetchCenters();
  }, []);

  const filteredCenters = centers.filter(center => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (
      (center.code && center.code.toLowerCase().includes(query)) ||
      (center.name && center.name.toLowerCase().includes(query)) ||
      (center.province && center.province.toLowerCase().includes(query))
    );
  });

  return (
    <main className="flex-grow">
      {/* Top Navigation */}
      <nav className="bg-surface/90 dark:bg-surface-dim/90 backdrop-blur-xl docked full-width top-0 sticky border-b border-outline-variant/30 shadow-sm z-50">
        <div className="flex justify-between items-center w-full px-gutter py-sm max-w-container-max mx-auto relative">
          <div className="flex items-center gap-md">
            <Link href="#" className="flex items-center gap-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ICON Home.png" alt="Digital Thai Thai Logo" className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
              <span className="font-headline-md text-headline-md font-bold bg-gradient-to-r from-[#2f6b8f] via-[#90c759] to-[#dde14a] bg-[length:200%_auto] animate-gradient text-transparent bg-clip-text">
                Digital Thai Thai
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex gap-lg items-center">
            <Link href="#schedule" className="group relative text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md py-1">
              กำหนดการ
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>
            <Link href="#applicants" className="group relative text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md py-1">
              จำนวนผู้สมัคร
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>
            <Link href="#check-status" className="group relative text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md py-1">
              เช็คสถานะ
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>
            <Link href="#register" className="group relative text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md py-1">
              ช่องทางการสมัคร
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>
          </div>
          <Link href="#register" className="hidden lg:flex bg-primary text-on-primary px-lg py-sm rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-sm items-center gap-2">
            สมัครเข้าร่วมกิจกรรม
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </Link>

          {/* Mobile Toggle Button */}
          <button
            className="lg:hidden flex items-center text-primary p-2 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="material-symbols-outlined text-[32px]">
              {isMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`lg:hidden absolute top-full left-0 w-full bg-surface-container-lowest border-b border-outline-variant/30 shadow-lg transition-all duration-300 overflow-hidden ${isMenuOpen ? "max-h-[500px] py-6 opacity-100" : "max-h-0 py-0 opacity-0"} flex flex-col items-center gap-4`}>
          <Link href="#schedule" onClick={() => setIsMenuOpen(false)} className="text-on-surface-variant hover:text-primary font-headline-md text-[18px] w-full text-center py-2">กำหนดการ</Link>
          <Link href="#applicants" onClick={() => setIsMenuOpen(false)} className="text-on-surface-variant hover:text-primary font-headline-md text-[18px] w-full text-center py-2">จำนวนผู้สมัคร</Link>
          <Link href="#check-status" onClick={() => setIsMenuOpen(false)} className="text-on-surface-variant hover:text-primary font-headline-md text-[18px] w-full text-center py-2">เช็คสถานะ</Link>
          <Link href="#register" onClick={() => setIsMenuOpen(false)} className="text-on-surface-variant hover:text-primary font-headline-md text-[18px] w-full text-center py-2">ช่องทางการสมัคร</Link>

          <Link href="#register" onClick={() => setIsMenuOpen(false)} className="bg-primary text-on-primary px-lg py-3 mt-2 rounded-full font-headline-md text-[18px] hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm flex items-center gap-2">
            สมัครเข้าร่วมกิจกรรม
            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient relative py-xl px-gutter w-full min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-xl items-center w-full">
          <div className="z-10 flex flex-col gap-md order-2 md:order-1">
            <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface">
              <span className="bg-gradient-to-r from-[#2f6b8f] via-[#90c759] to-[#dde14a] bg-[length:200%_auto] animate-gradient text-transparent bg-clip-text block mb-2 pb-1">Digital Thai Thai</span>
              เทคโนโลยีล้ำสมัย<br></br>
              สะท้อนอัตลักษณ์ไทย<br></br>
              ไปกับศูนย์ดิจิทัลชุมชน
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant border-l-4 border-tertiary-fixed-dim pl-sm">
              โครงการพัฒนาแพลตฟอร์มภาครัฐเพื่อรองรับการพัฒนาทักษะดิจิทัล<br></br>
              เรียนรู้มีรายได้เรียนรู้ง่ายตลอดชีวิต ผ่านรูปแบบ Learn to Earn
            </p>
            <div className="mt-sm flex justify-center md:justify-start">
              <Link href="#register" className="inline-flex items-center gap-2 bg-primary text-on-primary px-lg py-sm rounded-full font-headline-md text-[20px] hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md hover:shadow-lg">
                สมัครเลยตอนนี้
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="relative z-10 flex justify-center order-1 md:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full max-w-[600px] h-auto object-contain animate-[float_6s_ease-in-out_infinite] scale-110 md:scale-150" alt="BDE-LEARNTOEARN IMG" src="/BDE-LEARNTOEARN IMG.png" />
          </div>
        </div>
        {/* Decorative Elements - Background image removed to fix Next.js build error */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-transparent bg-cover bg-center"></div>
      </section>

      {/* Timeline Section */}
      <section id="schedule" className="py-xl px-gutter max-w-container-max mx-auto w-full">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            กำหนดการ
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {/* Session 1 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-pointer"
            onClick={() => setSelectedScheduleImg("/schedule-1.png")}
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 1</span>
              <span className="text-primary font-bold font-label-sm text-right whitespace-nowrap">ภาคกลาง</span>
            </div>
            <div className="z-10 mt-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">3 ส.ค. 2569</h3>
              <p className="text-on-surface-variant flex items-center gap-1 mt-1 font-body-md">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                ภาคกลาง
              </p>
            </div>
          </div>
          {/* Session 2 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-pointer"
            onClick={() => setSelectedScheduleImg("/schedule-2.png")}
          >
            <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 2</span>
              <span className="text-secondary font-bold font-label-sm text-right whitespace-nowrap">ภาคเหนือ</span>
            </div>
            <div className="z-10 mt-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">5 ส.ค. 2569</h3>
              <p className="text-on-surface-variant flex items-center gap-1 mt-1 font-body-md">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                ภาคเหนือ
              </p>
            </div>
          </div>
          {/* Session 3 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-pointer"
            onClick={() => setSelectedScheduleImg("/schedule-3.png")}
          >
            <div className="absolute inset-0 bg-tertiary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 3</span>
              <span className="text-tertiary font-bold font-label-sm text-right whitespace-nowrap">ภาคตะวันออกเฉียงเหนือ</span>
            </div>
            <div className="z-10 mt-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">10 ส.ค. 2569</h3>
              <p className="text-on-surface-variant flex items-center gap-1 mt-1 font-body-md">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                อีสาน
              </p>
            </div>
          </div>
          {/* Session 4 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-pointer"
            onClick={() => setSelectedScheduleImg("/schedule-4.png")}
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 4</span>
              <span className="text-primary font-bold font-label-sm text-right whitespace-nowrap">ภาคใต้</span>
            </div>
            <div className="z-10 mt-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">14 ส.ค. 2569</h3>
              <p className="text-on-surface-variant flex items-center gap-1 mt-1 font-body-md">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                ภาคใต้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning & Topics Grid */}
      <section id="curriculum" className="bg-surface-container py-xl px-gutter">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-xl">
          {/* Modules */}
          <div>
            <div className="flex items-center gap-3 mb-md">
              <div className="bg-primary p-2 rounded-lg text-on-primary">
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">เรียนรู้อะไร?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high p-3 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">ปั้นสื่อผสม AI</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high p-3 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">การถ่ายภาพและวิดีโอ</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high p-3 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>movie_edit</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">เทคนิคการตัดต่อ</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high p-3 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">ศิลปะการเล่าเรื่อง</span>
              </div>
            </div>
          </div>
          {/* Topics */}
          <div id="topics">
            <div className="flex items-center gap-3 mb-md">
              <div className="bg-tertiary-fixed-dim p-2 rounded-lg text-on-tertiary-container">
                <span className="material-symbols-outlined">emoji_events</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">โจทย์ประกวด</h2>
            </div>
            <div className="flex flex-col gap-md">
              <div className="glass-card p-md rounded-xl flex items-center gap-4 border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-default">
                <div className="text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 p-2 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_cafe</span>
                </div>
                <span className="font-headline-md text-[20px] text-on-surface">ของดีที่ถูกลืม</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-default">
                <div className="text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 p-2 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                </div>
                <span className="font-headline-md text-[20px] text-on-surface">1 วันในบ้าน</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-default">
                <div className="text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 p-2 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                </div>
                <span className="font-headline-md text-[20px] text-on-surface">วัยเก๋าเล่าเรื่อง</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Applicants Count Section */}
      <section id="applicants" className="py-xl px-gutter max-w-container-max mx-auto w-full">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            จำนวนผู้สมัคร
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Applicants Card */}
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-primary shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-surface-container-lowest cursor-default">
            <div className="bg-primary/10 p-4 rounded-full text-primary mb-sm">
              <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">จำนวนศูนย์ที่ได้รับคัดเลือก</h3>
            <p className="font-headline-xl text-primary text-[48px] font-bold tabular-nums">
              {loading ? (
                <span className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
              ) : (
                applicantCount !== null ? applicantCount : '--'
              )}
            </p>
            <p className="text-on-surface-variant font-body-md mt-2 flex items-center gap-2">
              ผู้เข้าร่วมกิจกรรม
              {!loading && <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>}
            </p>
          </div>
          {/* Waitlist Card */}
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-tertiary-fixed-dim shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-surface-container-lowest cursor-default">
            <div className="bg-tertiary-fixed-dim/10 p-4 rounded-full text-tertiary-fixed-dim mb-sm">
              <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">จำนวนศูนย์ที่ได้รับคัดเลือก (สำรอง)</h3>
            <p className="font-headline-xl text-tertiary-fixed-dim text-[48px] font-bold">
              {loading ? (
                <span className="inline-block w-8 h-8 border-4 border-tertiary-fixed-dim border-t-transparent rounded-full animate-spin"></span>
              ) : (
                reserveCount !== null ? reserveCount : '--'
              )}
            </p>
            <p className="text-on-surface-variant font-body-md mt-2">รายชื่อสำรอง</p>
          </div>
        </div>
      </section>

      {/* Check Status Section */}
      <section id="check-status" className="py-xl px-gutter max-w-container-max mx-auto w-full scroll-mt-24">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            ตรวจสอบสถานะผู้สมัคร
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
          <p className="text-on-surface-variant font-body-lg mt-4 max-w-1xl mx-auto">
            กรุณากรอก ชื่อ-นามสกุล, อีเมล หรือ เบอร์โทรศัพท์ ที่ใช้ในการสมัครให้ถูกต้องครบถ้วน เพื่อตรวจสอบสถานะ
          </p>
        </div>

        <div className="max-w-full mx-auto bg-surface-container-lowest p-lg rounded-3xl shadow-sm border border-outline-variant/30 text-center">
          <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-sm items-center justify-center">
            <input
              type="text"
              placeholder="กรอกชื่อ-นามสกุล, อีเมล หรือ เบอร์โทร..."
              value={statusSearchKey}
              onChange={(e) => setStatusSearchKey(e.target.value)}
              required
              className="w-full sm:flex-1 bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/60 rounded-full py-3 px-6 font-body-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
            />
            <button
              type="submit"
              disabled={checkingStatus || !statusSearchKey.trim()}
              className="w-full sm:w-auto bg-primary text-on-primary px-lg py-3 rounded-full font-headline-md text-[18px] hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {checkingStatus ? (
                <span className="inline-block w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">manage_search</span>
              )}
              ตรวจสอบ
            </button>
          </form>

          {/* Status Result Display */}
          {statusResult && (
            <div className={`mt-lg p-lg rounded-2xl border-l-4 animate-[fadeIn_0.3s_ease-out] ${statusResult.error ? 'bg-error-container text-on-error-container border-l-error' :
              !statusResult.found ? 'bg-surface-container-highest text-on-surface-variant border-l-outline' :
                statusResult.data?.status?.includes('สำรอง') ? 'bg-tertiary-fixed text-on-tertiary-container border-l-tertiary-fixed-dim' :
                  'bg-primary/10 text-primary border-l-primary'
              }`}>
              {statusResult.error ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[48px] opacity-70">error</span>
                  <p className="font-headline-md">เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง</p>
                </div>
              ) : !statusResult.found ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[48px] opacity-70">person_off</span>
                  <p className="font-headline-md">ไม่พบข้อมูลผู้สมัคร</p>
                  <p className="font-body-md opacity-80 mt-1">โปรดตรวจสอบว่าพิมพ์ ชื่อ-นามสกุล, อีเมล หรือ เบอร์โทรศัพท์ ถูกต้อง 100%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {statusResult.data.status.includes('สำรอง') ? 'hourglass_empty' : 'verified'}
                  </span>
                  <p className="font-body-lg text-on-surface-variant mb-1">
                    พบข้อมูลของคุณ: <span className="font-bold">{statusResult.data.name}</span>
                  </p>
                  <p className="font-headline-xl text-[36px] font-bold">
                    {statusResult.data.status}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>



      {/* Center Search Section */}
      <section id="centers" className="py-xl px-gutter max-w-container-max mx-auto w-full scroll-mt-24">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            ค้นหาข้อมูลศูนย์ดิจิทัลชุมชน
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-secondary rounded-full"></div>
          </h2>
          <p className="text-on-surface-variant font-body-lg mt-4 max-w-2xl mx-auto">
            ค้นหาด้วย รหัสศูนย์ ชื่อศูนย์ หรือ จังหวัด เพื่อใช้เป็นข้อมูลในการกรอกใบสมัคร
          </p>
        </div>

        <div className="max-w-full mx-auto bg-surface-container-lowest p-lg rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="relative mb-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="พิมพ์ชื่อศูนย์, รหัส หรือจังหวัด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/60 rounded-full py-3 pl-12 pr-4 font-body-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="bg-surface-container rounded-xl overflow-hidden min-h-[100px]">
            {loadingCenters ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <span className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                <p>กำลังโหลดข้อมูลศูนย์...</p>
              </div>
            ) : searchQuery.trim() === "" ? (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] opacity-50 mb-2">manage_search</span>
                <p>พิมพ์คำค้นหาเพื่อดูรายชื่อศูนย์</p>
              </div>
            ) : filteredCenters.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-high sticky top-0">
                    <tr>
                      <th className="p-3 font-headline-md text-on-surface border-b border-outline-variant/30 whitespace-nowrap">รหัส</th>
                      <th className="p-3 font-headline-md text-on-surface border-b border-outline-variant/30 whitespace-nowrap">จังหวัด</th>
                      <th className="p-3 font-headline-md text-on-surface border-b border-outline-variant/30 whitespace-nowrap">ชื่อศูนย์</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCenters.slice(0, 50).map((center, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-highest transition-colors border-b border-outline-variant/10 last:border-0">
                        <td className="p-3 font-body-md text-primary font-bold">{center.code}</td>
                        <td className="p-3 font-body-md text-on-surface-variant">{center.province}</td>
                        <td className="p-3 font-body-md text-on-surface">{center.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCenters.length > 50 && (
                  <div className="p-3 text-center text-label-sm text-on-surface-variant bg-surface-container-high/50">
                    แสดงผล 50 รายการแรกจากทั้งหมด {filteredCenters.length} รายการ (โปรดพิมพ์คำค้นหาให้ชัดเจนขึ้น)
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-error/50 mb-2">search_off</span>
                <p>ไม่พบข้อมูลศูนย์ที่ตรงกับ <b>"{searchQuery}"</b></p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA / Registration */}
      <section id="register" className="py-xl px-gutter max-w-container-max mx-auto w-full">
        <div className="bg-primary rounded-3xl p-lg md:p-xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-xl">
          {/* BG Pattern - URL removed to avoid Next.js build error */}
          <div className="absolute inset-0 z-0 opacity-10 bg-transparent bg-cover"></div>
          <div className="z-10 text-on-primary max-w-[500px] flex flex-col gap-md">
            <h2 className="font-headline-xl text-headline-xl text-on-primary">ช่องทางการสมัคร</h2>
            <p className="font-body-lg text-body-lg text-on-primary opacity-90">สแกน QR Code หรือคลิกปุ่มด้านล่างเพื่อลงทะเบียนเข้าร่วมโครงการ</p>
            <div className="flex items-center gap-3 mt-2 bg-on-primary/10 w-fit p-md rounded-lg border border-on-primary/20 backdrop-blur-sm">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[32px]">calendar_month</span>
              <div>
                <p className="text-sm opacity-80 text-on-primary">ตั้งแต่วันนี้ถึง</p>
                <p className="font-bold text-xl text-tertiary-fixed-dim">24 กรกฎาคม 2569</p>
              </div>
            </div>
            <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer" className="mt-2 bg-tertiary-fixed-dim text-on-tertiary-container px-lg py-sm rounded-full font-headline-md text-[20px] hover:bg-tertiary-fixed transition-all w-fit shadow-md flex items-center gap-2">
              ลงทะเบียนเลย <span className="material-symbols-outlined">open_in_new</span>
            </a>
          </div>
          <div className="z-10 bg-surface-container-lowest p-md rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-[300px] h-[300px] object-cover rounded-lg border border-outline-variant/30" alt="QR Code" src="/register_qr.png" />
            <p className="text-center text-primary font-bold mt-3 font-body-md">Scan to Register</p>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-surface-container-lowest full-width relative border-t border-outline-variant/30 mt-xl">
        <div className="px-gutter py-xl max-w-container-max mx-auto w-full flex flex-col gap-xl md:flex-row md:justify-between md:items-start">
          <div className="flex flex-col gap-4 max-w-[550px]">
            <span className="font-headline-sm text-headline-sm font-black text-primary">
              สำนักงานคณะกรรมการดิจิทัลเพื่อเศรษฐกิจและสังคมแห่งชาติ
            </span>
            <p className="text-on-surface-variant font-body-sm leading-relaxed">
              เลขที่ 120 หมู่ 3 ชั้น 3 และ 5 ศูนย์ราชการฯ แจ้งวัฒนะ (อาคาร ซี) <br />
              ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพฯ 10210 <br />

            </p>
            <p className="text-on-surface-variant font-body-sm leading-relaxed -mt-2">
              <b>โทร 080 0727072 </b>
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-3">
            <span className="font-headline-sm text-headline-sm font-black bg-gradient-to-r from-[#2f6b8f] via-[#90c759] to-[#dde14a] bg-[length:200%_auto] animate-gradient text-transparent bg-clip-text pb-1">
              Digital Thai Thai

            </span>
            <p className="text-on-surface-variant font-body-sm mb-2 -mt-4 text-right">
              โครงการพัฒนาแพลตฟอร์มภาครัฐเพื่อรองรับการพัฒนาทักษะดิจิทัล<br></br>
              เรียนรู้มีรายได้เรียนรู้ง่ายตลอดชีวิต ผ่านรูปแบบ Learn to Earn
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <span className="font-label-sm text-label-sm text-on-surface hidden md:block">ติดตามเรา:</span>
              <Link href="https://www.facebook.com" className="text-on-surface-variant hover:text-primary transition-all font-body-md flex items-center gap-1">Facebook</Link>
              <Link href="https://www.line.me/th/" className="text-on-surface-variant hover:text-primary transition-all font-body-md flex items-center gap-1">Line Official</Link>
              <Link href="https://www.youtube.com" className="text-on-surface-variant hover:text-primary transition-all font-body-md flex items-center gap-1">YouTube</Link>
            </div>
            <p className="text-on-surface-variant font-label-sm text-label-sm -mt-3">
              © 2026 Digital Thai Thai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      {/* Schedule Popup Modal */}
      {selectedScheduleImg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedScheduleImg(null)}
        >
          <div
            className="relative max-w-4xl w-full flex flex-col items-center justify-center animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-12 right-0 text-white hover:text-primary transition-colors bg-black/50 rounded-full p-2 flex items-center justify-center"
              onClick={() => setSelectedScheduleImg(null)}
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedScheduleImg}
              alt="Schedule Detail"
              className="w-full h-auto object-contain rounded-xl shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 80px)' }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
