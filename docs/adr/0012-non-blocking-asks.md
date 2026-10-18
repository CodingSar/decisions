# Agents need not block on a Decision

`request_decision` takes `blocking: soft`: the app writes the pending file and returns the recommendation at once. The Verdict comes back later through `check_decisions` (pull) or the startup line of the next Run. `inform` reports an action without asking.

Why pull, not push: MCP clients ignore unsolicited server messages, and ADR 0005's stateless server would have to go. State stays in the Decision files (ADR 0003): `undelivered: true` marks a Verdict no agent has seen, inverted so existing files need no migration. A hung-up agent (Run stopped, crash) drops its waiter; the card stays, marked "Agent gone".

Cost: a soft ask may be overturned after the agent built on it; the agent must read `check_decisions` and rework. Agents may skip the check; the tool descriptions say when to call it.
