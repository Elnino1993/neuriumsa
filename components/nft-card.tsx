"use client"

import { useState } from "react"
import { Heart, ShoppingCart, Gavel, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNFTContract } from "@/hooks/use-nft-contract"
import { useWallet } from "@/hooks/use-wallet"
import { ipfsToHttp } from "@/lib/ipfs"
import { getExplorerTxUrl } from "@/lib/neura-config"

interface NFTCardProps {
  tokenId: string
  name: string
  image: string
  price: string
  creator: string
  likes?: number
  category?: string
  isAuction?: boolean
  endTime?: number
  onSuccess?: () => void
}

export function NFTCard({
  tokenId,
  name,
  image,
  price,
  creator,
  likes = 0,
  category,
  isAuction,
  endTime,
  onSuccess,
}: NFTCardProps) {
  const { buy, bid, isLoading } = useNFTContract()
  const { isConnected, connect } = useWallet()

  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [showBidDialog, setShowBidDialog] = useState(false)
  const [bidAmount, setBidAmount] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getTimeLeft = () => {
    if (!endTime) return null
    const now = Math.floor(Date.now() / 1000)
    const diff = endTime - now
    if (diff <= 0) return "Ended"

    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const handleBuy = async () => {
    if (!isConnected) {
      connect()
      return
    }

    const result = await buy(tokenId, price)
    if (result.success && result.txHash) {
      setTxHash(result.txHash)
      onSuccess?.()
    }
  }

  const handleBid = async () => {
    if (!isConnected) {
      connect()
      return
    }

    if (!bidAmount || Number.parseFloat(bidAmount) <= Number.parseFloat(price)) {
      return
    }

    const result = await bid(tokenId, bidAmount)
    if (result.success && result.txHash) {
      setTxHash(result.txHash)
      setShowBidDialog(false)
      setBidAmount("")
      onSuccess?.()
    }
  }

  const getImageUrl = () => {
    if (!image || imageError) {
      return `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(name)}`
    }
    return ipfsToHttp(image)
  }

  const imageUrl = getImageUrl()

  return (
    <>
      <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
        <CardContent className="p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {category && (
              <Badge className="absolute top-3 left-3 bg-background/80 text-foreground backdrop-blur-sm">
                {category}
              </Badge>
            )}
            {isAuction && (
              <Badge variant="destructive" className="absolute top-3 right-3">
                {getTimeLeft()}
              </Badge>
            )}
            <button
              onClick={() => setLiked(!liked)}
              className={`absolute bottom-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm 
                opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background
                ${liked ? "text-red-500" : ""}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 p-4">
          <div className="w-full">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            <p className="text-sm text-muted-foreground truncate">by {creator}</p>
            <p className="text-xs text-muted-foreground mt-1">Token #{tokenId}</p>
          </div>
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-xs text-muted-foreground">{isAuction ? "Current bid" : "Price"}</p>
              <p className="font-semibold text-primary">{price} ANKR</p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-3 w-3" />
              <span className="text-xs">{likes + (liked ? 1 : 0)}</span>
            </div>
          </div>
          <Button
            className="w-full gap-2"
            variant={isAuction ? "outline" : "default"}
            onClick={() => (isAuction ? setShowBidDialog(true) : setShowBuyDialog(true))}
          >
            {isAuction ? (
              <>
                <Gavel className="h-4 w-4" />
                Place Bid
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Buy Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <img src={imageUrl || "/placeholder.svg"} alt={name} className="w-20 h-20 rounded-lg object-cover" />
              <div>
                <h4 className="font-semibold">{name}</h4>
                <p className="text-sm text-muted-foreground">Token #{tokenId}</p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-t border-b">
              <span>Price</span>
              <span className="font-semibold text-primary">{price} ANKR</span>
            </div>
            {txHash && (
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                View Transaction
              </a>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBuy} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place a Bid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <img src={imageUrl || "/placeholder.svg"} alt={name} className="w-20 h-20 rounded-lg object-cover" />
              <div>
                <h4 className="font-semibold">{name}</h4>
                <p className="text-sm text-muted-foreground">Token #{tokenId}</p>
                <p className="text-sm">
                  Current bid: <span className="text-primary font-semibold">{price} ANKR</span>
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bid-amount">Your Bid (ANKR)</Label>
              <Input
                id="bid-amount"
                type="number"
                step="0.1"
                min={Number.parseFloat(price) + 0.1}
                placeholder={`Min: ${(Number.parseFloat(price) + 0.1).toFixed(1)} ANKR`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Bid must be higher than current bid</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBidDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBid}
              disabled={isLoading || !bidAmount || Number.parseFloat(bidAmount) <= Number.parseFloat(price)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Place Bid"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
