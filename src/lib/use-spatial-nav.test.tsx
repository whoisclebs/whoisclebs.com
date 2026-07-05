import { render, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { getNavigableItems, useSpatialNav } from './use-spatial-nav'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a component that calls `useSpatialNav()` so the window listener is mounted. */
function setup() {
  function Harness() {
    useSpatialNav()
    return null
  }
  render(<Harness />)
}

/**
 * Mock `getBoundingClientRect` on an element so it returns the given rect.
 */
function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
  const full: DOMRect = {
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
    width: (rect.right ?? 0) - (rect.left ?? 0),
    height: (rect.bottom ?? 0) - (rect.top ?? 0),
    top: rect.top ?? 0,
    right: rect.right ?? 0,
    bottom: rect.bottom ?? 0,
    left: rect.left ?? 0,
    toJSON: () => full,
  }
  return vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(full)
}

/**
 * Create a simple `<a data-nav-item>` and append to body.
 * Returns the element.
 */
function createNavItem(id: string): HTMLAnchorElement {
  const el = document.createElement('a')
  el.setAttribute('data-nav-item', '')
  el.setAttribute('href', `#${id}`)
  el.textContent = id
  document.body.appendChild(el)
  return el
}

// ---------------------------------------------------------------------------
// Cleanup between tests — remove leaked DOM elements and restore mocks
// ---------------------------------------------------------------------------

