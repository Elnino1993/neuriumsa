"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Powered by Neura Protocol
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Create, Collect, and Trade <span className="text-primary">NFTs</span> on Neura
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
            The premier NFT marketplace on Neura Protocol. Experience sub-second transactions, instant finality, and a
            seamless Web3 experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/marketplace">
              <Button size="lg" className="gap-2 h-12 px-8">
                Explore Marketplace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 bg-transparent">
                <Sparkles className="h-4 w-4" />
                Create NFT
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">10K+</div>
              <div className="text-sm text-muted-foreground">NFTs Created</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">5K+</div>
              <div className="text-sm text-muted-foreground">Artists</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">2s</div>
              <div className="text-sm text-muted-foreground">Block Time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
