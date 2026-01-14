"use client"

import { useState, useEffect, useCallback } from "react"
import { NEURA_CHAIN } from "@/lib/neura-config"

interface WalletState {
  address: string | null
  balance: string
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: "0",
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  })

  const getBalance = useCallback(async (address: string) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) return "0"

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      const balanceInAnkr = Number.parseInt(balance, 16) / 1e18
      return balanceInAnkr.toFixed(4)
    } catch {
      return "0"
    }
  }, [])

  const switchToNeura = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return false

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${NEURA_CHAIN.id.toString(16)}` }],
      })
      return true
    } catch (switchError: unknown) {
      const error = switchError as { code?: number }
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${NEURA_CHAIN.id.toString(16)}`,
                chainName: NEURA_CHAIN.name,
                nativeCurrency: NEURA_CHAIN.nativeCurrency,
                rpcUrls: [NEURA_CHAIN.rpcUrls.default],
                blockExplorerUrls: [NEURA_CHAIN.blockExplorers.default.url],
              },
            ],
          })
          return true
        } catch {
          return false
        }
      }
      return false
    }
  }, [])

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((prev) => ({ ...prev, error: "Please install MetaMask" }))
      return
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }))

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      const address = accounts[0]
      await switchToNeura()

      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      const balance = await getBalance(address)

      setState({
        address,
        balance,
        chainId: Number.parseInt(chainId, 16),
        isConnected: true,
        isConnecting: false,
        error: null,
      })
    } catch (err: unknown) {
      const error = err as { message?: string }
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Failed to connect",
      }))
    }
  }, [getBalance, switchToNeura])

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: "0",
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        const balance = await getBalance(accounts[0])
        setState((prev) => ({
          ...prev,
          address: accounts[0],
          balance,
        }))
      }
    }

    const handleChainChanged = (chainId: string) => {
      setState((prev) => ({
        ...prev,
        chainId: Number.parseInt(chainId, 16),
      }))
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum?.removeListener("chainChanged", handleChainChanged)
    }
  }, [disconnect, getBalance])

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        })

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          const balance = await getBalance(accounts[0])

          setState({
            address: accounts[0],
            balance,
            chainId: Number.parseInt(chainId, 16),
            isConnected: true,
            isConnecting: false,
            error: null,
          })
        }
      } catch {
        // Silent fail for auto-connect
      }
    }

    checkConnection()
  }, [getBalance])

  return {
    ...state,
    connect,
    disconnect,
    switchToNeura,
    isCorrectChain: state.chainId === NEURA_CHAIN.id,
  }
}
