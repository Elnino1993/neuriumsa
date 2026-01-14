import { type NextRequest, NextResponse } from "next/server"

const PINATA_API_KEY = process.env.PINATA_API_KEY || ""
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || ""

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // If no Pinata keys, use base64 data URL as fallback for demo
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString("base64")
      const mimeType = file.type || "image/png"
      const dataUrl = `data:${mimeType};base64,${base64}`

      return NextResponse.json({ url: dataUrl })
    }

    // Upload to Pinata
    const pinataFormData = new FormData()
    pinataFormData.append("file", file)

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: pinataFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Pinata upload error:", errorText)
      return NextResponse.json({ error: "Failed to upload to IPFS" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ url: `ipfs://${data.IpfsHash}` })
  } catch (error) {
    console.error("IPFS upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
