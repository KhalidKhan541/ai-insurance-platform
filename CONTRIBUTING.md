# Contributing to AI Insurance Platform

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ai-insurance-platform.git
   cd ai-insurance-platform
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment:
   ```bash
   cp .env.example .env.local
   ```

5. Start development:
   ```bash
   docker compose up -d
   npm run db:push
   npm run dev
   ```

## Code Style

### TypeScript

- Use TypeScript for all new files
- Prefer interfaces over types for object shapes
- Use `type` imports: `import type { User } from "@/types"`
- Avoid `any` - use `unknown` or proper types

### Formatting

```bash
# Check formatting
npx prettier --check "src/**/*.{ts,tsx}"

# Fix formatting
npx prettier --write "src/**/*.{ts,tsx}"
```

### Linting

```bash
# Check lint rules
npm run lint

# Fix lint issues
npm run lint -- --fix
```

## Git Workflow

### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/ai-risk-api` |
| `fix/` | Bug fix | `fix/claim-validation` |
| `docs/` | Documentation | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/policy-service` |
| `test/` | Adding tests | `test/claim-unit-tests` |
| `chore/` | Maintenance | `chore/update-deps` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements

**Examples:**
```
feat(claims): add document upload endpoint
fix(validations): handle empty description field
docs(api): update policy endpoint documentation
test(policy): add unit tests for premium calculation
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Write or update tests
4. Ensure all checks pass:
   ```bash
   npm run lint
   npm run typecheck
   npx vitest run
   ```
5. Push and create a PR against `develop`
6. Fill out the PR template
7. Request review from maintainers

## Testing

### Running Tests

```bash
# All tests
npx vitest run

# Unit tests
npx vitest run tests/unit/

# Integration tests
npx vitest run tests/integration/

# Component tests
npx vitest run tests/components/

# With coverage
npx vitest run --coverage

# Watch mode
npx vitest
```

### Writing Tests

- Place tests in `tests/` directory mirroring `src/` structure
- Use `.test.ts` for unit tests, `.test.tsx` for component tests
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Test both success and error paths

```typescript
import { describe, it, expect } from "vitest";
import { calculatePremium } from "@/lib/utils/calculations";

describe("calculatePremium", () => {
  it("should calculate premium correctly", () => {
    // Arrange
    const policyType = "auto";
    const coverage = 100_000;

    // Act
    const result = calculatePremium(policyType, coverage);

    // Assert
    expect(result).toBeGreaterThan(0);
  });
});
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # Reusable React components
├── config/           # App configuration
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
│   ├── utils/        # Pure utility functions
│   └── validators/   # Zod validation schemas
├── services/         # Business logic
├── stores/           # Zustand stores
└── types/            # TypeScript types
```

### Adding a New Feature

1. **Define types** in `src/types/index.ts`
2. **Create validators** in `src/lib/validators/`
3. **Implement service** in `src/services/`
4. **Add API route** in `src/app/api/`
5. **Build UI** in `src/components/`
6. **Write tests** in `tests/`

## Database

### Schema Changes

```bash
# Create migration
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Reset database
npm run db:reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Seeding

```bash
npm run db:seed
```

## Docker

### Development

```bash
docker compose up -d        # Start services
docker compose logs -f app  # View logs
docker compose down         # Stop services
```

### Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

## CI/CD

### CI Pipeline (on every push/PR)

1. **Lint** - ESLint + Prettier
2. **Type Check** - TypeScript compiler
3. **Unit Tests** - Vitest
4. **Integration Tests** - Vitest + PostgreSQL
5. **Build** - Next.js production build
6. **Docker Build** - Verify Dockerfile

### CD Pipeline (on tag/release)

1. Run all tests
2. Build Docker image
3. Push to Container Registry
4. Deploy to staging
5. Deploy to production
6. Notify team

## Code Review

### Checklist

- [ ] Code follows style guidelines
- [ ] Tests cover new functionality
- [ ] No type errors
- [ ] No lint warnings
- [ ] Documentation updated
- [ ] Database changes are backwards-compatible
- [ ] API changes are backwards-compatible
- [ ] Security considerations addressed

## Issue Reporting

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots (if applicable)

### Feature Requests

Include:
- Problem statement
- Proposed solution
- Alternatives considered
- Use cases

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Run `npm audit` regularly
- Report security issues privately to maintainers

## Questions?

- Open a discussion on GitHub
- Check existing issues and docs
- Reach out to maintainers
