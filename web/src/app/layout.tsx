import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LiverFusion AI — Research Prototype",
  description: "Liver fibrosis staging research prototype using ultrasound deep learning. Not for clinical diagnosis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen bg-slate-950 text-slate-100">
        {/* Rule 2: Mandatory disclaimer banner on every page */}
        <header className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs sm:text-sm py-2 px-4 text-center font-medium tracking-wide">
          Research prototype. Not for clinical diagnosis.
        </header>
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

