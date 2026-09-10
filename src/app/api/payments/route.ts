import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { paymentSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    if (session.user.role === "CUSTOMER") {
      const policies = await prisma.policy.findMany({
        where: { customerId: session.user.id },
        select: { id: true },
      });
      where.policyId = { in: policies.map((p) => p.id) };
    }

    const statusFilter = searchParams.get("status");
    if (statusFilter) where.status = statusFilter;

    const methodFilter = searchParams.get("method");
    if (methodFilter) where.method = methodFilter;

    const policyId = searchParams.get("policyId");
    if (policyId) where.policyId = policyId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          policy: { select: { policyNumber: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return paginatedResponse(payments, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = paymentSchema.parse(body);

    const policy = await prisma.policy.findUnique({ where: { id: data.policyId } });
    if (!policy) throw new Error("Policy not found");

    if (policy.status !== "ACTIVE") {
      throw new Error("Can only process payments for active policies");
    }

    const payment = await prisma.payment.create({
      data: {
        ...data,
        reference: data.reference || `PAY-${Date.now().toString(36).toUpperCase()}`,
        status: "PENDING",
      },
      include: {
        policy: { select: { policyNumber: true } },
      },
    });

    const pendingPayments = await prisma.payment.findMany({
      where: { policyId: data.policyId, status: "PENDING" },
    });

    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    return successResponse(
      {
        payment,
        policyBalance: {
          totalPending,
          paymentCount: pendingPayments.length,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "FINANCE"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to update payments");
    }

    const body = await request.json();
    const { id, status, transactionId } = body;

    if (!id || !status) throw new Error("id and status are required");

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        transactionId,
        processedAt: status === "COMPLETED" ? new Date() : undefined,
      },
      include: {
        policy: { select: { policyNumber: true } },
      },
    });

    return successResponse(payment);
  } catch (error) {
    return handleApiError(error);
  }
}
