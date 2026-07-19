import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutShell } from "@/components/layout-shell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Villa Snag List & Inspection Management System",
  description: "Enterprise-grade snagging and quality control system for residential construction projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}

