# Safe Message MCP Service

## Project Overview

Safe Message MCP is an email safety verification service designed for AI agents. It's part of an Anti-Deepfake/Agent Abuse suite that protects agents (and their owners) from phishing, social engineering, and manipulation attempts.

**Key Innovation:** Agents are first-class customers who can discover, register, and pay autonomously.

## Design

- **Theme:** Dark premium aesthetic matching LocationLedger.com
- **Colors:** Very dark backgrounds (#0f1012), white text, muted blue accent (hsl 200 70% 50%)
- **Font:** Inter, system-ui, sans-serif
- **Brand name:** "Safe Message" (with space)
- **Header:** Sticky, backdrop-blur, subtle bottom border
- **Footer:** Dark, minimal, with logo and tagline

## Quick Start

See `BUILD_PLAN.md` for the complete technical specification.

## Architecture

- **Backend:** Express.js on Node.js
- **Frontend:** React with Vite, TailwindCSS, shadcn/ui
- **Database:** PostgreSQL with Drizzle ORM
- **Payments:** Stripe (delegated model) + Skyfire KYAPay (autonomous model) + Crypto wallets (legacy)
- **AI:** Anthropic Claude for email analysis
- **Email:** Postmark for owner notifications

## Payment Models

1. **Delegated Model:** Owner sets up payment once via Stripe, agent operates autonomously
2. **Skyfire Pay-Per-Use:** Agent sends Skyfire PAY token via `skyfire-pay-id` header, no registration needed
3. **Autonomous Model:** Agent registers with own crypto wallet (legacy)

## MCP Remote Server

SafeMessage is a **Remote MCP Server** using the Streamable HTTP transport (MCP spec 2025).

- **Endpoint:** `POST /mcp` (JSON-RPC 2.0 over Streamable HTTP)
- **Protocol:** Model Context Protocol (Streamable HTTP transport)
- **SDK:** `@modelcontextprotocol/sdk`
- **Tool:** `check_email_safety` - analyzes emails for phishing, social engineering, prompt injection
- **Auth:** `skyfire-pay-id` header (Skyfire PAY token) or `Authorization: Bearer <token>`
- **Skyfire Listing:** Register as seller on Skyfire dashboard, agents discover via Skyfire directory

### Connecting as an MCP Client

```json
{
  "mcpServers": {
    "safemessage": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe.locationledger.com/mcp",
        "--header", "skyfire-pay-id: <SKYFIRE_PAY_TOKEN>"
      ]
    }
  }
}
```

## REST API Endpoints

- `GET /mcp/discover` - Service discovery for agents (REST)
- `POST /mcp/register/delegated` - Register with owner token
- `POST /mcp/register/autonomous` - Register with own wallet
- `POST /mcp/register/skyfire` - Register via Skyfire KYAPay token
- `POST /mcp/tools/check_email_safety` - Core email safety check (REST, accepts Bearer token or skyfire-pay-id header)

## Environment Variables

| Variable | Status |
|----------|--------|
| `ANTHROPIC_API_KEY` | ✅ Set |
| `POSTMARK_API` | ✅ Set |
| `STRIPE_SECRET_KEY` | ✅ Set |
| `STRIPE_PUBLISHABLE_KEY` | ✅ Set |
| `JWT_SECRET` | ✅ Set |
| `SESSION_SECRET` | ✅ Set |
| `SKYFIRE_API` | ✅ Set |
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

$0.01 per email check (both payment models)

## External Integrations

- **Anthropic Claude:** Email analysis
- **Stripe:** Payment processing (delegated model)
- **Skyfire:** Agent payment network (KYAPay protocol, PAY tokens, JWKS validation)
- **Postmark:** Email notifications (from support@locationledger.com)
- **MoltBook:** Referral agent posts

## MoltBook Referral Agents

We run OpenClaw agents that post about SafeMessage on MoltBook to drive organic agent adoption.
