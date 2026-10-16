import type { AgentRuntime } from '../model'

export const fakeRuntime: AgentRuntime = {
  start({ onOutput, onExit, prompt, mcpUrl }) {
    // The endpoint ends in the Run ID, which makes sessions tell apart.
    onOutput(`orchestrator session ${mcpUrl.split('/').pop()}\r\n`)
    if (prompt) onOutput(`${prompt}\r\n`)
    // Typing "exit" ends the session, like the real CLI.
    let line = ''
    let done = false
    const exit = (code: number) => {
      if (done) return
      done = true
      onExit(code)
    }
    return {
      write(data) {
        line += data
        if (/^exit\r/.test(line)) exit(0)
        else if (data.includes('\r')) line = ''
      },
      resize() {},
      stop() {
        exit(1) // like killing the real CLI
      },
    }
  },
}
