// app/owner/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSimStore, type Property } from "@/lib/sim-store";
import { cn } from "@/lib/utils";
import OwnerOnboarding from "@/components/owner-onboarding";
import { useAppKit, useDisconnect, useAppKitAccount } from "@reown/appkit/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// === Synapse + ethers (Filecoin) ===
import { Synapse /*, RPC_URLS*/ } from "@filoz/synapse-sdk";
import { ethers } from "ethers";

// === Lighthouse (IPFS) ===
import lighthouse from "@lighthouse-web3/sdk";

let __synapsePromise: Promise<Synapse> | null = null;

// ---------- Provider (MetaMask) ----------
async function getBrowserProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Open in a browser with MetaMask (or similar).");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider;
}

// ---------- Synapse factory (kept minimal; you can add chain/balance checks as before) ----------
async function getSynapse(): Promise<Synapse> {
  if (!__synapsePromise) {
    __synapsePromise = (async () => {
      const provider = await getBrowserProvider();
      // OPTIONAL: add chain guard + fee overrides here if FEVM estimate fails in your setup.
      return await Synapse.create({ provider });
    })();
  }
  return __synapsePromise;
}

// ---------- Filecoin helpers (Synapse) ----------
async function fcUploadJSON(obj: unknown): Promise<{ pieceCid: string }> {
  const synapse = await getSynapse();
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const result = await synapse.storage.upload(data);
  return { pieceCid: result.pieceCid };
}

async function fcDownloadJSON<T = unknown>(pieceCid: string): Promise<T> {
  const synapse = await getSynapse();
  const bytes = await synapse.storage.download(pieceCid);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

// ---------- Lighthouse helpers (IPFS) ----------
// const LIGHTHOUSE_API_KEY = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY; // demo only (frontend)
const LIGHTHOUSE_API_KEY ="0ebd66d1.14229f36a37440abaaec39aec071c361";

async function lhUploadJSON(obj: unknown, name = "visionland-record"): Promise<{ cid: string; name?: string }> {
  if (!LIGHTHOUSE_API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_LIGHTHOUSE_API_KEY");
  }
  const text = JSON.stringify(obj);
  const res = await lighthouse.uploadText(text, LIGHTHOUSE_API_KEY, name);
  // res.data = { Name, Hash (CID), Size }
  return { cid: res?.data?.Hash, name: res?.data?.Name };
}

async function lhDownloadJSON<T = unknown>(cid: string): Promise<T> {
  const url = `https://gateway.lighthouse.storage/ipfs/${cid}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Gateway fetch failed: ${r.status}`);
  const text = await r.text();
  return JSON.parse(text) as T;
}

