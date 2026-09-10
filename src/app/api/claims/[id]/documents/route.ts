import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { documentSchema } from "@/lib/validations";
import { successResponse, handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const claim = await prisma.claim.findUnique({ where: { id: params.id } });
    if (!claim) throw new NotFoundError("Claim", params.id);

    const documents = await prisma.claimDocument.findMany({
      where: { claimId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedByUser: { select: { name: true } },
      },
    });

    return successResponse(documents);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    const claim = await prisma.claim.findUnique({ where: { id: params.id } });
    if (!claim) throw new NotFoundError("Claim", params.id);

    if (["DENIED", "CLOSED"].includes(claim.status)) {
      throw new Error("Cannot add documents to denied or closed claims");
    }

    const body = await request.json();
    const data = documentSchema.parse(body);

    const document = await prisma.claimDocument.create({
      data: {
        claimId: params.id,
        name: data.name,
        type: data.type,
        url: data.url,
        fileContent: data.fileContent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        uploadedBy: session.user.id,
      },
    });

    const existingDocs = await prisma.claimDocument.count({
      where: { claimId: params.id },
    });

    if (existingDocs > 0 && claim.status === "PENDING_DOCUMENTS") {
      await prisma.claim.update({
        where: { id: params.id },
        data: { status: "UNDER_REVIEW" },
      });

      await prisma.claimTimeline.create({
        data: {
          claimId: params.id,
          action: "DOCUMENTS_UPLOADED",
          fromStatus: "PENDING_DOCUMENTS",
          toStatus: "UNDER_REVIEW",
          notes: `Document uploaded: ${data.name}`,
          userId: session.user.id,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        entityType: "CLAIM",
        entityId: params.id,
        action: "DOCUMENT_ADDED",
        details: JSON.stringify({ documentId: document.id, name: data.name, type: data.type }),
        userId: session.user.id,
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new UnauthorizedError();

    if (!["ADMIN", "CLAIMS_ADJUSTER"].includes(session.user.role)) {
      throw new UnauthorizedError("Insufficient permissions to delete claim documents");
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) throw new Error("documentId query parameter is required");

    const document = await prisma.claimDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.claimId !== params.id) {
      throw new NotFoundError("Document", documentId);
    }

    await prisma.claimDocument.delete({ where: { id: documentId } });

    return successResponse({ message: "Document deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
