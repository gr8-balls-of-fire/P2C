# CRM Addendum: Account-Contact-Opportunity Model

**Status:** Planned restructure (before Phase 1 schema finalization)
**Priority:** CRITICAL — implement before Phase 1 is deployed
**Complexity:** Schema migration + service layer updates

---

## Executive Summary

Replace flattened Contact model with standard CRM shape:
- **Account** — company (1 company : many people)
- **Contact** — person at account (1 person : many opportunities)
- **Opportunity** — sales process/deal (1 deal : many people involved)

**Why:** Current model can't represent multiple stakeholders at same company (champion, economic buyer, technical evaluator). Standard CRM shape solves this.

---

## New Schema (Prisma)

### Account Model
```prisma
model Account {
  id              String   @id @default(cuid())
  venture         Venture  @relation(fields: [ventureId], references: [id])
  ventureId       String
  
  name            String   // Company name
  industry        String?
  companySize     String?
  website         String?
  linkedinUrl     String?
  notes           String?
  
  // Venture-specific custom fields (ICP criteria vary per venture)
  customFields    Json?    // { "budget": "500k", "use_case": "...", "decision_timeline": "Q2" }
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  contacts        Contact[]
  opportunities   Opportunity[]
  
  @@index([ventureId])
}
```

### Contact Model (Updated)
```prisma
model Contact {
  id              String   @id @default(cuid())
  account         Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  accountId       String
  
  firstName       String?
  lastName        String?
  email           String?
  phone           String?
  title           String?  // Job title
  linkedinUrl     String?
  source          String?
  
  emailVerifiedAt DateTime?
  
  // Role/influence at account (custom)
  customFields    Json?    // { "role": "champion", "influence_level": "high", "report_to": "CRO" }
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  opportunities   Opportunity[]  // Join table: many-to-many
  touches         Touch[]
  tasks           Task[]
  
  @@index([accountId])
  @@index([email])
}
```

### Opportunity Model (NEW — replaces old Contact.state)
```prisma
model Opportunity {
  id              String   @id @default(cuid())
  venture         Venture  @relation(fields: [ventureId], references: [id])
  ventureId       String
  account         Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  accountId       String
  campaign        Campaign? @relation(fields: [campaignId], references: [id])
  campaignId      String?
  
  name            String   // "Acme Inc - ArcAI License"
  description     String?
  amount          Float?   // Deal value
  
  // Core lifecycle (moved from Contact)
  state           State    @default(PROSPECT)
  prospectState   ProspectState?
  customStage     String?  // If in campaign
  
  // Stakeholders (many contacts can be involved)
  contacts        Contact[]  // Join table
  
  // Tracking (same as before, now on Opportunity)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastTouchedAt   DateTime?
  nextActionDueAt DateTime?
  
  // Deal-specific custom fields
  customFields    Json?    // { "contract_value": "50k", "discount": "10%", "approval_needed": "CFO" }
  
  stateHistory    StateHistory[]
  touches         Touch[]
  tasks           Task[]
  
  @@index([ventureId])
  @@index([accountId])
  @@index([state])
}
```

### Many-to-Many Junction
```prisma
model OpportunityContact {
  id            String   @id @default(cuid())
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  opportunityId String
  contact       Contact  @relation(fields: [contactId], references: [id])
  contactId     String
  
  // Role in this deal
  role          String?  // "champion", "economic buyer", "technical eval"
  
  @@unique([opportunityId, contactId])
}
```

### StateHistory (Updated)
```prisma
model StateHistory {
  // ... same as before, but now references Opportunity not Contact
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  opportunityId String
  
  @@index([opportunityId])
}
```

### Touch & Task (Updated)
```prisma
model Touch {
  // Remove contactId, add opportunityId (or keep both for flexibility)
  opportunity   Opportunity? @relation(fields: [opportunityId])
  opportunityId String?
  contact       Contact? @relation(fields: [contactId])
  contactId     String?
  // ... rest same
}

model Task {
  // Same — references both Contact and Opportunity as needed
}
```

---

## Updated Lifecycle Doc

**01-lifecycle-and-operating-model.md Section 1:**

Change from:
> "One core entity (Contact/Company pairing) moves through Prospect → Lead → Opportunity → Customer"

To:
> "One Opportunity (sales process) at an Account (company) moves through Prospect → Lead → Opportunity → Customer. Each Opportunity involves one or more Contacts (stakeholders)."

---

## CLAUDE.md Updates

### Section 2 (Locked Decisions)
Add:
```
- **CRM Shape:** Account-Contact-Opportunity (standard CRM model, 3-entity)
- **Custom Fields:** JSON on Account/Opportunity for venture-specific ICP criteria (no custom-object engine)
- **Multi-stakeholder:** One Opportunity can involve many Contacts at same Account
```

### Section 3 (Phase 1 Status)
Change from:
```
- [x] Contact CRUD with enrichment fields
```

To:
```
- [x] Account model (company)
- [x] Contact model (person, many per Account)
- [x] Opportunity model (deal, many per Account, many Contacts per Opportunity)
- [x] Many-to-many Contact-Opportunity relationship
- [x] Custom fields JSON on Account/Opportunity (venture-specific ICP)
```

---

## Service Layer Changes

### ContactService → CRMService
Rename and split:
- `createAccount(ventureId, name, ...)`
- `createContact(accountId, firstName, lastName, email, ...)`
- `createOpportunity(ventureId, accountId, campaignId, name, ...)`
- `addContactToOpportunity(opportunityId, contactId, role)`
- `transitionOpportunityState(opportunityId, toState)`
- `getOpportunityWithContacts(opportunityId)` — fetch deal + all stakeholders

### PipelineService
Update to reference Opportunity instead of Contact:
- `getDailyTaskQueue(ventureId)` — tasks by Opportunity state
- `identifyDormantOpportunities(ventureId)` — dormancy on Opportunity, not Contact

### OutreachService
Update to accept opportunityId OR contactId:
- `createEmailTask(ventureId, contactId, opportunityId, ...)`
- Track which contact from which opportunity received reply

---

## Migration Path

**Before finalizing Phase 1 schema:**

1. Update Prisma schema (Account + Opportunity models)
2. Create Prisma migration: `npx prisma migrate dev --name add_crm_models`
3. Update service layer (split ContactService into CRMService)
4. Update API routes to work with new entities
5. Update UI pages to show Account → Opportunities → Contacts hierarchy
6. Commit: "Phase 1 revised: CRM Account-Contact-Opportunity model"

---

## Benefits

✅ **Multiple stakeholders** — represent champion + economic buyer + technical evaluator at same company  
✅ **Cleaner state machine** — state lives on deal (Opportunity), not person (Contact)  
✅ **Scalability** — standard CRM shape matches all industry systems  
✅ **Venture flexibility** — custom JSON fields replace schema churn for ICP criteria  
✅ **Real-world deals** — one company = one Account, not duplicated per opportunity

---

## Explicitly Out of Scope (Agree with Reevo)

❌ NLP parsing of emails/calls (manual enrichment fine at this volume)  
❌ Natural-language query layer (dashboard answers all questions)  
❌ Field-level audit history (only state transitions tracked)  
❌ Forecasting / coaching / rep performance (solo use case)

---

## Implementation Notes

- **Downtime:** None if migrating dev environment only
- **Backwards compat:** Contact → Opportunity relationship requires code changes, not auto-migration
- **Custom fields:** Start empty, add fields as Parimal defines per-venture ICP
- **Opportunity naming:** "Acme Inc - ArcAI" or "Acme - Enterprise License" (human-readable)
