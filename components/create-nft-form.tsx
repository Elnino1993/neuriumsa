"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  ImageIcon,
  Upload,
  Sparkles,
  Tag,
  DollarSign,
  FileText,
  Loader2,
  ExternalLink,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useWallet } from "@/hooks/use-wallet"
import { useNFTContract } from "@/hooks/use-nft-contract"
import { useToast } from "@/hooks/use-toast"
import { getExplorerTxUrl, getExplorerTokenUrl } from "@/lib/neura-config"

const categories = ["Art", "Photography", "Music", "Video", "Collectibles", "Gaming", "Sports", "Utility"]

type MintingStep = "idle" | "uploading" | "metadata" | "minting" | "success"

export function CreateNFTForm() {
  const { isConnected, connect, isCorrectChain, switchToNeura, address } = useWallet()
  const { mint, isLoading } = useNFTContract()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Art",
    royalty: "2.5",
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [mintingStep, setMintingStep] = useState<MintingStep>("idle")
  const [mintResult, setMintResult] = useState<{ tokenId?: string; txHash?: string } | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Maximum file size is 50MB",
            variant: "destructive",
          })
          return
        }
        setImage(file)
        const reader = new FileReader()
        reader.onload = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/svg+xml": [".svg"],
    },
    maxFiles: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      connect()
      return
    }

    if (!isCorrectChain) {
      await switchToNeura()
      return
    }

    if (!image || !formData.name || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setMintingStep("uploading")
    setMintResult(null)

    try {
      setMintingStep("metadata")

      // Small delay to show step
      await new Promise((r) => setTimeout(r, 500))

      setMintingStep("minting")

      const result = await mint(
        image,
        formData.name,
        formData.description,
        formData.category,
        Number.parseFloat(formData.royalty),
      )

      if (result.success) {
        setMintingStep("success")
        setMintResult({ tokenId: result.tokenId, txHash: result.txHash })
      } else {
        setMintingStep("idle")
      }
    } catch {
      setMintingStep("idle")
      toast({
        title: "Minting failed",
        description: "There was an error minting your NFT. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", category: "Art", royalty: "2.5" })
    setImage(null)
    setImagePreview(null)
    setMintingStep("idle")
    setMintResult(null)
  }

  if (mintingStep === "success" && mintResult) {
    return (
      <Card className="max-w-lg mx-auto border-primary/50">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">NFT Minted Successfully!</h2>
            <p className="text-muted-foreground">
              Your NFT &ldquo;{formData.name}&rdquo; has been minted on Neura Protocol
            </p>
          </div>

          {imagePreview && (
            <div className="rounded-lg overflow-hidden border border-border max-w-xs mx-auto">
              <img src={imagePreview || "/placeholder.svg"} alt={formData.name} className="w-full h-auto" />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {mintResult.txHash && (
              <a
                href={getExplorerTxUrl(mintResult.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View Transaction
              </a>
            )}
            {mintResult.tokenId && (
              <a
                href={getExplorerTokenUrl(mintResult.tokenId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View NFT (Token #{mintResult.tokenId})
              </a>
            )}
          </div>

          <Button onClick={resetForm} className="w-full">
            Mint Another NFT
          </Button>
        </CardContent>
      </Card>
    )
  }

  const MintingProgress = () => {
    if (mintingStep === "idle") return null

    const steps = [
      { key: "uploading", label: "Uploading image to IPFS" },
      { key: "metadata", label: "Creating metadata" },
      { key: "minting", label: "Minting on blockchain" },
    ]

    return (
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
        {steps.map((step, index) => {
          const stepIndex = steps.findIndex((s) => s.key === mintingStep)
          const isActive = step.key === mintingStep
          const isComplete = index < stepIndex

          return (
            <div key={step.key} className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : isActive ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={isActive ? "text-foreground" : isComplete ? "text-primary" : "text-muted-foreground"}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-4xl mx-auto border-border/50">
        <CardContent className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Image Upload */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-primary" />
                Upload Image <span className="text-destructive">*</span>
              </Label>

              <div
                {...getRootProps()}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 
                  transition-colors cursor-pointer min-h-[300px]
                  flex flex-col items-center justify-center
                  ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                  ${isLoading ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input {...getInputProps()} disabled={isLoading} />

                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-auto max-h-[250px] object-contain rounded-lg"
                    />
                    <p className="text-center text-sm text-muted-foreground mt-3">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground mb-1">
                      {isDragActive ? "Drop your image here" : "Drag and drop your image here"}
                    </p>
                    <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
                    <Button type="button" variant="outline" className="gap-2 bg-transparent">
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">Max 50MB. JPG, PNG, GIF, SVG supported</p>
                  </div>
                )}
              </div>

              <MintingProgress />
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-6">
              {/* NFT Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  NFT Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter a unique name for your NFT"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-background"
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your NFT and its story"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-background resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Royalty */}
              <div className="space-y-2">
                <Label htmlFor="royalty" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Royalty Percentage
                </Label>
                <div className="relative">
                  <Input
                    id="royalty"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.royalty}
                    onChange={(e) => setFormData((prev) => ({ ...prev, royalty: e.target.value }))}
                    className="bg-background pr-8"
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll receive this percentage from future sales (max 10%)
                </p>
              </div>

              {isConnected && address && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Minting to:</p>
                  <p className="font-mono text-sm">
                    {address.slice(0, 10)}...{address.slice(-8)}
                  </p>
                </div>
              )}

              {/* Mint Button */}
              <Button type="submit" className="w-full gap-2 h-12 text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {!isConnected ? "Connect Wallet to Mint" : !isCorrectChain ? "Switch to Neura" : "Mint NFT"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
