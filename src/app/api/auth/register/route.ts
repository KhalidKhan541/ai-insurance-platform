import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { successResponse, handleApiError, ConflictError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        isActive: true,
        emailVerified: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (data.role === "CUSTOMER") {
      await prisma.customer.create({
        data: {
          userId: user.id,
          riskProfile: "MEDIUM",
        },
      });
    }

    if (data.role === "AGENT") {
      await prisma.agent.create({
        data: {
          userId: user.id,
          licenseNumber: `LIC-${Date.now().toString(36).toUpperCase()}`,
          commissionRate: 10,
        },
      });
    }

    return successResponse(
      {
        user,
        message: "Registration successful. Please verify your email.",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
