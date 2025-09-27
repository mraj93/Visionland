"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function scanPropertiesFromLocalStorage(): Array<{ id?: string; city?: string; rent?: number }> {
  if (typeof window === "undefined") return []
  const results: Array<{ id?: string; city?: string; rent?: number }> = []
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key) continue
      try {
        const val = window.localStorage.getItem(key)
        if (!val) continue
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) {
          // naive heuristic: items that look like properties
          const looksLikeProps = parsed.some(
            (it) =>
              it && typeof it === "object" && ("city" in it || "rent" in it || "available" in it || "title" in it),
          )
          if (looksLikeProps) {
            parsed.forEach((p) => results.push(p))
          }
        }
      } catch {
        // ignore parse errors for unrelated keys
      }
    }
  } catch {
    // ignore
  }
  return results
}

export function OwnerOnboarding() {
  const [hidden, setHidden] = useState(true)
  const [onboarded, setOnboarded] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("visionland:ownerOnboarded")
    const hasOnboarded = stored === "true"
    setOnboarded(hasOnboarded)
    // check if there are any properties; if none and not onboarded, show card
    const props = scanPropertiesFromLocalStorage()
    if (!hasOnboarded && props.length === 0) {
      setHidden(false)
    }
  }, [])

  const handleSkip = () => {
    try {
      window.localStorage.setItem("visionland:ownerOnboarded", "true")
    } catch {}
    setOnboarded(true)
    setHidden(true)
  }

  const handleAddNow = () => {
    // try to focus an add-property section if exists
    const anchor = document.querySelector<HTMLElement>("#add-property")
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" })
      anchor.focus?.()
    }
    // fire a custom event that pages can optionally listen for
    window.dispatchEvent(new CustomEvent("visionland:focus-add-property"))
  }

  if (hidden || onboarded) return null

  return (
    <div className={cn("mb-4", "animate-in fade-in-50 zoom-in-95 duration-500 ease-out")}>
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">Welcome, Owner</CardTitle>
          <CardDescription className="text-muted-foreground">
            Add your first property to get started. You can edit details or toggle availability at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button onClick={handleAddNow} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add property now
          </Button>
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default OwnerOnboarding
