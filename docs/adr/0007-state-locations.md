# App state in userData, Decisions in the Project

App state lives in Electron `userData`: open Projects (`projects.json`) and pane layout (`layout.json`). Everything about a Project's Decisions lives in its `.decisions/` folder (ADR 0003), so it travels with the repo. Runs do not resume after restart.

Why: per-machine UI state stays out of git, while the Decision log is shared project history. Cost: moving a Project folder breaks its saved tab (shown as missing).
