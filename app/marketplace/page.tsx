import { Header } from "@/components/header"
import { MarketplaceGrid } from "@/components/marketplace-grid"
import { Footer } from "@/components/footer"

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">NFT Marketplace</h1>
          <p className="text-muted-foreground">Discover and collect unique digital artworks on Neura Protocol</p>
        </div>
        <MarketplaceGrid />
      </main>
      <Footer />
    </div>
  )
}
