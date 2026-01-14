"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, RefreshCw, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NFTCard } from "@/components/nft-card"
import { useNFTContract, type NFTItem } from "@/hooks/use-nft-contract"
import { useWallet } from "@/hooks/use-wallet"
import { formatAddress } from "@/lib/contracts"

export function MarketplaceGrid() {
  const { fetchListings } = useNFTContract()
  const { isConnected, isCorrectChain } = useWallet()

  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  const loadNFTs = useCallback(async () => {
    if (!isConnected || !isCorrectChain) {
      setNfts([])
      return
    }

    setIsLoadingNFTs(true)
    try {
      const listings = await fetchListings()
      setNfts(listings)
    } catch (error) {
      console.error("Failed to load NFTs:", error)
      setNfts([])
    } finally {
      setIsLoadingNFTs(false)
    }
  }, [isConnected, isCorrectChain, fetchListings])

  useEffect(() => {
    loadNFTs()
  }, [loadNFTs])

  const filteredNFTs = nfts
    .filter((nft) => {
      const matchesSearch = nft.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === "all" || nft.category?.toLowerCase() === category
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return Number.parseFloat(a.price || "0") - Number.parseFloat(b.price || "0")
      if (sortBy === "price-high") return Number.parseFloat(b.price || "0") - Number.parseFloat(a.price || "0")
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search NFTs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="art">Art</SelectItem>
            <SelectItem value="photography">Photography</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="gaming">Gaming</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadNFTs} disabled={isLoadingNFTs} className="gap-2 bg-transparent">
          {isLoadingNFTs ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {!isConnected && (
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground">Connect your wallet to view marketplace listings.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoadingNFTs ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredNFTs.map((nft) => (
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

          {filteredNFTs.length === 0 && isConnected && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No NFTs listed on the marketplace yet</p>
              <Button variant="link" asChild>
                <a href="/create">Create your first NFT</a>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
