import { PrismaClient, State, ProspectState, Contact, Venture } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  source?: string;
  notes?: string;
}

export interface EnrichContactInput {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  industry?: string;
  companySize?: string;
  notes?: string;
}

export class ContactService {
  async createContact(
    ventureId: string,
    data: CreateContactInput
  ): Promise<Contact> {
    // Validate required fields
    if (!data.email && !data.lastName) {
      throw new Error('At least email or lastName is required');
    }
    if (!data.company) {
      throw new Error('Company is required');
    }

    // Check for duplicate (email + company combination)
    const existing = await prisma.contact.findFirst({
      where: {
        ventureId,
        email: data.email || undefined,
        company: data.company,
      },
    });

    if (existing) {
      throw new Error('Contact already exists (duplicate email + company)');
    }

    const contact = await prisma.contact.create({
      data: {
        ventureId,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        company: data.company,
        title: data.title || null,
        linkedinUrl: data.linkedinUrl || null,
        source: data.source || 'manual',
        notes: data.notes || null,
        state: State.PROSPECT,
        prospectState: ProspectState.NEW,
      },
    });

    // Log state history
    await prisma.stateHistory.create({
      data: {
        contactId: contact.id,
        fromState: State.PROSPECT,
        toState: State.PROSPECT,
        reason: 'Initial prospect creation',
      },
    });

    return contact;
  }

  async enrichContact(
    contactId: string,
    data: EnrichContactInput
  ): Promise<Contact> {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        title: data.title ?? undefined,
        company: data.company ?? undefined,
        linkedinUrl: data.linkedinUrl ?? undefined,
        industry: data.industry ?? undefined,
        companySize: data.companySize ?? undefined,
        notes: data.notes ?? undefined,
        prospectState:
          data.firstName && data.lastName
            ? ProspectState.ENRICHED
            : undefined,
      },
    });

    // Log enrichment if moving to ENRICHED state
    if (
      contact.prospectState === ProspectState.ENRICHED &&
      data.firstName &&
      data.lastName
    ) {
      await prisma.stateHistory.create({
        data: {
          contactId,
          fromState: State.PROSPECT,
          toState: State.PROSPECT,
          reason: `Prospect enriched with name, title, industry`,
        },
      });
    }

    return contact;
  }

  async requalifyContact(contactId: string): Promise<Contact> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: {
        prospectState: ProspectState.REQUALIFIED,
      },
    });

    await prisma.stateHistory.create({
      data: {
        contactId,
        fromState: contact.state,
        toState: contact.state,
        reason: 'Prospect requalified',
      },
    });

    return updated;
  }

  async disqualifyContact(
    contactId: string,
    reason: string
  ): Promise<Contact> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: {
        state: State.DORMANT,
        prospectState: ProspectState.DISQUALIFIED,
      },
    });

    await prisma.stateHistory.create({
      data: {
        contactId,
        fromState: contact.state,
        toState: State.DORMANT,
        reason: `Disqualified: ${reason}`,
      },
    });

    return updated;
  }

  async listContactsByVenture(
    ventureId: string,
    filters?: {
      state?: State;
      prospectState?: ProspectState;
      source?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ) {
    const limit = pagination?.limit || 20;
    const page = pagination?.page || 1;
    const skip = (page - 1) * limit;

    const where: any = { ventureId };
    if (filters?.state) where.state = filters.state;
    if (filters?.prospectState) where.prospectState = filters.prospectState;
    if (filters?.source) where.source = filters.source;

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getContactWithHistory(contactId: string) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        stateHistory: {
          orderBy: { createdAt: 'desc' },
        },
        touches: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    return contact;
  }

  async importContactsCSV(
    ventureId: string,
    csvData: string
  ): Promise<{
    created: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });

      try {
        // Validate required fields
        if (!row.email || !row.company) {
          results.skipped++;
          continue;
        }

        // Check for duplicates
        const existing = await prisma.contact.findFirst({
          where: {
            ventureId,
            email: row.email,
            company: row.company,
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create contact
        await this.createContact(ventureId, {
          firstName: row.firstname || undefined,
          lastName: row.lastname || undefined,
          email: row.email,
          company: row.company,
          title: row.title || undefined,
          linkedinUrl: row.linkedinurl || undefined,
          source: row.source || 'csv_import',
          notes: row.notes || undefined,
        });

        results.created++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

export const contactService = new ContactService();
