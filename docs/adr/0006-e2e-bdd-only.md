# E2E and BDD only, no unit tests

Every behaviour is specified as a Gherkin scenario (playwright-bdd) that drives the built Electron app against a fake agent. We write no unit tests. See `CLAUDE.md`.

Why: a deliberate experiment: scenarios are the spec of record and test what the human sees. Cost: slower feedback, and logic bugs surface only through a scenario; revisit if that hurts.
