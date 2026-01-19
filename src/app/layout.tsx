import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import NavBar from "@/components/NavBar";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ATND · 출석 관리",
  description: "조직 단위 출석 체크를 위한 웹 기반 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_55%),radial-gradient(circle_at_25%_40%,_rgba(251,191,36,0.22),_transparent_45%)]" />
            <NavBar />
            <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
