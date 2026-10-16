// Fold marker of a sidebar section header: right when collapsed, down when open.
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={open ? 'M6 9l6 6 6-6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}
