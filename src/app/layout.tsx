import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--f-fraunces" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--f-hanken" });
const splineMono = Spline_Sans_Mono({ subsets: ["latin"], variable: "--f-spline-mono" });

export const metadata: Metadata = {
  title: "Tend",
  description: "Goals, habits and tasks — one calm place.",
  appleWebApp: {
    capable: true,
    title: "Tend",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${hanken.variable} ${splineMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
