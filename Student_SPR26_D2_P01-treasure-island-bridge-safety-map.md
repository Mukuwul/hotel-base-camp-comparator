# SPR26_D2_P01: Treasure-Island Bridge Safety Map
*AI-Assisted Coding Interview Problem*

---

# Problem Statement

You are building a web application called Treasure-Island Bridge Safety Map for the volunteers running a weekend festival across a group of small islands. The application should turn their hand-drawn island-and-footbridge plan into an interactive safety map, replay how the network is inspected, and reveal which single bridge or island junction could split the festival if it became unavailable.

This solves a very practical festival problem. Food stalls, games, music stages, and the first-aid tent may be spread across different islands. Some areas are connected by loops, so visitors can take another path when one crossing closes. Other areas quietly depend on one narrow bridge. A storm, an overcrowded crossing, or a maintenance problem at that bridge could leave part of the festival cut off, and a final red warning on a map does not help volunteers understand why.

Imagine the safety meeting on the morning of the event. The map contains islands with playful names, several safe loops, and one or two exposed branches. A volunteer presses Step and watches the inspection enter an island, follow a bridge, return from a completed branch, and update the two numbers that prove whether an alternate connection exists. By the end, the map clearly marks every critical bridge and articulation island, and the volunteer can explain the result instead of trusting an unexplained answer.

Create your own deterministic festival archipelago; no starter graph or asset file is supplied. The main demonstration should contain six to nine islands and six to thirteen undirected bridges. It must be connected and contain at least one cycle, one bridge, one non-root articulation point, and one edge inside a cycle that is not a bridge. Choose the island names and map layout yourself. Before relying on the application, independently document the sorted adjacency lists, discovery order, parent/discovery/low table, component count, bridge IDs, and articulation IDs. The application must calculate from the graph and must not read those documented expected values as decisions.

Implement one coherent local application that validates the graph, constructs deterministic adjacency lists, runs a low-link depth-first search across every component, records explanatory replay events, and keeps the map, node table, current event, and final safety summary synchronized. Provide `Load My Archipelago`, `Step`, `Run to End`, and `Reset` controls. A browser-based interface is encouraged because the map and replay can be especially engaging, but technology choices remain open. No real map service, route planner, account, database, backend, sensor, or live bridge feed is required.

## Contracts

### Graph and validation

- The calculation engine supports from one through twelve nodes and from zero through twenty edges. The main demonstration uses the narrower range above.
- Each node has a unique ID matching `[A-Z][A-Z0-9_-]{0,15}`, a non-empty display name, and finite numeric `x` and `y` layout coordinates from `0` through `100`. Coordinates affect presentation only.
- Each edge has a unique ID using the same ID format and two existing, different endpoint IDs. The graph is undirected. Self-loops and more than one edge for the same unordered endpoint pair are invalid; parallel-edge analysis is outside scope.
- Validate the complete graph before traversal. Invalid input must identify the relevant node, edge, or endpoint, clear stale replay and results, and produce no partial analysis. Structural and coordinate validation may be demonstrated with repeatable component or engine tests; a graph editor and editable map coordinates are not required.
- Build adjacency from IDs rather than source order. Choose unvisited component roots in ascending node-ID order and inspect each node's neighbours in ascending node-ID order. Input array order and map position must not change the traversal or result.

### Low-link traversal

- Use one zero-based discovery clock across all components. When node `u` is first reached, set `discovery[u] = low[u] = clock`, increment the clock, and record its parent; a component root has parent `null`.
- For a tree edge from `u` to an unvisited child `v`, complete `v` and then set `low[u] = min(low[u], low[v])`.
- For an edge from `u` to an already visited neighbour other than `u`'s parent, set `low[u] = min(low[u], discovery[neighbour])`.
- A tree edge from parent `u` to child `v` is a bridge exactly when `low[v] > discovery[u]`.
- A non-root node `u` is an articulation point when at least one DFS child `v` has `low[v] >= discovery[u]`. A root is an articulation point only when it has at least two DFS-tree children.
- Sort final bridge IDs and articulation node IDs in ascending ASCII order. Recursive and iterative implementations are both acceptable if they produce the contracted observable ordering and values.

### Replay and visual explanation

- Record enough events to show node discovery; edge inspection as tree, parent, or already-visited connection; return from a child with the old and new low value; tree-edge classification; articulation consequences; and node or component completion.
- Document the event schema and emission order you choose, including whether an undirected edge is recorded once or from both adjacency entries and the order of return, classification, and articulation events. Traversal values and final results follow the fixed rules above; event granularity may vary between solutions, but it must be fixed and repeatable within one solution.
- `Step` advances exactly one recorded event. `Run to End` uses the same event sequence and leaves the final event history available for inspection. A mandatory animation framework, speed control, scrubber, or Pause button is not required.
- The current event must highlight the relevant node or edge and state the numerical change it caused. The final map must distinguish unvisited, current, DFS-tree, inspected non-tree, bridge, and articulation states using text, symbols, or line styles as well as colour.
- Show a compact node table containing ID, parent, discovery, and low values, plus component count and the sorted critical-item summaries. Reset restores the candidate-created graph and pre-traversal state exactly.

Acceptance criteria

- **Required:** Load the candidate-created main archipelago in one action and reproduce its independently documented discovery order, parent/discovery/low table, component count, bridge IDs, and articulation IDs without reading the oracle as application input.
- **Required:** Step through and run to the end of the same deterministic event sequence. Every visible low update and bridge or articulation classification must agree with the final table and result.
- **Required:** Reverse or otherwise shuffle the main graph's node and edge source arrays in a focused test and obtain the same traversal values and sorted critical results.
- **Required:** Create a small cycle-only test with no critical bridge or articulation point and a separate test combining a DFS root with at least two tree children, a disconnected component, and an isolated node.
- **Required:** Use repeatable tests for at least two materially different invalid cases, such as an out-of-range coordinate and a duplicate node ID, unknown endpoint, self-loop, or duplicate connection, without retaining stale output.
- **Required:** Show the full island map, replay state, numerical proof values, node table, component count, and critical summaries together clearly enough for a volunteer to explain one bridge result without reading logs or developer tools.
- **Required:** Reset exactly to the original candidate-created graph and confirm that repeated stepped and complete runs produce identical histories and results.
- **Required:** Include focused tests for back-connection low propagation, the strict bridge inequality, the non-root `>=` articulation rule, the root child-count rule, component/root ordering, validation, event ordering, and reset.
- **Optional:** Add gentle replay animation or a printable safety-summary view without changing the deterministic event model.

Use AI coding assistants. Before implementation, create a short plan with 3–5 ordered steps and useful checkpoints. Be prepared to present that plan, explain any changes you made to it, share relevant prompts, summarize your design, and show test evidence such as tests, screenshots, or output samples.

## How You'll Be Evaluated
- **Planning and Solution Presentation**: Present your 3–5-step implementation plan, explain how the work followed or changed that plan, and demonstrate the working solution with clear explanations
- **AI Prompting Strategy**: Show the prompts you used to translate this problem statement into technical specifications for AI assistants
- **Design Constraints and Technology Choices**: Explain the constraints you provided to AI regarding design patterns, technology stack, and architectural decisions
- **AI-Influenced Decision Making**: Discuss trade-offs, assumptions, and how AI recommendations influenced your choices for components, data structures, and implementation approaches
- **Testing and Validation**: Demonstrate how you tested the application covering both typical usage scenarios and edge cases
- **Live Modification Capability**: Be prepared to implement one small modification, and possibly a second if time permits, using AI assistance; keep your development environment ready for focused changes and verification

