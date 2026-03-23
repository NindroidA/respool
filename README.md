# Respool

Self-hosted 3D printing filament management — track spools, log usage, plan swaps.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)

---

## Features

- **Spool Tracking** — manage your filament inventory with rich metadata (brand, material, color, cost)
- **Usage Logging** — log filament usage per spool with quick-log from anywhere
- **Boxes** — organize spools into physical storage containers
- **Print Tracking** — log prints before or after printing with dual-mode flow
- **Dashboard** — stats, charts, low filament alerts, and activity feed
- **Color Database** — 70+ curated filament colors across solid, silk, matte, dual-color, and more
- **Admin Panel** — user management with role control and ban system
- **Self-Hosted** — Docker deployment with PostgreSQL, designed for your homelab

## Quick Start (Docker)

```bash
git clone https://github.com/NindroidA/respool.git
cd respool
cp .env.example .env
# Edit .env with your secrets
docker compose up -d
```

The app will be available at http://localhost:3000.

## Development

```bash
# Install dependencies
bun install

# Set up database
cp .env.example .env
# Edit .env with your local DATABASE_URL
bunx prisma migrate dev
bunx prisma db seed

# Start dev server
bun dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `DATABASE_URL` | Full Postgres connection string |
| `BETTER_AUTH_SECRET` | Auth secret (32+ random chars) |
| `BETTER_AUTH_URL` | App base URL for auth callbacks |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |

## Admin Setup

After registering your account, promote yourself to admin:

```bash
# Via database
UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Runtime | React 19 |
| Database | PostgreSQL 17 |
| ORM | Prisma 6 |
| Auth | Better Auth (email/password, GitHub, Google OAuth, TOTP 2FA) |
| UI | Tailwind CSS v4 + shadcn/ui (New York) |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Validation | Zod |
| Package Manager | bun |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

If you find Respool useful, consider buying me a coffee!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/NindroidA)

## License

[MIT](LICENSE)
