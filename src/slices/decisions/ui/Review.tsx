import { Row } from './Row'
import { useAll } from './useAll'

export function ReviewBadge({ project }: { project: string }) {
  const n = useAll(project).filter((d) => d.by === 'auto' && !d.accepted).length
  return n ? <span role="status">{n}</span> : null
}

export function Review({ project, onOverturn }: { project: string; onOverturn: () => void }) {
  const all = useAll(project)
  return (
    <section aria-label="Review">
      <ul className="rows">
        {all
          .filter((d) => d.by === 'auto')
          .map((d) => (
            <Row
              key={d.id}
              d={d}
              all={all}
              project={project}
              onOverturn={onOverturn}
              tag={`auto · ${d.reason}`}
              actions={
                d.accepted ? null : (
                  <button
                    type="button"
                    aria-label={`Accept D${d.id}`}
                    title="Accept"
                    onClick={() =>
                      window.api.invoke('decisions:accept', project, d.id).catch(console.error)
                    }
                  >
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                )
              }
            />
          ))}
      </ul>
    </section>
  )
}
