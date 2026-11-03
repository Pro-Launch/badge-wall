import { renderBadgeWall } from "./core/render"
import type { BadgeWallPayload } from "./core/types"
import { ELEMENT_NAME } from "./element"
import { fetchBadgeWall, type FetchBadgeWallOptions } from "./server"

// React Server Component for Next.js (App Router) and other RSC frameworks.
//
//   // app/layout.tsx (server)
//   import { BadgeWall } from "@prolaunch/badge-wall/react"
//   <footer><BadgeWall websiteId="…" /></footer>
//   // plus once, in a client component: import { defineBadgeWallElement } from "@prolaunch/badge-wall"
//
// The wall is rendered on the server inside a declarative shadow DOM, so the badge links are in
// the initial HTML (crawlers see them) and the host page's CSS cannot touch them. The custom
// element only wires the accordion/marquee on the client. The API key is read on the server from
// PROLAUNCH_API_KEY and never sent to the browser.

export function BadgeWallMarkup({ payload }: { payload: BadgeWallPayload }) {
  const { css, html } = renderBadgeWall(payload)
  const inner = `<template shadowrootmode="open"><style>${css}</style>${html}</template>`
  const Tag = ELEMENT_NAME as unknown as "div"
  return (
    <Tag
      website-id={payload.websiteId}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}

export async function BadgeWall(props: Omit<FetchBadgeWallOptions, "init">) {
  try {
    const payload = await fetchBadgeWall(props)
    return <BadgeWallMarkup payload={payload} />
  } catch {
    // A wall that fails to load must never break the host page's footer
    return null
  }
}
