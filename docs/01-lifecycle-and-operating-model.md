# Prospect-to-Customer Lifecycle & Operating Model

Working document — domain definitions and process design for the prospect/lead engine. This is the source of truth the platform is built against.

**Note on cadence figures:** Every number below marked *(placeholder)* is a first-pass assumption, not validated against real usage. The platform should treat these as configurable parameters, not hardcoded constants, so real use can correct them without a rebuild.

---

## 1. Lifecycle States & Transitions

One record type (a Contact/Company pairing) moves through four core states:

**Prospect** — Entry: sourced and matches a venture's ICP criteria. Sub-states: *New* (just added) → *Enriched* (contact/context data filled in) → *Requalified* (passed the requalification method) or *Disqualified* (dropped, with a reason recorded — bad fit, no valid contact, duplicate). Nothing has been sent to this record yet.

**Lead** — Entry: first real engagement signal — replied to outbound, accepted a connection and responded, or was hand-qualified via a call. A Requalified Prospect becomes a Lead the moment a channel produces a genuine two-way signal, not just a sent touch.

**Opportunity** — Entry: active sales conversation — a call held, or a proposal/pricing discussion underway. This is where the cold → virtual → in-person funnel escalation happens in practice: Lead → Opportunity is typically the point a virtual touch converts into a call.

**Customer** — Entry: signed contract + first invoice paid in cleared funds (same definition used for the equity-vesting "customer" criteria elsewhere). A 30-60 day active/non-refunded check is a reporting flag layered on top of this state, not a separate state.

Exit paths that aren't forward progress:

- **Closed-Lost** — from Lead or Opportunity, with a reason code (not interested, bad timing, lost to competitor, budget).
- **Dormant** — from Prospect or Lead, after N touches with no response over M days *(placeholder: 5 touches / 21 days)*. Dormant records are retried after a cooldown period *(placeholder: 90 days)* rather than deleted.

---

## 2. Channels of Engagement

Each channel is a distinct mechanism for producing lifecycle events, with its own automation level and constraints.

**Email** — Sequenced outbound, templated per venture. Fully automatable (send, track opens/replies where deliverable). Deliverability/domain warmup is a real constraint for a new sending domain — plan a ramp-up rather than full volume from day one.

**LinkedIn Direct** (connect/DM, including Sales Navigator) — Semi-manual by necessity; LinkedIn blocks true automation and polices it hard. V1 mechanic: a task queue tells the operator what to do next for a given contact (connect, follow-up DM, InMail); the operator executes in a normal LinkedIn tab and logs the outcome back. Tasks are paced/dripped across the day rather than surfaced all at once, to protect the account from abuse-detection triggered by bursty activity, even when every action is human-executed.

**LinkedIn Content (posts)** — Buffer-backed, mostly automated. Queue-replenishment watermark: when a venture's scheduled-post count drops toward empty (Buffer free tier: 10 scheduled posts per channel, refill anytime), the system raises a task to load the next batch. One-way — feeds top-of-funnel awareness, not individual lifecycle transitions. (A comment/reaction could later be logged as a soft signal — not v1.)

**Calls** — Fully manual execution. The platform's job here is capture, not automation: log the call, its outcome, and the next action, so it produces the same lifecycle-transition events as any other channel instead of living outside the system.

---

## 3. Operating Model

**Prioritization** *(placeholder rule)* — Each day, the task queue surfaces records in this order: overdue follow-ups first, then highest-fit new Prospects/Leads, then everything else by stage age. Refine once real volume shows what actually needs priority.

**Volume assumption** *(placeholder)* — roughly 15-20 LinkedIn direct touches/day, email sends within domain-warmup limits, calls as scheduled.

**Escalation triggers** (tying to the cold → virtual → in-person funnel) — two or more genuine exchanges on a virtual channel (email or LinkedIn) escalates to a call attempt; a productive call escalates to Opportunity (proposal/pricing stage). The platform should encode this as a suggested transition, not a forced one.

**Recycling** — Dormant records resurface after the cooldown window as a "recheck" task rather than a fresh Prospect, so history isn't lost.

---

## 4. Open Parameters to Validate With Real Use

- Daily/weekly touch volume per channel
- Dormancy threshold (touches / days before Dormant)
- Cooldown period before retrying a Dormant record
- Prioritization weighting (fit score vs. recency vs. stage age)
