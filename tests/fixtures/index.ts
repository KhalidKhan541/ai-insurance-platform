import { Policy, Claim, Customer, RiskAssessment, AuthSession, Address } from "@/types";

export const TEST_UUIDS = {
  policy1: "550e8400-e29b-41d4-a716-446655440001",
  policy2: "550e8400-e29b-41d4-a716-446655440002",
  policy3: "550e8400-e29b-41d4-a716-446655440003",
  claim1: "660e8400-e29b-41d4-a716-446655440001",
  claim2: "660e8400-e29b-41d4-a716-446655440002",
  claim3: "660e8400-e29b-41d4-a716-446655440003",
  customer1: "770e8400-e29b-41d4-a716-446655440001",
  customer2: "770e8400-e29b-41d4-a716-446655440002",
  customer3: "770e8400-e29b-41d4-a716-446655440003",
  user1: "880e8400-e29b-41d4-a716-446655440001",
  user2: "880e8400-e29b-41d4-a716-446655440002",
  adjuster1: "990e8400-e29b-41d4-a716-446655440001",
};

export const TEST_DATES = {
  today: "2026-09-10",
  yesterday: "2026-09-09",
  tomorrow: "2026-09-11",
  oneYearAgo: "2025-09-10",
  oneYearFromNow: "2027-09-10",
  twoYearsFromNow: "2028-09-10",
  fiveYearsFromNow: "2031-09-10",
  distantPast: "2020-01-01",
};

export const TEST_ADDRESSES: Record<string, Address> = {
  illinois: {
    street: "123 Main Street",
    city: "Springfield",
    state: "IL",
    zipCode: "62704",
    country: "US",
  },
  california: {
    street: "456 Oak Avenue",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    country: "US",
  },
  texas: {
    street: "789 Elm Boulevard",
    city: "Houston",
    state: "TX",
    zipCode: "77001",
    country: "US",
  },
  florida: {
    street: "321 Palm Drive",
    city: "Miami",
    state: "FL",
    zipCode: "33101",
    country: "US",
  },
  newYork: {
    street: "555 Fifth Avenue",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "US",
  },
};

export function createMockPolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: TEST_UUIDS.policy1,
    policyNumber: "POL-TEST-001",
    policyType: "auto",
    status: "active",
    customerId: TEST_UUIDS.customer1,
    premium: 1200.0,
    coverageAmount: 100_000,
    deductible: 1000,
    effectiveDate: TEST_DATES.today,
    expirationDate: TEST_DATES.oneYearFromNow,
    description: "Comprehensive auto insurance policy for testing",
    createdAt: TEST_DATES.today,
    updatedAt: TEST_DATES.today,
    ...overrides,
  };
}

export function createMockClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: TEST_UUIDS.claim1,
    claimNumber: "CLM-TEST-001",
    policyId: TEST_UUIDS.policy1,
    customerId: TEST_UUIDS.customer1,
    status: "pending",
    type: "auto_accident",
    description: "Vehicle collision at intersection during morning commute",
    amount: 5000,
    filedDate: TEST_DATES.today,
    documents: [],
    createdAt: TEST_DATES.today,
    updatedAt: TEST_DATES.today,
    ...overrides,
  };
}

export function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: TEST_UUIDS.customer1,
    customerNumber: "CUST-TEST-001",
    type: "individual",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+15551234567",
    address: TEST_ADDRESSES.illinois,
    dateOfBirth: "1990-05-15",
    totalPolicies: 2,
    totalClaims: 1,
    createdAt: TEST_DATES.today,
    updatedAt: TEST_DATES.today,
    ...overrides,
  };
}

