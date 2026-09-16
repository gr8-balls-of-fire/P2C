import { PrismaClient, State, ProspectState } from '@prisma/client';

const prisma = new PrismaClient();

export class CRMService {
  // ===== ACCOUNT OPERATIONS =====

  async createAccount(
    ventureId: string,
    name: string,
    data?: {
      industry?: string;
      companySize?: string;
      website?: string;
      linkedinUrl?: string;
      notes?: string;
      customFields?: Record<string, any>;
    }
  ) {
    return await prisma.account.create({
      data: {
        ventureId,
        name,
        ...data,
      },
      include: {
        contacts: true,
        opportunities: true,
      },
    });
  }

  // ===== CONTACT OPERATIONS =====

  async createContact(
    accountId: string,
    firstName: string,
    lastName: string,
    data?: {
      email?: string;
      phone?: string;
      title?: string;
      linkedinUrl?: string;
      source?: string;
      customFields?: Record<string, any>;
    }
  ) {
    return await prisma.contact.create({
      data: {
        accountId,
        firstName,
        lastName,
        ...data,
      },
    });
  }

  async verifyEmail(contactId: string) {
    return await prisma.contact.update({
      where: { id: contactId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  // ===== OPPORTUNITY OPERATIONS =====

  async createOpportunity(
    ventureId: string,
    accountId: string,
    name: string,
    data?: {
      description?: string;
      amount?: number;
      campaignId?: string;
      customFields?: Record<string, any>;
    }
  ) {
    return await prisma.opportunity.create({
      data: {
        ventureId,
        accountId,
        name,
        state: State.PROSPECT,
        prospectState: ProspectState.NEW,
        ...data,
      },
      include: {
        contacts: { include: { contact: true } },
        account: true,
      },
    });
  }

  async addContactToOpportunity(
    opportunityId: string,
    contactId: string,
    role?: string
  ) {
    return await prisma.opportunityContact.create({
      data: {
        opportunityId,
        contactId,
        role,
      },
      include: {
        contact: true,
        opportunity: true,
      },
    });
  }

  async getOpportunityWithContacts(opportunityId: string) {
    return await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        account: true,
        campaign: true,
        contacts: { include: { contact: true } },
        stateHistory: { orderBy: { createdAt: 'desc' } },
        touches: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  async transitionOpportunityState(
    opportunityId: string,
    toState: State,
    reason?: string
  ) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opp) throw new Error('Opportunity not found');

    const updated = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { state: toState },
    });

    await prisma.stateHistory.create({
      data: {
        opportunityId,
        fromState: opp.state,
        toState,
        reason,
      },
    });

    return updated;
  }

  async enrichOpportunity(opportunityId: string, data: any) {
    return await prisma.opportunity.update({
      where: { id: opportunityId },
      data,
    });
  }

  // ===== LIST OPERATIONS =====

  async getAccountWithAllData(accountId: string) {
    return await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        contacts: true,
        opportunities: {
          include: {
            contacts: { include: { contact: true } },
            stateHistory: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
  }

  async listOpportunitiesByVenture(
    ventureId: string,
    filters?: { state?: State; campaignId?: string }
  ) {
    return await prisma.opportunity.findMany({
      where: {
        ventureId,
        ...(filters?.state && { state: filters.state }),
        ...(filters?.campaignId && { campaignId: filters.campaignId }),
      },
      include: {
        account: true,
        contacts: { include: { contact: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const crmService = new CRMService();
