import type { Terminal as Xterm } from '@xterm/xterm'
import type { Activity, Signal } from '../model'

const BEL = '\x07'
const ACTIVITIES: Activity[] = ['working', 'waiting', 'done']

/** Parses OSC title, Claude Code status, progress and notifications; forwards them to main. */
export function watchSignals(term: Xterm, send: (s: Signal) => void) {
  const title = (data: string) => {
    send({ kind: 'title', value: data })
    return true
  }
  term.parser.registerOscHandler(0, title)
  term.parser.registerOscHandler(2, title)
  // OSC 7501 is unpublished: accept the known states leniently, ignore the rest.
  term.parser.registerOscHandler(7501, (data) => {
    const value = data.toLowerCase().split(';')[0] as Activity
    if (ACTIVITIES.includes(value)) send({ kind: 'activity', value })
    return true
  })
  // OSC 9;4;state;pct is ConEmu progress; any other OSC 9 is a notification (iTerm2/ConEmu).
  term.parser.registerOscHandler(9, (data) => {
    if (data.startsWith('4;')) {
      const [, state, pct] = data.split(';')
      const on = state === '1' || state === '2' || state === '4'
      send({ kind: 'progress', value: on ? Math.min(100, Number(pct) || 0) : undefined })
    } else send({ kind: 'notify', value: data })
    return true
  })
  // OSC 777;notify;title;body (rxvt) and OSC 99 (kitty).
  term.parser.registerOscHandler(777, (data) => {
    const [cmd, , body] = data.split(';')
    if (cmd === 'notify') send({ kind: 'notify', value: body ?? '' })
    return true
  })
  term.parser.registerOscHandler(99, (data) => {
    send({ kind: 'notify', value: data.split(';').at(-1) ?? '' })
    return true
  })
  term.onBell(() => send({ kind: 'notify', value: BEL }))
}
