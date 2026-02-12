# Agent Safe — How It Works

## Overview

Agent Safe is a Remote MCP (Model Context Protocol) Server that provides 9 message security tools (7 paid + 2 free: triage + feedback) to protect AI agents from phishing, social engineering, BEC, malware, and manipulation. Agents connect via MCP Streamable HTTP, call the free triage tool to figure out which security checks to run, then call the recommended paid tools and receive structured safety verdicts.

This document explains how the system works under the hood — how it uses Claude for AI-powered analysis, how it connects to external threat intelligence APIs, and how it learns and improves over time.

---

## The 9 Tools (7 Paid + 2 Free)

| Tool | What It Does | Cost |
|------|-------------|------|
| `assess_message` | Free triage — examines the input and recommends which paid tools to call | Free |
| `check_email_safety` | Analyzes emails for phishing, social engineering, scams, prompt injection | $0.02 |
| `check_url_safety` | Checks URLs for phishing, malware, spoofing, tracking | $0.02 |
| `check_response_safety` | Reviews draft replies for data leakage before sending | $0.02 |
| `analyze_email_thread` | Detects escalating manipulation across conversation threads | $0.02 |
| `check_attachment_safety` | Assesses malware risk from filenames, MIME types, and file sizes | $0.02 |
| `check_sender_reputation` | Verifies sender identity with live DNS and domain intelligence | $0.02 |
| `check_message_safety` | Analyzes SMS, WhatsApp, Slack, Discord, and other platform messages | $0.02 |
| `submit_feedback` | Free feedback tool — agents report whether analysis results were helpful, inaccurate, or missed a threat | Free |

---

## How Claude Powers the Analysis

Every paid tool uses **Claude (Haiku 4.5)** as the core analysis engine. Here's the flow:

### 1. Pattern Matching First (Fast, Free)
Before calling Claude, each analyzer runs a **quick pattern check** — a set of hardcoded rules that catch obvious red flags instantly. For example:
- Subject starts with "Re:" but no prior conversation exists → FAKE_REPLY_THREAD
- Very short email body + attachment from unknown sender → LURE_EMAIL
- PDF attachment + "review" / "sign" language → credential harvesting pattern
- Urgency language ("immediately", "act now", "final notice") → URGENCY_MANIPULATION

These pattern checks run in microseconds and catch the most common scam tactics without spending any API tokens.

### 2. Historical Intelligence Injection
Before Claude sees the message, the system queries its own database for historical context about the sender's domain:
- Has this domain been checked before? How many times?
- Did VirusTotal or Google Web Risk flag the domain's infrastructure?
- What scam patterns have been observed from this domain previously?

This historical context is injected into Claude's prompt so it can make better-informed decisions. For example, if a domain has been flagged by VirusTotal as hosting malware, Claude sees that and factors it into its analysis.

### 3. Claude Analyzes with Full Context
Claude receives a carefully constructed prompt containing:
- The message content (email, URL, thread, etc.)
- Pattern match results from step 1
- Historical intelligence from the database
- External threat intelligence (VirusTotal, Google Web Risk, DMARC, domain age)
- Specific scoring guidance and threat categories to evaluate

Claude returns a structured JSON response with a verdict (safe/suspicious/dangerous), risk score (0.0–1.0), detected threats, and actionable recommendations.

### 4. Post-Processing and Enrichment
After Claude responds:
- Pattern match threats are merged with Claude's analysis (deduped by type)
- If pattern matching found critical threats, the verdict is escalated regardless of Claude's assessment
- Results from VirusTotal and Google Web Risk override Claude if they indicate confirmed malware
- The final structured verdict is returned to the calling agent

---

## Connected External APIs

### VirusTotal (70+ Security Engines)
- **What it does:** Checks domains and URLs against 70+ antivirus and security engines
- **How we use it:** For `check_url_safety` and `check_sender_reputation`, we query VirusTotal to see if any security vendors have flagged the domain or URL as malicious
- **Graceful degradation:** If VirusTotal is down or times out (5-second limit), the system continues with Claude analysis alone. The prompt receives "VirusTotal data unavailable" and Claude works with what it has

### Google Web Risk
- **What it does:** Google's commercial threat intelligence database, covering malware, phishing, and unwanted software
- **How we use it:** Checked alongside VirusTotal for URL and domain reputation. If Google flags a URL, the verdict is automatically escalated to "dangerous" with a 0.98+ risk score
- **Graceful degradation:** Same as VirusTotal — if Google's API fails, the system proceeds without it. No crashes, no failures

### DNS DMARC Lookup
- **What it does:** Checks if a sender's domain has published a DMARC email authentication policy
- **How we use it:** Domains without DMARC are more susceptible to email spoofing. This is a free, infrastructure-level signal used in `check_sender_reputation`
- **Graceful degradation:** DNS lookups have a 3-second timeout. If they fail, the system reports "No DMARC record" and continues

