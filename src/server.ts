import type { BadgeWallPayload } from "./core/types"

// Server-side fetch of a wall with a secret API key. Run it on YOUR server only (an API route, a
// server component, a build step): the key must never reach the browser.

export const DEFAULT_API_ORIGIN = "https://prolaunch.net"

export interface FetchBadgeWallOptions {
  websiteId: string
  /** Defaults to process.env.PROLAUNCH_API_KEY */
  apiKey?: string
  /** Defaults to https://prolaunch.net */
  apiOrigin?: string
  /** Extra fetch options (e.g. Next.js `next: { revalidate: 300 }`) */
  init?: RequestInit & Record<string, unknown>
}

export class BadgeWallFetchError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "BadgeWallFetchError"
  }
}

function readEnvKey(): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env
  return env?.PROLAUNCH_API_KEY
}

export async function fetchBadgeWall({
  websiteId,
  apiKey = readEnvKey(),
  apiOrigin = DEFAULT_API_ORIGIN,
  init,
}: FetchBadgeWallOptions): Promise<BadgeWallPayload> {
  if (!apiKey) {
    throw new BadgeWallFetchError(401, "Missing API key: set PROLAUNCH_API_KEY")
  }
  const res = await fetch(`${apiOrigin}/api/badge-wall/v1/walls/${encodeURIComponent(websiteId)}`, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${apiKey}`,
    },
  })
  if (!res.ok) {
    // Never echo the key: only the status reaches the error
    throw new BadgeWallFetchError(res.status, `Badge wall request failed (HTTP ${res.status})`)
  }
  return (await res.json()) as BadgeWallPayload
}
