"use client";

import { useEffect, useState } from "react";

export default function CanvasTestPage() {
  const [testName, setTestName] = useState("นายสรัลชนา วิชิตชาญ");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-slate-100 min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-slate-900">
          🧪 iOS WebKit Centering Comparison
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            id="testInput"
            type="text"
            defaultValue={testName}
            className="px-4 py-3 border border-slate-300 rounded-xl text-base w-full sm:w-96 font-medium"
            placeholder="พิมพ์ชื่อทดสอบ..."
          />
          <button
            id="redrawBtn"
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow active:scale-95 transition"
          >
            🔄 วาดใหม่ (Re-draw)
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <h2 className="font-bold text-red-600 text-base">
            ❌ Method 1: Canvas `textAlign = "center"` (iOS Bugged - Starts at Red Line)
          </h2>
          <canvas id="c1" width="1000" height="300" className="w-full border rounded-xl bg-white aspect-[1000/300]" />
          <p className="text-xs text-slate-500 font-medium">📍 iOS WebKit บั๊ค: วางจุดเริ่มต้น (Start) ที่เส้นสีแดงแล้วยื่นขวา</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <h2 className="font-bold text-purple-800 text-base">
            ✅ Method 3: SVG Engine `text-anchor="middle"`
          </h2>
          <canvas id="c3" width="1000" height="300" className="w-full border rounded-xl bg-white aspect-[1000/300]" />
          <p className="text-xs text-slate-500 font-medium">📍 เช็คผลวาดผ่าน SVG Engine บน iOS</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <h2 className="font-bold text-emerald-700 text-base">
            ✅ Method 4: Calculated Left Offset (`X = 500 - (measuredWidth / 2)`)
          </h2>
          <canvas id="c4" width="1000" height="300" className="w-full border rounded-xl bg-white aspect-[1000/300]" />
          <p className="text-xs text-slate-500 font-medium">📍 เช็คผลคำนวณระยะซ้ายด้วย measureText</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <h2 className="font-bold text-blue-700 text-base">
            ✅ Method 5: HTML/CSS Standard DOM Overlay (`text-center`)
          </h2>
          <div className="relative w-full aspect-[1000/300] bg-white border rounded-xl overflow-hidden flex items-center justify-center">
            <div className="absolute inset-y-0 left-1/2 w-1 bg-red-500 transform -translate-x-1/2" />
            <span id="domText" className="text-2xl font-bold text-slate-900 z-10 font-sans">
              นายสรัลชนา วิชิตชาญ
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">📍 CSS Flexbox text-center มาตรฐาน</p>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            function runDraw() {
              var input = document.getElementById('testInput');
              var text = input ? input.value : 'นายสรัลชนา วิชิตชาญ';
              var dpr = window.devicePixelRatio || 1;

              var domText = document.getElementById('domText');
              if (domText) domText.innerText = text;

              function setup(id) {
                var c = document.getElementById(id);
                if (!c) return null;
                c.width = 1000 * dpr;
                c.height = 300 * dpr;
                var ctx = c.getContext('2d');
                ctx.scale(dpr, dpr);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 1000, 300);

                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(500, 0);
                ctx.lineTo(500, 300);
                ctx.stroke();
                return ctx;
              }

              // M1: Bugged Canvas Center
              var ctx1 = setup('c1');
              if (ctx1) {
                ctx1.font = "bold 44px sans-serif";
                ctx1.textAlign = "center";
                ctx1.textBaseline = "middle";
                ctx1.fillStyle = "#0f172a";
                ctx1.fillText(text, 500, 150);
              }

              // M3: SVG text-anchor middle
              var ctx3 = setup('c3');
              if (ctx3) {
                var svgString = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="300">' +
                  '<text x="500" y="150" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="44" fill="#0f172a">' + text + '</text>' +
                  '</svg>';
                var img = new Image();
                var blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                var url = URL.createObjectURL(blob);
                img.onload = function() {
                  ctx3.drawImage(img, 0, 0, 1000, 300);
                  URL.revokeObjectURL(url);
                };
                img.src = url;
              }

              // M4: Left Offset Math with ctx.textAlign = "left"
              var ctx4 = setup('c4');
              if (ctx4) {
                ctx4.font = "bold 44px sans-serif";
                ctx4.textAlign = "left";
                ctx4.textBaseline = "middle";
                var measuredW = ctx4.measureText(text).width;
                var leftX = 500 - (measuredW / 2);
                ctx4.fillStyle = "#0f172a";
                ctx4.fillText(text, leftX, 150);
              }
            }

            setTimeout(runDraw, 100);
            setTimeout(runDraw, 500);

            var btn = document.getElementById('redrawBtn');
            if (btn) btn.addEventListener('click', runDraw);

            var inputEl = document.getElementById('testInput');
            if (inputEl) inputEl.addEventListener('input', runDraw);
          `,
        }}
      />
    </div>
  );
}
