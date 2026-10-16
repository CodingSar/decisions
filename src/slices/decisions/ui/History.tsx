import type { Decision } from '../model'
import { Row } from './Row'
import { useAll } from './useAll'

// Every answered Decision, newest first.
export function History({
  project,
  focus,
  onOverturn,
}: {
  project: string
  /** The row to focus, e.g. a Decision opened from the map. */
  focus?: { id: number }
  onOverturn: (id: number) => void
}) {
  const all = useAll(project)
  const answered = all.filter((d) => d.status === 'answered')
  const tag = (d: Decision) => (d.by === 'human' ? 'you' : d.accepted ? 'auto · accepted' : d.by)
  return (
    <section aria-label="History" data-focus-unit="feed" tabIndex={-1}>
      {!answered.length && <p className="empty">No Decisions yet.</p>}
      <ul className="rows">
        {answered.map((d) => (
          <Row
            key={d.id}
            d={d}
            all={all}
            project={project}
            focus={focus}
            onOverturn={onOverturn}
            tag={tag(d)}
          />
        ))}
      </ul>
    </section>
  )
}
