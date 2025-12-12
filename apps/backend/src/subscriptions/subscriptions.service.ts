import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanEntity,
  SubscriptionEntity,
  UsageQuotaEntity,
  InvoiceEntity,
} from './infrastructure/persistence/relational/entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(PlanEntity)
    private planRepo: Repository<PlanEntity>,
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepo: Repository<SubscriptionEntity>,
    @InjectRepository(UsageQuotaEntity)
    private quotaRepo: Repository<UsageQuotaEntity>,
    @InjectRepository(InvoiceEntity)
    private invoiceRepo: Repository<InvoiceEntity>,
  ) {}

  async getPlans() {
    return this.planRepo.find({ order: { priceMonthly: 'ASC' } });
  }

  async getPlan(id: string) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(data: Partial<PlanEntity>) {
    const plan = this.planRepo.create(data);
    return this.planRepo.save(plan);
  }

  async getSubscription(workspaceId: string) {
    return this.subscriptionRepo.findOne({
      where: { workspaceId },
      relations: ['plan'],
    });
  }

  async createSubscription(data: {
    workspaceId: string;
    planId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    const plan = await this.getPlan(data.planId);

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subscription = this.subscriptionRepo.create({
      workspaceId: data.workspaceId,
      planId: data.planId,
      status: 'active',
      currentPeriodEnd,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    });

    return this.subscriptionRepo.save(subscription);
  }

  async updateSubscription(
    workspaceId: string,
    data: Partial<SubscriptionEntity>,
  ) {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    Object.assign(subscription, data);
    return this.subscriptionRepo.save(subscription);
  }

  async cancelSubscription(workspaceId: string) {
    return this.updateSubscription(workspaceId, { status: 'canceled' });
  }

  async changePlan(workspaceId: string, newPlanId: string) {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    await this.getPlan(newPlanId);
    subscription.planId = newPlanId;

    return this.subscriptionRepo.save(subscription);
  }

  async getQuota(workspaceId: string) {
    const periodStart = this.getCurrentPeriodStart();

    let quota = await this.quotaRepo.findOne({
      where: { workspaceId, periodStart },
    });

    if (!quota) {
      quota = this.quotaRepo.create({
        workspaceId,
        periodStart,
        messagesUsed: 0,
        storageUsedGb: 0,
      });
      await this.quotaRepo.save(quota);
    }

    return quota;
  }

  async incrementMessageUsage(workspaceId: string, count: number = 1) {
    const quota = await this.getQuota(workspaceId);
    quota.messagesUsed += count;
    return this.quotaRepo.save(quota);
  }

  async updateStorageUsage(workspaceId: string, storageGb: number) {
    const quota = await this.getQuota(workspaceId);
    quota.storageUsedGb = storageGb;
    return this.quotaRepo.save(quota);
  }

  async checkQuotaLimit(workspaceId: string): Promise<{
    withinLimit: boolean;
    messagesUsed: number;
    messagesLimit: number;
    storageUsedGb: number;
    storageLimit: number;
  }> {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription) {
      throw new BadRequestException('No active subscription');
    }

    const plan = await this.getPlan(subscription.planId);
    const quota = await this.getQuota(workspaceId);

    return {
      withinLimit:
        quota.messagesUsed < plan.maxMessages &&
        Number(quota.storageUsedGb) < plan.maxStorageGb,
      messagesUsed: quota.messagesUsed,
      messagesLimit: plan.maxMessages,
      storageUsedGb: Number(quota.storageUsedGb),
      storageLimit: plan.maxStorageGb,
    };
  }

  async getInvoices(workspaceId: string) {
    return this.invoiceRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async getInvoice(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createInvoice(data: {
    workspaceId: string;
    subscriptionId: string;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const invoice = this.invoiceRepo.create({
      ...data,
      status: 'draft',
    });
    return this.invoiceRepo.save(invoice);
  }

  async updateInvoiceStatus(
    id: string,
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible',
    pdfUrl?: string,
  ) {
    const invoice = await this.getInvoice(id);
    invoice.status = status;
    if (pdfUrl) invoice.pdfUrl = pdfUrl;
    return this.invoiceRepo.save(invoice);
  }

  private getCurrentPeriodStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
