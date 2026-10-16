# Git stays in the Run terminal

The app has no Git section, diff view or git IPC. Status, diff, commit, push, pull and branches happen in the Run terminal: the human asks the agent, or types `git` there. The Files tree still respects `.gitignore` and hides `.git/`.

Why: the agent already does the git work during a Run, and a second, in-app view of the same repo state (built as TASK-19) duplicated it, needed its own Run-active rules and error strips, and competed with the terminal for attention. One owner of repo state is simpler. Cost: no visual diff inside the app; use the terminal or an external tool.
