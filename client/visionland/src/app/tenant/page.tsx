"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useSimStore, type Property } from "@/lib/sim-store"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import TenantAlerts from "@/components/tenant-alerts"
import ConnectButton, { useEthersFromAppKit } from "@/app/appkit-setup";
import { useAppKit , useDisconnect } from "@reown/appkit/react";


function WalletConnectInline() {
  const { address, isConnected } = useEthersFromAppKit(); // Get wallet info from AppKit

  const { open } = useAppKit(); // Open wallet modal
  const { disconnect} = useDisconnect();
    const handleDisconnect = async() => {
        //  disconnect()
        window.location.reload(); // simplest way to reset wallet state

      };
  return (
    <div className="flex items-center gap-2">
      {isConnected && address ? (
        <>
          <Badge variant="secondary" className="font-mono bg-slate-800 text-slate-200 border border-white/10">
            {address.slice(0, 6)}…{address.slice(-4)}
          </Badge>
          <Button
            variant="secondary"
            onClick={handleDisconnect}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
          >
            Disconnect
          </Button>
        </>
      ) : (
        <Button
          onClick={open}
          className="animate-in fade-in slide-in-from-right-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  )
}




// function WalletConnectInline() {
//   const { wallet, connectWallet, disconnectWallet } = useSimStore()
//   return (
//     <div className="flex items-center gap-2">
//       {wallet?.address ? (
//         <>
//           <Badge variant="secondary" className="font-mono bg-slate-800 text-slate-200 border border-white/10">
//             {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
//           </Badge>
//           <Button
//             variant="secondary"
//             onClick={disconnectWallet}
//             className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
//           >
//             Disconnect
//           </Button>
//         </>
//       ) : (
//         <Button
//           onClick={connectWallet}
//           className="animate-in fade-in slide-in-from-right-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
//         >
//           Connect Wallet
//         </Button>
//       )}
//     </div>
//   )
// }

export default function TenantPage() {
  const { toast } = useToast()
  const search = useSearchParams()
  const router = useRouter()
  const { properties, ensureSeeded, createReceipt, wallet } = useSimStore()

  const [selected, setSelected] = useState<Property | null>(null)
  const [months, setMonths] = useState("1")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    ensureSeeded()
  }, [ensureSeeded])

  useEffect(() => {
    const focusId = search.get("focus")
    if (focusId) {
      const p = properties.find((p) => p.id === focusId && p.active)
      if (p) {
        setSelected(p)
        setOpen(true)
      }
    }
  }, [properties, search])

  const activeProps = useMemo(() => properties.filter((p) => p.active), [properties])

  function handlePay() {
    if (!selected) return
    const m = Math.max(1, Number(months || 1))
    const receipt = createReceipt({
      propertyId: selected.id,
      tenantAddress: wallet?.address || "0xTenant000000000000000000000000000000000000",
      months: m,
      amount: selected.pricePerMonth * m,
    })
    setOpen(false)
    toast({
      title: "Payment successful",
      description: `Receipt ${receipt.id} created. CID ${receipt.cid.slice(0, 6)}…`,
    })
    router.push(`/receipt/${receipt.id}`)
  }

  return (
    <main className="min-h-dvh text-slate-200 bg-slate-950">
      <header className="w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-lg font-semibold cursor-pointer">
              <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                Browse Rentals
              </span>
            </h1>
          </Link>
          <nav className="flex items-center gap-3">
            <WalletConnectInline />
            <Link href="/" className="text-sm underline underline-offset-4 text-cyan-300 hover:text-cyan-200">
              Home
            </Link>
            <Link href="/owner" className="text-sm underline underline-offset-4 text-fuchsia-300 hover:text-fuchsia-200">
              Owner
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="mb-4 animate-in fade-in-50">
          <TenantAlerts />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {activeProps.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "overflow-hidden transition-all hover:shadow-[0_0_24px_rgba(56,189,248,0.25)] hover:-translate-y-0.5",
                "animate-in fade-in slide-in-from-bottom-4 duration-500",
                "border border-white/10 bg-slate-900/60 backdrop-blur-xl"
              )}
            >
              <img
                src={p.image || "/placeholder.svg"}
                alt={`${p.title} exterior`}
                className="w-full h-44 object-cover opacity-95"
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-pretty text-slate-100">{p.title}</CardTitle>
                <CardDescription className="flex items-center justify-between text-slate-300">
                  <span>{p.location}</span>
                  <span className="font-semibold text-cyan-300">{p.pricePerMonth} PYUSD/mo</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">Available</Badge>
                <Button
                  onClick={() => {
                    setSelected(p)
                    setOpen(true)
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
                >
                  Rent now
                </Button>
              </CardContent>
            </Card>
          ))}
          {activeProps.length === 0 && (
            <Card className="animate-in fade-in duration-500 border border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">No active listings</CardTitle>
                <CardDescription className="text-slate-300">Please check back later.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md animate-in fade-in zoom-in-50 border border-white/10 bg-slate-900/80 backdrop-blur-2xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Confirm Rent
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-100">{selected.title}</p>
                  <p className="text-sm text-slate-400">{selected.location}</p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                  {selected.pricePerMonth} PYUSD/mo
                </Badge>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="months" className="text-slate-300">Months</Label>
                <Input
                  id="months"
                  type="number"
                  min={1}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-300">Total</p>
                <p className="font-semibold text-cyan-300">
                  {Math.max(1, Number(months || 1)) * selected.pricePerMonth} PYUSD
                </p>
              </div>
              {!wallet?.address && (
                <p className="text-sm text-slate-400">
                  You are not connected. A simulated address will be used unless you connect.
                </p>
              )}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePay}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
                >
                  Pay with PYUSD
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
