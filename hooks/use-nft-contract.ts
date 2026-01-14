"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import {
  mintNFT,
  buyNFT,
  listNFT,
  placeBid,
  createAuction,
  getActiveListings,
  getActiveAuctions,
  getUserNFTs,
  getNFTMetadata,
  parseTransactionError,
} from "@/lib/contracts"
import { uploadFileToIPFS, uploadMetadataToIPFS, fetchMetadataFromIPFS, type NFTMetadata } from "@/lib/ipfs"

export interface NFTItem {
  tokenId: string
  name: string
  description: string
  image: string
  price?: string
  owner?: string
  creator?: string
  category?: string
  isAuction?: boolean
  endTime?: number
}

export function useNFTContract() {
  const { toast } = useToast()
  const { address, isConnected, isCorrectChain } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  // Mint a new NFT
  const mint = useCallback(
    async (
      imageFile: File,
      name: string,
      description: string,
      category: string,
      royaltyPercentage: number,
    ): Promise<{ success: boolean; tokenId?: string; txHash?: string }> => {
      if (!isConnected || !isCorrectChain || !address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to Neura network",
          variant: "destructive",
        })
        return { success: false }
      }

      setIsLoading(true)

      try {
        // Upload image to IPFS
        toast({ title: "Uploading image...", description: "Uploading your image to IPFS" })
        const imageUrl = await uploadFileToIPFS(imageFile)

        // Create and upload metadata
        toast({ title: "Creating metadata...", description: "Preparing NFT metadata" })
        const metadata: NFTMetadata = {
          name,
          description,
          image: imageUrl,
          attributes: [{ trait_type: "Category", value: category }],
          properties: {
            category,
            royaltyPercentage,
            creator: address,
          },
        }

        const metadataUrl = await uploadMetadataToIPFS(metadata)

        // Mint NFT on blockchain
        toast({ title: "Minting NFT...", description: "Please confirm the transaction in your wallet" })
        const result = await mintNFT(metadataUrl, royaltyPercentage)

        toast({
          title: "NFT Minted!",
          description: `Token #${result.tokenId} has been minted successfully`,
        })

        return { success: true, tokenId: result.tokenId, txHash: result.txHash }
      } catch (error) {
        const message = parseTransactionError(error)
        toast({
          title: "Minting failed",
          description: message,
          variant: "destructive",
        })
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [address, isConnected, isCorrectChain, toast],
  )

  // Buy an NFT
  const buy = useCallback(
    async (tokenId: string, price: string): Promise<{ success: boolean; txHash?: string }> => {
      if (!isConnected || !isCorrectChain) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to Neura network",
          variant: "destructive",
        })
        return { success: false }
      }

      setIsLoading(true)

      try {
        toast({ title: "Processing purchase...", description: "Please confirm the transaction" })
        const txHash = await buyNFT(tokenId, price)

        toast({
          title: "Purchase successful!",
          description: `You now own Token #${tokenId}`,
        })

        return { success: true, txHash }
      } catch (error) {
        const message = parseTransactionError(error)
        toast({
          title: "Purchase failed",
          description: message,
          variant: "destructive",
        })
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected, isCorrectChain, toast],
  )

  // List NFT for sale
  const list = useCallback(
    async (tokenId: string, price: string): Promise<{ success: boolean; txHash?: string }> => {
      if (!isConnected || !isCorrectChain) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to Neura network",
          variant: "destructive",
        })
        return { success: false }
      }

      setIsLoading(true)

      try {
        toast({ title: "Listing NFT...", description: "Please approve and confirm the transactions" })
        const txHash = await listNFT(tokenId, price)

        toast({
          title: "NFT Listed!",
          description: `Token #${tokenId} is now for sale at ${price} ANKR`,
        })

        return { success: true, txHash }
      } catch (error) {
        const message = parseTransactionError(error)
        toast({
          title: "Listing failed",
          description: message,
          variant: "destructive",
        })
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected, isCorrectChain, toast],
  )

  // Place bid on auction
  const bid = useCallback(
    async (tokenId: string, amount: string): Promise<{ success: boolean; txHash?: string }> => {
      if (!isConnected || !isCorrectChain) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to Neura network",
          variant: "destructive",
        })
        return { success: false }
      }

      setIsLoading(true)

      try {
        toast({ title: "Placing bid...", description: "Please confirm the transaction" })
        const txHash = await placeBid(tokenId, amount)

        toast({
          title: "Bid placed!",
          description: `Your bid of ${amount} ANKR has been placed`,
        })

        return { success: true, txHash }
      } catch (error) {
        const message = parseTransactionError(error)
        toast({
          title: "Bid failed",
          description: message,
          variant: "destructive",
        })
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected, isCorrectChain, toast],
  )

  // Start an auction
  const startAuction = useCallback(
    async (
      tokenId: string,
      startingPrice: string,
      durationHours: number,
    ): Promise<{ success: boolean; txHash?: string }> => {
      if (!isConnected || !isCorrectChain) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to Neura network",
          variant: "destructive",
        })
        return { success: false }
      }

      setIsLoading(true)

      try {
        toast({ title: "Creating auction...", description: "Please approve and confirm the transactions" })
        const durationSeconds = durationHours * 60 * 60
        const txHash = await createAuction(tokenId, startingPrice, durationSeconds)

        toast({
          title: "Auction created!",
          description: `Token #${tokenId} auction started at ${startingPrice} ANKR`,
        })

        return { success: true, txHash }
      } catch (error) {
        const message = parseTransactionError(error)
        toast({
          title: "Auction creation failed",
          description: message,
          variant: "destructive",
        })
        return { success: false }
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected, isCorrectChain, toast],
  )

  // Fetch marketplace listings
  const fetchListings = useCallback(async (): Promise<NFTItem[]> => {
    try {
      const listings = await getActiveListings()
      const items: NFTItem[] = []

      for (const listing of listings) {
        try {
          const { tokenURI, owner } = await getNFTMetadata(listing.tokenId)
          const metadata = await fetchMetadataFromIPFS(tokenURI)

          if (metadata) {
            items.push({
              tokenId: listing.tokenId,
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              price: listing.price,
              owner,
              creator: metadata.properties?.creator,
              category: metadata.properties?.category,
            })
          }
        } catch {
          // Skip NFTs that fail to load
        }
      }

      return items
    } catch {
      return []
    }
  }, [])

  // Fetch active auctions
  const fetchAuctions = useCallback(async (): Promise<NFTItem[]> => {
    try {
      const auctions = await getActiveAuctions()
      const items: NFTItem[] = []

      for (const auction of auctions) {
        try {
          const { tokenURI, owner } = await getNFTMetadata(auction.tokenId)
          const metadata = await fetchMetadataFromIPFS(tokenURI)

          if (metadata) {
            items.push({
              tokenId: auction.tokenId,
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              price: auction.highestBid,
              owner,
              creator: metadata.properties?.creator,
              category: metadata.properties?.category,
              isAuction: true,
              endTime: auction.endTime,
            })
          }
        } catch {
          // Skip auctions that fail to load
        }
      }

      return items
    } catch {
      return []
    }
  }, [])

  // Fetch user's NFTs
  const fetchUserNFTs = useCallback(async (): Promise<NFTItem[]> => {
    if (!address) return []

    try {
      const tokenIds = await getUserNFTs(address)
      const items: NFTItem[] = []

      for (const tokenId of tokenIds) {
        try {
          const { tokenURI, owner } = await getNFTMetadata(tokenId)
          const metadata = await fetchMetadataFromIPFS(tokenURI)

          if (metadata) {
            items.push({
              tokenId,
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              owner,
              creator: metadata.properties?.creator,
              category: metadata.properties?.category,
            })
          }
        } catch {
          // Skip NFTs that fail to load
        }
      }

      return items
    } catch {
      return []
    }
  }, [address])

  return {
    mint,
    buy,
    list,
    bid,
    startAuction,
    fetchListings,
    fetchAuctions,
    fetchUserNFTs,
    isLoading,
  }
}
