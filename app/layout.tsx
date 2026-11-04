import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { DataProvider } from "@/src/store/data-context";
import { AppShell } from "@/src/components/layout/AppShell";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "St. Mary's Banana Distribution",
  description:
    "Banana Distribution Management System — procurement, dispatch and vendor ledgers for St. Mary's Banana Distribution.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
