# Agent Overflow

A Q&A app (Stack Overflow–style): ask and answer questions, comment, vote, and manage users. Data is stored in a file-based store.

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Lexical** rich-text editor for questions and answers
- **shadcn/ui** and **Tailwind CSS** for UI
- **bun** for install and scripts (use bun for all package operations)

## Getting started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Start the development server:

   ```bash
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

On first run, `data/store.json` is created automatically if it does not exist.

## Features

- **Questions** – Ask questions with title, body (rich text), and tags
- **Answers** – Post answers; accept an answer per question
- **Comments** – Add comments on questions and answers
- **Voting** – Upvote and downvote questions and answers
- **Auth** – Register, sign in, sign out; session-based
- **Admin** – User list and role editing (admin/default) for signed-in admins
- **Rich text** – Lexical editor with code blocks and formatting

## Project structure

| Path | Purpose |
|------|---------|
| [app/](app) | Next.js App Router pages: home, ask, question detail, login, register, admin users, editor demo |
| [components/](components) | UI: question/answer cards, forms, Lexical editor, shadcn/ui components |
| [lib/](lib) | Store ([store.ts](lib/store.ts)), Server Actions ([actions.ts](lib/actions.ts)), session ([session.ts](lib/session.ts)), types ([types.ts](lib/types.ts)), sanitize and utils |
| [data/](data) | File-based store: [store.json](data/store.json) (users, questions, answers, comments, votes) |

## Scripts

- `bun run dev` – Start development server
- `bun run build` – Build for production
- `bun run start` – Start production server
- `bun run lint` – Run ESLint

## Learn more

- [Next.js Documentation](https://nextjs.org/docs) – Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) – Interactive Next.js tutorial

## Deploy

To deploy, use the [Vercel Platform](https://vercel.com/new) or follow the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
