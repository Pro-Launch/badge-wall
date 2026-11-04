// Client-side behaviors for a rendered badge wall: the accordion toggle (the marquee is pure CSS).
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

/** The marquee is pure CSS (render.ts); only the accordion needs wiring. */
export function attachBehaviors(root: Root, options: AccordionOptions = {}): () => void {
  return attachAccordion(root, options)
}
