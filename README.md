# AI Insurance Platform

An intelligent insurance management platform built with Next.js 14, Prisma, PostgreSQL, and AI-powered risk assessment.

## Features

- **Policy Management** - Create, update, and manage insurance policies across multiple types (auto, home, life, health, commercial, travel)
- **Claims Processing** - File, review, and resolve insurance claims with document management
- **Customer Management** - Individual and business customer profiles with contact information
- **AI Risk Assessment** - Machine learning-powered risk scoring and premium adjustment recommendations
- **Dashboard Analytics** - Real-time statistics and trend visualization
- **Authentication & Authorization** - Role-based access control (admin, agent, adjuster, customer, analyst)
- **Email Notifications** - Automated email workflows for policy updates and claim status changes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL 16, Redis 7 |
| Auth | NextAuth.js v4 |
| Testing | Vitest |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Winston logger |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional, for caching)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ai-insurance-platform.git
cd ai-insurance-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npx prisma db seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Docker Setup

```bash
# Start all services (PostgreSQL, Redis, App, MailHog)
docker compose up -d

# Run migrations
docker compose exec app npx prisma db push

# View logs
docker compose logs -f app
```

### Production Deployment

```bash
# Copy and configure production env
cp .env.example .env.production

# Build and start production services
docker compose -f docker-compose.prod.yml up -d

# Run database migrations in production
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

## Project Structure

```
ai-insurance-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── policies/       # Policy CRUD endpoints
│   │   │   ├── claims/         # Claims endpoints
│   │   │   └── customers/      # Customer endpoints
│   │   └── page.tsx            # Main dashboard
│   ├── components/             # React components
│   ├── config/                 # Configuration (Prisma client)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── utils/              # Utility functions
│   │   │   ├── calculations.ts # Premium & risk calculations
│   │   │   ├── format.ts       # Data formatting
│   │   │   └── helpers.ts      # General helpers
│   │   └── validators/         # Zod validation schemas
│   │       ├── policy.ts
│   │       ├── claim.ts
│   │       └── customer.ts
│   ├── services/               # Business logic layer
│   │   ├── policy.service.ts
│   │   ├── claim.service.ts
│   │   ├── customer.service.ts
│   │   └── ai-risk.service.ts  # AI risk assessment
│   ├── stores/                 # Zustand state management
│   └── types/                  # TypeScript type definitions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seed script
├── tests/
│   ├── unit/                   # Unit tests
│   │   ├── validators/         # Schema validation tests
│   │   ├── utils/              # Utility function tests
│   │   └── services/           # Service layer tests
│   ├── integration/            # Integration tests
│   │   └── api/                # API endpoint tests
│   ├── components/             # Component tests
│   └── fixtures/               # Test fixtures & factories
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       └── cd.yml              # CD pipeline
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Development services
├── docker-compose.prod.yml     # Production services
└── package.json
```

## API Endpoints

### Policies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/policies` | List policies (paginated) |
| POST | `/api/policies` | Create new policy |
| GET | `/api/policies/[id]` | Get policy by ID |
| PUT | `/api/policies/[id]` | Update policy |
| DELETE | `/api/policies/[id]` | Delete policy |

### Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/claims` | List claims (paginated) |
| POST | `/api/claims` | File new claim |
| GET | `/api/claims/[id]` | Get claim by ID |
| PUT | `/api/claims/[id]` | Update claim status |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers (paginated) |
| POST | `/api/customers` | Register new customer |
| GET | `/api/customers/[id]` | Get customer by ID |
| PUT | `/api/customers/[id]` | Update customer |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | Sign in |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/session` | Get current session |

## Testing

```bash
# Run all tests
npx vitest run

# Run unit tests only
npx vitest run tests/unit/

# Run integration tests only
npx vitest run tests/integration/

# Run tests with coverage
npx vitest run --coverage

# Run tests in watch mode
npx vitest
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | No | - |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes | - |
| `NEXTAUTH_URL` | Application URL | Yes | - |
| `SMTP_HOST` | Email server host | No | - |
| `SMTP_PORT` | Email server port | No | 587 |
| `SMTP_USER` | Email server user | No | - |
| `SMTP_PASS` | Email server password | No | - |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.
