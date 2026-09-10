import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { generatePolicyNumber } from "@/lib/utils";
import { z } from "zod";

const convertSchema = z.object({
  quoteId: z.string().cuid(),
  startDate: z.string().datetime().or(z.date()),
  paymentMethod: z.enum(["CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "ACH"]).optional(),
  autoRenew: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = convertSchema.parse(body);

    const quote = await prisma.quote.findUnique({
      where: { id: data.quoteId },
      include: { product: true, customer: true },
    });

    if (!quote) throw new NotFoundError("Quote", data.quoteId);

    if (quote.status === "CONVERTED") {
      throw new Error("Quote has already been converted to a policy");
    }

    if (new Date(quote.validUntil) < new Date()) {
      throw new Error("Quote has expired. Please generate a new quote.");
    }

    if (!quote.customerId) {
      throw new Error("Quote must be associated with a customer before conversion");
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const policyNumber = generatePolicyNumber(quote.type);

    const [policy, updatedQuote] = await prisma.$transaction([
      prisma.policy.create({
        data: {
          policyNumber,
          type: quote.type,
          status: "ACTIVE",
          customerId: quote.customerId,
          productId: quote.productId,
          agentId: quote.agentId,
          startDate,
          endDate,
          premium: quote.premium,
          coverageAmount: quote.coverageAmount,
          deductible: quote.deductible,
          currency: "USD",
          metadata: JSON.stringify({
            convertedFromQuote: quote.id,
            quoteNumber: quote.quoteNumber,
            riskScore: quote.riskScore,
            autoRenew: data.autoRenew,
          }),
        },
        include: {
          customer: { include: { user: { select: { name: true, email: true } } } },
          product: true,
        },
      }),
      prisma.quote.update({
        where: { id: data.quoteId },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
        },
      }),
    ]);

    if (data.paymentMethod) {
      await prisma.payment.create({
        data: {
          policyId: policy.id,
          amount: quote.premium,
          method: data.paymentMethod,
          status: "PENDING",
          reference: `INIT-${policyNumber}`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        entityType: "QUOTE",
        entityId: data.quoteId,
        action: "CONVERTED",
        details: JSON.stringify({
          quoteNumber: quote.quoteNumber,
          policyId: policy.id,
          policyNumber,
          premium: quote.premium,
        }),
        userId: session.user.id,
      },
    });

    return successResponse(
      {
        policy,
        quote: {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          status: "CONVERTED",
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
