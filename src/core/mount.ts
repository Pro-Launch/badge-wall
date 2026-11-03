import { attachBehaviors, type AccordionOptions } from "./behaviors"
import { renderBadgeWall, type RenderOptions } from "./render"
import type { BadgeWallPayload } from "./types"

/**
 * Renders a wall into `host`'s open shadow root (created if needed), so host-page CSS cannot
 * reach it and its CSS cannot leak out, then wires the accordion/marquee behaviors. Calling it
 * again re-renders in place. Returns a cleanup function.
 */
export function mountBadgeWall(
  host: HTMLElement,
  payload: BadgeWallPayload,
  options: RenderOptions & AccordionOptions = {},
): () => void {
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" })
  const { css, html } = renderBadgeWall(payload, options)
  shadow.innerHTML = `<style>${css}</style>${html}`
  return attachBehaviors(shadow, options)
}
