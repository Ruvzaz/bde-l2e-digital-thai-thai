import { Prompt } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const promptFont = Prompt({
  variable: "--font-prompt",
  weight: ['400', '600', '700'],
  subsets: ["latin", "thai"],
});

export const metadata = {
  title: "Digital Thai Thai",
  description: "โครงการอบรมและประกวดสื่อสร้างสรรค์",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background font-body-md relative overflow-x-hidden">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
