import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturedNFTs } from "@/components/featured-nfts"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturedNFTs />
      </main>
      <Footer />
    </div>
  )
}
