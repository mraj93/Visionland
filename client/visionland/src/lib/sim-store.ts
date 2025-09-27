"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export type Property = {
  id: string
  title: string
  location: string
  pricePerMonth: number
  description: string
  image: string
  active: boolean
  createdAt: number
}

export type Receipt = {
  id: string
  propertyId: string
  tenantAddress: string
  months: number
  amount: number
  cid: string
  txHash: string
  createdAt: number
}

export type Wallet = {
  address: string
}

const LS_KEYS = {
  properties: "visionland:properties",
  receipts: "visionland:receipts",
  wallet: "visionland:wallet",
} as const

function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

function generateMockCid() {
  // Not a real CID — just a base58-like string for demo purposes
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  let out = "Qm"
  for (let i = 0; i < 42; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

function generateMockTxHash() {
  let out = "0x"
  const hex = "0123456789abcdef"
  for (let i = 0; i < 64; i++) out += hex[Math.floor(Math.random() * hex.length)]
  return out
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function useSimStore() {
  const [properties, setProperties] = useState<Property[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)

  useEffect(() => {
    setProperties(readLS<Property[]>(LS_KEYS.properties, []))
    setReceipts(readLS<Receipt[]>(LS_KEYS.receipts, []))
    setWallet(readLS<Wallet | null>(LS_KEYS.wallet, null))
  }, [])

  useEffect(() => {
    writeLS(LS_KEYS.properties, properties)
  }, [properties])

  useEffect(() => {
    writeLS(LS_KEYS.receipts, receipts)
  }, [receipts])

  useEffect(() => {
    writeLS(LS_KEYS.wallet, wallet)
  }, [wallet])

  const ensureSeeded = useCallback(() => {
    if (properties.length > 0) return
    const seed: Property[] = [
      {
        id: uid("prop_"),
        title: "Sunny 2BR Apartment",
        location: "Austin, TX",
        pricePerMonth: 1400,
        description: "Bright 2-bedroom near parks and cafés.",
        image: "/sunny-2br-apartment-front.jpg",
        active: true,
        createdAt: Date.now() - 86400000,
      },
      {
        id: uid("prop_"),
        title: "Modern Loft",
        location: "Denver, CO",
        pricePerMonth: 2200,
        description: "Open-plan loft with city views.",
        image: "/modern-loft-exterior.jpg",
        active: true,
        createdAt: Date.now() - 43200000,
      },
      {
        id: uid("prop_"),
        title: "Cozy Cottage",
        location: "Portland, OR",
        pricePerMonth: 1750,
        description: "Charming cottage with garden.",
        image: "/cozy-cottage-front.jpg",
        active: false,
        createdAt: Date.now() - 21600000,
      },
    ]
    setProperties(seed)
  }, [properties.length])

  const addProperty = useCallback((p: Omit<Property, "id" | "active" | "createdAt">) => {
    setProperties((prev) => [
      {
        ...p,
        id: uid("prop_"),
        active: true,
        createdAt: Date.now(),
      },
      ...prev,
    ])
  }, [])

  const togglePropertyActive = useCallback((id: string) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)))
  }, [])

  const connectWallet = useCallback(() => {
    // Simulate new address each connect
    const addr =
      "0x" +
      Array.from({ length: 40 })
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")
    setWallet({ address: addr })
  }, [])

  const disconnectWallet = useCallback(() => setWallet(null), [])

  const createReceipt = useCallback(
    (input: {
      propertyId: string
      tenantAddress: string
      months: number
      amount: number
    }) => {
      const r: Receipt = {
        id: uid("rcpt_"),
        propertyId: input.propertyId,
        tenantAddress: input.tenantAddress,
        months: input.months,
        amount: input.amount,
        cid: generateMockCid(),
        txHash: generateMockTxHash(),
        createdAt: Date.now(),
      }
      setReceipts((prev) => [r, ...prev])
      return r
    },
    [],
  )

  return {
    // state
    properties,
    receipts,
    wallet,

    // actions
    ensureSeeded,
    addProperty,
    togglePropertyActive,
    createReceipt,
    connectWallet,
    disconnectWallet,

    // derived
    activeProperties: useMemo(() => properties.filter((p) => p.active), [properties]),
  }
}
