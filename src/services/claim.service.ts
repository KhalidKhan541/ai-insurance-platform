import { prisma } from "@/config/prisma";
import { generateClaimNumber, generateId } from "@/lib/utils/helpers";
import { CreateClaimInput, UpdateClaimStatusInput, ClaimQueryInput } from "@/lib/validators/claim";
import { Claim, ClaimDocument, PaginatedResponse } from "@/types";

export class ClaimService {
  async create(data: CreateClaimInput, customerId: string): Promise<Claim> {
    const policy = await prisma.policy.findUnique({
      where: { id: data.policyId },
    });

    if (!policy) throw new Error("Policy not found");
    if (policy.status !== "active") throw new Error("Policy is not active");
    if (policy.customerId !== customerId) throw new Error("Policy does not belong to this customer");

    if (data.amount > policy.coverageAmount) {
      throw new Error("Claim amount exceeds policy coverage");
    }

    const claimNumber = generateClaimNumber();

    const claim = await prisma.claim.create({
      data: {
        id: generateId(),
        claimNumber,
        policyId: data.policyId,
        customerId,
        status: "pending",
        type: data.type,
        description: data.description,
        amount: data.amount,
        incidentDate: new Date(data.incidentDate),
        incidentLocation: data.incidentLocation,
      },
      include: {
        documents: true,
      },
    });

    if (data.documents && data.documents.length > 0) {
      await prisma.claimDocument.createMany({
        data: data.documents.map((doc) => ({
          id: generateId(),
          claimId: claim.id,
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          url: `/uploads/claims/${claim.id}/${doc.fileName}`,
        })),
      });
    }

    return this.mapToClaim(claim);
  }

  async getById(id: string): Promise<Claim | null> {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        documents: true,
        policy: true,
        customer: true,
        adjuster: true,
      },
    });

    if (!claim) return null;
    return this.mapToClaim(claim);
  }

  async getByClaimNumber(claimNumber: string): Promise<Claim | null> {
    const claim = await prisma.claim.findUnique({
      where: { claimNumber },
      include: {
        documents: true,
        policy: true,
        customer: true,
      },
    });

    if (!claim) return null;
    return this.mapToClaim(claim);
  }

  async query(params: ClaimQueryInput): Promise<PaginatedResponse<Claim>> {
    const where: Record<string, unknown> = {};

    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.policyId) where.policyId = params.policyId;
    if (params.customerId) where.customerId = params.customerId;
    if (params.minAmount || params.maxAmount) {
      where.amount = {};
      if (params.minAmount) (where.amount as Record<string, number>).gte = params.minAmount;
      if (params.maxAmount) (where.amount as Record<string, number>).lte = params.maxAmount;
    }
    if (params.dateFrom || params.dateTo) {
      where.filedDate = {};
      if (params.dateFrom) (where.filedDate as Record<string, Date>).gte = new Date(params.dateFrom);
      if (params.dateTo) (where.filedDate as Record<string, Date>).lte = new Date(params.dateTo);
    }
    if (params.search) {
      where.OR = [
        { claimNumber: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const skip = (params.page - 1) * params.limit;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include: { documents: true },
      }),
      prisma.claim.count({ where }),
    ]);

    return {
      data: claims.map((c) => this.mapToClaim(c)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async updateStatus(id: string, data: UpdateClaimStatusInput, adjusterId: string): Promise<Claim> {
    const existing = await prisma.claim.findUnique({ where: { id } });
    if (!existing) throw new Error("Claim not found");

    if (existing.status === "paid") {
      throw new Error("Cannot update a paid claim");
    }

    if (existing.status === "denied" && data.status !== "pending") {
      throw new Error("Denied claims can only be reopened to pending");
    }

    if (data.status === "approved" && data.approvedAmount !== undefined) {
      if (data.approvedAmount > existing.amount) {
        throw new Error("Approved amount cannot exceed claim amount");
      }
    }

    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: data.status,
        approvedAmount: data.approvedAmount,
        adjusterId,
        resolvedDate: ["approved", "denied", "paid"].includes(data.status)
          ? new Date()
          : undefined,
      },
      include: { documents: true },
    });

    return this.mapToClaim(updated);
  }

  async approve(id: string, approvedAmount: number, adjusterId: string): Promise<Claim> {
    return this.updateStatus(
      id,
      { status: "approved", approvedAmount },
      adjusterId
    );
  }

  async deny(id: string, adjusterId: string, reason: string): Promise<Claim> {
    if (reason.length < 10) {
      throw new Error("Denial reason must be at least 10 characters");
    }
    return this.updateStatus(id, { status: "denied", notes: reason }, adjusterId);
  }

  async getClaimsByPolicy(policyId: string): Promise<Claim[]> {
    const claims = await prisma.claim.findMany({
      where: { policyId },
      orderBy: { filedDate: "desc" },
      include: { documents: true },
    });

    return claims.map((c) => this.mapToClaim(c));
  }

  async getClaimsByCustomer(customerId: string): Promise<Claim[]> {
    const claims = await prisma.claim.findMany({
      where: { customerId },
      orderBy: { filedDate: "desc" },
      include: { documents: true },
    });

    return claims.map((c) => this.mapToClaim(c));
  }

  async getClaimStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    denied: number;
    totalAmount: number;
    approvedAmount: number;
  }> {
    const [total, pending, approved, denied, amountResult, approvedResult] = await Promise.all([
      prisma.claim.count(),
      prisma.claim.count({ where: { status: "pending" } }),
      prisma.claim.count({ where: { status: "approved" } }),
      prisma.claim.count({ where: { status: "denied" } }),
      prisma.claim.aggregate({ _sum: { amount: true } }),
      prisma.claim.aggregate({
        _sum: { approvedAmount: true },
        where: { status: { in: ["approved", "paid"] } },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      denied,
      totalAmount: amountResult._sum.amount || 0,
      approvedAmount: approvedResult._sum.approvedAmount || 0,
    };
  }

  private mapToClaim(data: Record<string, unknown>): Claim {
    const documents = (data.documents as Array<Record<string, unknown>> || []).map((d) => ({
      id: d.id as string,
      claimId: d.claimId as string,
      fileName: d.fileName as string,
      fileType: d.fileType as string,
      fileSize: d.fileSize as number,
      uploadedAt: (d.uploadedAt as Date).toISOString(),
      url: d.url as string,
    }));

    return {
      id: data.id as string,
      claimNumber: data.claimNumber as string,
      policyId: data.policyId as string,
      customerId: data.customerId as string,
      status: data.status as Claim["status"],
      type: data.type as string,
      description: data.description as string,
      amount: data.amount as number,
      approvedAmount: data.approvedAmount as number | undefined,
      filedDate: (data.filedDate as Date).toISOString(),
      resolvedDate: data.resolvedDate ? (data.resolvedDate as Date).toISOString() : undefined,
      adjusterId: data.adjusterId as string | undefined,
      documents,
      createdAt: (data.createdAt as Date).toISOString(),
      updatedAt: (data.updatedAt as Date).toISOString(),
    };
  }
}

export const claimService = new ClaimService();
