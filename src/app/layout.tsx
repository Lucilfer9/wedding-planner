import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jomar & Jenila | Wedding Planner — Lavender & Lanterns",
  description:
    "Official Wedding Planner & Tracker for Jomar & Jenila — Stella Maris Chapel & Sumlang Lake",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FAF8FF] text-[#2D223B]">
        {children}
      </body>
    </html>
  );
}
