"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, ExternalLink, Settings, RefreshCw, Loader2, Plus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/hooks/use-wallet"
import { useNFTContract, type NFTItem } from "@/hooks/use-nft-contract"
import { getExplorerAddressUrl, NEURA_CHAIN } from "@/lib/neura-config"
import { useToast } from "@/hooks/use-toast"
import { ipfsToHttp } from "@/lib/ipfs"

export function ProfileSection() {
  const { address, balance, isConnected, connect, isCorrectChain } = useWallet()
  const { fetchUserNFTs, list, startAuction, isLoading } = useNFTContract()
  const { toast } = useToast()

  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [showListDialog, setShowListDialog] = useState(false)
  const [showAuctionDialog, setShowAuctionDialog] = useState(false)
  const [listPrice, setListPrice] = useState("")
  const [auctionPrice, setAuctionPrice] = useState("")
  const [auctionDuration, setAuctionDuration] = useState("24")

  const loadUserNFTs = useCallback(async () => {
    if (!address || !isConnected || !isCorrectChain) {
      setUserNFTs([])
      return
    }

    setIsLoadingNFTs(true)
    try {
      const nfts = await fetchUserNFTs()
      setUserNFTs(nfts)
    } catch (error) {
      console.error("Failed to load user NFTs:", error)
      setUserNFTs([])
    } finally {
      setIsLoadingNFTs(false)
    }
  }, [address, isConnected, isCorrectChain, fetchUserNFTs])

  useEffect(() => {
    loadUserNFTs()
  }, [loadUserNFTs])

  const getImageUrl = (nft: NFTItem) => {
    if (!nft.image) {
      return `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(nft.name)}`
    }
    return ipfsToHttp(nft.image)
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({ title: "Address copied!" })
    }
  }

  const handleList = async () => {
    if (!selectedNFT || !listPrice) return

    const result = await list(selectedNFT.tokenId, listPrice)
    if (result.success) {
      setShowListDialog(false)
      setListPrice("")
      setSelectedNFT(null)
      loadUserNFTs()
    }
  }

  const handleStartAuction = async () => {
    if (!selectedNFT || !auctionPrice || !auctionDuration) return

    const result = await startAuction(selectedNFT.tokenId, auctionPrice, Number.parseInt(auctionDuration))
    if (result.success) {
      setShowAuctionDialog(false)
      setAuctionPrice("")
      setAuctionDuration("24")
      setSelectedNFT(null)
      loadUserNFTs()
    }
  }

  if (!isConnected || !address) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to view your profile and NFT collection</p>
          <Button onClick={connect} className="gap-2">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">{address.slice(2, 4).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </h1>
                <Button variant="ghost" size="icon" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={getExplorerAddressUrl(address)} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
              <p className="text-muted-foreground mb-4">Connected to {NEURA_CHAIN.name}</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold text-primary">{balance} ANKR</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NFTs Owned</p>
                  <p className="text-lg font-semibold">{userNFTs.length}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadUserNFTs}
                disabled={isLoadingNFTs}
                className="gap-2 bg-transparent"
              >
                {isLoadingNFTs ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Tabs */}
      <Tabs defaultValue="collected" className="w-full">
        <TabsList>
          <TabsTrigger value="collected">Collected ({userNFTs.length})</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="listed">Listed</TabsTrigger>
        </TabsList>

        <TabsContent value="collected" className="mt-6">
          {isLoadingNFTs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userNFTs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {userNFTs.map((nft) => (
                <Card key={nft.tokenId} className="overflow-hidden border-border/50">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={getImageUrl(nft) || "/placeholder.svg"}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(nft.name)}`
                      }}
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold truncate">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground">Token #{nft.tokenId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setSelectedNFT(nft)
                          setShowListDialog(true)
                        }}
                      >
                        <Tag className="h-3 w-3" />
                        List
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 bg-transparent"
                        onClick={() => {
                          setSelectedNFT(nft)
                          setShowAuctionDialog(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Auction
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No NFTs collected yet</p>
              <Button asChild>
                <a href="/create">Create your first NFT</a>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="created" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">NFTs you&apos;ve created will appear here</p>
            <Button variant="link" asChild>
              <a href="/create">Create an NFT</a>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="listed" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Your listed NFTs will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedNFT && (
              <div className="flex items-center gap-4">
                <img
                  src={getImageUrl(selectedNFT) || "/placeholder.svg"}
                  alt={selectedNFT.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-semibold">{selectedNFT.name}</h4>
                  <p className="text-sm text-muted-foreground">Token #{selectedNFT.tokenId}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="list-price">Price (ANKR)</Label>
              <Input
                id="list-price"
                type="number"
                step="0.1"
                min="0"
                placeholder="Enter price in ANKR"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleList} disabled={isLoading || !listPrice}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Listing...
                </>
              ) : (
                "List for Sale"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAuctionDialog} onOpenChange={setShowAuctionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Auction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedNFT && (
              <div className="flex items-center gap-4">
                <img
                  src={getImageUrl(selectedNFT) || "/placeholder.svg"}
                  alt={selectedNFT.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-semibold">{selectedNFT.name}</h4>
                  <p className="text-sm text-muted-foreground">Token #{selectedNFT.tokenId}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="auction-price">Starting Price (ANKR)</Label>
              <Input
                id="auction-price"
                type="number"
                step="0.1"
                min="0"
                placeholder="Enter starting price"
                value={auctionPrice}
                onChange={(e) => setAuctionPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auction-duration">Duration (hours)</Label>
              <Input
                id="auction-duration"
                type="number"
                min="1"
                max="168"
                placeholder="Enter duration in hours"
                value={auctionDuration}
                onChange={(e) => setAuctionDuration(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Min 1 hour, Max 7 days (168 hours)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuctionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartAuction} disabled={isLoading || !auctionPrice || !auctionDuration}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Start Auction"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
