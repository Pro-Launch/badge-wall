import { attachBehaviors } from "./core/behaviors"
import { mountBadgeWall } from "./core/mount"
import type { BadgeWallPayload } from "./core/types"

// <prolaunch-badge-wall website-id="…"> for any site. If the element already has a shadow root
// (server-rendered declarative shadow DOM, see react.tsx), it only wires the behaviors; otherwise
// it fetches the public payload (website ID only) and renders it.

export const ELEMENT_NAME = "prolaunch-badge-wall"

export function defineBadgeWallElement(apiOrigin = "https://prolaunch.net"): void {
  if (typeof customElements === "undefined" || customElements.get(ELEMENT_NAME)) return

  class ProLaunchBadgeWallElement extends HTMLElement {
    private cleanup: (() => void) | null = null

    connectedCallback() {
      if (this.shadowRoot && this.shadowRoot.childNodes.length > 0) {
        this.cleanup = attachBehaviors(this.shadowRoot)
        return
      }
      const websiteId = this.getAttribute("website-id")
      if (!websiteId) return
      void fetch(`${apiOrigin}/api/badge-wall/v1/walls/${encodeURIComponent(websiteId)}`, {
        credentials: "omit",
      })
        .then((res) => (res.ok ? (res.json() as Promise<BadgeWallPayload>) : null))
        .then((payload) => {
          if (payload && this.isConnected) this.cleanup = mountBadgeWall(this, payload)
        })
        .catch(() => undefined)
    }

    disconnectedCallback() {
      this.cleanup?.()
      this.cleanup = null
    }
  }

  customElements.define(ELEMENT_NAME, ProLaunchBadgeWallElement)
}
