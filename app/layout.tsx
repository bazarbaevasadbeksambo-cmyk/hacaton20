import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Daftar",
  description: "O'quvchi qaysi mavzuni tushunmaganini ko'rsatadigan maktab platformasi",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F2" },
    { media: "(prefers-color-scheme: dark)", color: "#11151B" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme and lang are set on the client before paint; the server can't know them.
    <html lang="uz" suppressHydrationWarning className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
