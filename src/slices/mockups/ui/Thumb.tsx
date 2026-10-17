import { Board } from './Board'
import { useMockup } from './useMockup'

// The small Mock-up on a Feed card; a click (or M) opens the Inspector.
export function Thumb({
  project,
  rel,
  onOpen,
}: {
  project: string
  rel: string
  onOpen: () => void
}) {
  const file = useMockup(project, rel)
  if (!file) return null
  return (
    // biome-ignore lint/a11y/useSemanticElements: a button cannot hold the framed Mock-up
    <div
      className="thumb"
      role="button"
      tabIndex={-1}
      aria-label="Mock-up"
      title="Open Mock-up (M)"
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <Board html={file.html} title="Mock-up thumbnail" />
      {file.before && <span className="badge">changed</span>}
    </div>
  )
}
