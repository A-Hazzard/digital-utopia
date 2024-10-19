import type { Metadata } from "next";
import "./globals.css";
import { NextUIProvider } from "@nextui-org/react";

export const metadata: Metadata = {
  title: "Digital Utopia - Empower Your Financial Journey",
  description: "Join Digital Utopia to start your crypto journey, become a profitable trader, and access exclusive financial services.",
  keywords: "crypto, trading, financial independence, copy trading, digital opportunities, deposit, withdraw, invoices",
  openGraph: {
    title: "Digital Utopia",
    description: "Empower your financial journey with Digital Utopia.",
    url: "https://digital-utopia.vercel.app",
    siteName: "Digital Utopia",
    images: [
      {
        url: "https://digital-utopia.vercel.app/logo.svg",
        width: 800,
        height: 600,
        alt: "Digital Utopia",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Utopia",
    description: "Empower your financial journey with Digital Utopia.",
    images: ["https://digital-utopia.vercel.app/logo.svg"],
  },
};
//TODO add nextso to all pages
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NextUIProvider>
          {children}
        </NextUIProvider>
      </body>
    </html>
  );
}
