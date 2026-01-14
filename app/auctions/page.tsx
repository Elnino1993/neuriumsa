import { Header } from "@/components/header"
import { AuctionsGrid } from "@/components/auctions-grid"
import { Footer } from "@/components/footer"

export default function AuctionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">Live Auctions</h1>
          <p className="text-muted-foreground">Bid on exclusive NFTs and win unique digital collectibles</p>
        </div>
        <AuctionsGrid />
      </main>
      <Footer />
    </div>
  )
}
