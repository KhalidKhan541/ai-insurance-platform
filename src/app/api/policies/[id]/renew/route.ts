import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { generatePolicyNumber, calculatePremium } from "@/lib/utils";
import { z } from "zod";

const renewalSchema = z.object({
  newEndDate: z.string().datetime().or(z.date()),
  coverageAmount: z.number().positive().optional(),
  deductible: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = renewalSchema.parse(body);

    const existingPolicy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        customer: true,
        _count: { select: { claims: true } },
      },
    });

    if (!existingPolicy) throw new NotFoundError("Policy", params.id);

    if (existingPolicy.status === "CANCELLED") {
      throw new Error("Cannot renew a cancelled policy");
    }

    const claimCount = existingPolicy._count.claims;
    const riskMultiplier = 1 + claimCount * 0.1;

    const coverageAmount = data.coverageAmount || existingPolicy.coverageAmount;
    const deductible = data.deductible ?? existingPolicy.deductible;

    const newPremium = calculatePremium(
      existingPolicy.product.basePremium,
      coverageAmount,
      deductible,
      riskMultiplier
    );

    const renewalPolicy = await prisma.policy.create({
      data: {
        policyNumber: generatePolicyNumber(existingPolicy.type),
        type: existingPolicy.type,
        status: "ACTIVE",
        customerId: existingPolicy.customerId,
        productId: existingPolicy.productId,
        agentId: existingPolicy.agentId,
        startDate: existingPolicy.endDate,
        endDate: new Date(data.newEndDate),
        premium: newPremium,
        coverageAmount,
        deductible,
        currency: existingPolicy.currency,
        metadata: JSON.stringify({
          renewalOf: existingPolicy.id,
          originalPolicyNumber: existingPolicy.policyNumber,
          renewalNotes: data.notes,
          riskMultiplier,
          claimCount,
        }),
      },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        product: true,
      },
    });

    await prisma.policy.update({
      where: { id: params.id },
      data: { status: "EXPIRED" },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "POLICY",
        entityId: params.id,
        action: "RENEWED",
        details: JSON.stringify({
          newPolicyId: renewalPolicy.id,
          newPolicyNumber: renewalPolicy.policyNumber,
          previousPremium: existingPolicy.premium,
          newPremium,
        }),
        userId: session.user.id,
      },
    });

    return successResponse(
      {
        renewedPolicy: renewalPolicy,
        previousPolicy: {
          id: existingPolicy.id,
          policyNumber: existingPolicy.policyNumber,
        },
        premiumChange: {
          previous: existingPolicy.premium,
          new: newPremium,
          difference: newPremium - existingPolicy.premium,
          changePercent: ((newPremium - existingPolicy.premium) / existingPolicy.premium * 100).toFixed(1),
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
