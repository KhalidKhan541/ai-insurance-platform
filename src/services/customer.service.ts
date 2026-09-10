import { prisma } from "@/config/prisma";
import { generateCustomerNumber, generateId } from "@/lib/utils/helpers";
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
} from "@/lib/validators/customer";
import { Customer, PaginatedResponse } from "@/types";

export class CustomerService {
  async create(data: CreateCustomerInput): Promise<Customer> {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: data.email,
      },
    });

    if (existingCustomer) {
      throw new Error("A customer with this email already exists");
    }

    const customerNumber = generateCustomerNumber();

    const customer = await prisma.customer.create({
      data: {
        id: generateId(),
        customerNumber,
        type: data.type,
        firstName: "firstName" in data ? data.firstName : data.companyName,
        lastName: "lastName" in data ? data.lastName : "",
        email: data.email,
        phone: data.phone || "",
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode,
        country: data.address.country,
        dateOfBirth: "dateOfBirth" in data && data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : undefined,
        ssnLast4: "ssnLast4" in data ? data.ssnLast4 : undefined,
        companyName: "companyName" in data ? data.companyName : undefined,
        taxId: "taxId" in data ? data.taxId : undefined,
      },
    });

    return this.mapToCustomer(customer);
  }

  async getById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        policies: true,
        claims: true,
      },
    });

    if (!customer) return null;
    return this.mapToCustomer(customer);
  }

  async getByEmail(email: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) return null;
    return this.mapToCustomer(customer);
  }

  async query(params: CustomerQueryInput): Promise<PaginatedResponse<Customer>> {
    const where: Record<string, unknown> = {};

    if (params.type) where.type = params.type;
    if (params.state) where.state = params.state;
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { customerNumber: { contains: params.search, mode: "insensitive" } },
        { companyName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const skip = (params.page - 1) * params.limit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c) => this.mapToCustomer(c)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new Error("Customer not found");

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.customer.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (emailTaken) throw new Error("Email is already taken by another customer");
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.address) {
      updateData.street = data.address.street;
      updateData.city = data.address.city;
      updateData.state = data.address.state;
      updateData.zipCode = data.address.zipCode;
      updateData.country = data.address.country;
      delete updateData.address;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return this.mapToCustomer(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.customer.findUnique({
      where: { id },
      include: { policies: true },
    });

    if (!existing) throw new Error("Customer not found");

    const activePolicies = existing.policies.filter((p) => p.status === "active");
    if (activePolicies.length > 0) {
      throw new Error("Cannot delete customer with active policies");
    }

    await prisma.customer.delete({ where: { id } });
  }

  async getCustomerStats(): Promise<{
    total: number;
    individual: number;
    business: number;
    newThisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, individual, business, newThisMonth] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { type: "individual" } }),
      prisma.customer.count({ where: { type: "business" } }),
      prisma.customer.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return {
      total,
      individual,
      business,
      newThisMonth,
    };
  }

  async search(query: string): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { customerNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    });

    return customers.map((c) => this.mapToCustomer(c));
  }

  private mapToCustomer(data: Record<string, unknown>): Customer {
    return {
      id: data.id as string,
      customerNumber: data.customerNumber as string,
      type: data.type as Customer["type"],
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      email: data.email as string,
      phone: data.phone as string,
      address: {
        street: data.street as string,
        city: data.city as string,
        state: data.state as string,
        zipCode: data.zipCode as string,
        country: (data.country as string) || "US",
      },
      dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Date).toISOString() : undefined,
      ssnLast4: data.ssnLast4 as string | undefined,
      companyName: data.companyName as string | undefined,
      taxId: data.taxId as string | undefined,
      riskScore: data.riskScore as number | undefined,
      totalPolicies: (data.policies as unknown[])?.length || 0,
      totalClaims: (data.claims as unknown[])?.length || 0,
      createdAt: (data.createdAt as Date).toISOString(),
      updatedAt: (data.updatedAt as Date).toISOString(),
    };
  }
}

export const customerService = new CustomerService();
