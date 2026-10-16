import type { ITheme } from '@xterm/xterm'
import '@fontsource-variable/jetbrains-mono'

// Warm ANSI 16 tuned to the app palette (dark, low-saturation, readable on --deep).
const ANSI = {
  black: '#3a3835',
  red: '#e5786d',
  green: '#8fb573',
  yellow: '#e5b567',
  blue: '#7fa8d4',
  magenta: '#c7a0d4',
  cyan: '#7fbfb8',
  white: '#d6d3cc',
  brightBlack: '#5b5852',
  brightRed: '#f08f86',
  brightGreen: '#a6c98a',
  brightYellow: '#f0c87e',
  brightBlue: '#9bbde0',
  brightMagenta: '#d8b8e2',
  brightCyan: '#9bd0ca',
  brightWhite: '#faf9f5',
}

/** Theme built from the shell.css tokens, so the terminal follows the app. */
/** A shell.css token's value. */
export const v = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** Font stack from the `--mono` token. */
export const font = () => v('--mono')

export function theme(): ITheme {
  return {
    ...ANSI,
    background: v('--deep'),
    foreground: v('--text'),
    cursor: v('--accent-solid'),
    cursorAccent: v('--deep'),
    selectionBackground: v('--accent'),
    selectionInactiveBackground: v('--raise'),
    scrollbarSliderBackground: v('--line'),
    scrollbarSliderHoverBackground: v('--dim'),
    scrollbarSliderActiveBackground: v('--dim'),
    overviewRulerBorder: v('--deep'),
  }
}

export const OPTIONS = {
  fontSize: 12.5,
  lineHeight: 1.4,
  cursorStyle: 'bar',
  cursorBlink: true,
  cursorInactiveStyle: 'outline',
  smoothScrollDuration: 80,
  scrollback: 5000,
  minimumContrastRatio: 4.5,
  allowProposedApi: true,
  overviewRuler: { width: 8 },
  convertEol: false,
} as const

/** WebGL2 is available (a probe context, released at once). */
export function hasWebgl() {
  if (window.api.env.renderer === 'dom') return false
  const gl = document.createElement('canvas').getContext('webgl2')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  return !!gl
}
