# Agent Safe - New Tool Concepts Research

## Test Date: February 11, 2026
## Model: Claude Haiku 4.5 (claude-haiku-4-5-20251001)
## Current Tool: check_email_safety ($0.02/call)

---

## Summary

All 5 tool concepts were tested against the Claude Haiku 4.5 API with realistic threat scenarios. Every tool produced valid structured JSON with high-quality, accurate analysis on the first attempt.

### Cost Basis
- Claude Haiku 4.5: $1.00/M input tokens, $5.00/M output tokens
- Claude cost per call: $0.004 - $0.006
- Recommended price: $0.02 per call (same as check_email_safety)
- Margin at $0.02: approximately 3-5x

---

## Tool 1: check_url_safety

**Purpose:** Analyzes URLs for phishing, malware, typosquatting, redirect abuse, and injection patterns before an AI agent visits or clicks them.

**Use Case:** Agent receives an email with links. Before clicking any, it passes them to this tool for a safety verdict.

**Parameters:**
- `urls` (required) - Array of URLs to analyze
- `context` (optional) - Where the URLs were found (email, chat, document)
- `agentCapabilities` (optional) - What the agent can do (browse, download, execute)

**Response Format:**
```json
{
  "urls": [
    {
      "url": "<the URL>",
      "verdict": "safe | suspicious | dangerous",
      "riskScore": 0.0-1.0,
      "threats": [{ "type": "...", "description": "...", "severity": "..." }],
      "recommendation": "safe_to_visit | do_not_visit | visit_with_caution",
      "explanation": "..."
    }
  ],
  "overallVerdict": "safe | suspicious | dangerous",
  "overallRiskScore": 0.0-1.0
}
```

**Threat Categories Detected:**
1. PHISHING - Domain spoofing, typosquatting, lookalike domains
2. MALWARE - Known malicious patterns, suspicious file downloads
3. DATA_EXFILTRATION - URLs designed to capture/redirect sensitive data
4. REDIRECT_ABUSE - Open redirect exploitation
5. COMMAND_INJECTION - Path traversal, SQL injection in URLs
6. TRACKING - Excessive tracking parameters or fingerprinting

**Test Results:**
- Status: PASS (valid JSON)
- Input tokens: 473
- Output tokens: 802
- Claude cost: $0.004483
- Latency: 6,890ms
- Correctly flagged: spoofed Microsoft domain, path traversal attack, safe Google Docs link

---

## Tool 2: check_response_safety

**Purpose:** Reviews an AI agent's draft email reply BEFORE it sends it. Catches data leaks, over-sharing sensitive info, compliance violations, and social engineering compliance.

**Use Case:** Agent drafts a reply to an email. Before sending, it passes the draft to this tool to verify it's safe to send.

**Parameters:**
- `draftTo` (required) - Recipient email
- `draftSubject` (required) - Subject line
- `draftBody` (required) - The draft response body
- `originalFrom` (optional) - Who sent the original email
- `originalSubject` (optional) - Original email subject
- `originalBody` (optional) - Original email body for context

**Response Format:**
```json
{
  "verdict": "safe_to_send | review_required | do_not_send",
  "riskScore": 0.0-1.0,
  "confidence": 0.0-1.0,
  "threats": [
    {
      "type": "...",
      "description": "...",
      "severity": "...",
      "dataAtRisk": "what specific data is at risk"
    }
  ],
  "recommendation": "what the agent should do instead",
  "explanation": "2-3 sentence summary",
  "suggestedRevisions": ["list of specific changes to make the response safer"]
}
```

**Threat Categories Detected:**
1. DATA_LEAKAGE - Sharing sensitive financial, personal, or proprietary info
2. COMPLIANCE_RISK - Violating data protection regulations (PII, financial data)
3. SOCIAL_ENGINEERING_COMPLIANCE - Responding to a manipulation attempt
4. UNAUTHORIZED_ACTION - Performing actions outside normal authorization
5. IMPERSONATION_RISK - Response could enable downstream fraud
6. EXCESSIVE_DISCLOSURE - Sharing more information than necessary

