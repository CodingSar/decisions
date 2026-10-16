# Decisions are plain files, written by the app

Each Decision is `.decisions/D<n>.md` with tiny frontmatter (`scope`, `status`, `supersedes`, `by`), plus `.decisions/config.json`. No index and no database. The app writes every Verdict into the file itself; a live agent also gets it back from its `request_decision` call, otherwise the next Run reads it from the folder.

Why: the files live in the Project's git, agents can read them without any tool, and recording a Verdict never depends on an agent being alive. SQLite would be faster to query but hides the log from agents and from git. Cost: listing and searching scan the folder; acceptable at one human's volume.
