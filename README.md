# Expense Tracker & Inventory Manager

A modern, multi-tenant expense tracking and inventory price history application built with Next.js 16, designed for organizations that need robust financial oversight and inventory cost analysis.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.4-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

---

## Overview

This application enables organizations to:

- **Track expenses** with categories, recurring templates, and attachment support
- **Monitor inventory prices** with complete historical records
- **Integrate email** to automatically detect and categorize expense-related communications
- **Manage departments** for targeted notifications and access control
- **Analyze trends** with AI-powered insights and interactive dashboards

Built as a single Next.js deployment with server-side rendering, it provides enterprise-grade multi-tenancy while remaining simple to deploy and maintain.

---

## Features

### Expense Management
- Create, edit, and delete expenses with category assignment
- Recurring expense templates for subscriptions and regular payments
- File attachments with secure Supabase Storage
- Tax amount tracking with automatic rate calculation
- Monthly and category-based filtering

### Inventory Price History
- Append-only price tracking (never lose historical data)
- Point-in-time queries ("What was the price on March 15?")
- Price change analysis between any two dates
- Multi-vendor support per item

### Email Integration
- Gmail and Outlook OAuth connections
- Automatic email categorization with keyword matching
- Email forwarding rules with department-based notifications
- In-app notification system

### Organization & Access Control
- Multi-tenant architecture with complete data isolation
- Role-based permissions: `owner`, `org_admin`, `finance`, `inventory`, `viewer`
- Department management with managers and members
- Superadmin capabilities for platform administration
- Invitation system for onboarding new members

