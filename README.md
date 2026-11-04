# @prolaunch/badge-wall

Show the "Featured on …" badges of every directory that lists your product, in one block in your site footer. You manage the wall on [prolaunch.net/dashboard/badge-wall](https://prolaunch.net/dashboard/badge-wall). Badges, template and theme update without a redeploy.

- Two templates: **Fixed** (always visible) and **Accordion** (a collapsible "Featured badges" block). Each comes in **light** and **dark**.
- Rendered inside a Shadow DOM: your CSS can't break the wall, and the wall's CSS can't leak into your site.
- Each badge links to its directory's homepage. The wall only renders on your verified website.

## Credentials

| What       | Where it goes                               | Secret? |
| ---------- | ------------------------------------------- | ------- |
| Website ID | Script tag, iframe, `<BadgeWall websiteId>` | No      |
| API key    | `PROLAUNCH_API_KEY` on **your server** only | **Yes** |

Create the key in the dashboard. It is shown once. Never commit it, never send it to the browser, and never paste it into an AI prompt. One key works for every website on your account.

## Next.js (App Router)

```bash
npm install @prolaunch/badge-wall
```

```bash
# .env (server only)
PROLAUNCH_API_KEY=your_api_key_here
```

```tsx
// app/layout.tsx: a server component
import { BadgeWall } from "@prolaunch/badge-wall/react"

import { BadgeWallClient } from "@/components/badge-wall-client"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer>
          <BadgeWall websiteId="YOUR_WEBSITE_ID" />
          <BadgeWallClient />
        </footer>
      </body>
    </html>
  )
}
```

```tsx
// components/badge-wall-client.tsx
"use client"

import { useEffect } from "react"

import { defineBadgeWallElement } from "@prolaunch/badge-wall"

export function BadgeWallClient() {
  useEffect(() => defineBadgeWallElement(), [])
  return null
}
```

`<BadgeWall>` fetches the wall on the server with your key and renders it into a **declarative shadow root**, so the badge links are in your initial HTML. The client component only wires up the accordion and scrolling.

If the request fails, `<BadgeWall>` renders nothing: a broken wall never breaks your footer.

## Any server

```ts
import { fetchBadgeWall, renderBadgeWall } from "@prolaunch/badge-wall"

const payload = await fetchBadgeWall({ websiteId: "YOUR_WEBSITE_ID" }) // reads PROLAUNCH_API_KEY
const { css, html } = renderBadgeWall(payload)
// Put `<prolaunch-badge-wall><template shadowrootmode="open"><style>${css}</style>${html}</template></prolaunch-badge-wall>`
// in your footer, and call defineBadgeWallElement() in the browser.
```

## No build step (no key needed)

```html
<div data-prolaunch-badge-wall="YOUR_WEBSITE_ID"></div>
<script src="https://prolaunch.net/badge-wall/badges.js" async></script>
```

Or use `<prolaunch-badge-wall website-id="YOUR_WEBSITE_ID"></prolaunch-badge-wall>` after calling `defineBadgeWallElement()`.

## Iframe

Copy the iframe snippet from the dashboard. It includes a small listener that resizes the iframe as the accordion opens and closes. The listener accepts messages only from `https://prolaunch.net` and only from that iframe. `connectBadgeWallFrame(iframe, { expectedOrigin, websiteId })` does the same in code.

## API

| Export                                   | Where   | Description                                                     |
| ---------------------------------------- | ------- | --------------------------------------------------------------- |
| `fetchBadgeWall({ websiteId, apiKey? })` | server  | Fetches the payload with your key (default `PROLAUNCH_API_KEY`) |
| `BadgeWall` (`/react`)                   | server  | React Server Component, declarative shadow DOM                  |
| `renderBadgeWall(payload)`               | any     | `{ css, html }`, escaped and scoped                             |
| `mountBadgeWall(host, payload)`          | browser | Renders into `host`'s shadow root and wires up the behaviors    |
| `defineBadgeWallElement(origin?)`        | browser | Registers `<prolaunch-badge-wall>`                              |
| `connectBadgeWallFrame(iframe, opts)`    | browser | Auto-resizes an iframe embed, with strict origin checks         |

The payload contract is `BadgeWallPayload` in `src/core/types.ts`: version 1, additive changes only.

## License

MIT
