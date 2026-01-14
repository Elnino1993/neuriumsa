"use client"

import { CONTRACT_ADDRESSES, NFT_CONTRACT_ABI, MARKETPLACE_CONTRACT_ABI, NEURA_CHAIN } from "./neura-config"

// Helper to get ethers from window
async function getEthers() {
  const { ethers } = await import("ethers")
  return ethers
}

// Get provider from MetaMask
export async function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not installed")
  }
  const ethers = await getEthers()
  return new ethers.BrowserProvider(window.ethereum)
}

// Get signer for transactions
export async function getSigner() {
  const provider = await getProvider()
  return provider.getSigner()
}

// Get NFT contract instance
export async function getNFTContract(withSigner = false) {
  const ethers = await getEthers()
  if (withSigner) {
    const signer = await getSigner()
    return new ethers.Contract(CONTRACT_ADDRESSES.NFT, NFT_CONTRACT_ABI, signer)
  }
  const provider = await getProvider()
  return new ethers.Contract(CONTRACT_ADDRESSES.NFT, NFT_CONTRACT_ABI, provider)
}

// Get Marketplace contract instance
export async function getMarketplaceContract(withSigner = false) {
  const ethers = await getEthers()
  if (withSigner) {
    const signer = await getSigner()
    return new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_CONTRACT_ABI, signer)
  }
  const provider = await getProvider()
  return new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_CONTRACT_ABI, provider)
}

// Mint NFT function
export async function mintNFT(
  tokenURI: string,
  royaltyPercentage: number,
): Promise<{ txHash: string; tokenId: string }> {
  const ethers = await getEthers()
  const signer = await getSigner()
  const address = await signer.getAddress()

  console.log("[v0] Minting NFT with params:", { to: address, tokenURI, royaltyPercentage })
  console.log("[v0] Contract address:", CONTRACT_ADDRESSES.NFT)

  const isDeployed = await verifyContractDeployed(CONTRACT_ADDRESSES.NFT)
  console.log("[v0] Contract deployed:", isDeployed)

  if (!isDeployed) {
    throw new Error(
      `No contract found at ${CONTRACT_ADDRESSES.NFT}. Please verify the contract is deployed on Neura Testnet (Chain ID: ${NEURA_CHAIN.id}).`,
    )
  }

  const contract = await getNFTContract(true)

  let mintingFee = ethers.parseEther("0")
  try {
    mintingFee = await contract.mintingFee()
    console.log("[v0] Minting fee:", ethers.formatEther(mintingFee), "ANKR")
  } catch (e) {
    console.log("[v0] No minting fee function or error getting fee, assuming free mint:", e)
  }

  // Convert royalty percentage to basis points (e.g., 2.5% = 250)
  const royaltyBasisPoints = Math.round(royaltyPercentage * 100)
  console.log("[v0] Royalty basis points:", royaltyBasisPoints)

  try {
    console.log("[v0] Calling mintNFT with:", {
      to: address,
      uri: tokenURI,
      royaltyPercentage: royaltyBasisPoints,
      value: mintingFee.toString(),
    })

    // Try to estimate gas first to catch errors early
    let gasEstimate
    try {
      gasEstimate = await contract.mintNFT.estimateGas(address, tokenURI, royaltyBasisPoints, {
        value: mintingFee,
      })
      console.log("[v0] Estimated gas:", gasEstimate.toString())
    } catch (estimateError) {
      console.error("[v0] Gas estimation failed:", estimateError)
      throw new Error(
        `Gas estimation failed. The contract at ${CONTRACT_ADDRESSES.NFT} may have a different mintNFT function signature than expected. Check the contract ABI matches the deployed contract.`,
      )
    }

    const tx = await contract.mintNFT(address, tokenURI, royaltyBasisPoints, {
      value: mintingFee,
      gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
    })

    console.log("[v0] Transaction sent:", tx.hash)

    const receipt = await tx.wait()
    console.log("[v0] Transaction confirmed:", receipt.hash, "Status:", receipt.status)

    // Get token ID from Transfer event
    const transferEvent = receipt.logs.find(
      (log: { topics: string[] }) => log.topics[0] === ethers.id("Transfer(address,address,uint256)"),
    )

    let tokenId = "0"
    if (transferEvent && transferEvent.topics[3]) {
      tokenId = BigInt(transferEvent.topics[3]).toString()
    }
    console.log("[v0] Minted token ID:", tokenId)

    return { txHash: receipt.hash, tokenId }
  } catch (error) {
    console.error("[v0] Mint error details:", error)
    throw error
  }
}

// List NFT for sale
export async function listNFT(tokenId: string, priceInAnkr: string): Promise<string> {
  const ethers = await getEthers()
  const nftContract = await getNFTContract(true)
  const marketplaceContract = await getMarketplaceContract(true)

  // First approve marketplace to transfer NFT
  const approveTx = await nftContract.approve(CONTRACT_ADDRESSES.MARKETPLACE, tokenId)
  await approveTx.wait()

  // List on marketplace
  const price = ethers.parseEther(priceInAnkr)
  const listTx = await marketplaceContract.listItem(CONTRACT_ADDRESSES.NFT, tokenId, price)
  const receipt = await listTx.wait()

  return receipt.hash
}

