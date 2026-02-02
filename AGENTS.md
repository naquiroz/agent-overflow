# Agent instructions

This file is instructions for AI agents working in this repo (not human contributor docs).

Use **bun** for all package and dependency operations in this project.

- **Install dependencies:** `bun install` (not `npm install` or `yarn install`)
- **Add a package:** `bun add <package>` (not `npm install <package>`)
- **Add a dev dependency:** `bun add -d <package>`
- **Remove a package:** `bun remove <package>`
- **Run scripts:** Prefer `bun run <script>` when the project uses bun; otherwise follow the project’s existing run commands.

Always change dependencies using bun commands (e.g. `bun add`, `bun remove`, `bun add -d`). Do not edit `package.json` directly to add, remove, or change dependencies.

Do not use npm, yarn, or pnpm for installing or managing dependencies unless explicitly required by a specific tool or workflow.

---

## ⚠️ React code: composition rules are mandatory

**When working with any React code (`.tsx` / `.jsx`), you MUST always consider and apply the React composition pattern rules.**

- **Read and follow** the rule in `.cursor/rules/react-atomic-composition.mdc` before writing or refactoring React components.
- **Prioritize composition:** Prefer compound components and composition over boolean props (`isEdit`, `showX`, `hideY`, etc.).
- **Avoid monolithic components** that control structure via many boolean flags; use compound components (e.g. `Component.Root`, `Component.Part`) and context instead.
- This applies to **all** React UI: forms, cards, composers, and any component built with React.
- **shadcn components:** When using shadcn UI in this repo, **prioritize the use of Item over Card** where either could apply.

Treat this as **non-negotiable** for React work in this repo.

---

## Development practice

Before acting, especially during **planning phases**, check:

1. **Do I know what the user is asking me?** — Clarify the request if it’s ambiguous.
2. **Do I have the skills to do it? Or the tools?** — Confirm you can fulfill the task with what you have. You should use the skills that you have whenever possible.
3. **Should I verify what I know?** — Use skills, MCPs, web search, or other tools to validate assumptions and fill gaps before committing to a plan.
4. **Make sure to keep the documentation up to date when making code changes**: Always make sure the documentation is up to date when working with the code.

Treat this as critical in planning: avoid guessing when you can confirm with skills, MCPs, or web search. In rare cases you might need to **install** an existing skill or **create** a new one; the latter is even more unlikely.

---

## When an error occurs

When some error occurs, always ask yourself: **“Do I have the most correct and up-to-date knowledge of what I implemented?”** If unsure, re-read the relevant code or data before diagnosing or fixing the error. Use the tools at your disposal to validate that knowledge or improve it.
