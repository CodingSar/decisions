import { type Decision, supersededBy } from '../model'

// One past Decision: struck through once Superseded, otherwise it can be overturned.
export function Row({
  d,
  all,
  project,
  onOverturn,
  tag,
  actions,
}: {
  d: Decision
  all: Decision[]
  project: string
  onOverturn: () => void
  /** Right-aligned note, e.g. why it was Auto-resolved. */
  tag?: string
  /** Extra icon buttons, shown before Overturn. */
  actions?: React.ReactNode
}) {
  const by = supersededBy(all, d.id)
  return (
    <li className={by ? 'sup' : undefined}>
      {by ? (
        <>
          <s>D{d.id}</s>
          <span className="grow struck">{d.question}</span>
          <span className="amber">superseded by D{by}</span>
        </>
      ) : (
        <>
          <div className="meta">
            <span>D{d.id}</span>
            <span className="chip">{d.scope.charAt(0).toUpperCase() + d.scope.slice(1)}</span>
            <span>{d.agent}</span>
            <span className="grow" />
            <span>{tag}</span>
          </div>
          <p className="question">{d.question}</p>
          <div className="verdict">{d.verdict}</div>
          <div className="tools">
            {actions}
            <button
              className="overturn"
              type="button"
              aria-label={`Overturn D${d.id}`}
              title="Overturn"
              onClick={() =>
                window.api.invoke('decisions:overturn', project, d.id).then(onOverturn)
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
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
              </svg>
            </button>
          </div>
        </>
      )}
    </li>
  )
}