// ---------- Wallet Connect mini ----------
function WalletConnectInline() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  return (
    <div className="flex items-center gap-2">
      {isConnected && address ? (
        <>
          <Badge variant="secondary" className="font-mono bg-slate-800 text-slate-200 border border-white/10">
            {address.slice(0, 6)}…{address.slice(-4)}
          </Badge>
          <Button
            variant="secondary"
            onClick={() => disconnect()}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
          >
            Disconnect
          </Button>
          <Button
            variant="secondary"
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
            onClick={() => open({ view: "Networks" })}
          >
            Network
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
  );
}

export default function OwnerPage() {
  const {
    properties,
    addProperty,
    togglePropertyActive,
    receipts,
    ensureSeeded,
    // @ts-expect-error: optional in some codebases
    updateProperty,
  } = useSimStore();

  // Local maps if your store lacks fields
  const [pieceCidMap, setPieceCidMap] = useState<Record<string, string>>({}); // Filecoin pieceCID
  const [ipfsCidMap, setIpfsCidMap] = useState<Record<string, string>>({}); // Lighthouse IPFS CID

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    pricePerMonth: "",
    description: "",
    image: "",
  });

  // Restore flows
  const [restoreOpenFC, setRestoreOpenFC] = useState(false); // Filecoin restore
  const [restorePieceCid, setRestorePieceCid] = useState("");

  const [restoreOpenLH, setRestoreOpenLH] = useState(false); // Lighthouse restore
  const [restoreIpfsCid, setRestoreIpfsCid] = useState("");

  // JSON viewer
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonTitle, setJsonTitle] = useState("");
  const [jsonContent, setJsonContent] = useState<string>("");

  const prevLenRef = useRef(0);

  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  useEffect(() => {
    function onFocus() {
      setOpen(true);
    }
    window.addEventListener("visionland:focus-add-property", onFocus);
    return () => window.removeEventListener("visionland:focus-add-property", onFocus);
  }, []);

  useEffect(() => {
    prevLenRef.current = properties.length;
  }, [properties.length]);

  const totalActive = useMemo(() => properties.filter((p) => p.active).length, [properties]);
  const totalReceipts = receipts.length;

  function handleAdd() {
    const price = Number(form.pricePerMonth || 0);
    if (!form.title || !form.location || price <= 0) return;
    const payload: Omit<Property, "id" | "createdAt" | "active"> = {
      title: form.title.trim(),
      location: form.location.trim(),
      pricePerMonth: price,
      description: form.description.trim(),
      image: form.image.trim() || "/house-front-elevation.jpg",
    };
    (addProperty as any)(payload);
    setOpen(false);
    setForm({ title: "", location: "", pricePerMonth: "", description: "", image: "" });
  }

  // ===== Backup / View actions =====

  // Filecoin (Synapse)
  async function backupPropertyToFilecoin(prop: Property) {
    try {
      const toSave = {
        id: prop.id,
        title: prop.title,
        location: prop.location,
        pricePerMonth: prop.pricePerMonth,
        description: prop.description,
        image: prop.image,
        active: prop.active,
        createdAt: prop.createdAt,
      };
      const { pieceCid } = await fcUploadJSON(toSave);

      if (typeof updateProperty === "function") {
        updateProperty(prop.id, { pieceCid });
      } else {
        setPieceCidMap((m) => ({ ...m, [prop.id]: pieceCid }));
      }

      setJsonTitle(`Uploaded to Filecoin — pieceCID: ${pieceCid}`);
      setJsonContent(JSON.stringify(toSave, null, 2));
      setJsonOpen(true);
    } catch (err: any) {
      alert(`Filecoin backup failed: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  }

  async function viewFromPieceCid(pieceCid: string, title: string) {
    try {
      const obj = await fcDownloadJSON<any>(pieceCid);
      setJsonTitle(`${title} — from Filecoin pieceCID ${pieceCid}`);
      setJsonContent(JSON.stringify(obj, null, 2));
      setJsonOpen(true);
    } catch (err: any) {
      alert(`Filecoin download failed: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  }

  // Lighthouse (IPFS)
  async function backupPropertyToLighthouse(prop: Property) {
    try {
      const toSave = {
        id: prop.id,
        title: prop.title,
        location: prop.location,
        pricePerMonth: prop.pricePerMonth,
        description: prop.description,
        image: prop.image,
        active: prop.active,
        createdAt: prop.createdAt,
      };
      const { cid, name } = await lhUploadJSON(toSave, `visionland-${prop.id}`);

      if (typeof updateProperty === "function") {
        // If you have an 'ipfsCid' field in your store, use that. Otherwise local map.
        updateProperty(prop.id, { ipfsCid: cid });
      } else {
        setIpfsCidMap((m) => ({ ...m, [prop.id]: cid }));
      }

      setJsonTitle(`Uploaded to Lighthouse — CID: ${cid} ${name ? `(${name})` : ""}`);
      setJsonContent(JSON.stringify(toSave, null, 2));
      setJsonOpen(true);
    } catch (err: any) {
      alert(`Lighthouse backup failed: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  }

  async function viewFromIpfsCid(cid: string, title: string) {
    try {
      const obj = await lhDownloadJSON<any>(cid);
      setJsonTitle(`${title} — from IPFS CID ${cid}`);
      setJsonContent(JSON.stringify(obj, null, 2));
      setJsonOpen(true);
    } catch (err: any) {
      alert(`IPFS download failed: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  }

  // ===== Restore flows =====

  // Restore from Filecoin pieceCID
  async function restoreFromPieceCidToNewProperty() {
    if (!restorePieceCid.trim()) return;
    try {
      const data = await fcDownloadJSON<Partial<Property>>(restorePieceCid.trim());
      const newPayload: Omit<Property, "id" | "createdAt" | "active"> = {
        title: (data.title ?? "Restored Property") as string,
        location: (data.location ?? "Unknown") as string,
        pricePerMonth: Number(data.pricePerMonth ?? 0),
        description: (data.description ?? "") as string,
        image: (data.image ?? "/house-front-elevation.jpg") as string,
      };
      const maybeId = (addProperty as any)(newPayload);
      const attachId = (typeof maybeId === "string" ? maybeId : undefined) ?? properties[0]?.id;
      if (attachId) {
        if (typeof updateProperty === "function") {
          updateProperty(attachId, { pieceCid: restorePieceCid.trim() });
        } else {
          setPieceCidMap((m) => ({ ...m, [attachId]: restorePieceCid.trim() }));
        }
      }
      setRestoreOpenFC(false);
      setRestorePieceCid("");
      alert("Property created from Filecoin pieceCID.");
    } catch (err: any) {
      alert(`Restore failed: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  }

  // Restore from Lighthouse IPFS CID
  async function restoreFromIpfsCidToNewProperty() {
    if (!restoreIpfsCid.trim()) return;
    try {
      const data = await lhDownloadJSON<Partial<Property>>(restoreIpfsCid.trim());
      const newPayload: Omit<Property, "id" | "createdAt" | "active"> = {
        title: (data.title ?? "Restored Property") as string,
        location: (data.location ?? "Unknown") as string,
        pricePerMonth: Number(data.pricePerMonth ?? 0),
        description: (data.description ?? "") as string,
        image: (data.image ?? "/house-front-elevation.jpg") as string,
      };
      const maybeId = (addProperty as any)(newPayload);
      const attachId = (typeof maybeId === "string" ? maybeId : undefined) ?? properties[0]?.id;
      if (attachId) {
        if (typeof updateProperty === "function") {
          updateProperty(attachId, { ipfsCid: restoreIpfsCid.trim() });
        } else {
          setIpfsCidMap((m) => ({ ...m, [attachId]: restoreIpfsCid.trim() }));
        }
      }
      setRestoreOpenLH(false);
      setRestoreIpfsCid("");
      alert("Property created from IPFS CID.");
    } catch (err: any) {
      alert(`Restore failed: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  }

  return (
    <main className={cn("min-h-dvh flex flex-col text-slate-200 bg-slate-950 relative overflow-hidden")}>
      {/* bg */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]">
        <div className="absolute -top-28 -left-24 h-96 w-96 rounded-full blur-3xl opacity-40 bg-fuchsia-600/40" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40 bg-cyan-500/40" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background:linear-gradient(transparent_23px,rgba(255,255,255,0.08)_24px),linear-gradient(90deg,transparent_23px,rgba(255,255,255,0.08)_24px)] [background-size:24px_24px]" />

      {/* header */}
      <header className="w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Owner Dashboard
            </span>
          </h1>
          <nav className="flex items-center gap-3">
            <ConnectButton />
            <Link href="/" className="text-sm underline underline-offset-4 text-cyan-300 hover:text-cyan-200">
              Home
            </Link>
            <Link href="/tenant" className="text-sm underline underline-offset-4 text-fuchsia-300 hover:text-fuchsia-200">
              Tenant
            </Link>

            {/* Restore from Filecoin pieceCID */}
            <Dialog open={restoreOpenFC} onOpenChange={setRestoreOpenFC}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
                >
                  Restore (Filecoin pieceCID)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg border border-white/10 bg-slate-900/80 backdrop-blur-2xl text-slate-200">
                <DialogHeader>
                  <DialogTitle className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                    Restore from Filecoin pieceCID
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="piececid" className="text-slate-300">pieceCID</Label>
                    <Input
                      id="piececid"
                      placeholder="baga6ea4seaq..."
                      className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-500"
                      value={restorePieceCid}
                      onChange={(e) => setRestorePieceCid(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
                      onClick={() => setRestoreOpenFC(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={restoreFromPieceCidToNewProperty}
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Restore from Lighthouse IPFS CID */}
            <Dialog open={restoreOpenLH} onOpenChange={setRestoreOpenLH}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
                >
                  Restore (IPFS CID)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg border border-white/10 bg-slate-900/80 backdrop-blur-2xl text-slate-200">
                <DialogHeader>
                  <DialogTitle className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                    Restore from IPFS CID (Lighthouse)
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ipfscid" className="text-slate-300">IPFS CID</Label>
                    <Input
                      id="ipfscid"
                      placeholder="Qm... or bafy..."
                      className="bg-slate-800/70 border-white/10 text-slate-100 placeholder:text-slate-500"
                      value={restoreIpfsCid}
                      onChange={(e) => setRestoreIpfsCid(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10"
                      onClick={() => setRestoreOpenLH(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={restoreFromIpfsCidToNewProperty}
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </nav>
        </div>
      </header>

      {/* body */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {properties.length === 0 && (
          <div className="mb-6">
            <OwnerOnboarding />
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200">
            <CardHeader>
              <CardTitle className="text-cyan-300">Properties</CardTitle>
              <CardDescription className="text-slate-300">Total listed</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{properties.length}</CardContent>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200">
            <CardHeader>
              <CardTitle className="text-emerald-300">Active</CardTitle>
              <CardDescription className="text-slate-300">Visible to tenants</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{totalActive}</CardContent>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 backdrop-blur-xl text-slate-200">
            <CardHeader>
              <CardTitle className="text-fuchsia-300">Receipts</CardTitle>
              <CardDescription className="text-slate-300">Payments recorded</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{totalReceipts}</CardContent>
          </Card>
        </div>

        {/* Add Property */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
            Your Properties
          </h2>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                id="add-property"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
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
          {properties.map((p) => {
            const pieceCid = (p as any).pieceCid || pieceCidMap[p.id]; // Filecoin
            const ipfsCid = (p as any).ipfsCid || ipfsCidMap[p.id]; // Lighthouse
            return (
              <Card
                key={p.id}
                className={cn(
                  "overflow-hidden transition-all hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:-translate-y-0.5",
                  "border border-white/10 bg-slate-900/60 backdrop-blur-xl"
                )}
              >
                <img
                  src={p.image || "/placeholder.svg"}
                  alt={`${p.title} exterior`}
                  className="w-full h-44 object-cover opacity-95"
                />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-pretty text-slate-100">{p.title}</CardTitle>
                      <CardDescription className="text-slate-300">{p.location}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
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

                      {/* Filecoin View */}
                      {pieceCid ? (
                        <button
                          onClick={() => viewFromPieceCid(pieceCid, p.title)}
                          className="text-xs underline underline-offset-4 text-cyan-300 hover:text-cyan-200"
                          title={pieceCid}
                        >
                          View JSON (Filecoin)
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Not on Filecoin</span>
                      )}

                      {/* Lighthouse View */}
                      {ipfsCid ? (
                        <button
                          onClick={() => viewFromIpfsCid(ipfsCid, p.title)}
                          className="text-xs underline underline-offset-4 text-fuchsia-300 hover:text-fuchsia-200"
                          title={ipfsCid}
                        >
                          View JSON (IPFS)
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Not on IPFS</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-cyan-300">{p.pricePerMonth} PYUSD</p>
                    <p className="text-sm text-slate-400">per month</p>
                    {pieceCid && (
                      <p className="mt-1 text-[11px] text-slate-400 break-all">
                        Filecoin pieceCID: {pieceCid}
                      </p>
                    )}
                    {ipfsCid && (
                      <p className="mt-1 text-[11px] text-slate-400 break-all">
                        IPFS CID: {ipfsCid}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
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

                    {/* Backup buttons */}
                    <Button
                      onClick={() => backupPropertyToFilecoin(p)}
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900"
                    >
                      Backup to Filecoin
                    </Button>
                    <Button
                      onClick={() => backupPropertyToLighthouse(p)}
                      className="bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-400 hover:to-rose-400 text-white"
                    >
                      Backup to Lighthouse (IPFS)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {properties.length === 0 && (
            <Card className="border border-white/10 bg-slate-900/60 backdrop-blur-xl">
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

      {/* JSON Viewer Modal */}
      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="max-w-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base break-all text-cyan-200">
              {jsonTitle}
            </DialogTitle>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-xs bg-slate-950/60 p-3 rounded-lg border border-white/10">
{jsonContent}
          </pre>
        </DialogContent>
      </Dialog>
    </main>
  );
}
