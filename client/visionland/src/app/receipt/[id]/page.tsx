"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSimStore } from "@/lib/sim-store"
import { Badge } from "@/components/ui/badge"

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const { receipts, properties, ensureSeeded } = useSimStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    ensureSeeded()
    setMounted(true)
  }, [ensureSeeded])

  const receipt = useMemo(() => {
    const id =
      typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
    return receipts.find((r) => r.id === id)
  }, [params, receipts])

  const property = useMemo(() => {
    return receipt ? properties.find((p) => p.id === receipt.propertyId) : undefined
  }, [receipt, properties])

  if (!mounted) {
    return (
      <main className="min-h-dvh grid place-items-center bg-slate-950 text-slate-300">
        <div className="animate-in fade-in zoom-in-50">
          <p>Loading receipt…</p>
        </div>
      </main>
    )
  }

  if (!receipt) {
    return (
      <main className="min-h-dvh grid place-items-center bg-slate-950 text-slate-200">
        <Card className="max-w-md animate-in fade-in border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-100">Receipt not found</CardTitle>
            <CardDescription className="text-slate-400">
              We couldn’t find that receipt in local storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:from-cyan-400 hover:to-emerald-400">
              <Link href="/tenant">Back to rentals</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-200">
      <header className="w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-fuchsia-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Receipt
          </h1>
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm underline underline-offset-4 text-cyan-300 hover:text-cyan-200"
            >
              Home
            </Link>
            <Link
              href="/owner"
              className="text-sm underline underline-offset-4 text-fuchsia-300 hover:text-fuchsia-200"
            >
              Owner
            </Link>
            <Link
              href="/tenant"
              className="text-sm underline underline-offset-4 text-emerald-300 hover:text-emerald-200"
            >
              Tenant
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <Card className="animate-in fade-in slide-in-from-bottom-4 border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-pretty text-slate-100">Payment Receipt</CardTitle>
                <CardDescription className="text-slate-400">ID: {receipt.id}</CardDescription>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">PYUSD</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-slate-200">
            {property && (
              <div className="grid">
                <span className="text-sm text-slate-400">Property</span>
                <span className="font-medium">
                  {property.title} — {property.location}
                </span>
              </div>
            )}
            <div className="grid">
              <span className="text-sm text-slate-400">Tenant Address</span>
              <span className="font-mono">{receipt.tenantAddress}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-slate-400">Months</span>
                <p className="font-medium">{receipt.months}</p>
              </div>
              <div>
                <span className="text-sm text-slate-400">Amount</span>
                <p className="font-medium text-cyan-300">{receipt.amount} PYUSD</p>
              </div>
            </div>
            <div className="grid">
              <span className="text-sm text-slate-400">Filecoin CID (simulated)</span>
              <span className="font-mono break-all">{receipt.cid}</span>
            </div>
            <div className="grid">
              <span className="text-sm text-slate-400">Transaction Hash (simulated)</span>
              <span className="font-mono break-all">{receipt.txHash}</span>
            </div>
            <div className="grid">
              <span className="text-sm text-slate-400">Timestamp</span>
              <span className="font-medium">{new Date(receipt.createdAt).toLocaleString()}</span>
            </div>
            <div className="pt-2">
              <Button
                variant="secondary"
                onClick={() => window.print()}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:from-cyan-400 hover:to-emerald-400"
              >
                Print / Save PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
