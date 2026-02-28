import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UAE Books - Accounting Software for UAE Businesses",
  description: "VAT-compliant invoicing, Corporate Tax calculations, WPS payroll, and comprehensive financial reporting for UAE businesses.",
  keywords: ["UAE", "accounting", "VAT", "corporate tax", "payroll", "WPS", "invoicing", "finance"],
  authors: [{ name: "UAE Books Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "UAE Books - Accounting Software for UAE Businesses",
    description: "The only accounting software built for UAE businesses",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