afterEach(() => {
  document.querySelectorAll('[data-nav-item], [data-longform]').forEach((el) => el.remove())
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Unit: getNavigableItems
// ---------------------------------------------------------------------------

describe('getNavigableItems', () => {
  it('returns an empty array for null', () => {
    expect(getNavigableItems(null)).toEqual([])
  })

  it('filters out disabled elements', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <button data-nav-item id="a">A</button>
      <button data-nav-item id="b" disabled>B</button>
    `
    document.body.appendChild(container)

    const items = getNavigableItems(document.body)
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('a')

    document.body.removeChild(container)
  })

  it('filters out hidden elements', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <button data-nav-item id="a">A</button>
      <button data-nav-item id="b" hidden>B</button>
      <button data-nav-item id="c" style="display:none">C</button>
    `
    document.body.appendChild(container)

    const items = getNavigableItems(document.body)
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('a')

    document.body.removeChild(container)
  })

  it('returns all enabled visible items', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <a data-nav-item href="/a">A</a>
      <a data-nav-item href="/b">B</a>
      <a data-nav-item href="/c">C</a>
    `
    document.body.appendChild(container)

    expect(getNavigableItems(document.body)).toHaveLength(3)

    document.body.removeChild(container)
  })
})

// ---------------------------------------------------------------------------
// Spatial navigation integration tests
// ---------------------------------------------------------------------------

describe('useSpatialNav – ArrowDown', () => {
  it('moves from item-A (top:0) to item-B (top:100, overlapping x) on ArrowDown', () => {
    setup()

    const a = createNavItem('a')
    const b = createNavItem('b')
    mockRect(a, { top: 0, bottom: 40, left: 0, right: 100 })
    mockRect(b, { top: 100, bottom: 140, left: 0, right: 100 })

    a.focus()
    expect(document.activeElement).toBe(a)

    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(b)
  })

  it('does nothing when no item is below (no preventDefault, no focus change)', () => {
    setup()

    const a = createNavItem('a')
    mockRect(a, { top: 100, bottom: 140, left: 0, right: 100 })

    a.focus()
    expect(document.activeElement).toBe(a)

    // fireEvent.keyDown returns true when preventDefault was NOT called
    expect(fireEvent.keyDown(a, { key: 'ArrowDown' })).toBe(true)
    expect(document.activeElement).toBe(a)
  })

  it('picks horizontally-overlapping item over a nearer but offset item', () => {
    setup()

    const current = createNavItem('current')
    const overlapping = createNavItem('overlap')
    const offset = createNavItem('offset')

    // Current at top-left
    mockRect(current, { top: 0, bottom: 40, left: 0, right: 100 })
    // Overlapping below (share x-range)
    mockRect(overlapping, { top: 100, bottom: 140, left: 50, right: 150 })
    // Offset below but no x-overlap
    mockRect(offset, { top: 100, bottom: 140, left: 200, right: 300 })

    current.focus()
    fireEvent.keyDown(current, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(overlapping)
  })

  it('tie-breaks by gap when overlaps are equal', () => {
    setup()

    const current = createNavItem('current')
    const near = createNavItem('near')
    const far = createNavItem('far')

    // All have same x-overlap
    mockRect(current, { top: 0, bottom: 40, left: 0, right: 100 })
    mockRect(near, { top: 100, bottom: 140, left: 0, right: 100 }) // gap=60
    mockRect(far, { top: 200, bottom: 240, left: 0, right: 100 }) // gap=160

    current.focus()
    fireEvent.keyDown(current, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(near)
  })

  it('picks nearest by center-distance when x-overlap is zero for all candidates', () => {
    setup()

    const current = createNavItem('current')
    const closer = createNavItem('closer')
    const further = createNavItem('further')

    // Current on the left, centerX=50
    mockRect(current, { top: 0, bottom: 40, left: 0, right: 100 })
    // Closer: same gap, no overlap, centerX=250, |250-50|=200
    mockRect(closer, { top: 100, bottom: 140, left: 200, right: 300 })
    // Further: same gap, no overlap, centerX=450, |450-50|=400
    mockRect(further, { top: 100, bottom: 140, left: 400, right: 500 })

    current.focus()
    fireEvent.keyDown(current, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(closer)
  })

  it('relative overlap: same-column card beats full-width CTA with more absolute overlap', () => {
    setup()

    const current = createNavItem('current')
    const card = createNavItem('card')
    const cta = createNavItem('cta')

    // Current in right column
    mockRect(current, { top: 300, bottom: 400, left: 400, right: 800 })
    // Same-column card below (rel overlap = 1.0)
    mockRect(card, { top: 450, bottom: 600, left: 400, right: 800 })
    // Full-width CTA further down (absolute overlap = 400, width = 1280, rel overlap ≈ 0.31)
    mockRect(cta, { top: 700, bottom: 800, left: 0, right: 1280 })

    current.focus()
    fireEvent.keyDown(current, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(card)
  })

  it('relative overlap: picks full-width CTA when it is the only candidate below', () => {
    setup()

    const current = createNavItem('current')
    const cta = createNavItem('cta')

    // Bottom-left card
    mockRect(current, { top: 500, bottom: 600, left: 0, right: 600 })
    // Full-width CTA below, no other candidate
    mockRect(cta, { top: 700, bottom: 800, left: 0, right: 1280 })

    current.focus()
    fireEvent.keyDown(current, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cta)
  })
})

describe('useSpatialNav – multi-direction movement in a 3×2 grid', () => {
  it('ArrowRight moves along a row; ArrowDown moves down a column', () => {
    setup()

    const grid: HTMLElement[] = []
    const positions = [
      // Row 0
      { top: 0, bottom: 40, left: 0, right: 100 },   // col 0
      { top: 0, bottom: 40, left: 100, right: 200 },  // col 1
      { top: 0, bottom: 40, left: 200, right: 300 },  // col 2
      // Row 1
      { top: 50, bottom: 90, left: 0, right: 100 },   // col 0
      { top: 50, bottom: 90, left: 100, right: 200 }, // col 1
      { top: 50, bottom: 90, left: 200, right: 300 }, // col 2
    ]

    for (let i = 0; i < 6; i++) {
      const el = createNavItem(`item${i}`)
      mockRect(el, positions[i])
      grid.push(el)
    }

    // Start at top-left (item 0)
    grid[0].focus()
    expect(document.activeElement).toBe(grid[0])

    // Move right twice along row 0
    fireEvent.keyDown(grid[0], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(grid[1])

    fireEvent.keyDown(grid[1], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(grid[2])

    // Move down from last column
    fireEvent.keyDown(grid[2], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(grid[5])
  })
})

describe('useSpatialNav – no-op when activeElement is not a nav-item', () => {
  it('does nothing when activeElement is document.body', () => {
    setup()

    // Focus body
    ;(document.body as HTMLBodyElement).focus()

    // fireEvent.keyDown returns true when preventDefault was NOT called
    expect(fireEvent.keyDown(document.body, { key: 'ArrowDown' })).toBe(true)
  })

  it('does nothing when activeElement is a non-data-nav-item button', () => {
    setup()

    const btn = document.createElement('button')
    btn.textContent = 'Plain button'
    document.body.appendChild(btn)
    btn.focus()

    expect(fireEvent.keyDown(btn, { key: 'ArrowDown' })).toBe(true)

    btn.remove()
  })
})

describe('useSpatialNav – Enter', () => {
  it('calls .click() on the focused nav-item', () => {
    setup()

    const onClick = vi.fn()

    const a = createNavItem('a')
    a.addEventListener('click', onClick)

    a.focus()
    fireEvent.keyDown(a, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('useSpatialNav – candidates exclude hidden / disabled', () => {
  it('skips hidden and disabled nav-items when navigating', () => {
    setup()

    const active = createNavItem('active')
    mockRect(active, { top: 0, bottom: 40, left: 0, right: 100 })

    // Hidden item — should be skipped
    const hidden = createNavItem('hidden')
    hidden.hidden = true

    // Disabled item — should be skipped
    const disabled = createNavItem('disabled')
    disabled.setAttribute('disabled', '')

    // Visible enabled item — should be the target
    const target = createNavItem('target')
    mockRect(target, { top: 100, bottom: 140, left: 0, right: 100 })

    active.focus()
    fireEvent.keyDown(active, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(target)
  })
})

describe('useSpatialNav – no wrap', () => {
  it('does not wrap from last item in any direction', () => {
    setup()

    const a = createNavItem('a')
    const b = createNavItem('b')
    mockRect(a, { top: 0, bottom: 40, left: 0, right: 100 })
    mockRect(b, { top: 0, bottom: 40, left: 100, right: 200 })

    // Focus B (rightmost), press Right → no move
    b.focus()
    fireEvent.keyDown(b, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(b)

    // Focus A (leftmost), press Left → no move
    a.focus()
    fireEvent.keyDown(a, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(a)

    // Single item, press Down → no move
    const single = createNavItem('single')
    mockRect(single, { top: 0, bottom: 40, left: 300, right: 400 })
    single.focus()
    fireEvent.keyDown(single, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(single)
  })
})

// ---------------------------------------------------------------------------
// Cold start seeding (no nav-item focused)
// ---------------------------------------------------------------------------

describe('useSpatialNav – cold start seeding', () => {
  it('seeds to nearest item below viewport on ArrowDown', () => {
    setup()

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })

    const a = createNavItem('a')
    const b = createNavItem('b')
    mockRect(a, { top: 0, bottom: 40, left: 0, right: 100 })
    mockRect(b, { top: 100, bottom: 140, left: 0, right: 100 })

    // Cold start: body is focused
    ;(document.body as HTMLBodyElement).focus()
    expect(document.activeElement).toBe(document.body)

    const result = fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(result).toBe(false) // preventDefault was called
    expect(document.activeElement).toBe(a)
  })

  it('does nothing on ArrowDown when no nav-items exist', () => {
    setup()

    ;(document.body as HTMLBodyElement).focus()

    const result = fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(result).toBe(true) // no preventDefault
    expect(document.activeElement).toBe(document.body)
  })

  it('falls back to last item on ArrowUp (nothing above viewport)', () => {
    setup()

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })

    const a = createNavItem('a')
    const b = createNavItem('b')
    mockRect(a, { top: 0, bottom: 40, left: 0, right: 100 })
    mockRect(b, { top: 100, bottom: 140, left: 0, right: 100 })

    ;(document.body as HTMLBodyElement).focus()

    const result = fireEvent.keyDown(document.body, { key: 'ArrowUp' })
    expect(result).toBe(false) // preventDefault was called
    expect(document.activeElement).toBe(b) // last in DOM order
  })

  it('does not seed on longform page (data-longform present)', () => {
    setup()

    const longform = document.createElement('article')
    longform.setAttribute('data-longform', '')
    document.body.appendChild(longform)

    const a = createNavItem('a')
    mockRect(a, { top: 0, bottom: 40, left: 0, right: 100 })

    ;(document.body as HTMLBodyElement).focus()

    const result = fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(result).toBe(true) // no preventDefault
    expect(document.activeElement).toBe(document.body)
  })

  it('seeds on first ArrowDown then normal nav works on second', () => {
    setup()

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })

    const a = createNavItem('a')
    const b = createNavItem('b')
    mockRect(a, { top: 0, bottom: 40, left: 0, right: 100 })
    mockRect(b, { top: 100, bottom: 140, left: 0, right: 100 })

    // Cold start — seed to A
    ;(document.body as HTMLBodyElement).focus()
    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(a)

    // Now normal nav — ArrowDown from A to B
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(b)
  })
})
