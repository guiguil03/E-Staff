import Hero from "@/components/home/Hero";
import Roadmap from "@/components/home/Roadmap";
import Vision from "@/components/home/Vision";
import TrustStrip from "@/components/home/TrustStrip";

export default function Home() {
  return (
    <div className="min-h-screen bg-obsidian">
      <Hero />
      <Roadmap />
      <Vision />
      <TrustStrip />
    </div>
  );
}
