## Problem
Small startup support teams waste valuable time and lose context by constantly switching between fragmented tools—such as separate inboxes, messaging apps, and external AI tools—leading to delayed response times and a disjointed customer experience.

## Solution
OmniDesk is a unified, AI-native helpdesk application that centralizes all customer emails and messages into a single collaborative workspace, streamlining workflows and empowering agents to resolve issues faster.

## Deployment model
- Multi-tenant SaaS: one shared application instance serving many customer workspaces, with data isolated per workspace (including each workspace's own knowledge base).
- Channels (v1): email only. A workspace connects its support inbox (e.g. Gmail/Outlook OAuth); OmniDesk ingests inbound mail as tickets and sends replies from that connected address.

## Ticket model
- **Statuses**: `open` → `resolved` → `closed`.
  - `open`: awaiting a reply (from AI or an agent), or awaiting the customer's response.
  - `resolved`: an answer was sent (by AI or an agent) and the issue is considered handled.
  - `closed`: terminal state, no further action expected.
  - Open question: does a customer reply to a `resolved` ticket reopen it automatically, and does it go straight to a human or can AI attempt it again?
- **Categories**: `general question`, `technical (account) question`, `order status`.
  - Category drives both AI routing (which KB slice to search) and the money/account safety carve-out below.
  - Open question: is category assigned by the AI classifier on ticket creation, and can an agent override it?

## AI response flow
1. An inbound email creates a ticket and is classified into one of the categories above.
2. The AI searches the workspace's knowledge base for a matching article.
   - **Match found** → AI drafts and sends a reply grounded in that article; ticket moves to `resolved`. The KB article used should be recorded on the ticket for traceability.
   - **No match found** → ticket stays `open` and is assigned to a representative, who has AI tools available (thread summary, reply suggestions) but sends manually.
3. **Safety carve-out**: tickets involving money or account actions (refunds, cancellations, account/password changes) are never auto-resolved by AI, regardless of KB match — they always route to a representative.
4. **Escape hatch**: at any point, a customer can request a human; this overrides an AI resolution and routes the ticket to a representative.

Open questions:
- Do AI-auto-resolved tickets need an audit/quality-review queue for agents to spot-check, given there's no human review before send?
- PII handling: does customer email content get redacted before being sent to the AI provider, and what's the data retention policy for that content?

## Knowledge base
- Dedicated KB per workspace: admins author/manage articles used to ground AI answers (not just raw ticket history).
- Needed for v1 AI response flow: article CRUD, and retrieval (e.g. vector search) to match incoming tickets to articles.
- Open question: can representatives contribute articles (e.g. promote a resolved ticket to a KB article), or is authoring admin-only?

## User roles
- The system deploys with a single admin account.
- The admin can create additional accounts for customer service representatives.
- Fine-grained permissions (what admins vs. representatives can each do) are left for later clarification.

## Features
- Unified Ticket Dashboard: A central control center where agents can view, filter, sort, and manage all incoming customer inquiries in real time.

- Ticket Detail View: A dedicated workspace for individual threads containing the full customer history, timeline of events, and communication logs in a single window.

- AI Conversation Summaries: Automated summaries generated for representatives upon opening a long ticket thread, giving them the core context instantly without reading through dozens of back-and-forth messages.

- AI First-Response Resolution: For inbound tickets, the AI attempts to answer directly using the workspace's knowledge base before any human is involved (see AI response flow above). Only tickets without a KB match, or involving money/account actions, reach a representative.

- AI-Generated Reply Suggestions: For tickets assigned to a representative, smart drafting tools suggest context-aware, empathetic replies that the representative reviews and sends manually.

- Knowledge Base Management: Admin tooling to create and maintain the articles the AI uses to ground its answers.

- Role-Based User Management: The admin invites representatives and manages workspace accounts; permission granularity to be defined later.

## Out of scope (v1)
- Channels beyond email (chat widget, SMS/WhatsApp, Slack, social).
- Fully autonomous handling of money/account-affecting tickets.
- Customer-facing self-service portal.
- SLA timers/automation and advanced routing rules (round-robin, load balancing).
- Fine-grained permission tiers beyond admin vs. representative.
