import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Artifice - Polymarket Markets",
  description: "Top Polymarket markets by 24h volume",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geist.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
