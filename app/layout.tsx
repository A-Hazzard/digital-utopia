import "./globals.css";
import { Providers } from "./providers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Utopia - Empower Your Financial Journey",
  description: "Join Digital Utopia to start your crypto journey, become a profitable trader, and access exclusive financial services.",
  keywords: "crypto, trading, financial independence, copy trading, digital opportunities, deposit, withdraw, invoices",
  openGraph: {
    title: "Digital Utopia",
    description: "Empower your financial journey with Digital Utopia.",
    url: "https://digitalutopia.app",
    siteName: "Digital Utopia",
    images: [
      {
        url: "https://digitalutopia.app/logo.png",
        width: 800,
        height: 600,
        alt: "Digital Utopia",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
