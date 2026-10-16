import { useEffect } from 'react'

const DWELL_MS = 150
const UNIT = '[data-focus-unit]'
const PANES = { '1': 'sidebar', '2': 'feed', '3': 'terminal' } as const

const unitOf = (t: EventTarget | null) => (t instanceof Element ? t.closest(UNIT) : null)

function focusEl(el: Element | null | undefined) {
  if (!(el instanceof HTMLElement)) return
  const inner = el.querySelector<HTMLElement>('.xterm-helper-textarea')
  ;(inner ?? el).focus({ preventScroll: true })
}

// Hover focus: resting on a focus unit for 150 ms focuses it. A focus move by other means (keys,
// a click, the app itself) suspends hover focus until the mouse moves again, so a pending dwell
// cannot undo it. `paths`/`active` are the Project tabs for tab shortcuts.
export function useFocus(paths: string[], active: string) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let candidate: Element | null | undefined
    let suspended = false
    let own = false

    const hover = (t: EventTarget | null) => {
      if (suspended) return
      const unit = unitOf(t)
      if (unit === candidate) return
      candidate = unit
      clearTimeout(timer)
      timer = setTimeout(() => {
        const at = document.activeElement
        if (unit) {
          if (!unit.contains(at)) {
            own = true
            focusEl(unit)
            own = false
          }
        } else if (at instanceof HTMLElement && unitOf(at)) at.blur()
      }, DWELL_MS)
    }
    const suspend = () => {
      suspended = true
      candidate = undefined
      clearTimeout(timer)
    }
    const onMove = (e: MouseEvent) => {
      suspended = false
      hover(e.target)
    }
    const onOver = (e: MouseEvent) => hover(e.target)
    const onFocusIn = () => {
      if (!own) suspend()
    }

    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const pane = e.shiftKey ? undefined : PANES[e.key as keyof typeof PANES]
      if (pane) {
        e.preventDefault()
        suspend()
        const units = [...document.querySelectorAll(`[data-focus-unit="${pane}"]`)]
        focusEl(units[0] ?? document.querySelector(`[data-pane="${pane}"]`))
        return
      }
      const step = e.shiftKey ? { BracketRight: 1, BracketLeft: -1 }[e.code] : undefined
      if (!step || paths.length < 2) return
      e.preventDefault()
      suspend()
      const next = paths[(paths.indexOf(active) + step + paths.length) % paths.length]
      window.api.invoke('projects:focus', next)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('keydown', onKey)
    }
  }, [paths, active])
}
