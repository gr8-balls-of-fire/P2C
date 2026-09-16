# Phase 2 — Lead/Pipeline Management

PRD for Phase 2 implementation.

---

## Objective

Build the daily task queue and lifecycle state machine to enforce valid transitions, dormancy rules, and prioritized task surfacing.

## Scope

### 1. Task Entity & Model

**Task** table:
- `id` (cuid)
- `contactId` (FK Contact)
- `ventureId` (FK Venture)
- `channel` (EMAIL | LINKEDIN_DIRECT | LINKEDIN_CONTENT | CALL)
- `action` (string: "connect", "send_email", "follow_up_dm", "call_attempt", "check_in")
- `status` (PENDING | COMPLETED | FAILED | SKIPPED)
- `dueAt` (DateTime)
- `notes` (optional)
- `createdAt`, `updatedAt`

### 2. State Machine Rules

#### Prospect → Lead Transition
**Trigger:** First genuine two-way signal
- Email reply received
- LinkedIn connection accepted + DM replied
- Call completed with positive outcome
- Manual mark-as-engaged by operator

**Implementation:**
- Create endpoint: `POST /api/ventures/:ventureId/contacts/:contactId/engage`
- Logs state transition: PROSPECT → LEAD
- Creates "log engagement" task if needed

#### Lead → Opportunity Transition
**Trigger:** Active sales conversation (manual for v1)
- Call scheduled and completed
- Proposal sent and discussed
- Pricing conversation initiated

**Implementation:**
- Create endpoint: `POST /api/ventures/:ventureId/contacts/:contactId/advance-to-opportunity`
- Validates: contact is in LEAD state
- Logs state transition: LEAD → OPPORTUNITY

#### Dormancy Rules
**Dormant Trigger:** After 5 touches with no response over 21 days
- Touch = any outbound action (email, LinkedIn DM, call)
- Response = engagement signal (reply, connection + DM, call pick-up)
- Auto-transition: PROSPECT/LEAD → DORMANT after 21 days

**Implementation:**
- Service method: `identifyDormantContacts(ventureId)` — runs daily (cron or manual)
- Transition contacts meeting criteria → DORMANT
- Log reason: "No response after 5 touches / 21 days"

#### Recycling (Reactivation)
**Dormant → Prospect:** After 90-day cooldown
- Surface as "recheck" task, not fresh prospect
- Preserve all history

**Implementation:**
- Service method: `identifyRecycleableContacts(ventureId)` — checks lastTouchedAt + 90 days
- Create task: "Recheck prospect" for operator review
- Operator can re-engage or re-disqualify

### 3. Task Generation & Prioritization

#### Priority Rule (Placeholder)
1. **Overdue Follow-ups** (nextActionDueAt < now)
2. **High-Fit Prospects** (custom fit score field, v1 defaults to recent)
3. **Stage Age** (older in stage first)

#### Task Queue Service
```typescript
async getDailyTaskQueue(ventureId: string): {
  tasks: Task[];
  contact: Contact; // with enrichment
  action: string;
  dueAt: DateTime;
}[]
```

#### Task Generation Scenarios
1. **Enrichment Task:** New Prospect → "Complete enrichment (LinkedIn, company size, title)"
2. **Requalify Task:** Enriched Prospect → "Requalify or disqualify"
3. **Outreach Task:** Requalified Prospect → "Send intro email" (Phase 3 creates these)
4. **Follow-up Task:** LEAD with no recent activity → "Follow-up call / email"
5. **Dormancy Check:** Contact at 18 days, 5 touches → "Check: approaching dormancy"
6. **Recheck Task:** Recycled Dormant → "Recheck prospect — engage or disqualify?"

### 4. API Endpoints

#### State Transitions
- `POST /api/ventures/:ventureId/contacts/:contactId/engage` — Prospect → Lead
- `POST /api/ventures/:ventureId/contacts/:contactId/advance-to-opportunity` — Lead → Opportunity

#### Task Management
- `GET /api/ventures/:ventureId/tasks?sortBy=priority` — daily task queue (sorted by priority)
- `POST /api/ventures/:ventureId/tasks/:taskId/complete` — mark task done
- `POST /api/ventures/:ventureId/tasks/:taskId/skip` — skip task (reason optional)

#### Dormancy & Recycling (Admin/Scheduled)
- `POST /api/ventures/:ventureId/identify-dormant` — batch transition dormant contacts
- `POST /api/ventures/:ventureId/identify-recycleable` — batch identify for reactivation

### 5. UI Layer

#### New Pages

**`/ventures/[ventureId]/tasks`** — Daily Task Queue
- Filters: priority, channel, status
- Cards: Contact name + company, action, due date, snooze button
- Mark complete / skip / snooze (1 day / 1 week)
- Quick enrichment inline (fill missing fields without page nav)

**`/ventures/[ventureId]/pipeline`** — Pipeline View (lightweight)
- Table: state (PROSPECT | LEAD | OPPORTUNITY | CUSTOMER) as columns
- Cards/tiles: count + sample contacts in each stage
- Filters: source, created date range
- Stage-age stats (avg days in stage)

#### Updated Pages

**`/ventures/[ventureId]` (contacts table)**
- Add column: nextActionDueAt, statusIcon (overdue = ⚠️)
- Right-click or → context menu: "Create task", "Mark engaged", "Advance to opportunity"

### 6. Service Layer

Create `lib/service/pipeline.service.ts`:
- `generateTasksForContact(contact)` — determine next action
- `identifyDormantContacts(ventureId)` — 5 touches / 21 days
- `identifyRecycleableContacts(ventureId)` — 90-day cooldown
- `getTaskQueue(ventureId, filters)` — return sorted tasks
- `completeTask(taskId, notes)` — mark done + log
- `skipTask(taskId, reason)` — skip (counts as touch?)

### 7. Database

#### New Migration
- Task table (see Task Entity section above)
- Add optional fields to Contact if not already present:
  - `nextActionDueAt` (DateTime) — when next task is due
  - `lastTouchedAt` (DateTime) — timestamp of last outbound action

### 8. Testing Checklist

- [ ] Prospect → Lead transition via engagement (POST /engage)
- [ ] Lead → Opportunity transition (POST /advance-to-opportunity)
- [ ] Daily task queue returns sorted by priority
- [ ] Complete task → updates status + logs
- [ ] 5 touches + 21 days → auto-dormant
- [ ] 90 days dormant → surface as recheck task
- [ ] Skip task → moves to next in queue
- [ ] Snooze task → returns 1 day / 1 week later
- [ ] Task queue page loads and displays
- [ ] Pipeline view shows counts by stage
- [ ] Filters work (priority, channel, status)

---

## Definition of Done

- Task model and CRUD endpoints implemented
- State machine transitions (engage, advance-to-opportunity)
- Dormancy logic & recycling implemented
- Task queue service & prioritization working
- Daily task queue endpoint returns sorted results
- UI: task queue page + pipeline view
- Database migration tested
- All endpoints tested (manual or jest)
- Commit and push to GitHub
