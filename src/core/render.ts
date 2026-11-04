import type { BadgeWallPayload, BadgeWallPayloadBadge, BadgeWallThemeName } from "./types"

// Renders a badge wall to { css, html }. Pure and DOM-free, so it runs on the server (iframe),
// in the browser (script tag, npm custom element, dashboard preview) and in tests.
//
// The CSS is written for a shadow root (:host) and every class is namespaced "bw-", so it can
// neither leak into nor be broken by the host page. The iframe document uses the same CSS.
//
// Both templates scroll like the "Featured On" block of Pro Launch's own footer
// (components/layout/featured-badges.tsx): uppercase muted heading, 40px-tall badges, 32px gaps
// (48px from 768px), a linear single-row marquee that pauses on hover, with a duplicated
// aria-hidden set for a seamless loop. Like the footer it always scrolls (no reduced-motion
// fallback). Short walls repeat their badges so one set is always wider than the viewport, and
// the duration scales with the number of badges so every wall moves at the footer's speed.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Defense in depth: only absolute http(s) URLs ever reach an href or src. */
export function safeUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null
  } catch {
    return null
  }
}

const ALLOWED_REL = new Set(["noopener", "noreferrer", "nofollow", "ugc", "sponsored"])

function safeRel(rel: string): string {
  const tokens = rel
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => ALLOWED_REL.has(token))
  if (!tokens.includes("noopener")) tokens.push("noopener")
  return [...new Set(tokens)].join(" ")
}

const PALETTE: Record<BadgeWallThemeName, Record<string, string>> = {
  light: {
    "--bw-fg": "#171717",
    "--bw-muted": "#737373",
    "--bw-border": "#e5e5e5",
    "--bw-bg": "transparent",
    "--bw-focus": "#2563eb",
    "--bw-hover-bg": "rgba(0, 0, 0, 0.04)",
  },
  dark: {
    "--bw-fg": "#fafafa",
    "--bw-muted": "#a3a3a3",
    "--bw-border": "#262626",
    "--bw-bg": "transparent",
    "--bw-focus": "#60a5fa",
    "--bw-hover-bg": "rgba(255, 255, 255, 0.06)",
  },
}

export const BADGE_WALL_CSS = `
:host { all: initial; display: block; contain: content; }
.bw, .bw * { box-sizing: border-box; }
.bw {
  display: flex; flex-direction: column; align-items: center; width: 100%;
  padding: 0 0 16px; margin: 0; background: var(--bw-bg); color: var(--bw-fg);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px; line-height: 1.5; text-align: center;
}
.bw-title {
  margin: 0 0 24px; padding: 0; color: var(--bw-muted); font-size: 14px; font-weight: 600;
  letter-spacing: 0.05em; text-transform: uppercase;
}
.bw-viewport { width: 100%; overflow: hidden; margin: 0; padding: 0; }
@keyframes bw-marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
.bw-track {
  display: flex; width: max-content; margin: 0; padding: 0;
  animation: bw-marquee 60s linear infinite;
}
.bw-track:hover, .bw-track:focus-within { animation-play-state: paused; }
.bw-set {
  display: flex; flex-wrap: nowrap; align-items: center; justify-content: flex-start; gap: 32px;
  margin: 0; padding: 0 32px 0 0; list-style: none;
}
.bw-badge {
  display: block; flex-shrink: 0; margin: 0; padding: 0; border: 0; text-decoration: none;
  transition: transform 0.2s;
}
.bw-badge img {
  display: block; height: 40px !important; max-height: 40px !important; width: auto !important;
  max-width: none; object-fit: contain; margin: 0 !important; border: 0;
}
.bw-badge:focus-visible { outline: 2px solid var(--bw-focus); outline-offset: 2px; border-radius: 4px; }
@media (min-width: 768px) {
  .bw-set { gap: 48px; padding-right: 48px; }
}
.bw-attribution { margin: 16px 0 0; font-size: 12px; color: var(--bw-muted); }
.bw-attribution a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.bw-attribution a:hover { color: var(--bw-fg); }
.bw-attribution a:focus-visible { outline: 2px solid var(--bw-focus); outline-offset: 2px; border-radius: 2px; }
.bw-empty { margin: 0; color: var(--bw-muted); font-size: 13px; }

.bw-acc-header { margin: 0; padding: 0; font: inherit; }
.bw-toggle {
  display: inline-flex; align-items: center; gap: 8px; margin: 0; padding: 6px 10px;
  border: 0; border-radius: 6px; background: transparent; color: var(--bw-muted);
  font: inherit; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  cursor: pointer;
}
.bw-toggle:hover { color: var(--bw-fg); background: var(--bw-hover-bg); }
.bw-toggle:focus-visible { outline: 2px solid var(--bw-focus); outline-offset: 2px; }
.bw-chevron { width: 16px; height: 16px; flex-shrink: 0; transition: transform 0.25s ease; }
.bw-open .bw-chevron { transform: rotate(180deg); }
.bw-panel {
  display: grid; grid-template-rows: 0fr; width: 100%; visibility: hidden;
  transition: grid-template-rows 0.25s ease, visibility 0s linear 0.25s;
}
.bw-open .bw-panel {
  grid-template-rows: 1fr; visibility: visible;
  transition: grid-template-rows 0.25s ease, visibility 0s linear 0s;
}
.bw-panel-inner { min-height: 0; overflow: hidden; }
.bw-panel-inner .bw-viewport { padding: 16px 0 4px; }
.bw-accordion:not(.bw-open) .bw-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .bw-panel, .bw-open .bw-panel, .bw-chevron, .bw-badge { transition: none !important; }
}
`

