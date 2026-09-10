import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { communicationSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    if (session.user.role === "CUSTOMER") {
      where.recipientId = session.user.id;
      where.recipientType = "CUSTOMER";
    } else if (session.user.role === "AGENT") {
      where.OR = [
        { senderId: session.user.id },
        { recipientId: session.user.id },
      ];
    }

    const typeFilter = searchParams.get("type");
    if (typeFilter) where.type = typeFilter;

    const unreadOnly = searchParams.get("unread");
    if (unreadOnly === "true") where.readAt = null;

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          sender: { select: { name: true } },
          recipient: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.communication.count({ where }),
    ]);

    const unreadCount = await prisma.communication.count({
      where: {
        recipientId: session.user.id,
        readAt: null,
      },
    });

    return paginatedResponse(
      { communications, unreadCount },
      total,
      params.page,
      params.limit
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = communicationSchema.parse(body);

    const communication = await prisma.communication.create({
      data: {
        ...data,
        senderId: session.user.id,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
      include: {
        sender: { select: { name: true } },
        recipient: { select: { name: true } },
      },
    });

    return successResponse(communication, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const { ids, markAsRead } = body;

    if (markAsRead && ids) {
      await prisma.communication.updateMany({
        where: {
          id: { in: ids },
          recipientId: session.user.id,
        },
        data: { readAt: new Date() },
      });
    }

    return successResponse({ message: "Communications updated" });
  } catch (error) {
    return handleApiError(error);
  }
}
