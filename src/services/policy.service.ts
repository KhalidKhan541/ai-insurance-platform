import { prisma } from "@/config/prisma";
import { generatePolicyNumber, generateId } from "@/lib/utils/helpers";
import { CreatePolicyInput, UpdatePolicyInput, PolicyQueryInput } from "@/lib/validators/policy";
import { Policy, PaginatedResponse } from "@/types";

export class PolicyService {
  async create(data: CreatePolicyInput): Promise<Policy> {
    const policyNumber = generatePolicyNumber();

    const policy = await prisma.policy.create({
      data: {
        id: generateId(),
        policyNumber,
        policyType: data.policyType,
        status: "pending",
        customerId: data.customerId,
        premium: data.premium,
        coverageAmount: data.coverageAmount,
        deductible: data.deductible,
        effectiveDate: new Date(data.effectiveDate),
        expirationDate: new Date(data.expirationDate),
        description: data.description,
      },
    });

    return this.mapToPolicy(policy);
  }

  async getById(id: string): Promise<Policy | null> {
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        customer: true,
        claims: true,
      },
    });

    if (!policy) return null;
    return this.mapToPolicy(policy);
  }

  async getByPolicyNumber(policyNumber: string): Promise<Policy | null> {
    const policy = await prisma.policy.findUnique({
      where: { policyNumber },
      include: {
        customer: true,
        claims: true,
      },
    });

    if (!policy) return null;
    return this.mapToPolicy(policy);
  }

  async query(params: PolicyQueryInput): Promise<PaginatedResponse<Policy>> {
    const where: Record<string, unknown> = {};

    if (params.status) where.status = params.status;
    if (params.policyType) where.policyType = params.policyType;
    if (params.customerId) where.customerId = params.customerId;
    if (params.search) {
      where.OR = [
        { policyNumber: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const skip = (params.page - 1) * params.limit;

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: { customer: true },
      }),
      prisma.policy.count({ where }),
    ]);

    return {
      data: policies.map((p) => this.mapToPolicy(p)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(id: string, data: UpdatePolicyInput): Promise<Policy> {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error("Policy not found");

    if (data.status === "cancelled" && existing.status === "cancelled") {
      throw new Error("Policy is already cancelled");
    }

    if (data.status === "expired" && existing.status !== "active") {
      throw new Error("Only active policies can be marked as expired");
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: {
        ...data,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
      },
    });

    return this.mapToPolicy(updated);
  }

  async cancel(id: string): Promise<Policy> {
    return this.update(id, { status: "cancelled" });
  }

  async activate(id: string): Promise<Policy> {
    return this.update(id, { status: "active" });
  }

  async getExpiringPolicies(days: number = 30): Promise<Policy[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const policies = await prisma.policy.findMany({
      where: {
        status: "active",
        expirationDate: {
          lte: futureDate,
        },
      },
      orderBy: { expirationDate: "asc" },
    });

    return policies.map((p) => this.mapToPolicy(p));
  }

  async getPolicyStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    cancelled: number;
    totalPremium: number;
  }> {
    const [total, active, pending, cancelled, premiumResult] = await Promise.all([
      prisma.policy.count(),
      prisma.policy.count({ where: { status: "active" } }),
      prisma.policy.count({ where: { status: "pending" } }),
      prisma.policy.count({ where: { status: "cancelled" } }),
      prisma.policy.aggregate({ _sum: { premium: true }, where: { status: "active" } }),
    ]);

    return {
      total,
      active,
      pending,
      cancelled,
      totalPremium: premiumResult._sum.premium || 0,
    };
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) throw new Error("Policy not found");

    if (existing.status === "active") {
      throw new Error("Cannot delete an active policy");
    }

    await prisma.policy.delete({ where: { id } });
  }

  private mapToPolicy(data: Record<string, unknown>): Policy {
    return {
      id: data.id as string,
      policyNumber: data.policyNumber as string,
      policyType: data.policyType as Policy["policyType"],
      status: data.status as Policy["status"],
      customerId: data.customerId as string,
      premium: data.premium as number,
      coverageAmount: data.coverageAmount as number,
      deductible: data.deductible as number,
      effectiveDate: (data.effectiveDate as Date).toISOString(),
      expirationDate: (data.expirationDate as Date).toISOString(),
      description: data.description as string,
      createdAt: (data.createdAt as Date).toISOString(),
      updatedAt: (data.updatedAt as Date).toISOString(),
    };
  }
}

export const policyService = new PolicyService();
