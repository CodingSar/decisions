// Keys typed into a text field belong to the field.
export const typesText = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

// Plain-letter shortcuts stop while typing or while a modal (Settings, Decision map) is open.
export const keysBlocked = (e: KeyboardEvent) =>
  typesText(e.target) || document.querySelector('dialog[open], [role="dialog"]') !== null
