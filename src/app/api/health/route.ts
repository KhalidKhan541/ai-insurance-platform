import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};
  const startTime = Date.now();

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "healthy", latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: "unhealthy" };
  }

  try {
    checks.memory = {
      status: "healthy",
      latency: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  } catch {
    checks.memory = { status: "unhealthy" };
  }

  checks.uptime = {
    status: "healthy",
    latency: Math.round(process.uptime()),
  };

  checks.version = {
    status: "healthy",
  };

  const allHealthy = Object.values(checks).every((c) => c.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      checks,
      totalLatency: Date.now() - startTime,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
