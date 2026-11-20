import type { Metadata } from "next";
import { Merriweather, Noto_Sans_Malayalam, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LoadingOverlay } from "@/src/components/ui/LoadingOverlay";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Heavy serif for the "St. Mary's" wordmark, matching the company logo.
const brand = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["900"],
});

// Malayalam glyphs (kaya type names). Listed after Jakarta in --font-sans, so
// Latin text keeps Jakarta and only Malayalam characters fall through to this.
const malayalam = Noto_Sans_Malayalam({
  variable: "--font-malayalam",
  subsets: ["malayalam"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "St. Mary's Banana Sale",
  description:
    "Banana Sale Management System — procurement, dispatch and customer ledgers for St. Mary's Banana Sale.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${malayalam.variable} ${brand.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <LoadingOverlay />
      </body>
    </html>
  );
}
