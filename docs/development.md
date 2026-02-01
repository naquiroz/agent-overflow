# Development

## Local setup

1. **Runtime** – Use [bun](https://bun.sh) for install and scripts (see [AGENTS.md](../AGENTS.md)).
2. **Install** – From the repo root: `bun install`.
3. **Run** – `bun run dev`; open [http://localhost:3000](http://localhost:3000).
4. **Data** – `data/store.json` is created automatically on first read. To reset data, delete that file and restart the dev server.

No environment variables are required for local development. Session cookies use `secure: true` only when `NODE_ENV === "production"`.

## Scripts

- `bun run dev` – Start the Next.js dev server.
- `bun run build` – Production build.
- `bun run start` – Run the production server after `build`.
- `bun run lint` – Run ESLint.

## Tests

The project does not currently include a test suite or test runner. To add tests later, use the same package manager (bun) for consistency.
