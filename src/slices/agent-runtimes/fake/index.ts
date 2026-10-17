import type { AgentRuntime } from '../model'

// A tiny line-oriented shell: echoes input and knows a few commands the specs drive.
export const fakeRuntime: AgentRuntime = {
  // Specs make a skill missing with DECISIONS_FAKE_PLUGINS=none (through the agent:env hook).
  hasSkill: () => process.env.DECISIONS_FAKE_PLUGINS !== 'none',
  start({ onOutput, onExit, prompt, mcpUrl }) {
    // The endpoint ends in the Run ID, which makes sessions tell apart.
    const id = mcpUrl.split('/').pop()
    let paused = false
    let done = false
    const queue: string[] = []
    const out = (s: string) => {
      if (done) return
      if (paused) queue.push(s)
      else onOutput(s)
    }
    const exit = (code: number) => {
      if (done) return
      done = true
      onExit(code)
    }
    // 1 MB in 64 kB chunks with a sentinel last, like a chatty CLI.
    const flood = () => {
      const chunk = `${'x'.repeat(78)}\r\n`.repeat(820)
      let left = 16
      const tick = () => {
        if (done) return
        if (left-- > 0) {
          out(chunk)
          setImmediate(tick)
        } else out('FLOOD-END\r\n')
      }
      tick()
    }
    const osc = (code: number, body: string) => out(`\x1b]${code};${body}\x07`)
    const run = (cmd: string) => {
      const [name, ...rest] = cmd.split(' ')
      const arg = rest.join(' ')
      if (name === 'exit') exit(0)
      else if (name === 'flood') flood()
      else if (name === 'wait' || name === 'work' || name === 'done')
        osc(7501, name === 'wait' ? 'waiting' : name === 'work' ? 'working' : 'done')
      else if (name === 'title') osc(0, arg)
      else if (name === 'progress') osc(9, `4;1;${arg}`)
      else if (name === 'bell') out('\x07')
      else if (name === 'lines') for (let i = 1; i <= Number(arg); i++) out(`line ${i}\r\n`)
    }
    out(`orchestrator session ${id}\r\n`)
    if (prompt) out(`${prompt}\r\n`)
    let line = ''
    return {
      write(data) {
        // Shift+Enter arrives as ESC CR: a newline inside the prompt.
        if (data === '\x1b\r') {
          out('⏎\r\n')
          return
        }
        for (const ch of data) {
          if (ch === '\r') {
            out('\r\n')
            run(line)
            line = ''
          } else if (ch === '\x7f') {
            if (line) {
              line = line.slice(0, -1)
              out('\b \b')
            }
          } else {
            line += ch
            out(ch)
          }
        }
      },
      resize() {},
      pause() {
        paused = true
      },
      resume() {
        paused = false
        while (!paused && queue.length) onOutput(queue.shift() as string)
      },
      stop() {
        exit(1) // like killing the real CLI
      },
    }
  },
}