### Dashboard & Analytics
- Real-time expense summaries and trends
- Interactive Recharts visualizations
- AI-powered expense analysis (OpenRouter integration)
- Customizable dashboard widgets

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack, React Server Components) |
| **UI** | React 19, Tailwind CSS v4, shadcn/ui, Radix Primitives |
| **Authentication** | Better Auth with Organizations plugin |
| **Database** | Supabase Postgres (server-side only) |
| **Storage** | Supabase Storage with signed URLs |
| **Validation** | Zod schemas for API and forms |
| **State Management** | nuqs (URL state), SWR (data fetching) |
| **AI** | OpenRouter API with Vercel AI SDK |
| **Icons** | Lucide React, Hugeicons |

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 9+ (recommended) or npm/yarn
- **Supabase** account (free tier works for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/expense-tracker.git
cd expense-tracker/next-mockup

# Install dependencies
pnpm install
```

### Environment Setup

Create `.env.local` in the `next-mockup` directory:

```env
# ===================
# Database
# ===================
# Supabase Postgres connection string (get from Supabase dashboard > Settings > Database)
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# ===================
# Better Auth
# ===================
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters

# Base URL for auth callbacks (no trailing slash)
BETTER_AUTH_URL=http://localhost:3000

# ===================
# Public URLs
# ===================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===================
# Supabase
# ===================
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# ===================
# Storage
# ===================
ATTACHMENTS_BUCKET=attachments

# ===================
# AI (Optional)
# ===================
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### Database Setup

```bash
# Apply Better Auth tables (user, session, organization, member, etc.)
pnpm db:migrate

# Apply application migrations
# Option 1: Via Supabase Dashboard SQL Editor
# Option 2: Via Supabase CLI
supabase db push
```

### Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
next-mockup/
├── app/                              # Next.js App Router
│   ├── (protected)/                  # Authenticated routes (requires session)
│   │   ├── dashboard/                # Main dashboard with analytics
│   │   ├── expenses/                 # Expense CRUD
│   │   │   └── recurring/            # Recurring expense templates
│   │   ├── inventory/                # Inventory management
│   │   │   └── items/[id]/           # Item detail with price history
│   │   ├── inbox/                    # Email integration
│   │   │   └── rules/                # Forwarding rules
│   │   ├── settings/                 # Organization settings
│   │   │   ├── categories/           # Expense categories
│   │   │   ├── departments/          # Department management
│   │   │   ├── email/                # Email accounts & categories
│   │   │   ├── members/              # Member management
│   │   │   └── organization/         # Org settings
│   │   └── ai/                       # AI assistant
│   ├── api/                          # API Route Handlers
│   │   ├── auth/[...all]/            # Better Auth catch-all
│   │   ├── orgs/[orgId]/             # Organization-scoped endpoints
│   │   │   ├── expenses/
│   │   │   ├── inventory/
│   │   │   ├── departments/
│   │   │   └── ...
│   │   └── super/                    # Superadmin endpoints
│   ├── auth/                         # Public auth pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   └── org/                          # Organization selection
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── email/                        # Email-related components
│   └── [feature]/                    # Feature-specific components
├── lib/
│   ├── auth.ts                       # Better Auth server config
│   ├── auth-client.ts                # Better Auth client
│   ├── supabase.ts                   # Supabase client
│   ├── permissions.ts                # Role & permission definitions
│   ├── errors.ts                     # API error handling
│   ├── server/                       # Server-only code
│   │   ├── auth-helpers.ts           # Session & org helpers
│   │   └── services/                 # Business logic layer
│   └── validations/                  # Zod schemas
├── docs/                             # Documentation
├── supabase/
│   └── migrations/                   # SQL migrations
└── public/                           # Static assets
```

---

## API Reference

All organization-scoped endpoints follow: `/api/orgs/:orgId/...`

### Authentication

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/sign-up/email` | Create account |
| `POST /api/auth/sign-in/email` | Sign in |
| `POST /api/auth/sign-out` | Sign out |
| `GET /api/auth/session` | Get current session |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orgs/:orgId/expenses` | List expenses (supports `?month=`, `?category=`) |
| `POST` | `/api/orgs/:orgId/expenses` | Create expense |
| `PATCH` | `/api/orgs/:orgId/expenses/:id` | Update expense |
| `DELETE` | `/api/orgs/:orgId/expenses/:id` | Delete expense |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orgs/:orgId/inventory/items` | List items |
| `POST` | `/api/orgs/:orgId/inventory/items` | Create item |
| `GET` | `/api/orgs/:orgId/inventory/items/:id/prices` | Get price history |
| `POST` | `/api/orgs/:orgId/inventory/items/:id/prices` | Add price entry |
| `GET` | `/api/orgs/:orgId/inventory/items/:id/price-at?date=` | Price at specific date |

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orgs/:orgId/departments` | List departments |
| `POST` | `/api/orgs/:orgId/departments` | Create department |
| `PATCH` | `/api/orgs/:orgId/departments/:id` | Update department |
| `DELETE` | `/api/orgs/:orgId/departments/:id` | Delete department |
| `GET` | `/api/orgs/:orgId/departments/:id/members` | List members |
| `POST` | `/api/orgs/:orgId/departments/:id/members` | Add member |
| `DELETE` | `/api/orgs/:orgId/departments/:id/members/:memberId` | Remove member |

---

## Roles & Permissions

| Role | Description | Expenses | Inventory | Members | Settings |
|------|-------------|----------|-----------|---------|----------|
| `owner` | Organization creator | Full | Full | Full | Full |
| `org_admin` | Administrator | Full | Full | Full | Full |
| `finance` | Financial operations | Full | Read | - | - |
| `inventory` | Inventory management | Read | Full | - | - |
| `viewer` | Read-only access | Read | Read | - | - |

Users with `superadmin` system role can access any organization.

---

## Database Schema

### Core Tables (Better Auth)

- `user` - User accounts
- `session` - Active sessions with `activeOrganizationId`
- `organization` - Tenant organizations
- `member` - Organization memberships with roles

### Application Tables

```sql
-- Expense tracking
expense_categories(id, org_id, name, is_active)
expenses(id, org_id, expense_date, category_id, amount, vendor, notes, ...)
recurring_expense_templates(id, org_id, name, category_id, frequency, ...)

-- Inventory (append-only price history)
inventory_items(id, org_id, sku, name, unit, is_active)
inventory_price_history(id, org_id, item_id, unit_price, vendor, effective_at, ...)

-- Departments
departments(id, org_id, name, description, color)
department_members(id, department_id, user_id, is_manager)

-- Email integration
email_integrations(id, org_id, provider, email_address, ...)
email_categories(id, org_id, name, keywords, sender_patterns)
email_forwarding_rules(id, org_id, category_id, notify_roles, notify_department_ids)
detected_emails(id, org_id, subject, sender_email, category_id, ...)
```

---

## Development

### Available Scripts

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm db:migrate   # Apply Better Auth migrations
pnpm db:generate  # Generate schema types
```

### Adding UI Components

```bash
# Add shadcn/ui components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add table
```

### Creating API Routes

```typescript
// app/api/orgs/[orgId]/example/route.ts
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { ApiError } from "@/lib/errors"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params
    const { org, session } = await requireOrgAccess(orgId)

    // All queries must include org.id filter
    const data = await fetchData(org.id)
    return Response.json({ data })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    return new ApiError("INTERNAL_ERROR").toResponse()
  }
}
```

---

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in project settings
3. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Environment Variables for Production

Ensure all `.env.local` variables are set in your hosting platform:
- Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to production domain
- Use production Supabase credentials
- Set a strong `BETTER_AUTH_SECRET`

---

## Documentation

Detailed documentation is in the `/docs` directory:

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, performance patterns |
| [AUTH_AND_ORGS.md](docs/AUTH_AND_ORGS.md) | Better Auth setup, roles, authorization |
| [DATABASE.md](docs/DATABASE.md) | Schema design, price history model |
| [API.md](docs/API.md) | Complete endpoint contracts |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | UI patterns, colors, components |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production hosting guide |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/new-feature`
3. Make your changes
4. Run linting: `pnpm lint`
5. Commit with conventional commits: `git commit -m 'feat: add new feature'`
6. Push and open a Pull Request

### Commit Convention

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

## License

Proprietary - All rights reserved.

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org) - React framework
- [Better Auth](https://better-auth.com) - Authentication
- [Supabase](https://supabase.com) - Database and storage
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling
