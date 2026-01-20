import type { Metadata } from "next";
import { IBM_Plex_Sans, Roboto, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import NavBar from "@/components/NavBar";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";
import { Analytics } from "@vercel/analytics/react";
import Footer from "@/components/Footer";

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

const google = Roboto({
  variable: "--font-google",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "ATND · Attendance",
  description: "Web-based attendance management for organizations.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${google.variable}`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          <LocaleProvider locale={locale} dictionary={dictionary}>
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.18),_transparent_55%),radial-gradient(circle_at_25%_40%,_rgba(251,191,36,0.22),_transparent_45%)]" />
              <NavBar />
              <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                {children}
              </main>
            </div>
            <Footer />
            <Analytics />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
