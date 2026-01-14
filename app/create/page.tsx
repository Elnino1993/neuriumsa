import { Header } from "@/components/header"
import { CreateNFTForm } from "@/components/create-nft-form"
import { Footer } from "@/components/footer"

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">Create Your NFT</h1>
          <p className="text-muted-foreground">
            Upload your digital art and mint it as an NFT on the Neura Protocol blockchain
          </p>
        </div>
        <CreateNFTForm />
      </main>
      <Footer />
    </div>
  )
}
