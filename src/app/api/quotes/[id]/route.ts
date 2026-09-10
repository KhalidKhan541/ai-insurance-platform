import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        agent: { include: { user: { select: { name: true, email: true } } } },
        policy: { select: { id: true, policyNumber: true, status: true } },
      },
    });

    if (!quote) throw new NotFoundError("Quote", params.id);

    return successResponse(quote);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();

    const existing = await prisma.quote.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError("Quote", params.id);

    if (existing.status === "CONVERTED") {
      throw new Error("Cannot modify a converted quote");
    }

    const allowedFields = ["coverageAmount", "deductible", "status", "notes"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (updates.coverageAmount || updates.deductible) {
      const product = await prisma.product.findUnique({
        where: { id: existing.productId },
      });

      if (product) {
        const coverage = (updates.coverageAmount as number) || existing.coverageAmount;
        const deductible = (updates.deductible as number) ?? existing.deductible;
        const riskScore = existing.riskScore || 1.0;

        updates.premium = calculatePremium(product.basePremium, coverage, deductible, riskScore);
        updates.monthlyPremium = Math.round(((updates.premium as number) / 12) * 100) / 100;
      }
    }

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: updates,
      include: { product: true },
    });

    return successResponse(quote);
  } catch (error) {
    return handleApiError(error);
  }
}

function calculatePremium(base: number, coverage: number, deductible: number, risk: number): number {
  const factor = coverage / 100000;
  const discount = deductible / 10000 * 0.05;
  return Math.round(base * factor * risk * (1 - Math.min(discount, 0.3)) * 100) / 100;
}
