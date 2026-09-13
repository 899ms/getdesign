"use client"

import { downloadDesignMd, downloadDesignBundle } from "@/lib/download-design-md"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Download01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ExportActions({
  content,
  filename,
}: {
  content: string
  filename: string
}) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content.replace(/(!\[[^\]]*\]\()\/(?!\/)([^)]+)\)/g,
        (_match, prefix: string, path: string) => `${prefix}${window.location.origin}/${path})`))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard write can fail in insecure contexts; silently ignore.
    }
  }

  const handleDownload = async (bundle = false) => {
    setBusy(true)
    setError(null)
    try {
      if (bundle) await downloadDesignBundle(content)
      else await downloadDesignMd(content, filename)
    } catch { setError("Download failed. Please retry.") }
    finally { setBusy(false) }
  }

  return (
    <TooltipProvider>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        {error ? <span role="alert" className="text-xs text-destructive">{error}</span> : null}
        {content.includes("![") ? <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleDownload(true)}>Download with images</Button> : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy markdown"}
              >
                <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} />
              </Button>
            }
          />
          <TooltipContent>{copied ? "Copied" : "Copy markdown"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleDownload()}
                aria-label="Download design.md"
              >
                <HugeiconsIcon icon={Download01Icon} />
                Download design.md
              </Button>
            }
          />
          <TooltipContent>Download design.md</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
