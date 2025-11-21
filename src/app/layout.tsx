import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weet AI - Image Generation Studio",
  description: "AI-powered image generation and editing with Gemini 3 Pro",
};

import { Navigation } from "@/components/ui/Navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased h-screen flex flex-col bg-zinc-950 text-white">
        <Navigation />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
