# P2C Engine — Prospect-to-Customer Platform

Single-user prospect-to-customer lifecycle engine for SaaS ventures. Manages prospects, leads, opportunities, and customers across multiple ventures with a unified interface.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Copy `.env.example` to `.env.local` and configure:
```bash
# Database (use Railway PostgreSQL or local Postgres)
DATABASE_URL="postgresql://user:password@host:5432/p2c_dev"

# Access Gate
P2C_ACCESS_KEY="your-secret-key"
P2C_USER_EMAIL="pm@heuristicworks.com"

# Email Provider (Resend)
RESEND_API_KEY="re_xxxxx"

# Social Integration (Buffer)
BUFFER_API_KEY="buffer_token"
```

### 3. Initialize Database
```bash
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Available Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run db:migrate       # Create/apply migrations
npm run db:migrate:deploy # Apply migrations (CI/CD)
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (dev only)
```

## Architecture

- **Stack:** Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL, Tailwind CSS
- **Auth:** Simple API Key + email gate (v1 single-user)
- **API:** Venture management, Contact CRUD, state transitions, touch logging
- **Email:** Resend provider (ready for integration)
- **Social:** Buffer API integration (post queue replenishment)

## Modules

1. **Prospect Identification** — Manual entry + CSV import
2. **Prospect Database** — Canonical record with state history
3. **Lead/Pipeline Management** — State machine + task queue
4. **Direct Outreach** — Email + LinkedIn task queue
5. **Post Replenishment** — Buffer integration
6. **Response Tracking** — Reply detection + auto-transitions
7. **Deal Closing** — Opportunity → Customer conversion
8. **Call Logging** — Manual call capture

## Documentation

- [CLAUDE.md](./CLAUDE.md) — Project context & decisions
- [docs/01-lifecycle-and-operating-model.md](./docs/01-lifecycle-and-operating-model.md) — Domain & process design

## Database Schema

### Core Tables
- **Venture** — Multi-venture identifier
- **Contact** — Core entity (Contact/Company pairing)
- **StateHistory** — Audit trail of state transitions
- **Touch** — Records of every interaction (email, LinkedIn, call, etc.)

### States
- **Prospect** (New → Enriched → Requalified/Disqualified)
- **Lead** (first engagement signal)
- **Opportunity** (active sales conversation)
- **Customer** (signed contract + first invoice paid)
- **Closed-Lost** (exit with reason)
- **Dormant** (no response after N touches)

## Deployment

### Vercel + Railway PostgreSQL
1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

See [docs/deployment.md](./docs/deployment.md) for detailed steps.

## License

Proprietary — Heuristicworks LLC
