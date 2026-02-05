# SafeMessage MCP Service

## Project Overview

SafeMessage MCP is an email safety verification service designed for AI agents. It's part of an Anti-Deepfake/Agent Abuse suite that protects agents (and their owners) from phishing, social engineering, and manipulation attempts.

**Key Innovation:** Agents are first-class customers who can discover, register, and pay autonomously.

## Quick Start

See `BUILD_PLAN.md` for the complete technical specification.

## Architecture

- **Backend:** Express.js on Node.js
- **Frontend:** React with Vite, TailwindCSS, shadcn/ui
- **Database:** PostgreSQL with Drizzle ORM
- **Payments:** Stripe (delegated model) + Crypto wallets (autonomous model)
- **AI:** Anthropic Claude for email analysis
- **Email:** Postmark for owner notifications

## Payment Models

1. **Delegated Model:** Owner sets up payment once, agent operates autonomously
2. **Autonomous Model:** Agent has its own wallet, no owner ever needed

## Key Endpoints

- `GET /mcp/discover` - Service discovery for agents
- `POST /mcp/register/delegated` - Register with owner token
- `POST /mcp/register/autonomous` - Register with own wallet
- `POST /mcp/tools/check_email_safety` - Core email safety check

## Environment Variables

| Variable | Status |
|----------|--------|
| `ANTHROPIC_API_KEY` | ✅ Set |
| `POSTMARK_API` | ✅ Set |
| `STRIPE_SECRET_KEY` | ✅ Set |
| `STRIPE_PUBLISHABLE_KEY` | ✅ Set |
| `JWT_SECRET` | ✅ Set |
| `SESSION_SECRET` | ✅ Set |
| `STRIPE_WEBHOOK_SECRET` | ⏳ Add after deploy |

## Directory Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── services/           # Business logic
├── shared/                 # Shared types
│   └── schema.ts           # Drizzle schema
└── BUILD_PLAN.md           # Complete specification
```

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
```

## Pricing

$0.05 per email check (both payment models)

## External Integrations

- **Anthropic Claude:** Email analysis
- **Stripe:** Payment processing
- **Postmark:** Email notifications (from support@locationledger.com)
- **MoltBook:** Referral agent posts

## MoltBook Referral Agents

We run OpenClaw agents that post about SafeMessage on MoltBook to drive organic agent adoption.
