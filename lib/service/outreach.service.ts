import { PrismaClient, Channel, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

// Default email templates (v1 — configurable later)
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'intro-1',
    name: 'Quick Introduction',
    subject: 'Quick question about {{company}}',
    body: `Hi {{firstName}},

I came across {{company}} and thought you might be interested in what we're doing.

Would you be open to a quick 15-minute call?

Best,
Parimal`,
  },
  {
    id: 'intro-2',
    name: 'Value Proposition',
    subject: 'Idea for {{company}}',
    body: `Hi {{firstName}},

I work with companies like {{company}} in the {{industry}} space. We recently helped a similar company {{achievement}}.

Thought it might be worth a conversation.

Cheers,
Parimal`,
  },
  {
    id: 'follow-up-1',
    name: 'First Follow-up',
    subject: 'Re: {{subject}}',
    body: `Hi {{firstName}},

Just wanted to follow up on my previous message. No pressure — but I think you'd find value in a brief conversation.

Let me know if you're open to it.

Best,
Parimal`,
  },
  {
    id: 'follow-up-2',
    name: 'Second Follow-up',
    subject: 'One more time: {{company}}',
    body: `Hi {{firstName}},

I know you're busy, so I'll keep this short. I think {{company}} could really benefit from what we're building.

Would love to show you in 15 minutes.

Best,
Parimal`,
  },
];

export class OutreachService {
  /**
   * Get available email templates
   */
  getEmailTemplates(): EmailTemplate[] {
    return DEFAULT_TEMPLATES;
  }

  /**
   * Render email template with contact variables
   */
  renderTemplate(
    template: EmailTemplate,
    contact: {
      firstName?: string;
      lastName?: string;
      company?: string;
      industry?: string;
      email?: string;
    }
  ) {
    let subject = template.subject;
    let body = template.body;

    // Simple variable replacement {{variable}}
    const vars = {
      firstName: contact.firstName || 'there',
      lastName: contact.lastName || '',
      company: contact.company || 'your company',
      industry: contact.industry || 'your industry',
      email: contact.email || '',
      achievement: 'increase their pipeline by 40%', // TODO: make configurable
      subject: subject, // for reply chains
    };

    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return { subject, body };
  }

  /**
   * Create email outreach task for a contact
   */
  async createEmailTask(
    ventureId: string,
    contactId: string,
    templateId: string,
    dueAt: Date = new Date()
  ) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    if (!contact.email) {
      throw new Error('Contact has no email address');
    }

    const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const rendered = this.renderTemplate(template, {
      firstName: contact.firstName || undefined,
      lastName: contact.lastName || undefined,
      company: contact.company || undefined,
      industry: contact.industry || undefined,
      email: contact.email,
    });

    const task = await prisma.task.create({
      data: {
        ventureId,
        contactId,
        action: 'send_email',
        channel: Channel.EMAIL,
        status: TaskStatus.PENDING,
        dueAt,
        priority: 20,
        notes: `Template: ${template.name}
Subject: ${rendered.subject}
Body: ${rendered.body}`,
      },
    });

