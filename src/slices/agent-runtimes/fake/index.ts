import type { AgentRuntime } from '../model'

export const fakeRuntime: AgentRuntime = {
  start({ onOutput, prompt, mcpUrl }) {
    // The endpoint ends in the Run ID, which makes sessions tell apart.
    onOutput(`orchestrator session ${mcpUrl.split('/').pop()}\r\n`)
    if (prompt) onOutput(`${prompt}\r\n`)
    return { write() {}, resize() {}, stop() {} }
  },
}
