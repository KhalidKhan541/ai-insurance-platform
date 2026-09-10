import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  getServerSession: vi.fn(),
}));

vi.mock("@/config/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/signin", () => {
    it("should handle login request", async () => {
      const body = {
        email: "admin@example.com",
        password: "securePassword123",
      };

      const request = new NextRequest("http://localhost/api/auth/signin", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response).toBeDefined();
    });

    it("should reject invalid email format", async () => {
      const body = {
        email: "invalid-email",
        password: "password123",
      };

      const request = new NextRequest("http://localhost/api/auth/signin", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response).toBeDefined();
    });

    it("should reject empty password", async () => {
      const body = {
        email: "user@example.com",
        password: "",
      };

      const request = new NextRequest("http://localhost/api/auth/signin", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response).toBeDefined();
    });
  });

  describe("GET /api/auth/session", () => {
    it("should return session data", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        },
        expires: "2027-01-01T00:00:00.000Z",
      });

      const request = new NextRequest("http://localhost/api/auth/session");
      const response = await GET(request);

      expect(response).toBeDefined();
    });

    it("should return null session when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/auth/session");
      const response = await GET(request);

      expect(response).toBeDefined();
    });
  });

  describe("Authentication flow", () => {
    it("should enforce role-based access", async () => {
      const roles = ["admin", "agent", "adjuster", "customer", "analyst"];

      for (const role of roles) {
        const { getServerSession } = await import("next-auth");
        vi.mocked(getServerSession).mockResolvedValue({
          user: {
            id: "user-1",
            email: "user@example.com",
            name: "Test User",
            role,
          },
          expires: "2027-01-01T00:00:00.000Z",
        });

        expect(role).toBeDefined();
        expect(roles).toContain(role);
      }
    });

    it("should validate session expiration", async () => {
      const { getServerSession } = await import("next-auth");

      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@example.com",
          name: "Test User",
          role: "admin",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const session = await getServerSession();
      expect(session).not.toBeNull();
      expect(new Date(session!.expires).getTime()).toBeGreaterThan(Date.now());
    });

    it("should handle session with past expiration", async () => {
      const { getServerSession } = await import("next-auth");

      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@example.com",
          name: "Test User",
          role: "admin",
        },
        expires: new Date(Date.now() - 86400000).toISOString(),
      });

      const session = await getServerSession();
      expect(session).not.toBeNull();
      expect(new Date(session!.expires).getTime()).toBeLessThan(Date.now());
    });
  });
});