// Buy NFT
export async function buyNFT(tokenId: string, priceInAnkr: string): Promise<string> {
  const ethers = await getEthers()
  const marketplaceContract = await getMarketplaceContract(true)

  const price = ethers.parseEther(priceInAnkr)
  const tx = await marketplaceContract.buyItem(CONTRACT_ADDRESSES.NFT, tokenId, {
    value: price,
  })

  const receipt = await tx.wait()
  return receipt.hash
}

// Create auction
export async function createAuction(
  tokenId: string,
  startingPriceInAnkr: string,
  durationInSeconds: number,
): Promise<string> {
  const ethers = await getEthers()
  const nftContract = await getNFTContract(true)
  const marketplaceContract = await getMarketplaceContract(true)

  // First approve marketplace
  const approveTx = await nftContract.approve(CONTRACT_ADDRESSES.MARKETPLACE, tokenId)
  await approveTx.wait()

  // Create auction
  const startingPrice = ethers.parseEther(startingPriceInAnkr)
  const tx = await marketplaceContract.createAuction(CONTRACT_ADDRESSES.NFT, tokenId, startingPrice, durationInSeconds)

  const receipt = await tx.wait()
  return receipt.hash
}

// Place bid
export async function placeBid(tokenId: string, bidAmountInAnkr: string): Promise<string> {
  const ethers = await getEthers()
  const marketplaceContract = await getMarketplaceContract(true)

  const bidAmount = ethers.parseEther(bidAmountInAnkr)
  const tx = await marketplaceContract.placeBid(CONTRACT_ADDRESSES.NFT, tokenId, {
    value: bidAmount,
  })

  const receipt = await tx.wait()
  return receipt.hash
}

// Get all active listings
export async function getActiveListings(): Promise<
  Array<{
    tokenId: string
    seller: string
    price: string
  }>
> {
  const ethers = await getEthers()
  try {
    const marketplaceContract = await getMarketplaceContract()
    const listings = await marketplaceContract.getActiveListings()

    return listings.map((listing: { tokenId: bigint; seller: string; price: bigint }) => ({
      tokenId: listing.tokenId.toString(),
      seller: listing.seller,
      price: ethers.formatEther(listing.price),
    }))
  } catch {
    return []
  }
}

// Get all active auctions
export async function getActiveAuctions(): Promise<
  Array<{
    tokenId: string
    seller: string
    highestBid: string
    endTime: number
  }>
> {
  const ethers = await getEthers()
  try {
    const marketplaceContract = await getMarketplaceContract()
    const auctions = await marketplaceContract.getActiveAuctions()

    return auctions.map((auction: { tokenId: bigint; seller: string; highestBid: bigint; endTime: bigint }) => ({
      tokenId: auction.tokenId.toString(),
      seller: auction.seller,
      highestBid: ethers.formatEther(auction.highestBid),
      endTime: Number(auction.endTime),
    }))
  } catch {
    return []
  }
}

// Get NFT metadata
export async function getNFTMetadata(tokenId: string): Promise<{
  tokenURI: string
  owner: string
}> {
  const contract = await getNFTContract()

  const [tokenURI, owner] = await Promise.all([contract.tokenURI(tokenId), contract.ownerOf(tokenId)])

  return { tokenURI, owner }
}

// Get user's NFTs
export async function getUserNFTs(address: string): Promise<string[]> {
  const contract = await getNFTContract()

  try {
    const balance = await contract.balanceOf(address)
    const tokenIds: string[] = []

    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i)
      tokenIds.push(tokenId.toString())
    }

    return tokenIds
  } catch {
    return []
  }
}

// Check if connected to correct chain
export async function checkNetwork(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return Number.parseInt(chainId, 16) === NEURA_CHAIN.id
  } catch {
    return false
  }
}

// Format address for display
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Parse transaction error
export function parseTransactionError(error: unknown): string {
  const err = error as {
    reason?: string
    message?: string
    code?: string
    data?: { message?: string }
    shortMessage?: string
  }

  console.log("[v0] Parsing error:", err)

  if (err.message?.includes("No contract found at")) return err.message
  if (err.message?.includes("Gas estimation failed")) return err.message

  if (err.reason) return err.reason
  if (err.shortMessage) return err.shortMessage
  if (err.data?.message) return err.data.message
  if (err.message?.includes("user rejected")) return "Transaction was rejected"
  if (err.message?.includes("insufficient funds")) return "Insufficient funds for transaction"
  if (err.message?.includes("execution reverted")) {
    const match = err.message.match(/execution reverted: (.+?)(?:"|$)/)
    if (match) return match[1]
    return "Transaction reverted by contract"
  }
  if (err.message?.includes("missing revert data")) {
    return "Contract call failed - the contract may not exist at this address or the function signature doesn't match"
  }
  if (err.code === "ACTION_REJECTED") return "Transaction was rejected"
  if (err.code === "CALL_EXCEPTION") return "Contract call failed - please check you are on the correct network"
  if (err.code === "NETWORK_ERROR") return "Network error - please check your connection"
  if (err.message?.includes("could not coalesce error"))
    return "Contract error - the contract may not be deployed on this network"

  return err.message || "Transaction failed. Please try again."
}

export async function verifyContractDeployed(contractAddress: string): Promise<boolean> {
  const provider = await getProvider()
  const code = await provider.getCode(contractAddress)
  // If no code at address, it returns "0x"
  return code !== "0x" && code !== "0x0"
}
