import { Row } from './Row'
import { useAll } from './useAll'

// Every answered Decision, newest first.
export function History({ project, onOverturn }: { project: string; onOverturn: () => void }) {
  const all = useAll(project)
  return (
    <section aria-label="History">
      <ul className="rows">
        {all
          .filter((d) => d.status === 'answered')
          .map((d) => (
            <Row key={d.id} d={d} all={all} project={project} onOverturn={onOverturn} tag={d.by} />
          ))}
      </ul>
    </section>
  )
}
