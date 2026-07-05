import { useEffect } from 'react'

/**
 * Returns all visible, enabled `[data-nav-item]` descendants of `root`.
 *
 * Hidden elements (`offsetParent === null`) and disabled elements are
 * excluded so keyboard navigation skips items the user cannot interact with.
 */
export function getNavigableItems(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>('[data-nav-item]')).filter(
    (el) => !el.hasAttribute('disabled') && isVisible(el),
  )
}

function isVisible(el: HTMLElement): boolean {
  // In real browsers offsetParent is null for display:none and detached elements.
  // jsdom always returns null, so we fall back to attribute/style checks.
  if (typeof el.offsetParent !== 'undefined' && el.offsetParent !== null) return true
  if (el.hidden) return false
  if (el.style.display === 'none') return false
  return el.isConnected
}

function centerX(r: DOMRect): number {
  return (r.left + r.right) / 2
}

function centerY(r: DOMRect): number {
  return (r.top + r.bottom) / 2
}

/**
 * Spatial navigation algorithm.
 *
 * Finds the closest navigable item in the given direction, using gap
 * (distance in the movement direction) as the primary key, relative overlap
 * (alignment perpendicular to movement) as the first tie-breaker, then
 * center-distance, then DOM order.  Returns `undefined` when no candidate
 * exists in the requested direction (no wrap).
 *
 * This is "nearest item in that direction, most-aligned wins ties" —
 * predictable and vim-like.
 */
function findBestCandidate(
  candidates: HTMLElement[],
  direction: 'ArrowDown' | 'ArrowUp' | 'ArrowRight' | 'ArrowLeft',
  current: DOMRect,
): HTMLElement | undefined {
  const rects = candidates.map((el, domIndex) => {
    const rect = el.getBoundingClientRect()
    const horizontalOverlap = Math.max(
      0,
      Math.min(current.right, rect.right) - Math.max(current.left, rect.left),
    )
    const verticalOverlap = Math.max(
      0,
      Math.min(current.bottom, rect.bottom) - Math.max(current.top, rect.top),
    )
    return { el, rect, domIndex, horizontalOverlap, verticalOverlap }
  })

  switch (direction) {
    case 'ArrowDown': {
      // Primary: items strictly below or adjacent
      let filtered = rects.filter(({ rect }) => rect.top >= current.bottom)

      if (filtered.length === 0) {
        // Fallback: items whose top edge is below current's top
        filtered = rects.filter(({ rect }) => rect.top > current.top)
      }
      if (filtered.length === 0) return undefined

      filtered.sort((a, b) => {
        // Primary: nearest in movement direction (smallest gap)
        const gapA = a.rect.top - current.bottom
        const gapB = b.rect.top - current.bottom
        if (gapA !== gapB) return gapA - gapB

        // Secondary: best alignment (relative horizontal overlap)
        const relOverlapA = a.rect.width === 0 ? 0 : a.horizontalOverlap / a.rect.width
        const relOverlapB = b.rect.width === 0 ? 0 : b.horizontalOverlap / b.rect.width
        if (relOverlapB !== relOverlapA) return relOverlapB - relOverlapA

        // Tertiary: closest column center
        const distA = Math.abs(centerX(a.rect) - centerX(current))
        const distB = Math.abs(centerX(b.rect) - centerX(current))
        if (distA !== distB) return distA - distB

        return a.domIndex - b.domIndex
      })

      return filtered[0]?.el
    }

    case 'ArrowUp': {
      let filtered = rects.filter(({ rect }) => rect.bottom <= current.top)

      if (filtered.length === 0) {
        filtered = rects.filter(({ rect }) => rect.bottom < current.bottom)
      }
      if (filtered.length === 0) return undefined

      filtered.sort((a, b) => {
        // Primary: nearest in movement direction (smallest gap)
        const gapA = current.top - a.rect.bottom
        const gapB = current.top - b.rect.bottom
        if (gapA !== gapB) return gapA - gapB

        // Secondary: best alignment (relative horizontal overlap)
        const relOverlapA = a.rect.width === 0 ? 0 : a.horizontalOverlap / a.rect.width
        const relOverlapB = b.rect.width === 0 ? 0 : b.horizontalOverlap / b.rect.width
        if (relOverlapB !== relOverlapA) return relOverlapB - relOverlapA

        // Tertiary: closest column center
        const distA = Math.abs(centerX(a.rect) - centerX(current))
        const distB = Math.abs(centerX(b.rect) - centerX(current))
        if (distA !== distB) return distA - distB

        return a.domIndex - b.domIndex
      })

      return filtered[0]?.el
    }

    case 'ArrowRight': {
      let filtered = rects.filter(({ rect }) => rect.left >= current.right)

      if (filtered.length === 0) {
        filtered = rects.filter(({ rect }) => rect.left > current.left)
      }
      if (filtered.length === 0) return undefined

      filtered.sort((a, b) => {
        // Primary: nearest in movement direction (smallest gap)
        const gapA = a.rect.left - current.right
        const gapB = b.rect.left - current.right
        if (gapA !== gapB) return gapA - gapB

        // Secondary: best alignment (relative vertical overlap)
        const relOverlapA = a.rect.height === 0 ? 0 : a.verticalOverlap / a.rect.height
        const relOverlapB = b.rect.height === 0 ? 0 : b.verticalOverlap / b.rect.height
        if (relOverlapB !== relOverlapA) return relOverlapB - relOverlapA

        // Tertiary: closest row center
        const distA = Math.abs(centerY(a.rect) - centerY(current))
        const distB = Math.abs(centerY(b.rect) - centerY(current))
        if (distA !== distB) return distA - distB

        return a.domIndex - b.domIndex
      })

      return filtered[0]?.el
    }

    case 'ArrowLeft': {
      let filtered = rects.filter(({ rect }) => rect.right <= current.left)

      if (filtered.length === 0) {
        filtered = rects.filter(({ rect }) => rect.right < current.right)
      }
      if (filtered.length === 0) return undefined

      filtered.sort((a, b) => {
        // Primary: nearest in movement direction (smallest gap)
        const gapA = current.left - a.rect.right
        const gapB = current.left - b.rect.right
        if (gapA !== gapB) return gapA - gapB

        // Secondary: best alignment (relative vertical overlap)
        const relOverlapA = a.rect.height === 0 ? 0 : a.verticalOverlap / a.rect.height
        const relOverlapB = b.rect.height === 0 ? 0 : b.verticalOverlap / b.rect.height
        if (relOverlapB !== relOverlapA) return relOverlapB - relOverlapA

        // Tertiary: closest row center
        const distA = Math.abs(centerY(a.rect) - centerY(current))
        const distB = Math.abs(centerY(b.rect) - centerY(current))
        if (distA !== distB) return distA - distB

        return a.domIndex - b.domIndex
      })

      return filtered[0]?.el
    }
  }
}

