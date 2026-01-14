"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { NFTCard } from "@/components/nft-card"
import { useNFTContract, type NFTItem } from "@/hooks/use-nft-contract"
import { useWallet } from "@/hooks/use-wallet"
import { formatAddress } from "@/lib/contracts"

export function FeaturedNFTs() {
  const { fetchListings } = useNFTContract()
  const { isConnected, isCorrectChain } = useWallet()

  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadNFTs = useCallback(async () => {
    if (!isConnected || !isCorrectChain) {
      setNfts([])
      return
    }

    setIsLoading(true)
    try {
      const listings = await fetchListings()
      // Show only first 4 NFTs as featured
      setNfts(listings.slice(0, 4))
    } catch (error) {
      console.error("Failed to load featured NFTs:", error)
      setNfts([])
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, isCorrectChain, fetchListings])

  useEffect(() => {
    loadNFTs()
  }, [loadNFTs])

  // Don't show section if no NFTs
  if (!isConnected || nfts.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Featured NFTs</h2>
          <p className="text-muted-foreground">Discover trending digital collectibles from top creators</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                tokenId={nft.tokenId}
                name={nft.name}
                image={nft.image}
                price={nft.price || "0"}
                creator={nft.creator ? formatAddress(nft.creator) : "Unknown"}
                category={nft.category}
                onSuccess={loadNFTs}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
