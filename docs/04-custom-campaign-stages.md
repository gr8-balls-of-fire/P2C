# Custom Campaign-Specific Stages

Phase 1 extension: Enable custom sales stages per campaign.

---

## Overview

By default, P2C uses standard lifecycle states: PROSPECT → LEAD → OPPORTUNITY → CUSTOMER, with CLOSED_LOST and DORMANT as exits.

For campaigns with custom sales processes, you can now define custom stages that override the standard pipeline. Each campaign has its own stages, and contacts assigned to a campaign use those stages instead.

**Example:**
- Campaign: "Enterprise Q4 Push"
  - Stages: Lead Qualified → Discovery Call → Demo Scheduled → Proposal Sent → Negotiation → Closed Won
- Campaign: "SMB Outreach"
  - Stages: Contact Made → Interest Confirmed → Trial Offered → Converted

---

## Data Model

### Campaign
```
id          String (cuid)
ventureId   String (FK Venture)
name        String
description String? (optional notes)
stages      CampaignStage[]
contacts    Contact[]
createdAt   DateTime
updatedAt   DateTime
```

### CampaignStage
```
id          String (cuid)
campaignId  String (FK Campaign)
name        String (e.g., "Demo Scheduled")
order       Int (0, 1, 2, ... sequence)
createdAt   DateTime

Unique constraint: (campaignId, name)
Unique constraint: (campaignId, order)
```

### Contact (updated)
```
campaignId      String? (FK Campaign, nullable)
customStage     String? (current stage name if in campaign, null otherwise)
state           State (always one of enum: PROSPECT, LEAD, etc.)
                When in campaign, state may diverge from customStage
```

---

## API Endpoints

### Campaigns

**List campaigns for venture:**
```
GET /api/ventures/:ventureId/campaigns
Response: Campaign[] with nested stages
```

**Create campaign with initial stages:**
```
POST /api/ventures/:ventureId/campaigns
Body: {
  name: "Q4 Enterprise Push",
  description: "Targeting enterprise accounts in EMEA",
  stages: ["Lead Qualified", "Discovery Call", "Demo Scheduled", "Proposal Sent"]
}
Response: Campaign with nested stages (cuid)
```

### Campaign Stages

**List stages in campaign:**
```
GET /api/ventures/:ventureId/campaigns/:campaignId/stages
Response: CampaignStage[] ordered by order ASC
```

**Add stage to campaign:**
```
POST /api/ventures/:ventureId/campaigns/:campaignId/stages
Body: {
  name: "Closed Won",
  order?: 5  // optional, defaults to append
}
Response: CampaignStage (cuid)
```

### Contact Stage Transitions

**Move contact to custom stage (must be in campaign):**
```
POST /api/ventures/:ventureId/contacts/:contactId/move-to-stage
Body: {
  stageName: "Demo Scheduled"
}
Response: Contact (customStage now "Demo Scheduled")
Precondition: contact.campaignId must be set
StateHistory logged: "Moved to campaign stage: Demo Scheduled"
```

---

## UI

### Create Campaign Modal
- Modal form: name, description, stage list
- Stage builder: add/remove stages inline
- Default stages provided (customizable)
- Submit creates Campaign + CampaignStages in one request

**Location:** Venture detail page, "New Campaign" button

### Campaign View (Phase 2 future)
- List campaigns in venture
- View campaign stages and contact breakdown by stage
- Reassign contact to different campaign
- Add/remove stages from campaign

### Contact Detail (Updated)
- If contact.campaignId is set:
  - Show campaign badge: "Q4 Enterprise Push"
  - Show custom stage dropdown (not standard state)
  - Stage transitions move contact through campaign stages
- If contact.campaignId is null:
  - Show standard state (PROSPECT, LEAD, etc.)
  - Use standard requalify/disqualify buttons

---

## Usage Flow

1. **Create Campaign:** Venture owner defines custom stages
   ```
   POST /api/ventures/v1/campaigns
   → name: "Enterprise Q4 Push", stages: ["Lead Q'd", "Disc. Call", "Demo", "Prop"]
   ```

2. **Assign Contact:** Link contact to campaign
   ```
   POST /api/ventures/v1/contacts/c1/move-to-stage
   Body: { stageName: "Lead Q'd" }
   → contact.campaignId = campaignId, contact.customStage = "Lead Q'd"
   ```

3. **Track Progress:** Contact moves through campaign stages
   ```
   POST /api/ventures/v1/contacts/c1/move-to-stage
   Body: { stageName: "Demo" }
   → contact.customStage = "Demo"
   ```

4. **Reporting:** Campaign pipeline view shows stage breakdown (future feature)

---

## Backwards Compatibility

- Contacts not assigned to a campaign (`campaignId = null`) use standard states
- Standard state transitions (requalify, disqualify, engage) work unchanged
- Existing state history tracking continues for non-campaign contacts
- No migration required; existing data remains valid

---

## Implementation Notes

- `customStage` is a string (stage name), not a FK, for simplicity
- Campaign stages are ordered by `order` field (0, 1, 2, ...)
- Moving to a stage validates that stage exists in contact's campaign
- State history still logs transitions for auditing (reason: "Moved to campaign stage: X")
- Future: add Lead → Opportunity escalation logic per campaign type

---

## Testing

- [ ] Create campaign with 5+ stages
- [ ] Add stage to existing campaign
- [ ] Assign contact to campaign
- [ ] Move contact through stages
- [ ] Verify stage history logged
- [ ] Non-campaign contacts still use standard states
- [ ] Delete stage (cascade contact reassignment or error?)
- [ ] Unique constraint on stage name per campaign
