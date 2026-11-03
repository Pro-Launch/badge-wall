import { FRAME_HEIGHT_MESSAGE, FRAME_PING_MESSAGE } from "./core/types"

// Parent-page side of the iframe embed: resizes the iframe from the heights it posts.
// Origin checks, parent side: a message is honoured only when it comes from the Pro Launch
// origin AND from that exact iframe's window, carries the expected website ID and a sane height.
// The dashboard's copy-paste snippet inlines an equivalent of this function
// (lib/badge-wall/embed-snippets.ts); both are covered by the same tests.

export const MAX_FRAME_HEIGHT = 5000

export function createFrameResizeHandler(
  iframe: HTMLIFrameElement,
  { expectedOrigin, websiteId }: { expectedOrigin: string; websiteId: string },
): (event: MessageEvent) => void {
  return (event) => {
    if (event.origin !== expectedOrigin || event.source !== iframe.contentWindow) return
    const data = event.data as { type?: unknown; id?: unknown; height?: unknown } | null
    if (!data || data.type !== FRAME_HEIGHT_MESSAGE || data.id !== websiteId) return
    const height = Number(data.height)
    if (Number.isFinite(height) && height > 0 && height < MAX_FRAME_HEIGHT) {
      iframe.style.height = `${Math.ceil(height)}px`
    }
  }
}

/** Attaches the handler and asks the frame for its current height. Returns a cleanup. */
export function connectBadgeWallFrame(
  iframe: HTMLIFrameElement,
  options: { expectedOrigin: string; websiteId: string },
): () => void {
  const view = iframe.ownerDocument.defaultView
  if (!view) return () => undefined
  const handler = createFrameResizeHandler(iframe, options)
  view.addEventListener("message", handler)
  const ping = () =>
    iframe.contentWindow?.postMessage(
      { type: FRAME_PING_MESSAGE, id: options.websiteId },
      options.expectedOrigin,
    )
  iframe.addEventListener("load", ping)
  return () => {
    view.removeEventListener("message", handler)
    iframe.removeEventListener("load", ping)
  }
}
