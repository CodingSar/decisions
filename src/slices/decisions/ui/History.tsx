import type { Decision } from '../model'
import { Row } from './Row'
import { useAll } from './useAll'

// Every answered Decision, newest first.
export function History({
  project,
  onOverturn,
}: {
  project: string
  onOverturn: (id: number) => void
}) {
  const all = useAll(project)
  const answered = all.filter((d) => d.status === 'answered')
  const tag = (d: Decision) => (d.by === 'human' ? 'you' : d.accepted ? 'auto · accepted' : d.by)
  return (
    <section aria-label="History">
      {!answered.length && <p className="empty">No Decisions yet.</p>}
      <ul className="rows">
        {answered.map((d) => (
          <Row key={d.id} d={d} all={all} project={project} onOverturn={onOverturn} tag={tag(d)} />
        ))}
      </ul>
    </section>
  )
}