**Test Results:**
- Status: PASS (valid JSON)
- Input tokens: 531
- Output tokens: 848
- Claude cost: $0.004771
- Latency: 16,061ms
- Correctly caught: SSN sharing, wire transfer fraud compliance, unauthorized disclosure (6 threats total)

---

## Tool 3: analyze_email_thread

**Purpose:** Analyzes a full multi-message email conversation for escalating manipulation patterns. Detects social engineering that builds trust gradually then exploits it.

**Use Case:** Agent has been in an ongoing email conversation. Before responding to the latest message, it submits the full thread for pattern analysis.

**Parameters:**
- `messages` (required) - Array of messages in chronological order, each with `from`, `subject`, `body`, `date`
- `agentCapabilities` (optional) - What the agent can do

**Response Format:**
```json
{
  "verdict": "safe | suspicious | dangerous",
  "riskScore": 0.0-1.0,
  "confidence": 0.0-1.0,
  "manipulationPatterns": [
    {
      "type": "...",
      "description": "how the pattern manifests across the thread",
      "severity": "...",
      "evidenceMessages": [1, 2, 3]
    }
  ],
  "threadProgression": "summary of how the conversation evolved",
  "recommendation": "continue_conversation | proceed_with_caution | disengage",
  "explanation": "2-3 sentence summary",
  "safeActions": ["..."],
  "unsafeActions": ["..."]
}
```

**Pattern Categories Detected:**
1. ESCALATION_PATTERN - Increasing urgency, pressure, or authority claims over time
2. SCOPE_CREEP - Requests gradually expanding from reasonable to suspicious
3. TRUST_BUILDING - Initial rapport-building followed by exploitation
4. AUTHORITY_ESCALATION - Progressively invoking higher authority figures
5. DEADLINE_MANUFACTURING - Creating artificial time pressure
6. INFORMATION_HARVESTING - Systematic extraction of sensitive data across messages

**Test Results:**
- Status: PASS (valid JSON)
- Input tokens: 663
- Output tokens: 985
- Claude cost: $0.005588
- Latency: 10,521ms
- Correctly detected: 6 manipulation patterns including trust-to-exploitation progression and deadline manufacturing

---

## Tool 4: check_attachment_safety

**Purpose:** Assesses email attachment risk based on metadata (filename, MIME type, file size, sender) BEFORE an AI agent opens or downloads them.

**Use Case:** Agent receives an email with attachments. Before downloading/opening, it passes the attachment metadata to this tool.

**Parameters:**
- `attachments` (required) - Array of attachment metadata: `name`, `size` (bytes), `mimeType`, `from`
- `context` (optional) - Whether email is from known/unknown sender

**Response Format:**
```json
{
  "attachments": [
    {
      "filename": "...",
      "verdict": "safe | suspicious | dangerous",
      "riskScore": 0.0-1.0,
      "threats": [{ "type": "...", "description": "...", "severity": "..." }],
      "recommendation": "safe_to_open | do_not_open | open_with_caution",
      "explanation": "..."
    }
  ],
  "overallVerdict": "safe | suspicious | dangerous",
  "overallRiskScore": 0.0-1.0,
  "safeToProcess": ["filenames safe to process"],
  "doNotProcess": ["filenames that should NOT be processed"]
}
```

**Threat Categories Detected:**
1. EXECUTABLE_MASQUERADE - File pretending to be one type but is executable
2. DOUBLE_EXTENSION - Using multiple extensions to hide true file type
3. MACRO_RISK - Document formats known to contain macros
4. ARCHIVE_RISK - Compressed files that could contain malware
5. SIZE_ANOMALY - File size inconsistent with claimed type
6. MIME_MISMATCH - MIME type doesn't match file extension

**Test Results:**
- Status: PASS (valid JSON)
- Input tokens: 607
- Output tokens: 1,019
- Claude cost: $0.005702
- Latency: 8,562ms
- Correctly caught: double extension (.pdf.exe), MIME mismatch (.jpg.js with JS MIME type), archive risk, macro risk

