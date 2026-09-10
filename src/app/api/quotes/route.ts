import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { quoteSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";
import { generateQuoteNumber, calculatePremium, calculateRiskScore } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    if (session.user.role === "CUSTOMER") {
      where.customerId = session.user.id;
    } else if (session.user.role === "AGENT") {
      where.agentId = session.user.agentId;
    }

    const statusFilter = searchParams.get("status");
    if (statusFilter) where.status = statusFilter;

    const typeFilter = searchParams.get("type");
    if (typeFilter) where.type = typeFilter;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: { include: { user: { select: { name: true, email: true } } } },
          product: true,
          agent: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return paginatedResponse(quotes, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = quoteSchema.parse(body);

    let product = null;
    if (data.productId) {
      product = await prisma.product.findUnique({ where: { id: data.productId } });
    } else {
      product = await prisma.product.findFirst({
        where: { type: data.type, isActive: true },
      });
    }

    if (!product) throw new Error("No active product found for this type");

    const age = data.personalInfo.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(data.personalInfo.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 30;

    const riskScore = calculateRiskScore({
      age,
      coverageType: data.type,
      ...data.riskFactors,
    });

    const premium = calculatePremium(
      product.basePremium,
      data.coverageAmount,
      data.deductible,
      riskScore
    );

    const quoteNumber = generateQuoteNumber();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        type: data.type,
        productId: product.id,
        customerId: data.customerId || session.user.id,
        agentId: session.user.agentId,
        coverageAmount: data.coverageAmount,
        deductible: data.deductible,
        premium,
        monthlyPremium: Math.round((premium / 12) * 100) / 100,
        riskScore,
        personalInfo: JSON.stringify(data.personalInfo),
        riskFactors: data.riskFactors ? JSON.stringify(data.riskFactors) : undefined,
        validUntil,
        status: "DRAFT",
      },
      include: {
        product: true,
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    return successResponse(quote, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
