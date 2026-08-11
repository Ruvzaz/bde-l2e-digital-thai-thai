"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// วางลิงก์ Google Form ของคุณที่นี่ 👇
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfnb_lfCQB87XVmLcqkdEprON7QNem1-4x_rhVFA0EcVxdB2Q/viewform?usp=dialog";

// ลิงก์สำหรับเมนูดรอปดาวน์ "รายงานผล" 👇
const REPORT_ACTIVITY_URL = "https://forms.gle/L6wBEVgQcLBMGxh18"; // ลิงก์รายงานผลการจัดกิจกรรม
const CONTEST_MEDIA_URL = "https://forms.gle/U8jrmGeXMS5oRqEq7"; // ลิงก์แบบฟอร์มประกวดสื่อสร้างสรรค์ (ลุ้นรางวัล)
const DAILY_ACTIVITY_URL = "https://forms.gle/mxyKsMtcbhUVAVbk7"; // ลิงก์แบบฟอร์มส่งผลงานเล่นกิจกรรม (ระหว่างวัน)
const DOCUMENTS_URL = "https://drive.google.com/drive/folders/1VaslNzay-6-0fn8rfFmbHxx0vpEWh1a4"; // ลิงก์รวมเอกสาร

const FAQ_DATA = [
  {
    category: "1. การสมัครและคุณสมบัติศูนย์",
    items: [
      {
        q: "ศูนย์ทุกแห่งต้องเข้าร่วมอบรมหรือไม่?",
        a: "โครงการส่งหนังสือเชิญไปทั้งหมด 2,222 ศูนย์ แต่รับเฉพาะศูนย์ที่ \"มีความพร้อม\" จำนวน 1,722 ศูนย์เท่านั้น (สมัครก่อนได้สิทธิ์ก่อน) ศูนย์ที่ไม่สะดวกสามารถไม่เข้าร่วมได้ และไม่จำเป็นต้องลงทะเบียน"
      },
      {
        q: "\"ศูนย์ที่มีความพร้อม\" หมายถึงอะไร?",
        a: "คือศูนย์ที่สามารถ (1) จัดหาผู้เข้าอบรมได้ไม่น้อยกว่า 10 คน (2) จัดหาอาหารกลางวัน อาหารว่างและเครื่องดื่ม และ (3) อำนวยความสะดวกระหว่างการอบรมได้"
      },
      {
        q: "ศูนย์ที่มีเฉพาะผู้ดูแลศูนย์ ไม่มีผู้เข้าร่วมอบรมคนอื่น เข้าร่วมได้ไหม?",
        a: "ไม่ได้ เพราะโครงการกำหนดให้ศูนย์ต้องเป็นทั้งผู้จัดอบรมและมีผู้เข้าร่วมอบรมด้วย"
      },
      {
        q: "ลงทะเบียนได้ถึงวันไหน?",
        a: "ลงทะเบียนและส่งแผนได้ถึงวันที่ 31 กรกฎาคม 2569"
      },
      {
        q: "ถ้าหาผู้เข้าอบรมไม่ครบ 10 คน หรือหาไม่ได้เลย ต้องทำอย่างไร?",
        a: "หากหาคนไม่ครบ 10 คน จะไม่ได้รับงบสนับสนุน และหากหาผู้เข้าอบรมไม่ได้เลย ไม่ต้องลงทะเบียนเข้าร่วมกิจกรรม"
      }
    ]
  },
  {
    category: "2. รายชื่อผู้เข้าอบรม",
    items: [
      {
        q: "ต้องส่งรายชื่อผู้เข้าอบรมกี่คน และนับรวมผู้ดูแลศูนย์หรือไม่?",
        a: "ต้องส่งรายชื่อผู้เข้าอบรม 10 คน ไม่รวม ผู้ดูแลศูนย์"
      },
      {
        q: "ผู้เข้าอบรมต้องเป็นประชาชนทั่วไปเท่านั้นหรือใช้นักเรียนได้?",
        a: "เปิดกว้าง ใช้ได้ทั้งนักเรียน ครู หรือประชาชนทั่วไป"
      },
      {
        q: "นักเรียนที่ไม่มีโทรศัพท์ หรือไม่มีบัตรประชาชน เข้าร่วมได้ไหม?",
        a: "ได้ ไม่มีเบอร์โทรศัพท์หรือบัตรประชาชนสามารถข้ามข้อมูลนี้ไปได้ (ไม่บังคับ)"
      },
      {
        q: "วันอบรมจริง สามารถเปลี่ยนตัวผู้เข้าอบรมจากรายชื่อที่ส่งไปได้ไหม?",
        a: "ได้ สามารถเปลี่ยนแปลงตามข้อมูลจริงหน้างานได้ และให้ส่งใบลงชื่อ (เซ็นชื่อจริง) ตามที่เข้าร่วมจริงภายหลัง"
      },
      {
        q: "หากมีผู้เข้าอบรมมากกว่า 10 คน ต้องทำอย่างไร?",
        a: "เซ็นชื่อผู้เข้าอบรมได้ตามจริงทุกคน แต่งบประมาณและเกียรติบัตรฉบับจริงคำนวณที่ 10 คน"
      }
    ]
  },
  {
    category: "3. เอกสารการเบิกจ่ายเงิน (ใบสำคัญรับเงิน)",
    items: [
      {
        q: "งบสนับสนุนค่าอาหารเท่าไหร่?",
        a: "1,500 บาท (อาหารกลางวัน 1 มื้อ + อาหารว่างและเครื่องดื่ม 2 มื้อ) สำหรับผู้เข้าอบรมไม่น้อยกว่า 10 คน"
      },
      {
        q: "ศูนย์ที่ส่งใบสำคัญรับเงินอัตรา 1,200 บาทไปแล้ว ต้องส่งใหม่ไหม?",
        a: "ไม่บังคับต้องอัปโหลดแผนใหม่ (ระบบอนุมัติแผนไปแล้ว) แต่ขอความร่วมมือให้จัดทำใบสำคัญรับเงินฉบับจริงในอัตราใหม่ 1,500 บาท พร้อมสำเนาบัตรประชาชน เพื่อนำส่งพร้อมใบลงชื่อผู้เข้าอบรมหลังการอบรมเสร็จสิ้น"
      },
      {
        q: "ผู้รับเงินตามใบสำคัญรับเงินต้องเป็นใคร?",
        a: "เป็น ผู้ดูแลศูนย์เพียงท่านเดียว ไม่ใช่บัญชีโรงเรียน (เพื่อความสะดวกในการบริหารจัดการ)"
      },
      {
        q: "สำเนาบัตรประชาชนที่ต้องแนบ เป็นของใคร?",
        a: "เป็นสำเนาบัตรประชาชนของ ผู้ดูแลศูนย์ ผู้เบิกเงินเท่านั้น ไม่ใช่ของผู้เข้าอบรม"
      },
      {
        q: "ใบสำคัญรับเงินให้ลงวันที่เท่าไหร่?",
        a: "ให้ลงวันที่ตรงกับวันจัดอบรมของภาคนั้น ๆ (เช่น ภาคตะวันออกเฉียงเหนือ ลงวันที่ 11 สิงหาคม 2569)"
      },
      {
        q: "เอกสารฉบับจริงต้องส่งเมื่อไหร่?",
        a: "ส่งฉบับจริงพร้อมใบลงชื่อผู้เข้าอบรม ภายหลัง การอบรมและการรายงานผลเสร็จสิ้น (ตอนส่งแผนแนบเป็นไฟล์ในระบบก่อน)"
      },
      {
        q: "ลืมแนบสำเนาบัตรประชาชนตอนส่งแผน ทำอย่างไร?",
        a: "แผนจะไม่ได้รับการอนุมัติ ต้องส่งเอกสารมาใหม่ให้ครบถ้วน"
      }
    ]
  },
  {
    category: "4. วันและรูปแบบการอบรม",
    items: [
      {
        q: "อบรมแต่ละภาควันไหน?",
        a: "ภาคตะวันออกเฉียงเหนือ อบรมวันที่ 11 สิงหาคม 2569\nภาคกลาง วันที่ 10 สิงหาคม 2569\nภาคเหนือ วันที่ 3 สิงหาคม 2569\nภาคใต้ วันที่ 14 สิงหาคม 2569 (อบรม 1 วันเต็ม) ควรยึดตามหนังสือแจ้งจาก สดช. เป็นหลัก"
      },
      {
        q: "หัวข้ออบรมแต่ละศูนย์ต้องเตรียมเองหรือไม่?",
        a: "หัวข้ออบรมเป็นหัวข้อเดียวกันทั่วประเทศ (\"Digital Thai Thai\") ศูนย์มีหน้าที่จัดสถานที่ อำนวยความสะดวก และเปิดระบบออนไลน์ให้ผู้เข้าอบรมรับชมพร้อมกัน วิทยากรจะสอนเนื้อหาและเครื่องมือทำคอนเทนต์ให้ทั้งหมด"
      },
      {
        q: "ศูนย์ในพื้นที่ภาคหนึ่ง แต่ติดกิจกรรมในวันอบรมของภาคตน สามารถเข้าร่วมกับภาคอื่นได้ไหม?",
        a: "ได้ แต่แนะนำให้เข้าร่วมในพื้นที่ของตนเอง เนื่องจากเนื้อหาที่วิทยากรสอนจะแตกต่างกันตามแต่ละพื้นที่"
      },
      {
        q: "วันที่ 31 กรกฎาคม 2569 คือกิจกรรมอะไร?",
        a: "เป็นการประชุมชี้แจงขั้นตอนการเปิดระบบและการรายงานผล เวลา 09.00–12.00 น. รูปแบบออนไลน์ เฉพาะศูนย์ที่ได้รับคัดเลือกแล้ว"
      }
    ]
  },
  {
    category: "5. การรายงานผลและผลงาน (คลิป/คอนเทนต์)",
    items: [
      {
        q: "หลังอบรมต้องส่งอะไรบ้าง?",
        a: "ต้องรายงานผลการอบรม ประกอบด้วย ใบลงชื่อผู้เข้าอบรม รูปภาพ/หลักฐานการจัดกิจกรรม (รวมอาหารและอาหารว่าง) และผลงานคลิปอัตลักษณ์ชุมชนอย่างน้อย 1 ชิ้นต่อศูนย์"
      },
      {
        q: "ผลงานคลิปต้องเป็นผลงานของใคร?",
        a: "เป็นผลงานของผู้เข้าร่วมอบรมหรือของผู้ดูแลศูนย์ก็ได้ อย่างน้อย 1 ชิ้นต่อศูนย์"
      },
      {
        q: "หากไม่ส่งคลิปหลังอบรม จะมีผลอย่างไร?",
        a: "จะไม่ได้รับสิทธิ์ในการรายงานผลครบถ้วน ซึ่งเป็นเงื่อนไขของการรับเกียรติบัตร เบิกจ่ายเงิน และสิทธิ์ลุ้นรางวัลต่าง ๆ"
      },
      {
        q: "การประกวดชิงรางวัลคอนเทนต์ คืออะไร?",
        a: "หลังอบรมเสร็จ จะเปิดรับผลงาน (ส่งในนามบุคคล) ผลงานที่ผ่านคัดเลือกประมาณ 30 ชิ้น จะถูกนำไปเผยแพร่ใน Facebook โครงการ และพิจารณาจากยอดวิว ไลก์ แชร์ ชิงรางวัลรวม 60,000 บาท"
      }
    ]
  },
  {
    category: "6. เกียรติบัตรและรางวัล",
    items: [
      {
        q: "ผู้เข้าอบรมทุกคนได้เกียรติบัตรหรือไม่?",
        a: "ได้ทุกคนที่เข้าร่วม แต่รูปแบบต่างกัน:\n• 10 คนแรก ได้รับเกียรติบัตรฉบับจริง (พร้อมปก)\n• ส่วนที่เกินจาก 10 คน จะได้รับเป็น ไฟล์อิเล็กทรอนิกส์ (E-Cert) ที่ออกจากระบบ Self Service E-Cert\n ด้วยผู้ดูแลศูนย์ และให้ศูนย์นำไปจัดพิมพ์เอง"
      },
      {
        q: "มีรางวัลอะไรอีกสำหรับศูนย์ที่เข้าร่วม?",
        a: "ทุกศูนย์ที่เข้าร่วมกิจกรรมและส่งแผน/ผลงาน/เอกสารเบิกจ่ายครบถ้วน มีสิทธิ์ลุ้นรับรางวัล:\n\n• iPad ภาคละ 1 รางวัล\n• Huawei Watch Band 11 ภาคละ 25 รางวัล\n(รวมทั้งสิ้น 104 รางวัลทั่วประเทศ)\n\nจับรางวัลพร้อมกันแบบ Live โดยมีผู้อำนวยการกองดิจิทัลเพื่อสังคม สดช. เป็นประธาน (จะแจ้งกำหนดการอีกครั้ง)"
      }
    ]
  },
  {
    category: "7. ช่องทางติดต่อ",
    items: [
      {
        q: "ช่องทางติดต่อและติดตามข่าวสารโครงการ",
        a: "• LINE OA (สอบถามข้อมูลส่วนบุคคล/ปัญหาการเข้าร่วมอบรม): https://lin.ee/UbholhU หรือ LINE ID: @303aelxe\n• เว็บไซต์โครงการ (ส่งแผน / ตรวจสอบสถานะ): https://www.l2e-dtt.online/\n• LINE OpenChat: สำหรับรับข่าวสารและประชาสัมพันธ์โครงการ"
      }
    ]
  },
  {
    category: "8. ช่องทางการส่งเอกสาร",
    items: [
      {
        q: "ส่งเอกสารได้ที่ไหนครับ ?",
        a: "บริษัท ไพร์ม ดิจิทัล คอนซัลแทนท์ จำกัด 39/19 หมู่ที่ 6 ตำบลสามพราน อำเภอสามพราน จ.นครปฐม 73110\n โทร. 0829416199"
      }
      ,
      {
        q: "ส่งเอกสารอะไรบ้างครับ ?",
        a: "สิ่งที่ต้องส่ง: \n\n1.ใบสำคัญรับเงินตัวจริง พร้อมแนบสำเนาบัตรประชาชน\n 2.ใบรับของตัวจริง (พร้อมลงนาม)\n 3.ใบเซ็นชื่อ ผู้เข้าร่วมตัวจริง จำนวนไม่น้อยกว่า 11 คน (รวมผู้ดูแลศูนย์)"
      }
    ]
  }
];

function renderAnswerWithLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-bold underline hover:text-primary-container transition-colors break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

const SHOW_ECERT_LINK = true; // Toggle to true when ready to show E-Cert in nav bar

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

  // FAQ State
  const [openFaqs, setOpenFaqs] = useState({});

  const toggleFaq = (key) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
        <div className="flex justify-between items-center w-full px-6 sm:px-10 lg:px-12 py-sm relative">
          <div className="flex items-center gap-md">
            <Link href="#" className="flex items-center gap-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ICON Home.png" alt="Digital Thai Thai Logo" className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
              <span className="font-headline-md text-headline-md font-bold bg-gradient-to-r from-[#2f6b8f] via-[#90c759] to-[#dde14a] bg-[length:200%_auto] animate-gradient text-transparent bg-clip-text">
                Digital Thai Thai
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden xl:flex gap-4 xl:gap-5 items-center text-sm font-medium">
            <Link href="#schedule" className="group relative text-on-surface-variant hover:text-primary transition-colors py-1">
              กำหนดการ
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>
            <Link href="#applicants" className="group relative text-on-surface-variant hover:text-primary transition-colors py-1">
              ผู้สมัคร
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>
            <Link href="#check-status" className="group relative text-on-surface-variant hover:text-primary transition-colors py-1">
              เช็คสถานะ
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>
            <a
              href={DOCUMENTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-on-surface-variant hover:text-primary transition-colors py-1"
            >
              รวมเอกสาร
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </a>
            <Link href="#faq" className="group relative text-on-surface-variant hover:text-primary transition-colors py-1">
              FAQ
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </Link>

            <a
              href={CONTEST_MEDIA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-emerald-800 hover:text-emerald-950 font-bold transition-colors py-1 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[17px] text-emerald-700">emoji_events</span>
              <span>ประกวดสื่อสร้างสรรค์</span>
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-emerald-600 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
            </a>

            {SHOW_ECERT_LINK && (
              <Link href="/e-cert" className="group relative text-emerald-800 hover:text-emerald-950 font-bold transition-colors py-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[17px] text-emerald-700">workspace_premium</span>
                <span>ระบบ E-Cert</span>
                <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-emerald-600 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
              </Link>
            )}
          </div>

          {/* Right Action Cluster: รายงานผล + ลงทะเบียน */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Direct Button "รายงานผลการจัดกิจกรรม" (Direct Link to Form) */}
            <a
              href={REPORT_ACTIVITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-950 bg-emerald-100/90 hover:bg-emerald-200/90 border border-emerald-300/80 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-full transition-all shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-700">assessment</span>
              <span>รายงานผลการจัดกิจกรรม</span>
              <span className="material-symbols-outlined text-[15px] text-emerald-800">open_in_new</span>
            </a>

            {/* Button "ลงทะเบียนเข้าร่วมโครงการ" */}
            <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-primary-container hover:text-on-primary-container hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
              <span>ลงทะเบียนโครงการ</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="xl:hidden flex items-center text-primary p-2 focus:outline-none rounded-xl hover:bg-surface-container-high transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[30px]">
              {isMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <div className={`xl:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-2xl transition-all duration-300 overflow-hidden ${isMenuOpen ? "max-h-[850px] py-5 px-6 opacity-100" : "max-h-0 py-0 px-6 opacity-0"} flex flex-col gap-4 z-50`}>
          {/* Quick Nav Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Link href="#schedule" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-surface-container-high/80 hover:bg-primary/10 text-on-surface font-semibold text-sm py-2.5 px-3 rounded-xl transition-all border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
              <span>กำหนดการ</span>
            </Link>
            <Link href="#applicants" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-surface-container-high/80 hover:bg-primary/10 text-on-surface font-semibold text-sm py-2.5 px-3 rounded-xl transition-all border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
              <span>ผู้สมัคร</span>
            </Link>
            <Link href="#check-status" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-surface-container-high/80 hover:bg-primary/10 text-on-surface font-semibold text-sm py-2.5 px-3 rounded-xl transition-all border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px] text-primary">manage_search</span>
              <span>เช็คสถานะ</span>
            </Link>
            <a href={DOCUMENTS_URL} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-surface-container-high/80 hover:bg-primary/10 text-on-surface font-semibold text-sm py-2.5 px-3 rounded-xl transition-all border border-outline-variant/20">
              <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
              <span>รวมเอกสาร</span>
            </a>
            <Link href="#faq" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-1.5 bg-surface-container-high/80 hover:bg-primary/10 text-on-surface font-semibold text-sm py-2.5 px-3 rounded-xl transition-all border border-outline-variant/20 col-span-2 sm:col-span-1">
              <span className="material-symbols-outlined text-[18px] text-primary">help</span>
              <span>FAQ</span>
            </Link>
          </div>

          <div className="border-t border-outline-variant/30 my-0.5"></div>

          {/* Highlight Action Cards */}
          <div className="flex flex-col gap-2.5">
            <a
              href={REPORT_ACTIVITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-200 font-bold text-sm py-3 px-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[22px] text-emerald-600">assessment</span>
                <span>รายงานผลการจัดกิจกรรม</span>
              </div>
              <span className="material-symbols-outlined text-[18px] opacity-70">open_in_new</span>
            </a>

            <a
              href={CONTEST_MEDIA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="bg-gradient-to-r from-emerald-100/90 to-emerald-50 dark:from-emerald-900/40 dark:to-teal-900/30 border border-emerald-400 dark:border-emerald-600/60 text-emerald-950 dark:text-emerald-100 font-bold text-sm py-3 px-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[22px] text-emerald-700">emoji_events</span>
                <span>ประกวดสื่อสร้างสรรค์</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-emerald-700 opacity-80">open_in_new</span>
            </a>

            {SHOW_ECERT_LINK && (
              <Link
                href="/e-cert"
                onClick={() => setIsMenuOpen(false)}
                className="bg-gradient-to-r from-emerald-100/90 to-emerald-50 dark:from-emerald-900/40 dark:to-teal-900/30 border border-emerald-400 dark:border-emerald-600/60 text-emerald-950 dark:text-emerald-100 font-bold text-sm py-3 px-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[22px] text-emerald-700">workspace_premium</span>
                  <span>ระบบออกใบประกาศ E-Cert</span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-emerald-700">arrow_forward</span>
              </Link>
            )}
          </div>

          {/* Primary CTA */}
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMenuOpen(false)}
            className="w-full bg-primary text-on-primary font-bold text-base py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all mt-1 text-center"
          >
            <span>ลงทะเบียนเข้าร่วมโครงการ</span>
            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient relative py-xl px-gutter w-full min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-xl items-center w-full">
          <div className="z-10 flex flex-col gap-md order-2 md:order-1">
            <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface">
              <span className="bg-gradient-to-r from-[#2f6b8f] via-[#90c759] to-[#dde14a] bg-[length:200%_auto] animate-gradient text-transparent bg-clip-text block mb-2 pb-1">Digital Thai Thai</span>
              เทคโนโลยี<span className="animate-text-shimmer bg-gradient-to-r from-on-surface via-primary to-on-surface bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-sm">ล้ำสมัย</span><br></br>
              สะท้อนอัตลักษณ์ไทย<br></br>
              ไปกับศูนย์ดิจิทัลชุมชน
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant border-l-4 border-tertiary-fixed-dim pl-sm">
              โครงการพัฒนาแพลตฟอร์มภาครัฐเพื่อรองรับการพัฒนาทักษะดิจิทัล<br></br>
              เรียนรู้มีรายได้เรียนรู้ง่ายตลอดชีวิต ผ่านรูปแบบ Learn to Earn
            </p>
            <div className="mt-sm flex flex-col sm:flex-row items-center md:items-start gap-3 flex-wrap">
              <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-primary text-on-primary px-lg py-sm rounded-full font-headline-md text-[18px] md:text-[20px] hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md hover:shadow-lg text-center">
                ลงทะเบียนศูนย์ดิจิทัลชุมชนเข้าร่วมโครงการ
                <span className="material-symbols-outlined">arrow_forward</span>
              </a>
              <a href="#report-section" className="inline-flex items-center gap-2 bg-emerald-800 text-white border border-emerald-600/80 px-5 py-sm rounded-full font-headline-md text-[17px] hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg text-center">
                <span className="material-symbols-outlined text-[20px] text-emerald-300">analytics</span>
                <span>ส่งรายงานผล</span>
              </a>
            </div>
            <p className="text-on-surface-variant font-body-sm text-center md:text-left bg-surface-container-high px-3 py-1 rounded-full w-fit mt-1">
              * สำหรับศูนย์ดิจิทัลชุมชน <b>เพื่อเป็นหน่วยจัดอบรมออนไลน์ให้สมาชิก 10 คน</b>
            </p>
          </div>
          <div className="relative z-10 flex justify-center order-1 md:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full max-w-[600px] h-auto object-contain animate-[float_6s_ease-in-out_infinite] scale-110 md:scale-150" alt="BDE-LEARNTOEARN IMG" src="/BDE-LEARNTOEARN IMG.png" />
          </div>
        </div>
        {/* Decorative Elements - Background image removed to fix Next.js build error */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-transparent bg-cover bg-center"></div>
      </section>

      {/* High-Impact Report & Submission Hero Section */}
      <section id="report-section" className="w-full min-h-[calc(100vh-80px)] flex flex-col justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden py-12 sm:py-16 lg:py-20 border-b border-emerald-500/20 shadow-2xl scroll-mt-[80px]">
        {/* Glowing Background Orbs & Ambient Mesh */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-400/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full relative z-10 flex flex-col justify-center my-auto">
          {/* Header Badge & Title */}
          <div className="text-center max-w-4xl mx-auto mb-8 lg:mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4.5 py-1.5 rounded-full font-bold text-xs sm:text-sm mb-3.5 backdrop-blur-md shadow-inner">
              <span className="material-symbols-outlined text-[20px] text-emerald-400">analytics</span>
              <span>ช่องทางรายงานผลของโครงการ</span>
            </div>
            <h2 className="font-headline-lg text-[28px] sm:text-[38px] lg:text-[46px] font-bold text-white mb-3 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">ส่งรายงานผลการจัดกิจกรรม</span>
            </h2>
          </div>

          {/* 3 Responsive Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-5 lg:gap-7 items-stretch">
            {/* Card 1: รายงานผลการจัดกิจกรรม (MOST IMPORTANT - ULTIMATE GOLD HIGHLIGHT HERO CARD) */}
            <div className="bg-gradient-to-b from-amber-500/25 via-amber-900/45 to-emerald-950/95 backdrop-blur-xl border-2 border-amber-400/90 rounded-3xl p-6 sm:p-7 lg:p-8 flex flex-col justify-between hover:border-amber-300 hover:from-amber-500/35 transition-all duration-300 group hover:-translate-y-2 shadow-2xl shadow-amber-500/20 relative overflow-hidden ring-4 ring-amber-400/20">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">stars</span>
                <span>สำคัญที่สุด (ต้องส่งทุกคน)</span>
              </div>
              <div>
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-amber-400/25 border-2 border-amber-400/60 rounded-2xl flex items-center justify-center text-amber-300 mb-5 group-hover:scale-105 transition-transform shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">assignment_turned_in</span>
                </div>
                <div className="inline-block bg-amber-400/20 text-amber-200 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-amber-400/40">
                  สำหรับศูนย์ที่จัดอบรมเสร็จแล้ว
                </div>
                <h3 className="font-headline-md text-2xl lg:text-3xl font-extrabold text-amber-200 mb-2.5">
                  รายงานผลการจัดกิจกรรม
                </h3>

                {/* Structured 2-Column Requirements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  {/* Group 1: สิ่งที่ต้องนำมารายงานผล (ระบบออนไลน์) */}
                  <div className="bg-amber-950/50 border border-amber-400/35 rounded-2xl p-4.5 sm:p-5 backdrop-blur-md flex flex-col gap-3 shadow-inner">
                    <div className="font-bold text-amber-300 text-sm sm:text-base flex items-center gap-2 border-b border-amber-400/25 pb-2.5">
                      <span className="material-symbols-outlined text-[20px] text-amber-400">cloud_upload</span>
                      <span>สิ่งที่ต้องนำมารายงานผล (ออนไลน์)</span>
                    </div>
                    <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-white-100/90 font-medium">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400/25 border border-amber-400/40 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>กรอกรายชื่อผู้เข้าอบรมรวม ผดศ. ไม่น้อยกว่า 11 คน (ให้ตรงกับใบลงทะเบียน)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400/25 border border-amber-400/40 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>อัปโหลดภาพระหว่างอบรม, อาหาร, อาหารว่างและเครื่องดื่ม และคลิปบรรยากาศการอบรม</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400/25 border border-amber-400/40 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>อัปโหลดไฟล์สแกนใบรับของ (ใบประกาศและปก)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400/25 border border-amber-400/40 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>อัปโหลดไฟล์สแกนใบลงชื่อ</span>
                      </li>
                    </ul>
                  </div>

                  {/* Group 2: เมื่อรายงานผลแล้ว สิ่งที่ต้องส่งกลับบริษัท (เอกสารจริง) */}
                  <div className="bg-emerald-950/50 border border-emerald-400/35 rounded-2xl p-4.5 sm:p-5 backdrop-blur-md flex flex-col gap-3 shadow-inner">
                    <div className="font-bold text-emerald-300 text-sm sm:text-base flex items-center gap-2 border-b border-emerald-400/25 pb-2.5">
                      <span className="material-symbols-outlined text-[20px] text-emerald-400">markunread_mailbox</span>
                      <span>เมื่อรายงานผลแล้ว สิ่งที่ต้องส่งกลับบริษัท</span>
                    </div>
                    <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-white-100/90 font-medium">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-400/25 border border-emerald-400/40 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>ใบสำคัญรับเงิน และสำเนาบัตรประชาชน <b className="text-white font-bold">(1,500 บาท)</b></span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-400/25 border border-emerald-400/40 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>ใบรับของ (ฉบับจริง)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-400/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>ใบลงชื่อผู้เข้าอบรม (ฉบับจริง)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <a
                href={REPORT_ACTIVITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-extrabold py-4 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/35 text-base sm:text-lg hover:scale-[1.02]"
              >
                <span>ส่งรายงานผลการจัดกิจกรรม</span>
                <span className="material-symbols-outlined text-[22px]">open_in_new</span>
              </a>
            </div>



          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section id="target-audience" className="py-xl px-gutter max-w-container-max mx-auto w-full">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            ใครสมัครได้บ้าง ?
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-stretch">
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center justify-center text-center border-t-4 border-t-primary shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-surface-container-lowest">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined text-[32px]">store</span>
            </div>
            <h3 className="font-headline-md text-[22px] text-on-surface mb-2">ศูนย์ดิจิทัลชุมชน (โซน 1-4) จำนวน 1,722 ศูนย์</h3>

          </div>
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center justify-center text-center border-t-4 border-t-tertiary-fixed-dim shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-surface-container-lowest">
            <div className="w-16 h-16 bg-tertiary-fixed-dim/10 rounded-full flex items-center justify-center text-tertiary-fixed-dim mb-4">
              <span className="material-symbols-outlined text-[32px]">add_business</span>
            </div>
            <h3 className="font-headline-md text-[22px] text-on-surface mb-2">ศูนย์ดิจิทัลชุมชนใหม่ (โครงการใหม่ 500 ศูนย์)</h3>

          </div>
        </div>
        <div className="mt-md text-center">
          <p className="text-on-surface-variant font-body-sm bg-surface-container-high inline-block px-4 py-2 rounded-full">
            * ศูนย์ดิจิทัลชุมชนทั้งสองระบบ กรอกฟอร์มสมัครเดียวกัน (สามารถดูรหัสศูนย์ได้ที่ <b>ค้นหาข้อมูลศูนย์ดิจิทัลชุมชน</b>)
          </p>
        </div>
      </section>

      {/* Conditions Section */}
      <section id="conditions" className="py-xl px-gutter max-w-container-max mx-auto w-full">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            หน้าที่ของศูนย์ดิจิทัลชุมชนที่เข้าร่วมโครงการ
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center text-center shadow-sm bg-surface-container-lowest relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full z-0"></div>
            <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center font-headline-lg text-[24px] mb-4 z-10 shadow-md">
              1
            </div>
            <h3 className="font-headline-md text-[18px] text-on-surface mb-2 z-10">จัดอบรมออนไลน์</h3>
            <p className="text-on-surface-variant font-body-sm z-10">
              เป็นศูนย์อบรบออนไลน์สำหรับจัดการอบรมจากส่วนกลางโดยต้องจัดหาผู้เข้าร่วมอบรมอย่างน้อย 10 คน
            </p>
          </div>
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center text-center shadow-sm bg-surface-container-lowest relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full z-0"></div>
            <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center font-headline-lg text-[24px] mb-4 z-10 shadow-md">
              2
            </div>
            <h3 className="font-headline-md text-[18px] text-on-surface mb-2 z-10">รายงานผล</h3>
            <p className="text-on-surface-variant font-body-sm z-10">
              ส่งรายงานผลการจัดอบรม <br></br>ใบลงชื่อเข้าอบรม, รูปภาพ, เอกสารเบิกจ่าย
            </p>
          </div>
          <div className="glass-card p-lg rounded-2xl flex flex-col items-center text-center shadow-sm bg-surface-container-lowest relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full z-0"></div>
            <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center font-headline-lg text-[24px] mb-4 z-10 shadow-md">
              3
            </div>
            <h3 className="font-headline-md text-[18px] text-on-surface mb-2 z-10">ส่งคลิปวิดีโอ</h3>
            <p className="text-on-surface-variant font-body-sm z-10">
              ส่งผลงานคลิปวิดีโออัตลักษณ์ชุมชน<br></br>จากการอบรม จำนวน 1 ชิ้น<br />
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section id="schedule" className="py-xl px-gutter max-w-container-max mx-auto w-full">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            กำหนดการจัดอบรม
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md">
          {/* ประกาศชี้แจง  */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-default"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">เตรียมความพร้อม</span>
              <span className="text-primary font-bold font-label-sm text-right whitespace-nowrap">Online</span>
            </div>
            <div className="z-10 mt-sm flex flex-col h-full">
              <h3 className="font-headline-md text-headline-md text-on-surface">31 ก.ค. 2569</h3>
              <p className="text-on-surface-variant mt-2 font-body-sm leading-snug flex-grow">
                จัดประชุมชี้แจงเจ้าหน้าที่ผู้ดูแลศูนย์ดิจิทัลชุมชน เพื่อแจ้งรายละเอียดกิจกรรม
              </p>
              <a
                href="https://www.youtube.com/live/Nb5iE-Fw7rk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 mt-3 font-body-md font-bold transition-colors w-fit group/replay"
              >
                <span className="material-symbols-outlined text-[18px] text-red-600 group-hover/replay:rotate-[-45deg] transition-transform">replay</span>
                <span className="hover:underline">ดูย้อนหลัง</span>
              </a>
            </div>
          </div>


          {/* Session 1 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-default"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 1</span>
              <span className="text-primary font-bold font-label-sm text-right whitespace-nowrap">ภาคเหนือ</span>
            </div>
            <div className="z-10 mt-sm flex flex-col h-full">
              <h3 className="font-headline-md text-headline-md text-on-surface">3 ส.ค. 2569</h3>
              <p className="text-on-surface-variant mt-2 font-body-sm leading-snug flex-grow">
                อบรมออนไลน์เพื่อถ่ายทอดองค์ความรู้และพัฒนาสื่ออัตลักษณ์ชุมชน <br></br>(Digital Thai Thai)
              </p>
              <p className="text-primary flex items-center gap-1 mt-3 font-body-md font-bold">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                จัด Online
              </p>
            </div>
          </div>
          {/* Session 2 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-default"
          >
            <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 2</span>
              <span className="text-secondary font-bold font-label-sm text-right whitespace-nowrap">ภาคกลาง</span>
            </div>
            <div className="z-10 mt-sm flex flex-col h-full">
              <h3 className="font-headline-md text-headline-md text-on-surface">10 ส.ค. 2569</h3>
              <p className="text-on-surface-variant mt-2 font-body-sm leading-snug flex-grow">
                อบรมออนไลน์เพื่อถ่ายทอดองค์ความรู้และพัฒนาสื่ออัตลักษณ์ชุมชน <br></br>(Digital Thai Thai)
              </p>
              <p className="text-primary flex items-center gap-1 mt-3 font-body-md font-bold">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                จัด Online
              </p>
            </div>
          </div>
          {/* Session 3 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-default"
          >
            <div className="absolute inset-0 bg-tertiary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 3</span>
              <span className="text-tertiary font-bold font-label-sm text-right whitespace-nowrap">ภาคอีสาน</span>
            </div>
            <div className="z-10 mt-sm flex flex-col h-full">
              <h3 className="font-headline-md text-headline-md text-on-surface">11 ส.ค. 2569</h3>
              <p className="text-on-surface-variant mt-2 font-body-sm leading-snug flex-grow">
                อบรมออนไลน์เพื่อถ่ายทอดองค์ความรู้และพัฒนาสื่ออัตลักษณ์ชุมชน <br></br>(Digital Thai Thai)
              </p>
              <p className="text-primary flex items-center gap-1 mt-3 font-body-md font-bold">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                จัด Online
              </p>
            </div>
          </div>
          {/* Session 4 */}
          <div
            className="glass-card gold-border-top rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group bg-surface-container-lowest h-full cursor-default"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start z-10 gap-2">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap shrink-0">ครั้งที่ 4</span>
              <span className="text-primary font-bold font-label-sm text-right whitespace-nowrap">ภาคใต้</span>
            </div>
            <div className="z-10 mt-sm flex flex-col h-full">
              <h3 className="font-headline-md text-headline-md text-on-surface">14 ส.ค. 2569</h3>
              <p className="text-on-surface-variant mt-2 font-body-sm leading-snug flex-grow">
                อบรมออนไลน์เพื่อถ่ายทอดองค์ความรู้และพัฒนาสื่ออัตลักษณ์ชุมชน <br></br>(Digital Thai Thai)
              </p>
              <p className="text-primary flex items-center gap-1 mt-3 font-body-md font-bold">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                จัด Online
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning & Topics Grid */}
      <section id="learning" className="bg-surface-container pt-xl pb-lg px-gutter">
        <div className="max-w-container-max mx-auto grid grid-cols-1 gap-xl">
          {/* Modules */}
          <div>

            <div className="flex items-center gap-3 mb-md">
              <div className="bg-primary p-2 rounded-lg text-on-primary">
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">เรียนรู้อะไร ?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-md">
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high w-12 h-12 flex items-center justify-center shrink-0 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">ปั้นสื่อผสม AI</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high w-12 h-12 flex items-center justify-center shrink-0 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">การถ่ายภาพและวิดีโอ</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high w-12 h-12 flex items-center justify-center shrink-0 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>movie_edit</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">เทคนิคการตัดต่อ</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high w-12 h-12 flex items-center justify-center shrink-0 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">ศิลปะการเล่าเรื่อง</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* Contest & Reward Section */}
      <section id="contest" className="bg-surface-container pt-lg pb-xl px-gutter">
        <div className="text-center mb-xl flex flex-col items-center">
          <span className="bg-[#fff8d6] text-[#735c00] px-4 py-1.5 rounded-full font-label-md text-sm mb-4 flex items-center gap-2 border border-[#e6c200] shadow-sm font-bold">
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            กิจกรรมพิเศษ (ต่อยอดจากการจัดอบรม)
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            การประกวดสื่อสร้างสรรค์
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
          <p className="text-on-surface-variant font-body-lg mt-4 max-w-2xl mx-auto">
            ต่อยอดผลงานจากการจัดอบรม โดยปรับปรุงวิดีโอให้น่าสนใจตามความรู้ทักษะที่ได้รับ <br></br>
            เพียงส่งคลิปวิดีโอถ่ายทอดความเป็นพื้นเมืองต้นตำรับ หรืออัตลักษณ์ชุมชน <br></br>ก็มีสิทธิ์ลุ้นรับเงินรางวัลสนับสนุนรวมกว่า <b>60,000 บาท!</b><br></br>
            <i>( เป็นการประกวดระดับบุคคล ไม่เกี่ยวกับผลงานจากการจัดอบรม )</i>
          </p>
        </div>

        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-xl">
          {/* Criteria */}
          <div>
            <div className="flex items-center gap-3 mb-md">
              <div className="bg-primary p-2 rounded-lg text-on-primary">
                <span className="material-symbols-outlined">done_all</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">เกณฑ์การให้คะแนน</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-md">
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high w-12 h-12 flex items-center justify-center shrink-0 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>more_time</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">ความยาวคลิปอย่างน้อย 1-3 นาที</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform bg-surface-container-lowest shadow-sm">
                <div className="bg-surface-container-high w-12 h-12 flex items-center justify-center shrink-0 rounded-full text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>wand_shine</span>
                </div>
                <span className="font-headline-md text-[18px] text-on-surface">มีความคิดสร้างสรรค์ (Creativity) สื่อถึงอัตลักษณ์ชุมชน</span>
              </div>
            </div>
          </div>

          {/* Prizes */}
          <div>
            <div className="flex items-center gap-3 mb-md">
              <div className="bg-tertiary-fixed-dim p-2 rounded-lg text-on-tertiary-container">
                <span className="material-symbols-outlined">emoji_events</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">จำนวนเงินรางวัล</h2>
            </div>
            <div className="flex flex-col gap-md">
              <div className="glass-card p-md rounded-xl flex items-center gap-4 border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-default">
                <div className="text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 w-10 h-10 flex items-center justify-center shrink-0 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <span className="font-headline-md text-[20px] text-on-surface">รางวัลที่ 1 (1 รางวัล) : 30,000 บาท</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-default">
                <div className="text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 w-10 h-10 flex items-center justify-center shrink-0 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <span className="font-headline-md text-[20px] text-on-surface">รางวัลที่ 2 (1 รางวัล) : 20,000 บาท</span>
              </div>
              <div className="glass-card p-md rounded-xl flex items-center gap-4 border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-default">
                <div className="text-tertiary-fixed-dim bg-tertiary-fixed-dim/10 w-10 h-10 flex items-center justify-center shrink-0 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <span className="font-headline-md text-[20px] text-on-surface">รางวัลที่ 3 (1 รางวัล) : 10,000 บาท</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button to Submit Creative Media Contest */}
        <div className="mt-10 flex justify-center">
          <a
            href={CONTEST_MEDIA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold px-8 py-3.5 rounded-full text-base sm:text-lg border border-emerald-600/80 shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/35 hover:-translate-y-0.5 transition-all duration-300 group text-center"
          >
            <span className="material-symbols-outlined text-[24px] text-amber-300">emoji_events</span>
            <span>ส่งคลิปประกวดสื่อสร้างสรรค์ (ลุ้นรางวัล)</span>
          </a>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-md gap-y-4">
          {/* Applicants Card */}
          <div className="order-1 md:order-1 glass-card p-lg rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-primary shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-surface-container-lowest cursor-default h-full">
            <div className="bg-primary/10 w-20 h-20 flex items-center justify-center shrink-0 rounded-full text-primary mb-sm">
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
            <p className="text-on-surface-variant font-body-md mt-2 flex items-center justify-center gap-2">
              ผู้เข้าร่วมกิจกรรม
              {!loading && <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>}
            </p>
          </div>

          <p className="order-2 md:order-3 text-on-surface-variant font-body-sm px-2 text-center">
            ศูนย์ที่ได้รับคัดเลือก 1,722 ศูนย์ <br className="hidden md:block" />
            จะได้รับสนับสนุนงบประมาณในการจัดฝึกอบรม
          </p>

          {/* Waitlist Card */}
          <div className="order-3 md:order-2 glass-card p-lg rounded-2xl flex flex-col items-center justify-center text-center border-l-4 border-l-tertiary-fixed-dim shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-surface-container-lowest cursor-default h-full">
            <div className="bg-tertiary-fixed-dim/10 w-20 h-20 flex items-center justify-center shrink-0 rounded-full text-tertiary-fixed-dim mb-sm">
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

          <p className="order-4 md:order-4 text-on-surface-variant font-body-sm px-2 text-center">
            หากศูนย์ดิจิทัลชุมชน สมัครเข้าร่วม ครบ 1,722 ศูนย์ <br className="hidden lg:block" />
            ศูนย์ที่ได้รับคัดเลือก (สำรอง) <b>จะไม่ได้รับงบประมาณสนับสนุน</b> <br className="hidden lg:block" />
            แต่จะมีสิทธิ์ในการส่งคลิปวิดีโอในการประกวด <b>เพื่อลุ้นรับเงินรางวัล</b>
          </p>
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
                statusResult.data?.status?.includes('ไม่อนุมัติ') ? 'bg-error-container text-on-error-container border-l-error' :
                  statusResult.data?.status?.includes('สำรอง') ? 'bg-tertiary-fixed text-on-tertiary-container border-l-tertiary-fixed-dim' :
                    statusResult.data?.status?.includes('รอตรวจ') ? 'bg-secondary-container text-on-secondary-container border-l-secondary' :
                      statusResult.data?.status?.includes('ยังไม่ส่งแผน') ? 'bg-surface-container-highest text-on-surface-variant border-l-outline' :
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
                <div className="flex flex-col items-center gap-2 w-full">
                  <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {statusResult.data.status.includes('ไม่อนุมัติ') ? 'cancel' :
                      statusResult.data.status.includes('สำรอง') ? 'hourglass_empty' :
                        statusResult.data.status.includes('รอตรวจ') ? 'pending_actions' :
                          statusResult.data.status.includes('ยังไม่ส่งแผน') ? 'assignment_late' : 'verified'}
                  </span>
                  <p className="font-body-lg text-on-surface-variant mb-1">
                    พบข้อมูลของคุณ: <span className="font-bold">{statusResult.data.name}</span>
                  </p>
                  <p className={`font-headline-xl text-[32px] sm:text-[40px] font-bold ${statusResult.data.status.includes('ไม่อนุมัติ') ? 'text-error' : ''}`}>
                    {statusResult.data.status}
                  </p>

                  <div className="w-full max-w-4xl mt-6 flex flex-col gap-3.5 text-left">
                    {/* Top Status Pair Grid on PC (Transfer Status & Cert Tracking) */}
                    {(statusResult.data.transferStatus || statusResult.data.certTracking) && (
                      <div className={`grid gap-3.5 w-full ${(statusResult.data.transferStatus && statusResult.data.certTracking) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Transfer Status */}
                        {statusResult.data.transferStatus && (
                          <div className={`p-4 sm:p-5 border rounded-2xl w-full shadow-sm flex flex-col justify-between ${statusResult.data.transferStatus.includes('โอนแล้ว')
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                            }`}>
                            <div>
                              <p className="font-body-md font-bold flex items-center gap-1.5 text-sm sm:text-base">
                                <span className="material-symbols-outlined text-[22px]">payments</span>
                                <span>สถานะการโอนเงิน:</span>
                              </p>
                              <p className={`font-headline-md text-lg sm:text-xl font-extrabold mt-1.5 break-words ${statusResult.data.transferStatus.includes('โอนแล้ว')
                                ? 'text-emerald-950 dark:text-emerald-100'
                                : 'text-amber-950 dark:text-amber-100'
                                }`}>
                                {statusResult.data.transferStatus}
                              </p>
                            </div>
                            {statusResult.data.transferDate && (
                              <p className="font-body-sm text-xs sm:text-sm mt-3 pt-2.5 border-t border-current/15 flex items-center gap-1.5 font-semibold opacity-95">
                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                <span>วันที่จะได้รับเงิน : {statusResult.data.transferDate}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Cert Tracking */}
                        {statusResult.data.certTracking && (
                          <div className="p-4 sm:p-5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 rounded-2xl w-full shadow-sm flex flex-col justify-between">
                            <div>
                              <p className="font-body-md font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 text-sm sm:text-base">
                                <span className="material-symbols-outlined text-[22px] text-emerald-600 dark:text-emerald-400">local_shipping</span>
                                <span>เลข Tracking ใบประกาศนียบัตร:</span>
                              </p>
                              <p className="font-headline-md text-lg sm:text-xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1.5 break-words tracking-wider font-mono">
                                {statusResult.data.certTracking}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remark Card (Full Width) */}
                    {statusResult.data.remark && (
                      <div className={`p-4 sm:p-5 bg-surface-container-lowest border rounded-2xl w-full shadow-sm ${statusResult.data.status.includes('ไม่อนุมัติ') ? 'border-error/30' : 'border-primary/30'
                        }`}>
                        <p className={`font-body-md font-bold flex items-center gap-1.5 text-sm sm:text-base ${statusResult.data.status.includes('ไม่อนุมัติ') ? 'text-error' : 'text-primary'
                          }`}>
                          <span className="material-symbols-outlined text-[20px]">info</span>
                          <span>หมายเหตุ:</span>
                        </p>
                        <p className="font-body-md text-on-surface mt-1.5 pl-6 break-words leading-relaxed">{statusResult.data.remark}</p>
                      </div>
                    )}

                    {/* 📊 4-Grid Metrics Dashboard (Full Width on Desktop) */}
                    {statusResult.data.hasReported && (
                      <div className="w-full bg-surface-container-lowest/90 dark:bg-surface-container-lowest/60 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-4 sm:p-6 shadow-sm">
                        <p className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center justify-center gap-2 text-primary">
                          <span className="material-symbols-outlined text-[20px]">equalizer</span>
                          <span>สรุปข้อมูลการอบรม & การประเมินผล</span>
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          {/* 1. จำนวนผู้อบรม (AA) */}
                          <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 shadow-xs">
                            <div className="bg-emerald-500/20 p-2.5 rounded-full text-emerald-700 dark:text-emerald-300 mb-2">
                              <span className="material-symbols-outlined text-[26px]">groups</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">จำนวนผู้อบรม</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 font-mono mt-1">
                              {statusResult.data.traineeCount || '-'}
                            </span>
                            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">ท่าน</span>
                          </div>

                          {/* 2. Pre-Test (AB) */}
                          <div className="bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 shadow-xs">
                            <div className="bg-sky-500/20 p-2.5 rounded-full text-sky-700 dark:text-sky-300 mb-2">
                              <span className="material-symbols-outlined text-[26px]">quiz</span>
                            </div>
                            <span className="text-xs font-bold text-sky-800 dark:text-sky-300">Pre-Test</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-sky-950 dark:text-sky-100 font-mono mt-1">
                              {statusResult.data.preTestCount || '-'}
                            </span>
                            <span className="text-xs text-sky-700/80 dark:text-sky-400/80 font-medium">ชุด</span>
                          </div>

                          {/* 3. Post-Test (AC) */}
                          <div className="bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 shadow-xs">
                            <div className="bg-indigo-500/20 p-2.5 rounded-full text-indigo-700 dark:text-indigo-300 mb-2">
                              <span className="material-symbols-outlined text-[26px]">fact_check</span>
                            </div>
                            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Post-Test</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-950 dark:text-indigo-100 font-mono mt-1">
                              {statusResult.data.postTestCount || '-'}
                            </span>
                            <span className="text-xs text-indigo-700/80 dark:text-indigo-400/80 font-medium">ชุด</span>
                          </div>

                          {/* 4. ความพึงพอใจ (AD) */}
                          <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 shadow-xs">
                            <div className="bg-amber-500/20 p-2.5 rounded-full text-amber-700 dark:text-amber-300 mb-2">
                              <span className="material-symbols-outlined text-[26px]">sentiment_very_satisfied</span>
                            </div>
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">ความพึงพอใจ</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 dark:text-amber-100 font-mono mt-1">
                              {statusResult.data.satisfactionCount || '-'}
                            </span>
                            <span className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">ชุด</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
        <div className="bg-gradient-to-br from-primary via-primary to-[#2f6b8f] rounded-3xl p-lg md:p-xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-xl">
          {/* Decorative Background Elements */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-on-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-tertiary-fixed-dim/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="z-10 text-on-primary max-w-[500px] flex flex-col gap-md">
            <h2 className="font-headline-xl text-[36px] md:text-[42px] font-bold text-on-primary leading-tight">
              เริ่มยกระดับศูนย์ดิจิทัลชุมชนของคุณ
            </h2>
            <p className="font-body-lg text-on-primary/90">
              สแกน QR Code หรือคลิกปุ่มด้านล่างเพื่อลงทะเบียนเข้าร่วมโครงการ Digital Thai Thai เป็นหน่วยจัดอบรมให้สมาชิกในชุมชน
            </p>
            <div className="flex items-center gap-4 mt-2 bg-on-primary/10 w-fit p-4 rounded-xl border border-on-primary/20 backdrop-blur-md shadow-inner">
              <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-on-primary text-primary rounded-full shadow-sm">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
              </div>
              <div>
                <p className="text-sm text-on-primary/80 font-body-sm">เปิดรับสมัครตั้งแต่วันนี้ถึง</p>
                <p className="font-bold text-[20px] text-tertiary-fixed-dim tracking-wide drop-shadow-sm">10 สิงหาคม 2569</p>
              </div>
            </div>
            <div className="text-sm text-on-primary/90 bg-on-primary/10 p-3.5 rounded-xl border border-on-primary/20 flex items-start gap-2.5 backdrop-blur-md">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px] shrink-0 mt-0.5">info</span>
              <p className="font-body-sm leading-relaxed">
                <b>หมายเหตุ:</b> หากยังหาผู้เข้าร่วมไม่ได้แต่สนใจกิจกรรม สามารถส่งแผนโดย<br></br>ไม่ต้องแนบรายชื่อก่อนได้ แต่วันอบรมต้องยืนยันว่าสามารถหาผู้เข้าร่วมได้
              </p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer" className="bg-tertiary-fixed-dim text-on-tertiary-container px-8 py-3 rounded-full font-headline-md text-[20px] hover:bg-[#c8cc42] hover:-translate-y-1 transition-all shadow-lg flex items-center gap-2 group">
                ลงทะเบียนศูนย์ดิจิทัลชุมชน
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>

          <div className="z-10 bg-surface-container-lowest p-5 rounded-3xl shadow-2xl transform md:rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105 group border-4 border-on-primary/20">
            <div className="overflow-hidden rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-[280px] h-[280px] object-cover mix-blend-multiply" alt="QR Code" src="/register_qr.png" />
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-primary font-headline-md bg-primary/5 py-2 rounded-lg">
              <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
              <span>Scan to Register</span>
            </div>
          </div>
        </div>
      </section>

      {/* E-Cert Banner Section (Hidden until SHOW_ECERT_LINK is enabled) */}
      {SHOW_ECERT_LINK && (
        <section className="py-md px-gutter max-w-container-max mx-auto w-full pt-8">
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-500/30">
            <div className="z-10 space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/30 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200">
                ✨ ใหม่! ระบบ Self-Service สำหรับผู้ดูแลศูนย์
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                ระบบออกใบประกาศนียบัตรอิเล็กทรอนิกส์ (E-Cert)
              </h2>
              <p className="text-emerald-100 text-sm md:text-base max-w-2xl">
                ผู้ดูแลศูนย์สามารถออกใบประกาศพร้อม QR Code ยืนยันสิทธิ์สำหรับผู้เข้าร่วมอบรมได้ทันทีด้วยตนเอง
              </p>
            </div>
            <Link
              href="/e-cert"
              className="z-10 shrink-0 bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 font-bold px-6 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all text-sm md:text-base inline-flex items-center gap-2 whitespace-nowrap"
            >
              ออกใบประกาศ E-Cert
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-xl px-gutter max-w-container-max mx-auto w-full scroll-mt-24">
        <div className="text-center mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface inline-block relative">
            คำถามที่พบบ่อย (FAQ)
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-tertiary-fixed-dim rounded-full"></div>
          </h2>
          <p className="text-on-surface-variant font-body-lg mt-4 max-w-2xl mx-auto">
            คำถามและคำตอบที่พบบ่อยเกี่ยวกับโครงการ Digital Thai Thai
          </p>
        </div>

        <div className="flex flex-col gap-lg max-w-4xl mx-auto">
          {FAQ_DATA.map((cat, catIdx) => (
            <div key={catIdx} className="glass-card p-md md:p-lg rounded-2xl shadow-sm bg-surface-container-lowest border border-outline-variant/30">
              <h3 className="font-headline-md text-[20px] md:text-[22px] text-primary border-b border-outline-variant/30 pb-sm mb-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[26px]">quiz</span>
                {cat.category}
              </h3>

              <div className="flex flex-col gap-sm">
                {cat.items.map((item, itemIdx) => {
                  const faqKey = `${catIdx}-${itemIdx}`;
                  const isOpen = openFaqs[faqKey];
                  return (
                    <div
                      key={itemIdx}
                      className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-container-low/30 transition-all"
                    >
                      <button
                        onClick={() => toggleFaq(faqKey)}
                        className="w-full p-4 text-left font-headline-md text-[16px] md:text-[18px] text-on-surface flex justify-between items-center gap-4 hover:bg-surface-container-high/40 transition-colors"
                      >
                        <span className="flex items-start gap-2.5">
                          <span className="text-primary font-bold shrink-0">Q:</span>
                          <span className="leading-snug">{item.q}</span>
                        </span>
                        <span className={`material-symbols-outlined text-primary transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                          keyboard_arrow_down
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-3 border-t border-outline-variant/10 text-on-surface-variant font-body-md whitespace-pre-line bg-surface-container-lowest/90 leading-relaxed">
                          <span className="text-tertiary font-bold mr-1.5">A:</span>
                          {renderAnswerWithLinks(item.a)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
              {/* <Link href="https://www.facebook.com" className="text-on-surface-variant hover:text-primary transition-all font-body-md flex items-center gap-1">Facebook</Link> */}
              <Link href="https://lin.ee/qGKVs12" className="text-on-surface-variant hover:text-primary transition-all font-body-md flex items-center gap-1">Line Official</Link>
              {/* <Link href="https://www.youtube.com" className="text-on-surface-variant hover:text-primary transition-all font-body-md flex items-center gap-1">YouTube</Link> */}
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