### RDAP Domain Age Lookup
- **What it does:** Checks when a domain was registered and who the registrar is
- **How we use it:** Brand-new domains (less than 90 days old) are a red flag — scammers frequently register disposable domains. Used in `check_sender_reputation`
- **Graceful degradation:** 3-second timeout with fallback to "Unknown" age

### Key Design Principle: No Single Point of Failure
Every external API call is wrapped in:
1. A **timeout** (3–5 seconds) so a slow API can't hang the entire analysis
2. A **try/catch** so errors are swallowed, not propagated
3. A **fallback value** so Claude always receives a complete prompt, even if some intelligence is "unavailable"

If every external API goes down simultaneously, Claude still runs its full analysis using the message content, pattern matching, and any historical intelligence from the database. The service never fails.

---

## The Self-Learning Threat Intelligence System

This is what makes Agent Safe get smarter over time. The system has three database tables that form a learning loop:

### 1. Threat Intel Cache (`threat_intel` table)
- **Purpose:** Read-through cache for VirusTotal and Google Web Risk results
- **How it learns:** Every time an external API is queried, the result is stored with a 24-hour TTL
- **How it saves money:** Before calling an external API, the system checks this cache first. After 3+ cached hits for the same domain/URL, external API calls are **skipped entirely** — the stored result is used instead
- **Impact:** A domain checked 10 times only generates 3 external API calls. The other 7 are served from the database instantly

### 2. Scam Patterns (`scam_patterns` table)
- **Purpose:** Records every high-severity scam pattern detected by Claude
- **What's stored:** Pattern type (FAKE_REPLY_THREAD, LURE_EMAIL, PHISHING, etc.), sender domain, verdict, risk score, evidence, and a fingerprint of the email subject
- **How it learns:** When the same scam pattern appears repeatedly from a domain, it builds a history. Future analyses see "Previous scam pattern types observed from this domain: FAKE_REPLY_THREAD, LURE_EMAIL" in their context
- **Impact:** Claude gets progressively better at detecting repeat offenders and emerging scam campaigns

### 3. Domain Reputation (`domain_reputation` table)
- **Purpose:** Aggregate trust score per domain, updated only by infrastructure-level signals
- **What's tracked:** Total checks, DMARC status, domain age, VirusTotal malicious count, Google Web Risk flag count
- **Key distinction:** Domain reputation is based on **infrastructure signals only** (VT flags, Web Risk flags, DMARC, domain age) — NOT on whether scam emails were sent from the domain. This prevents legitimate domains from being unfairly penalized when scammers spoof or hijack them
- **Impact:** Truly malicious domains (registered by threat actors, flagged by security vendors) accumulate negative reputation, while legitimate domains that get spoofed maintain their clean reputation

### The Learning Loop in Action

Here's what happens when `check_email_safety` is called:

```
1. Agent calls check_email_safety with an email
2. System extracts sender domain
3. Database is queried for:
   - Stored VirusTotal/Web Risk results for this domain
   - Previous scam patterns observed from this domain
   - Domain reputation (trust score, infrastructure signals)
4. If VT/WR results exist with 3+ hits → skip external API calls
5. Historical context is injected into Claude's prompt
6. Claude analyzes with full context → returns verdict
7. High-severity threats are recorded in scam_patterns table
8. VirusTotal/Web Risk results are cached in threat_intel table
9. Next check on this domain starts at step 3 with MORE intelligence
```

Each cycle through this loop makes the system:
- **Faster** (fewer external API calls)
- **Cheaper** (less API spend on repeated lookups)
- **Smarter** (richer historical context for Claude)

---

## Domain Spoofing Awareness

A critical design decision: **the system distinguishes between a malicious domain and a legitimate domain being abused.**

Scammers frequently spoof (forge the From header) or hijack (compromise an account on) legitimate business domains. A phishing email sent "from" `ceo@legitimatebusiness.com` means the email is dangerous, but the domain itself may be perfectly legitimate — the domain owner is a victim too.

Agent Safe handles this by:
- **Email content analysis** (`check_email_safety`): Detects the scam based on content patterns, but does NOT penalize the sender's domain reputation
- **Sender reputation analysis** (`check_sender_reputation`): Updates domain reputation based ONLY on infrastructure signals (VirusTotal flags, Google Web Risk flags, DMARC status, domain age)
- **Historical context prompts** tell Claude explicitly: "Scam emails have been observed FROM this domain, but the domain infrastructure itself appears clean. This likely indicates spoofing or account compromise — NOT that the domain itself is malicious."

This prevents a feedback loop where legitimate domains get unfairly flagged as dangerous simply because scammers used them.

---

## How to Further Improve Agent Safe Into a World-Class MCP Security Server