export function createMockRiskAssessment(
  overrides: Partial<RiskAssessment> = {}
): RiskAssessment {
  return {
    id: TEST_UUIDS.claim1,
    customerId: TEST_UUIDS.customer1,
    policyType: "auto",
    riskScore: 35,
    riskLevel: "medium",
    factors: [
      {
        name: "Age",
        weight: 0.15,
        score: 40,
        impact: "neutral",
        description: "Age 36 - standard risk category",
      },
      {
        name: "Coverage Amount",
        weight: 0.25,
        score: 40,
        impact: "positive",
        description: "Coverage of $100,000",
      },
      {
        name: "Claim History",
        weight: 0.30,
        score: 10,
        impact: "positive",
        description: "No prior claims",
      },
      {
        name: "Location",
        weight: 0.20,
        score: 50,
        impact: "neutral",
        description: "Location modifier: 1.0x for state IL",
      },
      {
        name: "Policy Type",
        weight: 0.10,
        score: 55,
        impact: "neutral",
        description: "auto insurance base risk",
      },
    ],
    recommendations: ["Eligible for no-claims discount"],
    premiumAdjustment: 0,
    assessedAt: TEST_DATES.today,
    validUntil: TEST_DATES.oneYearFromNow,
    ...overrides,
  };
}

export function createMockAuthSession(
  overrides: Partial<AuthSession> = {}
): AuthSession {
  return {
    user: {
      id: TEST_UUIDS.user1,
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    },
    expires: TEST_DATES.oneYearFromNow,
    ...overrides,
  };
}

export function generateMockPolicies(count: number): Policy[] {
  const types: Policy["policyType"][] = ["auto", "home", "life", "health", "commercial", "travel"];
  const statuses: Policy["status"][] = ["active", "pending", "inactive", "cancelled", "expired"];

  return Array.from({ length: count }, (_, i) =>
    createMockPolicy({
      id: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, "0")}`,
      policyNumber: `POL-GEN-${String(i).padStart(3, "0")}`,
      policyType: types[i % types.length],
      status: statuses[i % statuses.length],
      premium: 500 + i * 250,
      coverageAmount: 50_000 + i * 25_000,
    })
  );
}

export function generateMockClaims(count: number): Claim[] {
  const types = [
    "auto_accident",
    "property_damage",
    "theft",
    "natural_disaster",
    "medical",
  ];
  const statuses: Claim["status"][] = ["pending", "approved", "denied", "paid"];

  return Array.from({ length: count }, (_, i) =>
    createMockClaim({
      id: `660e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, "0")}`,
      claimNumber: `CLM-GEN-${String(i).padStart(3, "0")}`,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      amount: 1000 + i * 1500,
    })
  );
}

export function generateMockCustomers(count: number): Customer[] {
  const types: Customer["type"][] = ["individual", "business"];
  const firstNames = ["John", "Jane", "Bob", "Alice", "Charlie", "Diana"];
  const lastNames = ["Doe", "Smith", "Johnson", "Williams", "Brown", "Davis"];
  const companies = ["Acme Corp", "TechStart Inc", "Global Industries", "Smart Solutions", "Alpha Systems", "Beta Labs"];

  return Array.from({ length: count }, (_, i) =>
    createMockCustomer({
      id: `770e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, "0")}`,
      customerNumber: `CUST-GEN-${String(i).padStart(3, "0")}`,
      type: types[i % types.length],
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[i % lastNames.length],
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@example.com`,
      totalPolicies: Math.floor(Math.random() * 5),
      totalClaims: Math.floor(Math.random() * 3),
    })
  );
}

export const SAMPLE_API_RESPONSES = {
  paginatedPolicies: {
    data: generateMockPolicies(10),
    total: 100,
    page: 1,
    limit: 10,
    totalPages: 10,
  },
  paginatedClaims: {
    data: generateMockClaims(10),
    total: 50,
    page: 1,
    limit: 10,
    totalPages: 5,
  },
  paginatedCustomers: {
    data: generateMockCustomers(10),
    total: 200,
    page: 1,
    limit: 10,
    totalPages: 20,
  },
  errorResponse: {
    message: "Something went wrong",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  },
  validationError: {
    message: "Validation failed",
    code: "VALIDATION_ERROR",
    statusCode: 400,
    details: {
      email: ["Invalid email address"],
      premium: ["Must be positive"],
    },
  },
};
