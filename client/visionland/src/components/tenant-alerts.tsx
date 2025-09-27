"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type AlertCriteria = {
  id: string
  city?: string
  min?: number
  max?: number
  createdAt: number
}

function readAlerts(): AlertCriteria[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem("visionland:tenantAlerts")
    return raw ? (JSON.parse(raw) as AlertCriteria[]) : []
  } catch {
    return []
  }
}
function writeAlerts(alerts: AlertCriteria[]) {
  try {
    window.localStorage.setItem("visionland:tenantAlerts", JSON.stringify(alerts))
  } catch {}
}

type PropertyLite = { id?: string; city?: string; rent?: number; available?: boolean; title?: string }

function scanPropertiesFromLocalStorage(): PropertyLite[] {
  if (typeof window === "undefined") return []
  const results: PropertyLite[] = []
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key) continue
      try {
        const val = window.localStorage.getItem(key)
        if (!val) continue
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) {
          const looksLikeProps = parsed.some(
            (it) =>
              it && typeof it === "object" && ("city" in it || "rent" in it || "available" in it || "title" in it),
          )
          if (looksLikeProps) {
            parsed.forEach((p) => results.push(p))
          }
        }
      } catch {}
    }
  } catch {}
  return results
}

function matchesCriteria(p: PropertyLite, a: AlertCriteria) {
  if (a.city && p.city && a.city.toLowerCase() !== p.city.toLowerCase()) return false
  if (typeof a.min === "number" && typeof p.rent === "number" && p.rent < a.min) return false
  if (typeof a.max === "number" && typeof p.rent === "number" && p.rent > a.max) return false
  if (p.available === false) return false
  return true
}

export function TenantAlerts() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertCriteria[]>([])
  const [city, setCity] = useState("")
  const [min, setMin] = useState<string>("")
  const [max, setMax] = useState<string>("")
  const properties = useMemo(() => scanPropertiesFromLocalStorage(), [])
  const uniqueCities = useMemo(
    () => Array.from(new Set(properties.map((p) => (p.city || "").trim()).filter(Boolean))).sort(),
    [properties],
  )

  useEffect(() => {
    setAlerts(readAlerts())
  }, [])

  const saveAlert = () => {
    const a: AlertCriteria = {
      id: crypto.randomUUID(),
      city: city || undefined,
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      createdAt: Date.now(),
    }
    const next = [...alerts, a]
    setAlerts(next)
    writeAlerts(next)

    // compute current matches to provide immediate feedback
    const matches = properties.filter((p) => matchesCriteria(p, a))
    toast({
      title: matches.length > 0 ? "New properties match your alert" : "Alert saved",
      description:
        matches.length > 0
          ? `We found ${matches.length} matching propert${matches.length === 1 ? "y" : "ies"} right now.`
          : "We'll notify you here when new matches appear.",
      duration: 3500,
    })
    setOpen(false)
    setCity("")
    setMin("")
    setMax("")
  }

  const totalMatches = useMemo(() => {
    return alerts.reduce((acc, a) => acc + properties.filter((p) => matchesCriteria(p, a)).length, 0)
  }, [alerts, properties])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Alerts</span>
          {alerts.length > 0 ? (
            <Badge variant="secondary" className="animate-in fade-in-50">
              {alerts.length}
            </Badge>
          ) : null}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Create alert</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create an alert</DialogTitle>
              <DialogDescription>Get notified when new listings match your preferences.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  list="known-cities"
                  placeholder={uniqueCities.length ? "Choose or type a city" : "Type a city"}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                {uniqueCities.length > 0 && (
                  <datalist id="known-cities">
                    {uniqueCities.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="min">Min rent</Label>
                  <Input
                    id="min"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 1200"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max">Max rent</Label>
                  <Input
                    id="max"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 2500"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveAlert} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length > 0 && (
        <div className="mt-3 rounded-md border p-3 animate-in fade-in-50">
          <div className="text-sm text-muted-foreground">
            You have {alerts.length} alert{alerts.length === 1 ? "" : "s"} set.{" "}
            <span className="font-medium text-foreground">{totalMatches}</span> current match
            {totalMatches === 1 ? "" : "es"}.
          </div>
        </div>
      )}
    </div>
  )
}

export default TenantAlerts
