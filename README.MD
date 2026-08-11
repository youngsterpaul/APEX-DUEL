# Apex Duel

Ranked 1v1 gaming arena app, connected to your Supabase project **Apex duel**.

## Structure

```
apex-duel/
├── pages/                  # Every full page (Next.js Pages Router = one file = one route)
│   ├── _app.tsx             # Wraps every page with Header + Footer
│   └── index.tsx            # Home page — fetches players + duels from Supabase
├── components/             # Reusable UI pieces (components), kept separate from pages
│   ├── Header.tsx            # <Header /> component
│   ├── Footer.tsx            # <Footer /> component
│   ├── Hero.tsx
│   ├── Leaderboard.tsx
│   └── UpcomingDuels.tsx
├── lib/
│   ├── supabaseClient.ts    # Single typed Supabase client, reused everywhere
│   └── types.ts             # Shared TypeScript types (Player, Duel)
├── styles/
│   └── globals.css          # Theme tokens + global styles
├── .env.local                # Supabase URL + anon key (already filled in for you)
├── tsconfig.json
├── next-env.d.ts
└── package.json
```

**Adding a new page** = add a new file to `pages/`, e.g. `pages/leaderboard.tsx` → route `/leaderboard`.
**Adding a new reusable piece** = add a `.tsx` file to `components/` and import it into a page. `Header` and `Footer` are both components living in `components/`, imported once in `pages/_app.tsx` so they wrap every page automatically.

## Database (already created in your "Apex duel" Supabase project)

- **players**: `id, username, avatar_url, rank, wins, losses, created_at`
- **duels**: `id, player1_id, player2_id, game, status, winner_id, scheduled_at, created_at`

Both tables have Row Level Security enabled with public **read** access. Sample rows are already seeded so the Home page isn't empty.

To allow inserts/updates from the app later (e.g. a "report result" button), you'll need to add write policies or go through an authenticated server route — ask me when you're ready and I'll set that up.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — the Home page will pull live data from your Supabase project.

## Next pages to build

- `/duels` — full duel schedule + history
- `/leaderboard` — full leaderboard with pagination
- `/players/[id]` — individual player profile

Just tell me which one to build next and I'll follow the same structure.