function themeStyle(theme: BadgeWallThemeName): string {
  const vars = PALETTE[theme] ?? PALETTE.light
  return `:host, .bw-root-${theme} { ${Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ")} }`
}

/** The badge's own <img> width/height only as layout hints; CSS fixes the height at 40px. */
function badgeLink(badge: BadgeWallPayloadBadge, hidden: boolean): string {
  const href = safeUrl(badge.href)
  const src = safeUrl(badge.src)
  if (!href || !src) return ""
  const size =
    badge.width && badge.height
      ? ` width="${Math.round(badge.width)}" height="${Math.round(badge.height)}"`
      : ""
  return (
    `<a class="bw-badge" href="${escapeHtml(href)}" target="_blank" rel="${escapeHtml(safeRel(badge.rel))}"` +
    `${hidden ? ' tabindex="-1" aria-hidden="true"' : ""} title="${escapeHtml(badge.name)}">` +
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(badge.alt)}"${size} loading="lazy" decoding="async" />` +
    `</a>`
  )
}

/** Badges per marquee set at least: short walls repeat their list so a set fills the viewport. */
export const MARQUEE_MIN_ITEMS = 12
/** Seconds per badge, the footer's speed (about 46 badges per set in 60s). */
export const MARQUEE_SECONDS_PER_ITEM = 1.3
export const MARQUEE_MIN_SECONDS = 20

export function marqueeCopies(badgeCount: number): number {
  return badgeCount > 0 ? Math.ceil(MARQUEE_MIN_ITEMS / badgeCount) : 0
}

export function marqueeDurationSeconds(badgeCount: number): number {
  const itemsPerSet = badgeCount * marqueeCopies(badgeCount)
  return Math.max(MARQUEE_MIN_SECONDS, Math.round(itemsPerSet * MARQUEE_SECONDS_PER_ITEM))
}

/**
 * One marquee set: the badge list repeated `copies` times. Only the first copy of the main set is
 * exposed (focusable, announced); every repeat and the whole clone set are aria-hidden and out of
 * the tab order, so each badge is announced and tabbable exactly once.
 */
function badgeSet(badges: BadgeWallPayloadBadge[], copies: number, clone: boolean): string {
  let links = ""
  for (let copy = 0; copy < copies; copy++) {
    links += badges.map((badge) => badgeLink(badge, clone || copy > 0)).join("")
  }
  return clone
    ? `<div class="bw-set bw-clone" aria-hidden="true">${links}</div>`
    : `<div class="bw-set">${links}</div>`
}

/** Single-row marquee: a set plus an identical clone, shifted by -50% for a seamless loop. */
function marquee(badges: BadgeWallPayloadBadge[]): string {
  const copies = marqueeCopies(badges.length)
  return (
    `<div class="bw-viewport"><div class="bw-track">` +
    badgeSet(badges, copies, false) +
    badgeSet(badges, copies, true) +
    `</div></div>`
  )
}

function attributionLine(payload: BadgeWallPayload): string {
  if (!payload.attribution.show) return ""
  const href = safeUrl(payload.attribution.href)
  const text = escapeHtml(payload.attribution.text)
  return `<p class="bw-attribution">${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${text}</a>` : text}</p>`
}

const CHEVRON =
  '<svg class="bw-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">' +
  '<path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>'

/** Ids must be unique per page when several walls are rendered into one document. */
function safeIdPrefix(value: string): string {
  return `bw-${value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "wall"}`
}

export interface RenderOptions {
  /** Prefix for the accordion's ids (aria-controls). Defaults to the website ID. */
  idPrefix?: string
  /** Text shown when the wall has no visible badge (dashboard preview only). */
  emptyText?: string
}

export function renderBadgeWall(
  payload: BadgeWallPayload,
  options: RenderOptions = {},
): { css: string; html: string } {
  const theme: BadgeWallThemeName = payload.theme === "dark" ? "dark" : "light"
  const badges = payload.badges.filter((badge) => safeUrl(badge.href) && safeUrl(badge.src))
  // Per-wall speed in the CSS (not a style attribute, which host-page CSPs may block)
  const css =
    `${themeStyle(theme)}\n${BADGE_WALL_CSS}` +
    (badges.length > 0
      ? `.bw-track { animation-duration: ${marqueeDurationSeconds(badges.length)}s; }\n`
      : "")
  const attribution = attributionLine(payload)

  const body =
    badges.length === 0
      ? options.emptyText
        ? `<p class="bw-empty">${escapeHtml(options.emptyText)}</p>`
        : ""
      : null

  if (payload.template === "accordion") {
    const prefix = safeIdPrefix(options.idPrefix ?? payload.websiteId)
    const html =
      `<div class="bw bw-accordion bw-root-${theme}" data-template="accordion" data-state="closed">` +
      `<div class="bw-acc-header">` +
      `<button type="button" class="bw-toggle" id="${prefix}-toggle" aria-expanded="false" aria-controls="${prefix}-panel">` +
      `<span>Featured Badges</span>${CHEVRON}</button></div>` +
      `<div class="bw-panel" id="${prefix}-panel" role="region" aria-labelledby="${prefix}-toggle">` +
      `<div class="bw-panel-inner">${body ?? marquee(badges)}</div></div>` +
      attribution +
      `</div>`
    return { css, html }
  }

  const html =
    `<div class="bw bw-fixed bw-root-${theme}" data-template="fixed">` +
    `<p class="bw-title">Featured On</p>` +
    (body ?? marquee(badges)) +
    attribution +
    `</div>`
  return { css, html }
}
