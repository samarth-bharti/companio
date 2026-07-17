import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { SafetyJourney } from "@/components/safety/SafetyJourney";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety, Companio",
  description: "How Companio keeps every member safe: government-ID checks, human review of every companion, no auto-renewal, SOS tools, and strict platonic enforcement.",
};

export default function SafetyPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <SafetyJourney />
      </main>
      <Footer />
    </>
  );
}
