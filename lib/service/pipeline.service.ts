import { PrismaClient, State, Channel, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Dormancy parameters (from lifecycle doc, configurable)
const DORMANCY_TOUCHES = 5;
const DORMANCY_DAYS = 21;
const DORMANCY_COOLDOWN_DAYS = 90;

export class PipelineService {
  /**
   * Get daily task queue sorted by priority (overdue first, then fit, then stage age)
   */
  async getDailyTaskQueue(
    ventureId: string,
    filters?: {
      status?: TaskStatus;
      channel?: Channel;
      sortBy?: 'priority' | 'dueAt';
    }
  ) {
    const where: any = {
      ventureId,
      status: filters?.status || TaskStatus.PENDING,
    };

    if (filters?.channel) {
      where.channel = filters.channel;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            state: true,
            customStage: true,
            emailVerifiedAt: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },  // Lower priority number = higher priority (overdue first)
        { dueAt: 'asc' },     // Then by due date
        { createdAt: 'asc' }, // Then by creation order
      ],
    });

    return tasks;
  }

  /**
   * Identify contacts that should be marked Dormant
   * Criteria: N touches with no response over M days
   */
  async identifyDormantContacts(ventureId: string): Promise<string[]> {
    const dormantIds: string[] = [];
    const now = new Date();
    const dormancyThreshold = new Date(now.getTime() - DORMANCY_DAYS * 24 * 60 * 60 * 1000);

    // Find contacts with N touches in the period and no response
    const ventureContacts = await prisma.ventureContact.findMany({
      where: {
        ventureId,
        touchCount: { gte: DORMANCY_TOUCHES },
        lastTouchedAt: { lte: dormancyThreshold },
        dormantAt: null, // Not already dormant
      },
      select: { contactId: true },
    });

    for (const vc of ventureContacts) {
      const contact = await prisma.contact.findUnique({
        where: { id: vc.contactId },
      });

      if (contact && (contact.state === State.PROSPECT || contact.state === State.LEAD)) {
        dormantIds.push(vc.contactId);
      }
    }

    return dormantIds;
  }

  /**
   * Transition identified contacts to Dormant state
   */
  async markDormantContacts(ventureId: string, contactIds: string[]) {
    const now = new Date();
    const recyclableAt = new Date(now.getTime() + DORMANCY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

    const marked = [];
    for (const contactId of contactIds) {
      const contact = await prisma.contact.update({
        where: { id: contactId },
        data: { state: State.DORMANT },
      });

      await prisma.ventureContact.updateMany({
        where: { contactId, ventureId },
        data: {
          dormantAt: now,
          recycleableAt: recyclableAt,
        },
      });

      await prisma.stateHistory.create({
        data: {
          contactId,
          fromState: contact.state,
          toState: State.DORMANT,
          reason: `No response after ${DORMANCY_TOUCHES} touches over ${DORMANCY_DAYS} days`,
        },
      });

      marked.push(contactId);
    }

    return marked;
  }

  /**
   * Identify Dormant contacts eligible for reactivation
   * Criteria: Dormant > 90 days
   */
  async identifyRecycleableContacts(ventureId: string): Promise<string[]> {
    const now = new Date();

    const ventureContacts = await prisma.ventureContact.findMany({
      where: {
        ventureId,
        recyclableAt: { lte: now },
        dormantAt: { not: null },
      },
      select: { contactId: true },
    });

    return ventureContacts.map((vc) => vc.contactId);
  }

  /**
   * Create a recheck task for recycleable contact
   */
  async createRechecktask(ventureId: string, contactId: string) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const task = await prisma.task.create({
      data: {
        ventureId,
        contactId,
        action: 'recheck_dormant',
        status: TaskStatus.PENDING,
        dueAt: new Date(),
        priority: 10, // Medium priority
        notes: 'Dormant contact eligible for reactivation',
      },
    });

    return task;
  }

  /**
   * Create task for Prospect → enrich
   */
  async createEnrichmentTask(ventureId: string, contactId: string) {
    return await prisma.task.create({
      data: {
        ventureId,
        contactId,
        action: 'enrich_prospect',
        status: TaskStatus.PENDING,
        dueAt: new Date(),
        priority: 5,
        notes: 'Complete enrichment: name, title, company, LinkedIn',
      },
    });
  }

  /**
   * Prospect → Lead transition
   */
  async engageContact(ventureId: string, contactId: string, reason?: string) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    if (contact.ventureId !== ventureId) {
      throw new Error('Contact not in this venture');
    }

    if (contact.state !== State.PROSPECT) {
      throw new Error('Contact must be in Prospect state');
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: { state: State.LEAD },
    });

    await prisma.stateHistory.create({
      data: {
        contactId,
        fromState: State.PROSPECT,
        toState: State.LEAD,
        reason: reason || 'Engagement signal received (email reply, LinkedIn DM, call)',
      },
    });

    // Reset touch count for new Lead
    await prisma.ventureContact.updateMany({
      where: { contactId, ventureId },
      data: { touchCount: 0, lastTouchedAt: null },
    });

    return updated;
  }

  /**
   * Lead → Opportunity transition
   */
  async advanceToOpportunity(ventureId: string, contactId: string, reason?: string) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    if (contact.ventureId !== ventureId) {
      throw new Error('Contact not in this venture');
    }

    if (contact.state !== State.LEAD) {
      throw new Error('Contact must be in Lead state');
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: { state: State.OPPORTUNITY },
    });

    await prisma.stateHistory.create({
      data: {
        contactId,
        fromState: State.LEAD,
        toState: State.OPPORTUNITY,
        reason: reason || 'Active sales conversation initiated (call, proposal, pricing)',
      },
    });

    return updated;
  }

  /**
   * Create/complete task
   */
  async createTask(data: {
    ventureId: string;
    contactId: string;
    action: string;
    channel?: Channel;
    dueAt: Date;
    priority?: number;
    notes?: string;
  }) {
    return await prisma.task.create({
      data: {
        ventureId: data.ventureId,
        contactId: data.contactId,
        action: data.action,
        channel: data.channel,
        dueAt: data.dueAt,
        priority: data.priority ?? 50,
        notes: data.notes,
        status: TaskStatus.PENDING,
      },
    });
  }

  /**
   * Complete task and log touch if it was an outbound action
   */
  async completeTask(taskId: string, notes?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        notes: notes || task.notes,
      },
    });

    // Log touch if this was an outbound action
    const outboundActions = [
      'send_email',
      'connect_linkedin',
      'send_dm',
      'follow_up_call',
      'follow_up_email',
    ];

    if (outboundActions.includes(task.action)) {
      const touchChannel = task.channel || Channel.OTHER;
      await prisma.touch.create({
        data: {
          contactId: task.contactId,
          channel: touchChannel,
          action: task.action,
          status: 'logged',
        },
      });

      // Increment touch count
      await prisma.ventureContact.updateMany({
        where: { contactId: task.contactId, ventureId: task.ventureId },
        data: {
          touchCount: { increment: 1 },
          lastTouchedAt: new Date(),
        },
      });
    }

    return updated;
  }

  /**
   * Skip task
   */
  async skipTask(taskId: string, reason?: string) {
    return await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SKIPPED,
        notes: reason || 'Skipped',
      },
    });
  }

  /**
   * Get pipeline view: counts by state
   */
  async getPipelineView(ventureId: string) {
    const states = [
      State.PROSPECT,
      State.LEAD,
      State.OPPORTUNITY,
      State.CUSTOMER,
      State.CLOSED_LOST,
      State.DORMANT,
    ];

    const view: Record<string, any> = {};

    for (const state of states) {
      const count = await prisma.contact.count({
        where: { ventureId, state },
      });

      const avgDaysInStage = await this.getAvgStageAge(ventureId, state);

      view[state] = {
        count,
        avgDaysInStage: Math.round(avgDaysInStage),
      };
    }

    return view;
  }

  /**
   * Calculate average days in a stage
   */
  private async getAvgStageAge(ventureId: string, state: State): Promise<number> {
    const contacts = await prisma.contact.findMany({
      where: { ventureId, state },
      select: { createdAt: true, updatedAt: true },
    });

    if (contacts.length === 0) return 0;

    const now = new Date();
    const ages = contacts.map((c) => {
      const lastUpdate = new Date(c.updatedAt);
      const daysInStage = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      return daysInStage;
    });

    const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
    return avg;
  }
}

export const pipelineService = new PipelineService();
