# Decision map: two views, own grid layout, arrows on demand

The Decision map (`src/slices/architecture/ui/DecisionMap.tsx`) draws the Groma model with a hand-rolled wrapped grid and two views of the same data, switched by header icons:

- **Overview**: one level at a time. The top shows actors, externals and the children of systems; a click on a container drills in, Up goes back. Every arrow of the shown level is drawn, rolled up to the shown elements. Answers "what are the big parts and how do they connect".
- **Interactions**: containers nest their components as frames; no arrows at rest. Hovering or selecting an element draws only its arrows and dims the rest. Answers "what does this element talk to".

Both views share one grid: tiles flow in wrapped rows, a frame lays its children out in a near-square grid. Heat (pending glow with count, recent tint) is the only colour channel; focus is the accent border and glow.

## Why

The first version put all 40 components in one flat grid with all 35 edges drawn, and never showed the containers (`top()` had its parent test inverted). It overloaded the reader: hierarchy, relationships and heat competed on one picture.

Three findings from the research drove the design:

1. Hierarchy reads best as containment, not as parent arrows. Nesting frees the arrows to mean one thing: a relationship.
2. Relationships read best one element at a time (focus+context). With hubs of 10+ edges, drawing everything hides the structure; drawing on demand keeps it.
3. A high-level click-through and a detailed interaction map serve different questions, so they are two views rather than one compromise.

A hand-rolled grid is enough for ~40 nodes: deterministic, synchronous, no dependency, trivially testable in BDD. Arrows bow to the right of their direction so A→B and B→A stay apart, and the viewBox grows to hold the bows.

## Alternatives rejected

- **elkjs** (layered, compound): ~500 KB, async layout, far more than ~40 nodes need.
- **@dagrejs/dagre**: compound (nested) layout is unreliable; parent frames end up misplaced.
- **cytoscape / fcose, d3-force**: non-deterministic positions make the map move between renders and tests flaky.
- **Treemap**: compact but weak at conveying depth and direction (Woodburn 2019 study); no place for arrows.
- **Dependency matrix (DSM)**: scales to dense levels but is unintuitive as the only view. Kept as a possible third view (TASK-24).
- **Hierarchical edge bundling, code city**: visually striking, hard to read for direction and for heat; not justified at this size.
- **Manual layout (Structurizr, IcePanel style)**: better pictures, but the model is agent-curated and changes under us; nobody would maintain positions.

## Consequences

Levels with more than ~15 elements still get busy in Overview; the hover dimming helps, and a matrix view (TASK-24) is the planned answer. Frames in Interactions do not yet aggregate their children's arrows (TASK-22). Follow-ups: TASK-22 to TASK-25.
