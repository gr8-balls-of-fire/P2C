# CLAUDE.md — Prospect Engine (working name)

Living spec for this build: architecture decisions, module map, build order, and open items. Update this file as decisions get made during the build — it's the canonical reference, not a one-time handoff document.

**Companion doc:** `docs/01-lifecycle-and-operating-model.md` — domain definitions, lifecycle states, channels, operating model. Read that first; this file assumes its states and transition rules and doesn't restate them.

---

## 1. What This Is

A single-user prospect-to-customer engine for Parimal's own SaaS ventures — prospect sourcing, lead/pipeline management, outbound communication (email, semi-manual LinkedIn, Buffer-backed content), response tracking, and deal closing, spanning multiple of his own products from day one.

---

## 2. Locked Architecture Decisions

- **Stack:** Next.js 14 (App Router) + TypeScript + Postgres via Prisma
- **Single-user v1:** lightweight access gate (not full multi-tenant auth)
- **Multi-venture from day one:** every record tagged with `venture` ID
- **Service layer separated from routes:** business logic in lib/service
- **Buffer integration:** free-tier API for Post Queue Replenishment (Module 4b)
- **LinkedIn:** task-queue + manual tab-switch (CSP blocks iframe)
- **Hosting target:** Vercel + Postgres (decided for Phase 0)
- **Email provider:** Resend (decided for Phase 0)

---

## 3. Current Phase: Phase 0 — Scaffold (IN PROGRESS)

- [x] Next.js 14 + TypeScript + Prisma + Postgres scaffold initialized
- [ ] Prisma schema: Venture, Contact, StateHistory tables
- [ ] Single-user access gate via middleware
- [ ] Environment variables configured (.env.local)
- [ ] Deployment target wired (Vercel)
- [ ] Initial git commit ready

---

## 4. Open Decisions (Phase 0 Blockers)

None — proceeding with:
- **Hosting:** Vercel + Railway PostgreSQL
- **Email:** Resend (free tier, 100 emails/day)
- **Access Gate:** API key from env var (pm@heuristicworks.com hardcoded for v1)

---

## 5. Module Map

- **Module 1:** Prospect Identification (manual entry + CSV import)
- **Module 2:** Prospect Database (canonical record, state history)
- **Module 3:** Lead/Pipeline Management (state machine, task queue)
- **Module 4a:** Direct Outreach Task Queue (email + LinkedIn tasks)
- **Module 4b:** Post Queue Replenishment (Buffer integration)
- **Module 5:** Response Tracking (replies → state transitions)
- **Module 6:** Deal Closing / Customer Conversion
- **Module 7:** Call Logging

---

## 6. Build Order

1. ✅ **Phase 0:** Scaffold
2. **Phase 1:** Prospect DB + Identification
3. **Phase 2:** Lead/Pipeline Management
4. **Phase 3:** Direct Outreach Task Queue (4a)
5. **Phase 4:** Post Queue Replenishment (4b)
6. **Phase 5:** Response Tracking
7. **Phase 6:** Deal Closing + Call Logging
8. **Phase 7:** Reporting
