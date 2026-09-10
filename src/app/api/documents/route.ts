import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { documentSchema, parseQueryParams } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, paginatedResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    const where: Record<string, unknown> = {};

    const typeFilter = searchParams.get("type");
    if (typeFilter) where.type = typeFilter;

    const entityType = searchParams.get("entityType");
    if (entityType) where.entityType = entityType;

    const entityId = searchParams.get("entityId");
    if (entityId) where.entityId = entityId;

    if (session.user.role === "CUSTOMER") {
      where.uploadedBy = session.user.id;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedByUser: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.document.count({ where }),
    ]);

    return paginatedResponse(documents, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const body = await request.json();
    const data = documentSchema.parse(body);

    const document = await prisma.document.create({
      data: {
        ...data,
        uploadedBy: session.user.id,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to delete documents");
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");
    if (!documentId) throw new Error("Document id is required");

    await prisma.document.delete({ where: { id: documentId } });

    return successResponse({ message: "Document deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
