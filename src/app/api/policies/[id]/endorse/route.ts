import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { calculatePremium } from "@/lib/utils";
import { z } from "zod";

const endorsementSchema = z.object({
  type: z.enum(["COVERAGE_CHANGE", "ADD_INSURED", "REMOVE_INSURED", "VEHICLE_CHANGE", "ADDRESS_CHANGE", "OTHER"]),
  description: z.string().min(10),
  effectiveDate: z.string().datetime().or(z.date()),
  coverageAmount: z.number().positive().optional(),
  deductible: z.number().min(0).optional(),
  premiumAdjustment: z.number().optional(),
  changes: z.record(z.unknown()),
  documents: z.array(z.string()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "AGENT", "UNDERWRITER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to endorse policies");
    }

    const body = await request.json();
    const data = endorsementSchema.parse(body);

    const policy = await prisma.policy.findUnique({
      where: { id: params.id },
      include: { product: true },
    });
    if (!policy) throw new NotFoundError("Policy", params.id);

    if (policy.status !== "ACTIVE") {
      throw new Error("Can only endorse active policies");
    }

    const effectiveDate = new Date(data.effectiveDate);
    if (effectiveDate <= new Date(policy.startDate)) {
      throw new Error("Endorsement effective date must be after policy start date");
    }
    if (effectiveDate >= new Date(policy.endDate)) {
      throw new Error("Endorsement effective date must be before policy end date");
    }

    let newCoverage = policy.coverageAmount;
    let newDeductible = policy.deductible;
    let newPremium = policy.premium;

    if (data.coverageAmount) newCoverage = data.coverageAmount;
    if (data.deductible !== undefined) newDeductible = data.deductible;

    if (data.coverageAmount || data.deductible !== undefined) {
      newPremium = calculatePremium(
        policy.product.basePremium,
        newCoverage,
        newDeductible
      );
    }

    if (data.premiumAdjustment) {
      newPremium += data.premiumAdjustment;
    }

    const [endorsement, updatedPolicy] = await prisma.$transaction([
      prisma.endorsement.create({
        data: {
          policyId: params.id,
          type: data.type,
          description: data.description,
          effectiveDate,
          coverageChange: data.coverageAmount ? data.coverageAmount - policy.coverageAmount : 0,
          premiumChange: newPremium - policy.premium,
          changes: JSON.stringify(data.changes),
          documents: data.documents ? JSON.stringify(data.documents) : undefined,
          status: "PENDING",
          createdBy: session.user.id,
        },
      }),
      prisma.policy.update({
        where: { id: params.id },
        data: {
          coverageAmount: newCoverage,
          deductible: newDeductible,
          premium: newPremium,
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        entityType: "POLICY",
        entityId: params.id,
        action: "ENDORSED",
        details: JSON.stringify({
          endorsementId: endorsement.id,
          type: data.type,
          premiumChange: newPremium - policy.premium,
        }),
        userId: session.user.id,
      },
    });

    return successResponse(
      {
        endorsement,
        updatedPolicy,
        changes: {
          coverage: { previous: policy.coverageAmount, new: newCoverage },
          deductible: { previous: policy.deductible, new: newDeductible },
          premium: { previous: policy.premium, new: newPremium, adjustment: newPremium - policy.premium },
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const endorsements = await prisma.endorsement.findMany({
      where: { policyId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        policy: { select: { policyNumber: true, type: true } },
      },
    });

    return successResponse(endorsements);
  } catch (error) {
    return handleApiError(error);
  }
}