    return task;
  }

  /**
   * Create LinkedIn DM task for a contact
   */
  async createLinkedInTask(
    ventureId: string,
    contactId: string,
    action: 'connect' | 'send_dm' | 'follow_up_dm' = 'connect',
    dueAt: Date = new Date()
  ) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    if (!contact.linkedinUrl) {
      throw new Error('Contact has no LinkedIn URL');
    }

    const actionMap = {
      connect: 'Connect on LinkedIn',
      send_dm: 'Send LinkedIn DM',
      follow_up_dm: 'Send follow-up DM',
    };

    const task = await prisma.task.create({
      data: {
        ventureId,
        contactId,
        action,
        channel: Channel.LINKEDIN_DIRECT,
        status: TaskStatus.PENDING,
        dueAt,
        priority: 25,
        notes: `LinkedIn: ${contact.linkedinUrl}
Action: ${actionMap[action]}
Manual execution required — log outcome when complete`,
      },
    });

    return task;
  }

  /**
   * Log email sent (with tracking metadata)
   */
  async logEmailSent(
    ventureId: string,
    contactId: string,
    templateId: string,
    messageId?: string
  ) {
    const task = await prisma.task.findFirst({
      where: {
        ventureId,
        contactId,
        action: 'send_email',
        status: TaskStatus.PENDING,
      },
    });

    if (task) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.COMPLETED,
          notes: `Email sent (${templateId})${messageId ? ` — ID: ${messageId}` : ''}`,
        },
      });
    }

    // Log touch
    await prisma.touch.create({
      data: {
        contactId,
        channel: Channel.EMAIL,
        action: 'email_sent',
        status: 'sent',
        details: JSON.stringify({ templateId, messageId }),
      },
    });

    // Increment touch count
    await prisma.ventureContact.updateMany({
      where: { contactId, ventureId },
      data: {
        touchCount: { increment: 1 },
        lastTouchedAt: new Date(),
      },
    });
  }

  /**
   * Log LinkedIn action outcome
   */
  async logLinkedInOutcome(
    ventureId: string,
    contactId: string,
    action: string,
    outcome: 'success' | 'pending' | 'failed'
  ) {
    const task = await prisma.task.findFirst({
      where: {
        ventureId,
        contactId,
        action: action as any,
        channel: Channel.LINKEDIN_DIRECT,
        status: TaskStatus.PENDING,
      },
    });

    if (task) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: outcome === 'success' ? TaskStatus.COMPLETED : TaskStatus.PENDING,
          notes: `LinkedIn ${action} — ${outcome}`,
        },
      });
    }

    // Log touch
    if (outcome === 'success') {
      await prisma.touch.create({
        data: {
          contactId,
          channel: Channel.LINKEDIN_DIRECT,
          action,
          status: 'logged',
          details: JSON.stringify({ outcome }),
        },
      });

      // Increment touch count only on success
      await prisma.ventureContact.updateMany({
        where: { contactId, ventureId },
        data: {
          touchCount: { increment: 1 },
          lastTouchedAt: new Date(),
        },
      });
    }
  }

  /**
   * Generate initial outreach sequence for a Lead
   * Creates paced email + LinkedIn tasks
   */
  async generateOutreachSequence(
    ventureId: string,
    contactId: string,
    options?: {
      includeEmail?: boolean;
      includeLinkedIn?: boolean;
      startDate?: Date;
      emailTemplate?: string;
    }
  ) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const startDate = options?.startDate || new Date();
    const tasks = [];

    // Day 0: Send email
    if (options?.includeEmail !== false && contact.email) {
      const emailTask = await this.createEmailTask(
        ventureId,
        contactId,
        options?.emailTemplate || 'intro-1',
        startDate
      );
      tasks.push(emailTask);
    }

    // Day 1: LinkedIn connect
    if (options?.includeLinkedIn !== false && contact.linkedinUrl) {
      const linkedInTask = await this.createLinkedInTask(
        ventureId,
        contactId,
        'connect',
        new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000)
      );
      tasks.push(linkedInTask);
    }

    // Day 3: LinkedIn follow-up DM (if connected)
    if (options?.includeLinkedIn !== false && contact.linkedinUrl) {
      const followUpTask = await this.createLinkedInTask(
        ventureId,
        contactId,
        'send_dm',
        new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      );
      tasks.push(followUpTask);
    }

    // Day 5: Email follow-up
    if (options?.includeEmail !== false && contact.email) {
      const followUpEmailTask = await this.createEmailTask(
        ventureId,
        contactId,
        'follow-up-1',
        new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000)
      );
      tasks.push(followUpEmailTask);
    }

    return tasks;
  }
}

export const outreachService = new OutreachService();