/**
 * Global spatial keyboard navigation for the whole page.
 *
 * Attaches a single `keydown` listener on `window`.  Arrow keys move focus
 * to the closest `[data-nav-item]` in that direction using geometric
 * proximity (overlap-first, then gap, then center-distance).  Enter
 * activates the focused item via `.click()`.
 *
 * Navigation does **not** wrap — if no element exists in the requested
 * direction the key event passes through unmodified.
 *
 * Call once at a root layout level so the listener is mounted for every
 * page.
 */
export function useSpatialNav(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement
      const isNavItemActive =
        active instanceof HTMLElement && active.hasAttribute('data-nav-item')
      const isArrowKey =
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowLeft'

      // ── Seeding: cold start when no nav-item is focused ──
      if (!isNavItemActive) {
        if (!isArrowKey) return

        // Longform reading: arrows scroll natively, don't seed
        if (document.querySelector('[data-longform]')) return

        const candidates = getNavigableItems(document.documentElement)
        if (candidates.length === 0) return

        // Seed point at top-centre of the visible viewport
        const viewportCenterX = window.innerWidth / 2
        const currentScrollY = window.scrollY
        const seedRect: DOMRect = {
          x: viewportCenterX,
          y: currentScrollY,
          width: 0,
          height: 0,
          top: currentScrollY,
          right: viewportCenterX,
          bottom: currentScrollY,
          left: viewportCenterX,
          toJSON() {
            return this
          },
        }

        const winner = findBestCandidate(
          candidates,
          event.key as 'ArrowDown' | 'ArrowUp' | 'ArrowRight' | 'ArrowLeft',
          seedRect,
        )

        if (winner) {
          event.preventDefault()
          winner.focus()
          return
        }

        // Seeding fallback: Up/Left → last item; Down/Right → first item
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          const fallback = candidates[candidates.length - 1]
          if (fallback) {
            event.preventDefault()
            fallback.focus()
          }
        } else {
          const fallback = candidates[0]
          if (fallback) {
            event.preventDefault()
            fallback.focus()
          }
        }
        return
      }

      // ── Nav-item is focused ──

      // Enter: activate the focused item without preventDefault
      if (event.key === 'Enter') {
        active.click()
        return
      }

      // Non-arrow keys: passthrough
      if (!isArrowKey) return

      const candidates = getNavigableItems(document.documentElement).filter(
        (el) => el !== active,
      )
      if (candidates.length === 0) return

      const currentRect = active.getBoundingClientRect()
      const winner = findBestCandidate(
        candidates,
        event.key as 'ArrowDown' | 'ArrowUp' | 'ArrowRight' | 'ArrowLeft',
        currentRect,
      )

      if (winner) {
        event.preventDefault()
        winner.focus()
      }
      // No winner → passthrough (no preventDefault, no focus change)
    }

    window.addEventListener('keydown', handleKeyDown, { capture: false })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: false })
  }, [])
}
