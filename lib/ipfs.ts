// IPFS upload utilities
// Uploads are handled by server API routes to keep API keys secure

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
  properties: {
    category: string
    royaltyPercentage: number
    creator: string
  }
}

// Upload file to IPFS via server API route
export async function uploadFileToIPFS(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/ipfs/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload file to IPFS")
  }

  const data = await response.json()
  return data.url
}

// Upload JSON metadata to IPFS via server API route
export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  const response = await fetch("/api/ipfs/metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload metadata to IPFS")
  }

  const data = await response.json()
  return data.url
}

// Convert IPFS URI to HTTP gateway URL
export function ipfsToHttp(ipfsUri: string): string {
  if (!ipfsUri) return ""

  if (ipfsUri.startsWith("ipfs://")) {
    const hash = ipfsUri.replace("ipfs://", "")
    return `https://gateway.pinata.cloud/ipfs/${hash}`
  }

  if (ipfsUri.startsWith("data:")) {
    return ipfsUri
  }

  return ipfsUri
}

// Fetch metadata from IPFS
export async function fetchMetadataFromIPFS(tokenURI: string): Promise<NFTMetadata | null> {
  try {
    const url = ipfsToHttp(tokenURI)

    if (url.startsWith("data:application/json;base64,")) {
      const base64 = url.replace("data:application/json;base64,", "")
      const jsonString = decodeURIComponent(escape(atob(base64)))
      return JSON.parse(jsonString)
    }

    const response = await fetch(url)
    if (!response.ok) return null

    return response.json()
  } catch {
    return null
  }
}
