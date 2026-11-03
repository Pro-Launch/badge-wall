// Client-side behaviors for a rendered badge wall: the accordion toggle and the marquee switch.
// Framework-free; `root` is a ShadowRoot, a Document or any element containing a rendered wall.

type Root = Document | ShadowRoot | Element

export interface AccordionOptions {
  /** Called after each open/close with the new state. */
  onToggle?: (open: boolean) => void
}

/**
 * Wires every accordion wall under `root`. The header is a real <button aria-expanded
 * aria-controls>, so Enter and Space work natively. Each page load starts collapsed and the
 * state is never persisted. Returns a cleanup function.
 */
export function attachAccordion(root: Root, { onToggle }: AccordionOptions = {}): () => void {
  const cleanups: (() => void)[] = []

  root.querySelectorAll<HTMLElement>(".bw-accordion").forEach((wall) => {
    const button = wall.querySelector<HTMLButtonElement>(".bw-toggle")
    if (!button) return

    const setOpen = (open: boolean) => {
      wall.classList.toggle("bw-open", open)
      wall.dataset.state = open ? "open" : "closed"
      button.setAttribute("aria-expanded", String(open))
    }

    // Always collapsed on load, whatever the markup said
    setOpen(false)

    const handleClick = () => {
      const open = button.getAttribute("aria-expanded") !== "true"
      setOpen(open)
      onToggle?.(open)
    }
    button.addEventListener("click", handleClick)
    cleanups.push(() => button.removeEventListener("click", handleClick))
  })

  return () => cleanups.forEach((cleanup) => cleanup())
}

function prefersReducedMotion(view: (Window & typeof globalThis) | null): boolean {
  try {
    return Boolean(view?.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  } catch {
    return false
  }
}

/**
 * Fixed template: scroll like the footer marquee only when the badges overflow a single row and
 * the visitor has not asked for reduced motion; otherwise keep the static wrapping row.
 * Re-evaluated on resize and as badge images load. Returns a cleanup function.
 */
export function attachMarquee(root: Root): () => void {
  const cleanups: (() => void)[] = []

  root.querySelectorAll<HTMLElement>(".bw-fixed").forEach((wall) => {
    const viewport = wall.querySelector<HTMLElement>(".bw-viewport")
    const firstSet = wall.querySelector<HTMLElement>(".bw-set:not(.bw-clone)")
    if (!viewport || !firstSet) return
    const view = wall.ownerDocument.defaultView

    const update = () => {
      if (prefersReducedMotion(view)) {
        wall.classList.remove("bw-scroll")
        return
      }
      // Measure the set laid out as a single row
      wall.classList.remove("bw-scroll")
      wall.classList.add("bw-measure")
      const overflows = firstSet.scrollWidth > viewport.clientWidth + 1
      wall.classList.remove("bw-measure")
      wall.classList.toggle("bw-scroll", overflows)
    }

    update()

    const images = Array.from(firstSet.querySelectorAll("img"))
    images.forEach((img) => img.addEventListener("load", update))
    cleanups.push(() => images.forEach((img) => img.removeEventListener("load", update)))

    if (view && "ResizeObserver" in view) {
      const observer = new view.ResizeObserver(() => update())
      observer.observe(viewport)
      cleanups.push(() => observer.disconnect())
    }

    const motion = view?.matchMedia?.("(prefers-reduced-motion: reduce)")
    motion?.addEventListener?.("change", update)
    cleanups.push(() => motion?.removeEventListener?.("change", update))
  })

  return () => cleanups.forEach((cleanup) => cleanup())
}

export function attachBehaviors(root: Root, options: AccordionOptions = {}): () => void {
  const a = attachAccordion(root, options)
  const m = attachMarquee(root)
  return () => {
    a()
    m()
  }
}
