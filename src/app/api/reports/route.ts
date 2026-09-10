import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, UnauthorizedError } from "@/lib/errors";
import { z } from "zod";

const reportSchema = z.object({
  type: z.enum([
    "REVENUE", "CLAIMS_SUMMARY", "POLICY_PORTFOLIO", "AGENT_PERFORMANCE",
    "CUSTOMER_ANALYTICS", "RISK_DISTRIBUTION", "FRAUD_SUMMARY", "CUSTOM",
  ]),
  dateFrom: z.string().datetime().or(z.date()).optional(),
  dateTo: z.string().datetime().or(z.date()).optional(),
  filters: z.record(z.unknown()).optional(),
  format: z.enum(["JSON", "CSV", "PDF"]).default("JSON"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "MANAGER", "FINANCE"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to view reports");
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "REVENUE";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const startDate = dateFrom ? new Date(dateFrom) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const dateFilter = { gte: startDate, lte: endDate };

    let reportData: Record<string, unknown> = {};

    switch (reportType) {
      case "REVENUE": {
        const [totalRevenue, monthlyRevenue, revenueByType] = await Promise.all([
          prisma.payment.aggregate({
            where: { status: "COMPLETED", createdAt: dateFilter },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.payment.groupBy({
            by: ["method"],
            where: { status: "COMPLETED", createdAt: dateFilter },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.policy.groupBy({
            by: ["type"],
            where: { createdAt: dateFilter },
            _sum: { premium: true },
            _count: true,
          }),
        ]);

        reportData = {
          summary: {
            totalRevenue: totalRevenue._sum.amount || 0,
            totalTransactions: totalRevenue._count,
            averageTransaction: totalRevenue._count > 0
              ? (totalRevenue._sum.amount || 0) / totalRevenue._count
              : 0,
          },
          byMethod: monthlyRevenue,
          byPolicyType: revenueByType,
          period: { from: startDate, to: endDate },
        };
        break;
      }

      case "CLAIMS_SUMMARY": {
        const [claimStats, claimsByStatus, claimsByType, avgSettlementTime] = await Promise.all([
          prisma.claim.aggregate({
            where: { createdAt: dateFilter },
            _sum: { estimatedAmount: true, approvedAmount: true },
            _count: true,
          }),
          prisma.claim.groupBy({
            by: ["status"],
            where: { createdAt: dateFilter },
            _count: true,
            _sum: { estimatedAmount: true },
          }),
          prisma.claim.groupBy({
            by: ["type"],
            where: { createdAt: dateFilter },
            _count: true,
            _sum: { estimatedAmount: true, approvedAmount: true },
          }),
          prisma.claim.aggregate({
            where: {
              createdAt: dateFilter,
              status: { in: ["SETTLED", "CLOSED"] },
              resolvedAt: { not: null },
            },
            _avg: { estimatedAmount: true, approvedAmount: true },
          }),
        ]);

        reportData = {
          summary: {
            totalClaims: claimStats._count,
            totalEstimated: claimStats._sum.estimatedAmount || 0,
            totalApproved: claimStats._sum.approvedAmount || 0,
            approvalRate: claimStats._count > 0
              ? ((claimsByStatus.find((s) => ["APPROVED", "SETTLED"].includes(s.status))?._count || 0) / claimStats._count * 100).toFixed(1)
              : 0,
          },
          byStatus: claimsByStatus,
          byType: claimsByType,
          averages: {
            estimatedAmount: avgSettlementTime._avg.estimatedAmount || 0,
            approvedAmount: avgSettlementTime._avg.approvedAmount || 0,
          },
          period: { from: startDate, to: endDate },
        };
        break;
      }

      case "POLICY_PORTFOLIO": {
        const [policyStats, policiesByType, policiesByStatus, premiumByType] = await Promise.all([
          prisma.policy.aggregate({
            where: { createdAt: dateFilter },
            _sum: { premium: true, coverageAmount: true },
            _count: true,
          }),
          prisma.policy.groupBy({
            by: ["type"],
            where: { createdAt: dateFilter },
            _count: true,
          }),
          prisma.policy.groupBy({
            by: ["status"],
            where: { createdAt: dateFilter },
            _count: true,
          }),
          prisma.policy.groupBy({
            by: ["type"],
            where: { status: "ACTIVE" },
            _sum: { premium: true, coverageAmount: true },
            _count: true,
          }),
        ]);

        reportData = {
          summary: {
            totalPolicies: policyStats._count,
            totalPremium: policyStats._sum.premium || 0,
            totalCoverage: policyStats._sum.coverageAmount || 0,
          },
          byType: policiesByType,
          byStatus: policiesByStatus,
          activePortfolio: premiumByType,
          period: { from: startDate, to: endDate },
        };
        break;
      }

      case "AGENT_PERFORMANCE": {
        const agents = await prisma.agent.findMany({
          include: {
            user: { select: { name: true } },
            policies: {
              where: { createdAt: dateFilter },
              select: { premium: true, status: true },
            },
          },
        });

        const agentPerformance = agents.map((agent) => ({
          agentId: agent.id,
          name: agent.user.name,
          licenseNumber: agent.licenseNumber,
          totalPolicies: agent.policies.length,
          activePolicies: agent.policies.filter((p) => p.status === "ACTIVE").length,
          totalPremium: agent.policies.reduce((sum, p) => sum + p.premium, 0),
          commission: agent.policies.reduce((sum, p) => sum + p.premium, 0) * (agent.commissionRate / 100),
        }));

        reportData = {
          agents: agentPerformance.sort((a, b) => b.totalPremium - a.totalPremium),
          period: { from: startDate, to: endDate },
        };
        break;
      }

      default:
        reportData = { message: `Report type ${reportType} is not yet implemented` };
    }

    return successResponse({
      type: reportType,
      generatedAt: new Date(),
      generatedBy: session.user.id,
      data: reportData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to schedule reports");
    }

    const body = await request.json();
    const data = reportSchema.parse(body);

    const report = await prisma.scheduledReport.create({
      data: {
        type: data.type,
        dateFrom: data.dateFrom ? new Date(data.dateFrom) : undefined,
        dateTo: data.dateTo ? new Date(data.dateTo) : undefined,
        filters: data.filters ? JSON.stringify(data.filters) : undefined,
        format: data.format,
        createdBy: session.user.id,
        status: "SCHEDULED",
      },
    });

    return successResponse(report, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
