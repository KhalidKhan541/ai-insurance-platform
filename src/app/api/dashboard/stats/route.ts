import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalPolicies,
      activePolicies,
      totalClaims,
      pendingClaims,
      totalRevenue,
      recentRevenue,
      totalCustomers,
      newCustomers,
      activeAgents,
      fraudCases,
      expiringPolicies,
      recentClaims,
      policiesByType,
      claimsByStatus,
      revenueByMonth,
    ] = await Promise.all([
      prisma.policy.count(),
      prisma.policy.count({ where: { status: "ACTIVE" } }),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "INVESTIGATING"] } } }),
      prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.customer.count(),
      prisma.customer.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.agent.count(),
      prisma.fraudCase.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
      prisma.policy.count({
        where: {
          status: "ACTIVE",
          endDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.claim.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { status: true, estimatedAmount: true, createdAt: true },
      }),
      prisma.policy.groupBy({ by: ["type"], _count: true, _sum: { premium: true } }),
      prisma.claim.groupBy({ by: ["status"], _count: true }),
      prisma.payment.groupBy({
        by: ["createdAt"],
        where: { status: "COMPLETED", createdAt: { gte: ninetyDaysAgo } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const monthlyRevenueMap: Record<string, number> = {};
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthDate.toISOString().substring(0, 7);
      monthlyRevenueMap[key] = 0;
    }

    const claimApprovalRate = totalClaims > 0
      ? ((await prisma.claim.count({
          where: { status: { in: ["APPROVED", "SETTLED", "CLOSED"] }, createdAt: { gte: ninetyDaysAgo } },
        })) / Math.max(await prisma.claim.count({ where: { createdAt: { gte: ninetyDaysAgo } } }), 1) * 100).toFixed(1)
      : "0";

    const monthlyPremium = activePolicies > 0
      ? (await prisma.policy.aggregate({
          where: { status: "ACTIVE" },
          _sum: { premium: true },
        }))._sum.premium || 0
      : 0;

    return successResponse({
      overview: {
        totalPolicies,
        activePolicies,
        totalClaims,
        pendingClaims,
        totalCustomers,
        newCustomers,
        activeAgents,
        fraudCases,
        expiringPolicies,
      },
      financial: {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: recentRevenue._sum.amount || 0,
        revenueTransactions: recentRevenue._count,
        monthlyPremium,
        averagePolicyPremium: activePolicies > 0 ? Math.round((monthlyPremium / activePolicies) * 100) / 100 : 0,
      },
      metrics: {
        claimApprovalRate: parseFloat(claimApprovalRate),
        claimsLast30Days: recentClaims.length,
        claimsTrend: recentClaims.length > 0
          ? recentClaims.filter((c) => c.createdAt >= thirtyDaysAgo).length
          : 0,
        averageClaimAmount: recentClaims.length > 0
          ? Math.round(recentClaims.reduce((s, c) => s + c.estimatedAmount, 0) / recentClaims.length)
          : 0,
      },
      charts: {
        policiesByType: policiesByType.map((p) => ({
          type: p.type,
          count: p._count,
          premium: p._sum.premium || 0,
        })),
        claimsByStatus: claimsByStatus.map((c) => ({
          status: c.status,
          count: c._count,
        })),
        revenueByMonth: Object.entries(monthlyRevenueMap).map(([month, amount]) => ({
          month,
          amount,
        })),
      },
      alerts: {
        expiringPolicies,
        pendingClaims,
        activeFraudCases: fraudCases,
        newCustomersLast30Days: newCustomers,
      },
      generatedAt: now,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
