"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useSimStore, type Property } from "@/lib/sim-store"
import { cn } from "@/lib/utils"
import OwnerOnboarding from "@/components/owner-onboarding"

export default function OwnerPage() {
  const { properties, addProperty, togglePropertyActive, receipts, ensureSeeded } = useSimStore()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    location: "",
    pricePerMonth: "",
    description: "",
    image: "",
  })

  useEffect(() => {
    ensureSeeded()
  }, [ensureSeeded])

  useEffect(() => {
    function onFocus() {
      setOpen(true)
    }
    window.addEventListener("visionland:focus-add-property", onFocus)
    return () => window.removeEventListener("visionland:focus-add-property", onFocus)
  }, [])

  const totalActive = useMemo(() => properties.filter((p) => p.active).length, [properties])
  const totalReceipts = receipts.length

  function handleAdd() {
    const price = Number(form.pricePerMonth || 0)
    if (!form.title || !form.location || price <= 0) return
    const payload: Omit<Property, "id" | "createdAt" | "active"> = {
      title: form.title.trim(),
      location: form.location.trim(),
      pricePerMonth: price,
      description: form.description.trim(),
      image: form.image.trim() || "/house-front-elevation.jpg",
    }
    addProperty(payload)
    setOpen(false)
    setForm({ title: "", location: "", pricePerMonth: "", description: "", image: "" })
  }

  return (
    <main className={cn(
      "min-h-dvh flex flex-col text-slate-200 bg-slate-950 relative overflow-hidden"
    )}>
      {/* Radial mesh glows */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]">
        <div className="absolute -top-28 -left-24 h-96 w-96 rounded-full blur-3xl opacity-40 bg-fuchsia-600/40" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40 bg-cyan-500/40" />
      </div>
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background:linear-gradient(transparent_23px,rgba(255,255,255,0.08)_24px),linear-gradient(90deg,transparent_23px,rgba(255,255,255,0.08)_24px)] [background-size:24px_24px]" />

      {/* Header */}
      <header className="w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Owner Dashboard
            </span>
          </h1>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm underline underline-offset-4 text-cyan-300 hover:text-cyan-200">
              Home
            </Link>
            <Link href="/tenant" className="text-sm underline underline-offset-4 text-fuchsia-300 hover:text-fuchsia-200">
              Tenant
            </Link>
          </nav>
        </div>
      </header>

      {/* Body */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {properties.length === 0 && (
          <div className="mb-6">
            <OwnerOnboarding />
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="animate-in fade-in duration-500 border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200 shadow-[0_0_24px_rgba(56,189,248,0.12)]">
            <CardHeader>
              <CardTitle className="text-cyan-300">Properties</CardTitle>
              <CardDescription className="text-slate-300">Total listed</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{properties.length}</CardContent>
          </Card>

          <Card className="animate-in fade-in duration-500 delay-100 border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
            <CardHeader>
              <CardTitle className="text-emerald-300">Active</CardTitle>
              <CardDescription className="text-slate-300">Visible to tenants</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{totalActive}</CardContent>
          </Card>

          <Card className="animate-in fade-in duration-500 delay-200 border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200 shadow-[0_0_24px_rgba(217,70,239,0.12)]">
            <CardHeader>
              <CardTitle className="text-fuchsia-300">Receipts</CardTitle>
              <CardDescription className="text-slate-300">Payments recorded</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{totalReceipts}</CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
            Your Properties
          </h2>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                id="add-property"
                className="animate-in fade-in slide-in-from-right-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
              >
                Add Property
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg border border-white/10 bg-slate-900/80 backdrop-blur-2xl text-slate-200">
              <DialogHeader>
                <DialogTitle className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Add a new property
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-slate-300">Title</Label>
                  <Input
                    id="title"
                    className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-400"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-slate-300">Location</Label>
                  <Input
                    id="location"
                    className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-400"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ppm" className="text-slate-300">Price per month (PYUSD)</Label>
                  <Input
                    id="ppm"
                    type="number"
                    min={1}
                    className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-400"
                    value={form.pricePerMonth}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerMonth: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image" className="text-slate-300">Image URL (optional)</Label>
                  <Input
                    id="image"
                    placeholder="/house-front-elevation.jpg"
                    className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-500"
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-slate-300">Description</Label>
                  <Textarea
                    id="desc"
                    className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-400"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Property List */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {properties.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "overflow-hidden transition-all hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:-translate-y-0.5",
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
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-pretty text-slate-100">{p.title}</CardTitle>
                    <CardDescription className="text-slate-300">{p.location}</CardDescription>
                  </div>
                  <Badge
                    variant={p.active ? "default" : "secondary"}
                    className={cn(
                      "border",
                      p.active
                        ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                        : "bg-slate-800 text-slate-200 border-white/10"
                    )}
                  >
                    {p.active ? "Active" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-semibold text-cyan-300">{p.pricePerMonth} PYUSD</p>
                  <p className="text-sm text-slate-400">per month</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    asChild
                    className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
                  >
                    <Link href={`/tenant?focus=${p.id}`}>Preview as Tenant</Link>
                  </Button>
                  <Button
                    onClick={() => togglePropertyActive(p.id)}
                    className={cn(
                      "font-medium",
                      p.active
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
                    )}
                  >
                    {p.active ? "Pause" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {properties.length === 0 && (
            <Card className="animate-in fade-in duration-500 border border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">No properties yet</CardTitle>
                <CardDescription className="text-slate-300">
                  Add your first property to get started.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>
    </main>
  )
}
