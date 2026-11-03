// Public payload contract of the badge wall API (GET /api/badge-wall/v1/walls/:websiteId).
// Shared by the Pro Launch server, the script tag, the iframe and the npm package. Additive
// changes only within a version.

export const BADGE_WALL_PAYLOAD_VERSION = 1

export type BadgeWallTemplateName = "fixed" | "accordion"
export type BadgeWallThemeName = "light" | "dark"

export interface BadgeWallPayloadBadge {
  name: string
  /** The directory's homepage */
  href: string
  /** "noopener" (followed) or "nofollow noopener", decided by the server */
  rel: string
  /** Image on Pro Launch storage (never hotlinked) */
  src: string
  alt: string
  width: number | null
  height: number | null
}

export interface BadgeWallPayload {
  version: typeof BADGE_WALL_PAYLOAD_VERSION
  websiteId: string
  template: BadgeWallTemplateName
  theme: BadgeWallThemeName
  badges: BadgeWallPayloadBadge[]
  attribution: { show: boolean; text: string; href: string }
}

/** Message the iframe sends its parent so the parent can resize it. */
export const FRAME_HEIGHT_MESSAGE = "prolaunch:badge-wall:height"
/** Message the parent may send to ask the iframe to report its height again. */
export const FRAME_PING_MESSAGE = "prolaunch:badge-wall:ping"