---

## Tool 5: check_sender_reputation

**Purpose:** Evaluates whether an email sender is who they claim to be. Analyzes identity signals, authentication results, and BEC (Business Email Compromise) indicators.

**Use Case:** Agent receives an email claiming to be from an authority figure. Before acting on it, it checks the sender's trustworthiness.

**Parameters:**
- `email` (required) - Sender's email address
- `displayName` (required) - Sender's display name
- `replyTo` (optional) - Reply-To address if different
- `spf` (optional) - SPF result: pass/fail/none
- `dkim` (optional) - DKIM result: pass/fail/none
- `previousInteractions` (optional) - Number of prior interactions
- `claimsToBeRole` (optional) - What role/title sender claims
- `emailSubject` (optional) - Subject line for context
- `emailSnippet` (optional) - Brief body snippet for context

**Response Format:**
```json
{
  "senderVerdict": "trusted | unverified | suspicious | likely_fraudulent",
  "trustScore": 0.0-1.0,
  "confidence": 0.0-1.0,
  "identityIssues": [
    {
      "type": "...",
      "description": "...",
      "severity": "..."
    }
  ],
  "becProbability": 0.0-1.0,
  "recommendation": "trust_sender | verify_identity | do_not_trust",
  "explanation": "2-3 sentence summary",
  "verificationSteps": ["steps to verify this sender's identity"]
}
```

**Issue Categories Detected:**
1. DOMAIN_SPOOFING - Email domain doesn't match claimed organization
2. REPLY_TO_MISMATCH - Reply-To differs from sender address
3. DISPLAY_NAME_FRAUD - Display name crafted to impersonate authority
4. AUTHENTICATION_FAILURE - SPF/DKIM/DMARC failures
5. BEC_INDICATORS - Business Email Compromise patterns
6. FIRST_CONTACT_RISK - No prior relationship with sender
7. AUTHORITY_CLAIM - Claiming executive status to pressure action

**Test Results:**
- Status: PASS (valid JSON)
- Input tokens: 543
- Output tokens: 655
- Claude cost: $0.003818
- Latency: 6,257ms
- Correctly identified: 93% BEC probability, 6 identity issues, "likely_fraudulent" verdict


Dev Question: Can we integrate DMARC checks into this somehow? LIke, could we combine CLaude with another API here that actually does some kind of additional ayer of check? 

---

## Pricing Recommendation

All tools should be priced at **$0.02 per call** to maintain consistency with `check_email_safety`.

| Tool | Claude Cost | Price | Margin |
|------|-----------|-------|--------|
| check_email_safety (existing) | ~$0.004 | $0.02 | ~5x |
| check_url_safety | ~$0.0045 | $0.02 | ~4.4x |
| check_response_safety | ~$0.0048 | $0.02 | ~4.2x |
| analyze_email_thread | ~$0.0056 | $0.02 | ~3.6x |
| check_attachment_safety | ~$0.0057 | $0.02 | ~3.5x |
| check_sender_reputation | ~$0.0038 | $0.02 | ~5.3x |

Note: Thread analysis uses more tokens because it processes multiple messages. Real-world threads with more messages will use proportionally more tokens, but should still stay within the $0.02 margin for typical 3-5 message threads.

Dev Question: Ok, we need to be smart about this. If a super long thread comes in, it needs to be charged according to size. We need to charge $.02 per call but define what a 'call' can include in terms of length. SO one large message could end up being multiple calls. 

---

## Complete Tool Suite (6 tools at $0.02 each)

1. **check_email_safety** - Analyze the email itself for threats
2. **check_url_safety** - Analyze links found in emails before clicking
3. **check_response_safety** - Check the agent's reply before sending
4. **analyze_email_thread** - Detect manipulation across a conversation
5. **check_attachment_safety** - Assess attachment risk before opening
6. **check_sender_reputation** - Verify the sender's identity and trustworthiness
