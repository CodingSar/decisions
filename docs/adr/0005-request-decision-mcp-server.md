# request_decision is a loopback MCP server

The app runs one streamable-HTTP MCP server on `127.0.0.1` at a random port (`src/slices/agent-runtimes/mcp.ts`). Each Run connects to `/mcp/<runId>`, so the server knows its Project. It is stateless: a server and transport per request. The `request_decision` tool blocks until a Verdict returns; its schema lists the Project's Scopes and Components.

Why: any Agent Runtime that speaks MCP can raise Decisions, with no per-agent plugin. Cost: the app must be running for agents to ask; the loopback port is unauthenticated.
