import { useSEO } from "@/lib/seo";
import { GlobalFooter } from "@/components/global-footer";
import { SiteHeader } from "@/components/site-header";

export default function Terms() {
  useSEO({
    title: "Terms of Service - Agent Safe | Liability & Usage Terms",
    description: "Terms of Service for Agent Safe 7-tool message security suite. Covers all tools including email, URL, attachment, sender, thread, response, and cross-platform message analysis. Includes liability disclaimers and usage terms.",
    path: "/terms",
  });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="container mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }} data-testid="text-terms-title">
          Terms of Service
        </h1>
        <p className="text-muted-foreground text-sm mb-12">Last updated: February 11, 2026</p>

        <div className="space-y-10 text-foreground/80 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Service Description</h2>
            <p>
              Agent Safe ("Service") is a Remote MCP (Model Context Protocol) Server operated by Alibi Ledger, LLC ("Company," "we," "us") that provides a 7-tool message security suite for AI agents. The Service includes the following tools: check_email_safety (email threat analysis), check_url_safety (URL analysis), check_response_safety (draft reply checking), analyze_email_thread (conversation thread analysis), check_attachment_safety (attachment risk assessment), check_sender_reputation (sender identity verification with live DNS DMARC and RDAP domain age checks), and check_message_safety (non-email message platform analysis). All tools provide advisory analysis powered by AI and return structured safety assessments.
            </p>
            <p className="mt-3">
              The Service is an advisory tool only. All analysis results are informational guidance — not a definitive security service. The Service does not guarantee detection of all threats, and its verdicts should be treated as one input among many in an overall security strategy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Acceptance of Terms</h2>
            <p>
              By connecting to or using the Agent Safe MCP Server, whether directly or through an AI agent acting on your behalf, you agree to be bound by these Terms of Service. If you are using the Service through an AI agent, the agent's owner or operator is responsible for compliance with these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Payment and Pricing</h2>
            <p className="mb-3">
              The Service charges $0.02 USD per tool call across all 7 tools. Payment is processed through the Skyfire Network using PAY tokens. By submitting a request with a valid Skyfire PAY token, you authorize the charge for that request.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>All charges are final and non-refundable once the analysis has been performed.</li>
              <li>Pricing may change with 30 days' notice posted on this page.</li>
              <li>Failed requests due to invalid payment tokens are not charged.</li>
              <li>We reserve the right to reject requests with insufficient or invalid payment credentials.</li>
              <li>Thread analysis (analyze_email_thread) uses unit-based billing for large inputs. 1 unit = up to 4,000 tokens ($0.02 per unit). Most threads cost a single unit; unusually large threads may require multiple units with cost quoted before charging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use the Service to process content that violates any applicable law or regulation.</li>
              <li>Attempt to reverse-engineer, decompile, or extract the analysis models or algorithms.</li>
              <li>Send excessive requests designed to degrade Service performance (rate abuse).</li>
              <li>Use the Service output as the sole basis for automated actions that could cause harm (e.g., auto-deleting emails without human review).</li>
              <li>Misrepresent the Service's analysis results or present them as your own product without attribution.</li>
              <li>Use the Service solely for message security analysis purposes. The tools are designed for evaluating emails, non-email messages, URLs, attachments, sender identities, draft replies, and message threads — not for any other content analysis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Service Availability and Limitations</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>The Service is provided on an "as available" basis. We target high availability but do not guarantee uninterrupted service.</li>
              <li>Analysis results across all 7 tools are advisory only. The Service uses AI to assess security risks and may produce false positives (flagging safe content as dangerous) or false negatives (missing actual threats). No tool in the suite provides a guarantee of threat detection.</li>
              <li>The Service does not store, retain, or log the content of emails submitted for analysis beyond the duration needed to process the request.</li>
              <li>We reserve the right to implement rate limits to ensure fair usage across all clients.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Data Privacy</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Email content submitted for analysis is processed in real-time and not permanently stored.</li>
              <li>We may log metadata (timestamps, token identifiers, risk scores) for billing and service improvement.</li>
              <li>We do not sell or share submitted email content with third parties.</li>
              <li>Analysis is performed using third-party AI providers. Email content, URLs, attachment metadata, sender information, and draft replies submitted for analysis are processed by our AI provider's systems. Their data processing terms also apply.</li>
              <li>The check_sender_reputation tool performs live DNS queries and RDAP domain lookups using publicly available infrastructure data. No private user data is shared in these lookups.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Intellectual Property</h2>
            <p>
              The Service, its analysis models, scoring systems, and all associated technology are the intellectual property of Alibi Ledger, LLC. You retain all rights to the email content you submit. Analysis results generated by the Service may be used freely by the requesting party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Disclaimer of Warranties and Accuracy</h2>
            <p className="mb-3 uppercase font-semibold">
              The Service is provided "as is" and "as available" without warranties of any kind, whether express, implied, or statutory. Alibi Ledger, LLC expressly disclaims all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="mb-3">
              The Service is an intermediary advisory tool that provides best-effort analysis of email content. It is not a substitute for professional security review or human judgment. You expressly acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>The Service may fail to identify some malicious, fraudulent, or manipulative emails (false negatives). Alibi Ledger, LLC is not responsible for any email threats that the Service does not detect.</li>
              <li>The Service may incorrectly flag legitimate emails as threats (false positives). Alibi Ledger, LLC is not responsible for any consequences arising from such misidentification.</li>
              <li>The Service provides informational analysis only. Any actions taken by you, your AI agent, or any automated system based on the Service's output are your sole responsibility.</li>
              <li>If your AI agent acts on, ignores, or misinterprets the Service's analysis in a way that causes harm, loss, or damage, Alibi Ledger, LLC bears no liability for those actions or their consequences.</li>
              <li>The Service does not guarantee protection against any specific type of threat, and its analysis should be considered one factor among many in a message security strategy.</li>
              <li>Each tool in the suite (check_email_safety, check_url_safety, check_response_safety, analyze_email_thread, check_attachment_safety, check_sender_reputation, check_message_safety) provides advisory analysis that may contain errors, omissions, or inaccuracies.</li>
              <li>The check_sender_reputation tool includes live DNS DMARC and RDAP domain age data. While this data comes from authoritative sources, it may be incomplete, outdated, or unavailable for some domains. The presence or absence of DMARC records or domain registration data does not constitute a definitive judgment of sender legitimacy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">
              To the maximum extent permitted by applicable law, Alibi Ledger, LLC, its officers, directors, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mb-3">
              <li>Loss of data, revenue, or profits arising from undetected email threats.</li>
              <li>Damages resulting from actions taken by AI agents or automated systems based on the Service's analysis.</li>
              <li>Harm caused by phishing, social engineering, or other message-based attacks that the Service failed to identify.</li>
              <li>Any consequences arising from reliance on the Service's safety verdicts, risk scores, or recommendations.</li>
              <li>Consequences arising from reliance on any of the 7 tools' analysis, including but not limited to email safety verdicts, URL risk scores, attachment safety assessments, sender reputation evaluations, thread manipulation detection, or draft reply recommendations.</li>
            </ul>
            <p>
              Our total aggregate liability for any and all claims related to the Service shall not exceed the lesser of (a) the total amount paid by you to us in the 30 calendar days immediately preceding the event giving rise to the claim, or (b) one US dollar ($1.00).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Agent-Specific Terms and Acceptance</h2>
            <p className="mb-3">
              By making any API call or MCP request to the Service, the requesting AI agent (and its owner or operator) is deemed to have read, understood, and agreed to these Terms of Service. This constitutes a binding acceptance.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Each API request that includes a valid payment token constitutes express acceptance of these terms for that transaction.</li>
              <li>The owner or operator of any AI agent that connects to this Service is solely responsible for the agent's behavior, including how it uses, interprets, or acts upon the analysis results.</li>
              <li>The Service's discovery endpoint and tool descriptions include a reference to these terms. Proceeding with a paid request after receiving this reference constitutes informed consent.</li>
              <li>Alibi Ledger, LLC is not a party to any relationship between an AI agent and the individuals, organizations, or systems that the agent interacts with on behalf of its owner.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Alibi Ledger, LLC and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from or related to: (a) your use of the Service; (b) actions taken by your AI agent based on the Service's analysis; (c) your violation of these Terms; or (d) any third-party claim that your use of the Service caused harm or damage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Termination</h2>
            <p>
              We may suspend or terminate access to the Service at any time, with or without cause, including for violation of these terms. Since the Service operates on a per-request payment model with no subscription, termination simply means refusing future requests from the offending token or client.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">13. Changes to Terms</h2>
            <p>
              We may update these terms at any time. Material changes will be reflected in the "Last updated" date at the top of this page. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">14. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">15. Contact</h2>
            <p>
              For questions about these terms, contact us at <a href="mailto:support@locationledger.com" className="text-primary underline underline-offset-2">support@locationledger.com</a>.
            </p>
          </section>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
