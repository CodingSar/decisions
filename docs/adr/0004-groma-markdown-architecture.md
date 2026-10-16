# Groma Markdown is the architecture source

The Decision map reads the Project's `groma/` Markdown directly (`src/slices/architecture/store/groma.ts`): its frontmatter and Relationships tables give the nodes and edges. Only C4 Actor, System, Container and Component types are kept; Systems under `externals/` map to `external`. The app renders its own SVG and never writes `groma/`; Groma (agent skill/CLI) curates it.

Why: plain files match ADR 0003, need no Groma runtime, and stay in git. Cost: we depend on Groma's file format and parse it ourselves.
