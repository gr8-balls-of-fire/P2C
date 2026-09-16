# Phase 1 — Prospect Database + Identification

PRD for Phase 1 implementation.

---

## Objective

Build the canonical Contact/Prospect record with full state history and the manual/CSV entry flow so prospects can be sourced, enriched, and requalified inside the system.

## Scope

### 1. Database

- Run migration: `npx prisma migrate dev --name init`
- Verify Contact, StateHistory, Touch, Venture tables created in PostgreSQL

### 2. API Layer

#### Venture Endpoints (already stubbed)
- `GET /api/ventures` — list all ventures
- `POST /api/ventures` — create new venture

#### Contact Endpoints (NEW)
- `GET /api/ventures/:ventureId/contacts` — list contacts for a venture (paginated)
- `GET /api/ventures/:ventureId/contacts/:contactId` — get single contact with state history
- `POST /api/ventures/:ventureId/contacts` — create contact (manual entry)
- `PUT /api/ventures/:ventureId/contacts/:contactId` — update enrichment fields
- `POST /api/ventures/:ventureId/contacts/import` — CSV import endpoint

#### Contact Transitions (NEW)
- `POST /api/ventures/:ventureId/contacts/:contactId/enrich` — mark as Enriched
- `POST /api/ventures/:ventureId/contacts/:contactId/requalify` — mark as Requalified
- `POST /api/ventures/:ventureId/contacts/:contactId/disqualify` — mark as Disqualified + reason

### 3. Service Layer

Create `lib/service/contact.service.ts`:
- `createContact(venture, data)` — new prospect entry
- `enrichContact(id, fields)` — fill in enrichment
- `requalifyContact(id)` — state → Requalified
- `disqualifyContact(id, reason)` — state → Disqualified
- `listContactsByVenture(ventureId, filters, pagination)` — list with optional state/age filters
- `importContactsCSV(ventureId, file)` — parse CSV and batch create

### 4. CSV Import

**Format (first row is header):**
```
firstName,lastName,email,company,title,linkedinUrl,source,notes
John,Doe,john@example.com,Acme Inc,CEO,https://linkedin.com/in/johndoe,manual,"Good fit for ArcAI"
```

**Behavior:**
- Skip duplicates (check email + company combination)
- Create each as state=PROSPECT, prospectState=NEW
- Set source='csv_import' if not specified
- Return report: created, skipped, errors

### 5. UI Layer (Next.js Pages)

#### Layout
- Sidebar: Venture selector + logo
- Main: Contact list or detail view

#### Pages

**`/` (home)**
- Shows dashboard/phase status (already done in Phase 0)

**`/ventures`**
- List all ventures
- Button to create new venture
- Click to enter venture detail

**`/ventures/[ventureId]`**
- Venture name + ICP notes
- Button: "Add Contact" (manual entry modal) + "Import CSV" (file upload)
- Table: All contacts for this venture (with state, name, email, company, last touched)
- Filters: state, prospect sub-state, source
- Pagination: 20 per page
- Click row → detail view

**`/ventures/[ventureId]/contacts/[contactId]`**
- Contact detail: name, email, company, title, LinkedIn URL, source
- Enrichment form (fields pre-filled)
- State history log: all transitions + timestamps + reasons
- Touch history: recent interactions (email sent, LinkedIn action, call logged, etc.)
- Buttons: Enrich, Requalify, Disqualify (with reason modal)
- Back link to venture detail

#### Modals/Forms

**New Contact Modal**
- Fields: firstName, lastName, email, company, title, linkedinUrl, notes
- Submit → POST /api/ventures/:ventureId/contacts
- On success: close, refresh contact list

**CSV Import Modal**
- Drag-drop or file select for .csv
- Preview first 5 rows
- Progress bar
- Report: "Created 12, skipped 3 (duplicates), errors 1"

**Disqualify Modal**
- Dropdown: bad fit, duplicate, no contact, no response, other
- Optional notes
- Submit → POST /api/ventures/:ventureId/contacts/:id/disqualify

### 6. Validation

- Email: required, valid format
- Company: required
- firstName + lastName OR email: at least one way to identify
- CSV import: skip rows with missing email or company

### 7. Permissions

All endpoints require `Authorization: Bearer <P2C_ACCESS_KEY>` header (enforced by middleware).

---

## Implementation Order

1. Run database migration
2. Create `lib/service/contact.service.ts` with all service methods
3. Create `/api/ventures/:ventureId/contacts/route.ts` (GET, POST)
4. Create `/api/ventures/:ventureId/contacts/:contactId/route.ts` (GET, PUT)
5. Create `/api/ventures/:ventureId/contacts/import/route.ts` (POST)
6. Create state transition endpoints (`.../:contactId/requalify`, etc.)
7. Create UI pages (ventures list, venture detail, contact detail)
8. Add modals (new contact, CSV import, disqualify)
9. Wire up navigation + loading states

---

## Testing Checklist

- [ ] Create venture via API
- [ ] Manually add contact via form
- [ ] CSV import with 5 test rows (check created count)
- [ ] View contact detail with enrichment fields
- [ ] Enrich contact → state history updates
- [ ] Requalify contact → state changes to LEAD
- [ ] Disqualify with reason → state changes to DORMANT with reason logged
- [ ] Filter contacts by state (Prospect, Disqualified, etc.)
- [ ] Pagination: 20 per page
- [ ] Authentication: API returns 403 without valid key

---

## Definition of Done

- All CRUD endpoints implemented and tested
- CSV import working end-to-end
- UI forms functional (create, enrich, disqualify)
- State history logged for all transitions
- README updated with API documentation
- Commit and push to GitHub
