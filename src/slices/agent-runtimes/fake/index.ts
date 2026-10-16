import type { AgentRuntime } from '../model'

// A tiny line-oriented shell: echoes input and knows a few commands the specs drive.
export const fakeRuntime: AgentRuntime = {
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
    const run = (cmd: string) => {
      if (cmd === 'exit') exit(0)
      else if (cmd === 'flood') flood()
    }
    out(`orchestrator session ${id}\r\n`)
    if (prompt) out(`${prompt}\r\n`)
    let line = ''
    return {
      write(data) {
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
