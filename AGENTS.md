# Agent instructions

Use **bun** for all package and dependency operations in this project.

- **Install dependencies:** `bun install` (not `npm install` or `yarn install`)
- **Add a package:** `bun add <package>` (not `npm install <package>`)
- **Add a dev dependency:** `bun add -d <package>`
- **Remove a package:** `bun remove <package>`
- **Run scripts:** Prefer `bun run <script>` when the project uses bun; otherwise follow the project’s existing run commands.

Do not use npm, yarn, or pnpm for installing or managing dependencies unless explicitly required by a specific tool or workflow.

---

## Development practice

Before acting, especially during **planning phases**, check:

1. **Do I know what the user is asking me?** — Clarify the request if it’s ambiguous.
2. **Do I have the skills to do it? Or the tools?** — Confirm you can fulfill the task with what you have. You should use the skills that you have whenever possible.
3. **Should I verify what I know?** — Use skills, MCPs, web search, or other tools to validate assumptions and fill gaps before committing to a plan.

Treat this as critical in planning: avoid guessing when you can confirm with skills, MCPs, or web search. In rare cases you might need to **install** an existing skill or **create** a new one; the latter is even more unlikely.

---

## When an error occurs

When some error occurs, always ask yourself: **“Do I have the most correct and up-to-date knowledge of what I implemented?”** If unsure, re-read the relevant code or data before diagnosing or fixing the error. Use the tools at your disposal to validate that knowledge or improve it.
