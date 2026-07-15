import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { IntroSequence } from "@/components/intro/IntroSequence";
import { PhoneJourneyHero } from "@/components/home/PhoneJourneyHero";
import { PeopleSection } from "@/components/home/PeopleSection";
import { BentoSection } from "@/components/home/BentoSection";
import { ActivityChapter } from "@/components/home/ActivityChapter";
import { SafetySection } from "@/components/home/SafetySection";
import { TrustCarousel } from "@/components/home/TrustCarousel";
import { StatsSection } from "@/components/home/StatsSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { ScrollProgressPill } from "@/components/motion/ScrollProgressPill";
import { WaveBridge } from "@/components/journey/WaveBridge";
import { ColorMorphBridge } from "@/components/journey/ColorMorphBridge";

/**
 * Homepage journey (spec §3.2):
 * Hero(light) ─wave→ People(dark) ─wave→ Bento(light) ─morph→ ActivityChapter(day-arc)
 * ─wave→ Safety(dark) ─wave→ TrustCarousel(azure-tint) ─morph→ Stats(light) ─morph→ FinalCta(aurora)
 *
 * WaveBridge color logic: non-flipped = `base` (source) on top, `fill` (destination)
 * arches up from below; flipped = `fill` (source) arches down from the top over `base`.
 */
export default function Home() {
  return (
    <>
      <IntroSequence />
      <ScrollProgressPill />
      <Nav heroMode />
      <main id="main-content">
        {/* The hero now fades to --color-ink-dark-panel at its bottom, so it flows
            straight into PeopleSection. A WaveBridge here would only re-introduce
            a light band between two dark sections. */}
        <PhoneJourneyHero />
        <PeopleSection />
        {/* grad-dark-panel ENDS at #0F1120 — flipped arch must match that edge */}
        <WaveBridge fill="#0F1120" base="var(--color-bg)" flip height={80} />
        <BentoSection />
        <ColorMorphBridge from="#FBFCFF" to="#FFF3E0" heightVh={8} />
        <ActivityChapter />
        <WaveBridge fill="var(--color-ink-dark-panel)" height={90} />
        <SafetySection />
        <WaveBridge fill="#0F1120" base="var(--color-azure-tint)" flip height={80} />
        <TrustCarousel />
        <ColorMorphBridge from="#EBF1FF" to="#FBFCFF" heightVh={14} />
        <StatsSection />
        <ColorMorphBridge from="#FBFCFF" to="#EBF1FF" heightVh={10} />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
