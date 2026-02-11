interface TriageInput {
  from?: string;
  subject?: string;
  body?: string;
  links?: string[];
  urls?: string[];
  attachments?: { name: string; size: number; mimeType?: string; type?: string }[];
  sender?: string;
  senderDisplayName?: string;
  replyTo?: string;
  platform?: string;
  messages?: { from?: string; body?: string; subject?: string; direction?: string; date?: string; timestamp?: string }[];
  draftTo?: string;
  draftSubject?: string;
  draftBody?: string;
  media?: { type: string; filename?: string; url?: string; caption?: string }[];
  senderVerified?: boolean;
  contactKnown?: boolean;
  knownSender?: boolean;
  previousCorrespondence?: boolean;
}

interface ToolRecommendation {
  tool: string;
  reason: string;
  priority: number;
  estimatedCost: string;
}

interface SkippedTool {
  tool: string;
  reason: string;
}

interface TriageResult {
  recommendedTools: ToolRecommendation[];
  skippedTools: SkippedTool[];
  totalEstimatedCost: string;
  summary: string;
}

export function triageMessage(input: TriageInput): TriageResult {
  const recommended: ToolRecommendation[] = [];
  const skipped: SkippedTool[] = [];
  let priority = 1;

  const isEmail = !!(input.from && input.subject && input.body) && !input.platform;
  const isNonEmailMessage = !!input.platform;
  const hasUrls = (input.urls && input.urls.length > 0) || (input.links && input.links.length > 0);
  const hasAttachments = !!(input.attachments && input.attachments.length > 0);
  const hasSender = !!(input.from || input.sender);
  const hasSenderDisplayName = !!(input.senderDisplayName || input.from);
  const isThread = !!(input.messages && input.messages.length >= 2);
  const hasDraft = !!(input.draftTo && input.draftBody);
  const hasMedia = !!(input.media && input.media.length > 0);

  if (isEmail) {
    recommended.push({
      tool: "check_email_safety",
      reason: "Email detected (from, subject, body provided) — analyze for phishing, social engineering, and threats",
      priority: priority++,
      estimatedCost: "$0.02",
    });
  } else if (isNonEmailMessage) {
    recommended.push({
      tool: "check_message_safety",
      reason: `${input.platform} message detected — analyze for platform-specific threats (smishing, scams, impersonation)`,
      priority: priority++,
      estimatedCost: "$0.02",
    });
  } else if (input.body && !hasDraft) {
    recommended.push({
      tool: "check_email_safety",
      reason: "Message body provided — analyze for threats. If this is from a non-email platform, re-submit with the 'platform' field for better results.",
      priority: priority++,
      estimatedCost: "$0.02",
    });
  }

  if (hasSender && hasSenderDisplayName) {
    const senderEmail = input.from || input.sender || "";
    const displayName = input.senderDisplayName || input.from || "";
    recommended.push({
      tool: "check_sender_reputation",
      reason: `Sender identified (${senderEmail}) — verify identity with live DNS DMARC and RDAP domain age checks`,
      priority: priority++,
      estimatedCost: "$0.02",
    });
  } else {
    skipped.push({ tool: "check_sender_reputation", reason: "No sender email/address provided" });
  }

  if (hasUrls) {
    const urlCount = (input.urls?.length || 0) + (input.links?.length || 0);
    recommended.push({
      tool: "check_url_safety",
      reason: `${urlCount} URL(s) found — check for phishing, malware, and spoofing`,
      priority: priority++,
      estimatedCost: "$0.02",
    });
  } else {
    skipped.push({ tool: "check_url_safety", reason: "No URLs or links provided" });
  }

  if (hasAttachments) {
    recommended.push({
      tool: "check_attachment_safety",
      reason: `${input.attachments!.length} attachment(s) found — assess for malware risk before opening`,
      priority: priority++,
      estimatedCost: "$0.02",
    });
  } else {
    skipped.push({ tool: "check_attachment_safety", reason: "No attachments provided" });
  }

  if (isThread) {
    recommended.push({
      tool: "analyze_email_thread",
      reason: `Thread with ${input.messages!.length} messages detected — analyze for escalating manipulation and scope creep`,
      priority: priority++,
      estimatedCost: "$0.02",
    });
  } else {
    skipped.push({ tool: "analyze_email_thread", reason: input.messages && input.messages.length === 1 ? "Only 1 message provided — thread analysis requires at least 2" : "No message thread provided" });
  }

  if (hasDraft) {
    recommended.push({
      tool: "check_response_safety",
      reason: "Draft reply detected — check for data leakage and unauthorized disclosure before sending",
      priority: priority++,
      estimatedCost: "$0.02",
    });
  } else {
    skipped.push({ tool: "check_response_safety", reason: "No draft reply provided (draftTo, draftBody)" });
  }

  if (!isEmail && !isNonEmailMessage && !input.body && !hasDraft) {
    if (!hasUrls && !hasAttachments && !hasSender) {
      skipped.push({ tool: "check_email_safety", reason: "No email content provided" });
      skipped.push({ tool: "check_message_safety", reason: "No platform message provided" });
    } else if (!isNonEmailMessage && !recommended.some(r => r.tool === "check_email_safety")) {
      skipped.push({ tool: "check_email_safety", reason: "No email body content provided" });
    }
    if (!isNonEmailMessage && !recommended.some(r => r.tool === "check_message_safety")) {
      skipped.push({ tool: "check_message_safety", reason: "No platform specified — use this tool for SMS, WhatsApp, Slack, Discord, etc." });
    }
  } else {
    if (!isEmail && !recommended.some(r => r.tool === "check_email_safety") && !recommended.some(r => r.tool === "check_message_safety")) {
      skipped.push({ tool: "check_email_safety", reason: "Not applicable for this content type" });
    }
    if (isEmail) {
      skipped.push({ tool: "check_message_safety", reason: "Email detected — use check_email_safety instead. Use check_message_safety for SMS, WhatsApp, Slack, Discord, etc." });
    }
    if (isNonEmailMessage) {
      skipped.push({ tool: "check_email_safety", reason: "Non-email platform detected — using check_message_safety instead" });
    }
  }

  const totalCost = recommended.length * 0.02;
  const toolNames = recommended.map(r => r.tool).join(", ");

  let summary: string;
  if (recommended.length === 0) {
    summary = "No security tools recommended — insufficient data provided. Include message content (from, subject, body for email or platform + sender + messages for other platforms), URLs, attachments, sender info, or a draft reply.";
  } else {
    summary = `${recommended.length} tool(s) recommended: ${toolNames}. Estimated total cost: $${totalCost.toFixed(2)}. Call each tool individually with the appropriate parameters.`;
  }

  return {
    recommendedTools: recommended,
    skippedTools: skipped,
    totalEstimatedCost: `$${totalCost.toFixed(2)}`,
    summary,
  };
}
