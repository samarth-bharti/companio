import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Lora } from "next/font/google";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { MotionPreferenceProvider } from "@/lib/motionPreference";
import { MotionToggle } from "@/components/motion/MotionToggle";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"], // optical-size axis: richer serifs at display scale
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Companio, Trusted. Verified. Companionship.",
  description:
    "Book ID-verified companions for city guiding, events, gym, conversation, and more. Strictly platonic. Indian market.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakarta.variable} ${lora.variable} h-full antialiased`}
    >
      <head>
        {/* Warm up the Spline origin so the desktop bento 3D iframe connects faster. */}
        <link rel="preconnect" href="https://my.spline.design" />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <MotionPreferenceProvider>
          <LenisProvider>{children}</LenisProvider>
          <MotionToggle />
        </MotionPreferenceProvider>
      </body>
    </html>
  );
}
