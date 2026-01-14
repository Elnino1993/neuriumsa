export const NEURA_CHAIN = {
  id: 267,
  name: "Neura Testnet",
  network: "neura-testnet",
  nativeCurrency: {
    name: "ANKR",
    symbol: "ANKR",
    decimals: 18,
  },
  rpcUrls: {
    default: "https://testnet.rpc.neuraprotocol.io/",
    public: "https://testnet.rpc.neuraprotocol.io/",
  },
  blockExplorers: {
    default: {
      name: "Neura Explorer",
      url: "https://testnet-blockscout.infra.neuraprotocol.io/",
    },
  },
  faucet: "https://neuraverse.neuraprotocol.io/?section=faucet",
} as const

export const CONTRACT_ADDRESSES = {
  NFT: "0x962aA072462a15d04Cc887d3081F19E4ABdE3551", // Replace with deployed NFT contract
  MARKETPLACE: "0x75860ca36Ee6507A2c19cFD35a14e128923e087A", // Replace with deployed Marketplace contract
} as const

export const NFT_CONTRACT_ABI = [
  // Minting
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
      { name: "royaltyPercentage", type: "uint96" },
    ],
    name: "mintNFT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  // Token URI
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  // Balance
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Owner of
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Approve
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Set approval for all
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Get approved
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Is approved for all
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Transfer from
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Safe transfer from
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Total supply
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Token by index
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "tokenByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Token of owner by index
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Royalty info
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "salePrice", type: "uint256" },
    ],
    name: "royaltyInfo",
    outputs: [
      { name: "receiver", type: "address" },
      { name: "royaltyAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Minting fee
  {
    inputs: [],
    name: "mintingFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "approved", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
] as const

export const MARKETPLACE_CONTRACT_ABI = [
  // List item for sale
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    name: "listItem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Buy item
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "buyItem",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Cancel listing
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "cancelListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Update listing price
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "newPrice", type: "uint256" },
    ],
    name: "updateListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Create auction
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "startingPrice", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    name: "createAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Place bid
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "placeBid",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // End auction
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "endAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Get listing
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "getListing",
    outputs: [
      {
        components: [
          { name: "seller", type: "address" },
          { name: "price", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Get auction
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "getAuction",
    outputs: [
      {
        components: [
          { name: "seller", type: "address" },
          { name: "highestBidder", type: "address" },
          { name: "highestBid", type: "uint256" },
          { name: "startingPrice", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Get all active listings
  {
    inputs: [],
    name: "getActiveListings",
    outputs: [
      {
        components: [
          { name: "nftContract", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "price", type: "uint256" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Get all active auctions
  {
    inputs: [],
    name: "getActiveAuctions",
    outputs: [
      {
        components: [
          { name: "nftContract", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "highestBid", type: "uint256" },
          { name: "endTime", type: "uint256" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Platform fee percentage
  {
    inputs: [],
    name: "platformFeePercent",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seller", type: "address" },
      { indexed: true, name: "nftContract", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "price", type: "uint256" },
    ],
    name: "ItemListed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "buyer", type: "address" },
      { indexed: true, name: "nftContract", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "price", type: "uint256" },
    ],
    name: "ItemBought",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seller", type: "address" },
      { indexed: true, name: "nftContract", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "ItemCanceled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seller", type: "address" },
      { indexed: true, name: "nftContract", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "startingPrice", type: "uint256" },
      { indexed: false, name: "endTime", type: "uint256" },
    ],
    name: "AuctionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bidder", type: "address" },
      { indexed: true, name: "nftContract", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "BidPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "winner", type: "address" },
      { indexed: true, name: "nftContract", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "AuctionEnded",
    type: "event",
  },
] as const

export function getExplorerTxUrl(txHash: string): string {
  return `${NEURA_CHAIN.blockExplorers.default.url}/tx/${txHash}`
}

export function getExplorerAddressUrl(address: string): string {
  return `${NEURA_CHAIN.blockExplorers.default.url}/address/${address}`
}

export function getExplorerTokenUrl(tokenId: string): string {
  return `${NEURA_CHAIN.blockExplorers.default.url}/token/${CONTRACT_ADDRESSES.NFT}/instance/${tokenId}`
}
