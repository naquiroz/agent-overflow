# Architecture

## Data flow

All persistent data lives in a single JSON file: `data/store.json`. The store holds users, questions, answers, comments, votes, and point events (see [lib/types.ts](../lib/types.ts) for the `Store` type). Users have a `reputation` field (integer, default 1), which is the user’s current **points** total.

- **Read/write** – [lib/store.ts](../lib/store.ts) provides `readStore()` and `writeStore()`, and helpers such as `getQuestions()`, `getQuestionById()`, `getUserById()`, `getUserByUsername()`, `getUsersForAdmin()`, `getUserVote()`, `applyReputationDelta()`, and `applyPointsDelta()`. The data directory and file are created on first read if missing.
- **Mutations** – [lib/actions.ts](../lib/actions.ts) defines Server Actions for auth (register, login, logout), questions (create, update, accept answer, un-accept answer), answers (create, update), comments (create), voting, and admin (update user role). Each action reads the store via `lib/store.ts`, mutates in memory, calls `writeStore()`, and uses `revalidatePath()` where needed.
- **Session** – [lib/session.ts](../lib/session.ts) uses a cookie (`agent_overflow_session`) to store the current user ID. `getSession()` resolves that ID to a `User` via `getUserById()`. Session is set on login/register and cleared on logout.

## Reputation, points, and privileges

Reputation is a Stack Overflow–style **points** system. Users start at 1 point; it never goes below 1. The same value is stored as `User.reputation` and referred to as “points” in the UI.

- **Earning/losing points** – Upvote on your question or answer: +10. Downvote on your question or answer: −2. You downvote an answer: −1. Your answer is accepted: +15; you accept an answer: +2. Self-votes and self-accept give no points. Vote removal or flip, and changing the accepted answer, reverse the corresponding points. Un-accepting an answer reverses both the acceptance points (−15 for answer author, −2 for question author) and removes the auto-upvote that was added when accepting (−10 for answer author), unless it was a self-accept or self-vote.
- **Point events** – Every change to a user’s points is recorded in `store.pointEvents` as a `PointEvent` (userId, delta, reason, createdAt, optional questionId/answerId). [lib/store.ts](../lib/store.ts) provides `applyPointsDelta()` to update reputation and append a point event; [lib/actions.ts](../lib/actions.ts) uses it in `vote()`, `setChosenAnswer()`, and `unacceptAnswer()`.
- **Where it’s applied** – [lib/actions.ts](../lib/actions.ts) in `vote()`, `setChosenAnswer()`, and `unacceptAnswer()`; [lib/store.ts](../lib/store.ts) provides `applyReputationDelta()` (low-level) and `applyPointsDelta()` (updates rep + records event).
- **Privileges** – [lib/privileges.ts](../lib/privileges.ts) defines thresholds: 15 points to upvote, 50 to comment, 125 to downvote. Admins bypass these checks. Actions enforce the gates; the UI disables or hides gated actions (vote buttons, comment form) and shows messages like “You need 15 reputation to upvote.”
- **Display** – Points (reputation) are shown next to usernames in the site header, in bylines (question/answer/comment cards), and in the admin users table. The **user profile** ([app/users/[username]/page.tsx](../app/users/[username]/page.tsx)) shows total points in the profile block and a **points history** in the activity feed: each point event appears as a timeline entry (e.g. “+10 points · Upvote received”) with a link to the related question when applicable.

```mermaid
flowchart LR
  subgraph client [Client]
    Pages[App Router pages]
    Forms[Forms]
  end
  subgraph server [Server]
    Actions[lib/actions.ts]
    Store[lib/store.ts]
    Session[lib/session.ts]
  end
  Data[(data/store.json)]
  Pages --> Actions
  Forms --> Actions
  Actions --> Store
  Actions --> Session
  Store --> Data
  Session --> Store
```

## UI structure

Content blocks and lists use **shadcn Card** and **Item** (and their subcomponents) for layout and structure:

- **Card** – Used for larger blocks: question list items ([components/question-card.tsx](../components/question-card.tsx)) and the question post on the detail page ([components/question-detail.tsx](../components/question-detail.tsx)). Card subcomponents (`CardHeader`, `CardContent`) organize title, body, tags, and comments.
- **Item** – Used for list-like blocks and rows: each answer’s content column ([components/answer-card.tsx](../components/answer-card.tsx)) uses `Item`, `ItemHeader` (badges/accept), `ItemContent` (body), `ItemFooter` (byline), and `ItemActions` (Edit/Delete); comments are listed below the Item. Each comment ([components/comment-item.tsx](../components/comment-item.tsx)) uses `Item`, `ItemContent`, `ItemFooter`, and `ItemActions`. Comment lists ([components/comment-list.tsx](../components/comment-list.tsx)) use `ItemGroup` and `ItemSeparator` to group comments and separate “add comment” from the list. Read-only comment rows use the same Item structure without actions for consistent styling. The **profile page** ([app/users/[username]/page.tsx](../app/users/[username]/page.tsx)) uses Item components only (no Card): a profile block with `ItemGroup`, `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, and `ItemFooter` (username, member since, stats including points, role badge), and a single chronological activity feed (questions, answers, comments, and point events merged and sorted by date) rendered with `ItemGroup`, `Item`, `ItemMedia` (type icons), `ItemContent`, `ItemTitle` (link), `ItemDescription`, `ItemFooter` (time), and `ItemSeparator`.

- **Home** ([app/page.tsx](../app/page.tsx)) – Lists all questions via `getQuestions()`; link to “Ask Question”.
- **Ask** ([app/ask/page.tsx](../app/ask/page.tsx)) – Ask-question form (title, body via Lexical, tags); submits to a Server Action that creates a question and redirects to its detail page.
- **Question detail** ([app/questions/[id]/page.tsx](../app/questions/[id]/page.tsx)) – Loads a single question with `getQuestionById()`; shows question body, answers (with vote counts and accept state), comments on question and answers, and forms to add an answer or comment. Voting and “accept answer” are Server Actions.
- **Auth** – [app/login/page.tsx](../app/login/page.tsx) and [app/register/page.tsx](../app/register/page.tsx) use forms that call login/register Server Actions; [components/site-header.tsx](../components/site-header.tsx) shows sign in/register or username + logout based on `getSession()`.
- **Admin** – [app/admin/users/page.tsx](../app/admin/users/page.tsx) lists users and allows role changes (admin-only); uses `getUsersForAdmin()` and `updateUserRole` action.
- **Editor** – [app/editor-00/page.tsx](../app/editor-00/page.tsx) is a standalone Lexical editor demo. The shared rich-text editor used in ask/answer/comment flows lives under [components/editor/](../components/editor/) and [components/blocks/editor-00/](../components/blocks/editor-00/).

Rendered HTML from Lexical is sanitized with DOMPurify in [lib/sanitize.ts](../lib/sanitize.ts) before display in [components/body-content.tsx](../components/body-content.tsx).