### 1. Real-Time Email Header Analysis
Currently, the system analyzes the email body, subject, and sender. Adding full email header parsing would enable:
- **SPF/DKIM verification results** — confirm whether the email actually passed authentication, not just whether the domain has DMARC published
- **Received chain analysis** — trace the actual path the email took through mail servers to detect spoofed origins
- **X-header anomaly detection** — identify bulk mailers, marketing platforms, or suspicious relay servers
- This would close the gap between "this domain has DMARC" and "this specific email actually passed DMARC"

### 2. Collaborative Threat Intelligence Network
Build a cross-agent learning network:
- **Anonymized threat sharing** — when Agent A detects a new phishing campaign, the pattern is available to Agent B immediately
- **Global scam fingerprint database** — hash email subjects, body templates, and attachment names to detect mass campaigns across all connected agents
- **Reputation federation** — aggregate trust signals across all agents using the service, not just individual agent history
- This transforms Agent Safe from a single-agent tool into a collective defense system where every agent's detection improves the network

### 3. Attachment Content Analysis
Currently, `check_attachment_safety` analyzes filenames, MIME types, and file sizes. To become world-class:
- **PDF content extraction** — parse PDFs to detect embedded links, JavaScript, form fields (credential harvesting), and QR codes
- **Document macro detection** — identify macros in Office documents without executing them
- **Image analysis** — detect QR codes in images that redirect to phishing sites (a rapidly growing attack vector)
- **Sandbox integration** — submit suspicious attachments to a sandboxed environment and analyze behavior

### 4. Conversation Memory Across Tool Calls
Currently, each tool call is stateless. Adding conversation memory would enable:
- **Cross-tool correlation** — if `check_sender_reputation` flags a sender as suspicious and then `check_email_safety` analyzes their email, the email analysis should automatically inherit the sender's risk context
- **Session-based threat tracking** — if an agent is processing a batch of emails, patterns across the batch (same sender, similar subjects, coordinated attack) should be detected
- **Escalation chains** — if three emails from different senders all link to the same phishing URL, the system should recognize this as a coordinated campaign

### 5. Agent Behavior Anomaly Detection
Protect agents from themselves:
- **Unusual action patterns** — if an agent suddenly starts approving wire transfers or sharing credentials after receiving an email, flag this as potential compromise
- **Scope drift monitoring** — detect when an email conversation gradually expands the agent's actions beyond its original mandate
- **Rate limiting intelligence** — if an agent is making rapid-fire security checks, it might be under automated attack

### 6. Real-Time Phishing URL Detonation
Go beyond reputation checks:
- **Headless browser rendering** — visit suspicious URLs in a sandboxed browser to capture the actual page content, screenshots, and redirect chains
- **Visual similarity detection** — compare rendered pages against known login pages (Google, Microsoft, banks) to detect pixel-perfect phishing clones
- **JavaScript analysis** — detect credential-harvesting scripts, keyloggers, and crypto-mining code on landing pages
- **Redirect chain unwinding** — follow URL shorteners and redirects to reveal the final destination

### 7. Multi-Language and Regional Scam Detection
Expand beyond English-centric patterns:
- **Multilingual scam templates** — detect phishing patterns in Spanish, Chinese, Arabic, Portuguese, and other languages
- **Regional scam awareness** — different regions have different scam patterns (romance scams, government impersonation, mobile payment fraud)
- **Character set analysis** — detect homograph attacks using Cyrillic, Greek, or other Unicode characters that look like Latin letters

### 8. Webhook and Proactive Alerting
Move from reactive to proactive:
- **Threat feed subscriptions** — when a domain that an agent previously interacted with gets flagged by VirusTotal, proactively notify the agent
- **Campaign tracking** — when a new phishing campaign is detected, push alerts to all agents who might be targeted
- **Retroactive re-scoring** — when new intelligence arrives about a previously-analyzed email, update the verdict and notify the agent

### 9. Compliance and Audit Trail
For enterprise adoption:
- **Full audit logging** — every tool call, verdict, and recommendation stored with timestamps for compliance review
- **Verdict explanation reports** — generate human-readable security reports that explain why a message was flagged
- **Policy customization** — allow organizations to set custom thresholds, approved sender lists, and domain allowlists
- **GDPR/privacy controls** — data retention policies, right to deletion, and anonymization of stored intelligence

### 10. MCP Resource and Prompt Integration
Leverage MCP protocol features beyond tools:
- **Resources** — expose threat intelligence feeds, domain reputation lookups, and scam pattern databases as MCP resources that agents can query on demand
- **Prompts** — provide pre-built security prompts that agents can use to frame their own analysis ("Analyze this message for BEC indicators using the following checklist...")
- **Sampling** — use MCP sampling to let the agent's own LLM participate in threat assessment, combining Agent Safe's specialized intelligence with the agent's broader context
