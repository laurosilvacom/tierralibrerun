# Trail Running Community Platform

An open-source application for managing community-led trail running programs.
Powers a focused athlete fund application workflow.

Built by [Tierra Libre Run](https://tierralibre.run) — a BIPOC-led nonprofit
building access to trail running.

<img src="https://cdn.sanity.io/images/ql7nlbjf/production/865b1e97b53de5882e5f358f31840a2256767fc1-4464x3058.png?w=1600&h=1096&q=76&fit=max&auto=format" alt="Tierra Libre Run community on the trails" width="100%" />

---

## What it does

### Athlete features

- **Race funding** — Apply for entry fee assistance and track application
  status.
- **Simple account flow** — Clerk handles authentication; Convex creates the app
  user record lazily.

### Admin features

- **Application review** — Review pending fund applications and approve or deny
  them.
- **Active fund view** — Filter approved athletes from the applications console.
- **User management** — Role-based access control, application history, and
  funding limit overrides.

### For forked instances

- **Branding via environment variables** — Configure site name, tagline, social
  links, email, and tax ID without code changes.
- **Sanity CMS** — Manage races, blog posts, companies, and page content in a
  headless CMS.
- **Production deployment** — Pre-configured for Clerk auth, Convex, Sanity, and
  Vercel hosting.

## Tech stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Actions)     |
| Language   | TypeScript                                  |
| Auth       | Clerk (JWT, middleware, role metadata)      |
| Database   | Convex                                      |
| CMS        | Sanity + GROQ queries                       |
| UI         | Tailwind CSS + shadcn/ui + Radix primitives |
| Deployment | Vercel                                      |

## Project structure

```
├── convex/                Convex schema, queries, and mutations
├── sanity/                Sanity Studio config
├── src/
│   ├── app/               Routes, layouts, metadata
│   │   ├── admin/         Operations console
│   │   ├── fund/          Athlete fund application flow
│   │   ├── blog/          Community stories (Sanity-powered)
│   │   └── dashboard/     Athlete home base
│   ├── components/        UI primitives + layout
│   └── lib/               Config, metadata, Sanity, and routing helpers
└── .env.local.example     Every env var with descriptions
```

## Getting started

### Requirements

- Node.js 18.18+
- pnpm 8+
- Accounts: [Clerk](https://clerk.com), [Convex](https://convex.dev),
  [Sanity](https://sanity.io)

### Installation

```bash
git clone <your-fork-url>
cd trail-running-community
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local`, then run:

```bash
pnpm convex:dev # provision/sync your Convex dev deployment
pnpm dev        # start dev server at localhost:3000
```

### Customize branding

All site branding is configured via environment variables:

```bash
NEXT_PUBLIC_SITE_NAME="Your Community Name"
NEXT_PUBLIC_SITE_TAGLINE="Your tagline here"
NEXT_PUBLIC_CONTACT_EMAIL="hello@yourcommunity.org"
NEXT_PUBLIC_INSTAGRAM_URL="https://instagram.com/yourhandle"
NEXT_PUBLIC_STRAVA_URL="https://strava.com/clubs/yourclub"
NEXT_PUBLIC_DONATION_URL="https://your-donation-page.com"
NEXT_PUBLIC_TAX_ID="12-3456789"
ADMIN_EMAILS="you@example.com"
```

See [.env.local.example](.env.local.example) for all options.

## Application workflows

### Fund application lifecycle

```
PENDING → APPROVED
PENDING → DENIED
```

The Convex model intentionally keeps only the status needed for the minimal
athlete fund workflow.

## npm scripts

| Command              | Purpose                    |
| -------------------- | -------------------------- |
| `pnpm dev`           | Dev server (Turbopack)     |
| `pnpm build`         | Production build           |
| `pnpm lint`          | ESLint                     |
| `pnpm type-check`    | TypeScript validation      |
| `pnpm format`        | Prettier                   |
| `pnpm precommit`     | Type-check + lint + format |
| `pnpm convex:dev`    | Convex dev deployment      |
| `pnpm convex:deploy` | Deploy Convex functions    |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for workflow guidelines. All interactions
must adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).

Security issues should be reported privately — see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
