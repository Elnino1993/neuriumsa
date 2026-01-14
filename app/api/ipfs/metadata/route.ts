import { type NextRequest, NextResponse } from "next/server"

const PINATA_API_KEY = process.env.PINATA_API_KEY || ""
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || ""

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json()

    if (!metadata || !metadata.name) {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 })
    }

    // If no Pinata keys, encode as base64 data URL for demo
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      const jsonString = JSON.stringify(metadata)
      const base64 = Buffer.from(jsonString).toString("base64")
      return NextResponse.json({ url: `data:application/json;base64,${base64}` })
    }

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}-metadata`,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Pinata metadata error:", errorText)
      return NextResponse.json({ error: "Failed to upload metadata to IPFS" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ url: `ipfs://${data.IpfsHash}` })
  } catch (error) {
    console.error("IPFS metadata error:", error)
    return NextResponse.json({ error: "Metadata upload failed" }, { status: 500 })
  }
}
