"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Loader2, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NFTCard } from "@/components/nft-card"
import { useNFTContract, type NFTItem } from "@/hooks/use-nft-contract"
import { useWallet } from "@/hooks/use-wallet"
import { formatAddress } from "@/lib/contracts"

export function AuctionsGrid() {
  const { fetchAuctions } = useNFTContract()
  const { isConnected, isCorrectChain } = useWallet()

  const [auctions, setAuctions] = useState<NFTItem[]>([])
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(false)

  const loadAuctions = useCallback(async () => {
    if (!isConnected || !isCorrectChain) {
      setAuctions([])
      return
    }

    setIsLoadingAuctions(true)
    try {
      const liveAuctions = await fetchAuctions()
      setAuctions(liveAuctions)
    } catch (error) {
      console.error("Failed to load auctions:", error)
      setAuctions([])
    } finally {
      setIsLoadingAuctions(false)
    }
  }, [isConnected, isCorrectChain, fetchAuctions])

  useEffect(() => {
    loadAuctions()
  }, [loadAuctions])

  useEffect(() => {
    const interval = setInterval(() => {
      setAuctions((prev) => [...prev]) // Force re-render to update times
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <span className="text-muted-foreground">
            {auctions.length} active auction{auctions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button variant="outline" onClick={loadAuctions} disabled={isLoadingAuctions} className="gap-2 bg-transparent">
          {isLoadingAuctions ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {!isConnected && (
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground">Connect your wallet to view live auctions.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoadingAuctions ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctions.map((nft) => (
            <NFTCard
              key={nft.tokenId}
              tokenId={nft.tokenId}
              name={nft.name}
              image={nft.image}
              price={nft.price || "0"}
              creator={nft.creator ? formatAddress(nft.creator) : "Unknown"}
              category={nft.category}
              isAuction={true}
              endTime={nft.endTime}
              onSuccess={loadAuctions}
            />
          ))}
        </div>
      )}

      {auctions.length === 0 && !isLoadingAuctions && isConnected && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No active auctions at the moment</p>
        </div>
      )}
    </div>
  )
}
