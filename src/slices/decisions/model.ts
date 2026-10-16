export interface Decision {
  id: number
  scope: string
  status: 'pending' | 'answered'
  agent: string
  question: string
  options: string[]
  recommended: number
  /** When the agent asked (epoch ms). */
  asked?: number
  by?: 'human' | 'auto'
  /** Why it was Auto-resolved. */
  reason?: 'out-of-scope' | 'timeout'
  /** Auto-resolved and accepted in Review: no longer unseen. */
  accepted?: boolean
  verdict?: string
  /** Overturn: the earlier Decision this one replaces once answered. */
  supersedes?: number
  /** When the Decision was answered (epoch ms). */
  answered?: number
  /** Groma Component ids the Decision touches. */
  components?: string[]
  /** The Run whose agent asked, e.g. "R1". */
  run?: string
}

/** The human's response; `option` is an index, `like` approves the recommendation. */
export interface Verdict {
  option?: number
  like?: boolean
  dislike?: boolean
  comment?: string
}

const num = (i: number) => String(i + 1)

/** The answered Decision that replaced `id`, if any (an unanswered overturn replaces nothing yet). */
export const supersededBy = (all: Decision[], id: number) =>
  all.find((d) => d.status === 'answered' && d.supersedes === id)?.id

/** What the waiting agent receives. */
export function verdictText(d: Decision, v: Verdict): string {
  const approved = v.option ?? (v.like ? d.recommended : undefined)
  const comment = v.comment ? `. ${v.comment}` : ''
  if (approved !== undefined) return `Approved: ${num(approved)}${comment}`
  if (v.dislike) return `Rejected: ${v.comment ?? 'reject the recommendation completely'}`
  return `Direction: ${v.comment ?? ''}`
}

// ADR 0003: tiny frontmatter, the rest is for humans and agents to read.
export function serialize(d: Decision): string {
  const options = d.options.map((o, i) => `- ${num(i)}: ${o}${i === d.recommended ? ' ★' : ''}`)
  const by = (d.by ? `by: ${d.by}\n` : '') + (d.reason ? `reason: ${d.reason}\n` : '')
  const asked =
    (d.asked ? `asked: ${d.asked}\n` : '') + (d.answered ? `answered: ${d.answered}\n` : '')
  const accepted = d.accepted ? 'accepted: true\n' : ''
  const supersedes = d.supersedes ? `supersedes: D${d.supersedes}\n` : ''
  const components = d.components?.length ? `components: ${d.components.join(', ')}\n` : ''
  const run = d.run ? `run: ${d.run}\n` : ''
  const verdict = d.verdict ? `\n## Verdict\n\n${d.verdict}\n` : ''
  return `---\nscope: ${d.scope}\nstatus: ${d.status}\n${asked}${by}${accepted}${supersedes}${components}${run}---\n# ${d.question}\n\nAsked by: ${d.agent}\n\n${options.join('\n')}\n${verdict}`
}

export function parse(id: number, text: string): Decision {
  const field = (re: RegExp) => re.exec(text)?.[1]?.trim() ?? ''
  const options = [...text.matchAll(/^- [1-4]: (.*?)( ★)?$/gm)]
  return {
    id,
    scope: field(/^scope: (.*)$/m),
    status: field(/^status: (.*)$/m) === 'answered' ? 'answered' : 'pending',
    agent: field(/^Asked by: (.*)$/m),
    question: field(/^# (.*)$/m),
    options: options.map((m) => m[1] as string),
    recommended: Math.max(
      0,
      options.findIndex((m) => m[2]),
    ),
    by: ['human', 'auto'].includes(field(/^by: (.*)$/m))
      ? (field(/^by: (.*)$/m) as 'human' | 'auto')
      : undefined,
    reason: ['out-of-scope', 'timeout'].includes(field(/^reason: (.*)$/m))
      ? (field(/^reason: (.*)$/m) as 'out-of-scope' | 'timeout')
      : undefined,
    asked: Number(field(/^asked: (.*)$/m)) || undefined,
    answered: Number(field(/^answered: (.*)$/m)) || undefined,
    accepted: field(/^accepted: (.*)$/m) === 'true' || undefined,
    supersedes: Number(/^supersedes: D(\d+)$/m.exec(text)?.[1]) || undefined,
    components: field(/^components: (.*)$/m)
      .split(', ')
      .filter(Boolean),
    run: field(/^run: (.*)$/m) || undefined,
    verdict: /^## Verdict\n\n(.*)$/m.exec(text)?.[1],
  }
}
