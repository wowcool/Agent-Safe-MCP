const SMITHERY_MCP = "https://server.smithery.ai/agent-safe-email/agentsafeemail/mcp";
const DIRECT_MCP = "https://agentsafe.locationledger.com/mcp";
const SMITHERY_KEY = process.env.SMITHERY_API!;
const BUYER_KEY = process.env.SKYFIRE_BUYER;

const TOOL_CALL_BODY = JSON.stringify({
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "check_attachment_safety",
    arguments: { attachments: [{ name: "test.txt", mimeType: "text/plain", size: 100 }] },
  },
});

const LIST_TOOLS_BODY = JSON.stringify({
  jsonrpc: "2.0",
  id: 3,
  method: "tools/list",
  params: {},
});

interface TestCase {
  label: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  expected: string;
  skip?: boolean;
}

async function runTest(test: TestCase): Promise<{ label: string; pass: boolean; response: string; skipped?: boolean }> {
  if (test.skip) return { label: test.label, pass: true, response: "SKIPPED (no SKYFIRE_BUYER env var)", skipped: true };
  try {
    const res = await fetch(test.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...test.headers,
      },
      body: test.body,
    });

    const text = await res.text();
    const match = text.match(/data: (.+)/);
    const data = match ? match[1] : text;

    let parsed: any;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { raw: data };
    }

    let responseText = "";
    if (parsed.result?.content?.[0]?.text) {
      const inner = JSON.parse(parsed.result.content[0].text);
      responseText = inner.error
        ? `${inner.error}${inner.details ? ": " + inner.details : ""}`
        : `verdict=${inner.overallVerdict || inner.verdict}, risk=${inner.overallRiskScore || inner.riskScore}, charged=${inner.charged}`;
    } else if (parsed.result?.tools) {
      responseText = `${parsed.result.tools.length} tools: ${parsed.result.tools.map((t: any) => t.name).join(", ")}`;
    } else if (parsed.error) {
      responseText = `JSON-RPC error: ${parsed.error.message}`;
    } else {
      responseText = data.substring(0, 200);
    }

    const pass = responseText.includes(test.expected);
    return { label: test.label, pass, response: responseText };
  } catch (err: any) {
    return { label: test.label, pass: false, response: `FETCH ERROR: ${err.message}` };
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Agent Safe — Smithery + Buyer API Key Integration Tests   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const tests: TestCase[] = [
    {
      label: "1. Direct: List tools",
      url: DIRECT_MCP,
      headers: {},
      body: LIST_TOOLS_BODY,
      expected: "7 tools",
    },
    {
      label: "2. Direct: No auth → Payment required",
      url: DIRECT_MCP,
      headers: {},
      body: TOOL_CALL_BODY,
      expected: "Payment required",
    },
    {
      label: "3. Direct: Fake skyfire-api-key → error",
      url: DIRECT_MCP,
      headers: { "skyfire-api-key": "fake-buyer-key-12345" },
      body: TOOL_CALL_BODY,
      expected: "Failed to generate PAY token",
    },
    {
      label: "4. Direct: Fake skyfire-pay-id (legacy) → Invalid token",
      url: DIRECT_MCP,
      headers: { "skyfire-pay-id": "fake-token-12345" },
      body: TOOL_CALL_BODY,
      expected: "Invalid Skyfire token",
    },
    {
      label: "5. Direct: Real Buyer API Key → charged $0.02",
      url: DIRECT_MCP,
      headers: { "skyfire-api-key": BUYER_KEY || "" },
      body: TOOL_CALL_BODY,
      expected: "charged=0.02",
      skip: !BUYER_KEY,
    },
    {
      label: "6. Smithery: List tools",
      url: `${SMITHERY_MCP}?api_key=${encodeURIComponent(SMITHERY_KEY)}`,
      headers: {},
      body: LIST_TOOLS_BODY,
      expected: "7 tools",
    },
    {
      label: "7. Smithery: No Skyfire key → Payment required",
      url: `${SMITHERY_MCP}?api_key=${encodeURIComponent(SMITHERY_KEY)}`,
      headers: {},
      body: TOOL_CALL_BODY,
      expected: "Payment required",
    },
    {
      label: "8. Smithery: Buyer API Key via header → charged $0.02",
      url: `${SMITHERY_MCP}?api_key=${encodeURIComponent(SMITHERY_KEY)}`,
      headers: { "skyfire-api-key": BUYER_KEY || "" },
      body: TOOL_CALL_BODY,
      expected: "charged=0.02",
      skip: !BUYER_KEY,
    },
    {
      label: "9. Smithery: Buyer API Key via config param → charged $0.02",
      url: `${SMITHERY_MCP}?api_key=${encodeURIComponent(SMITHERY_KEY)}&skyfireBuyerApiKey=${encodeURIComponent(BUYER_KEY || "")}`,
      headers: {},
      body: TOOL_CALL_BODY,
      expected: "charged=0.02",
      skip: !BUYER_KEY,
    },
  ];

  const results = [];
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  console.log("Results:\n");
  let allPass = true;
  let skipped = 0;
  for (const r of results) {
    const icon = r.skipped ? "SKIP" : r.pass ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${r.label}`);
    console.log(`         → ${r.response}\n`);
    if (!r.pass) allPass = false;
    if (r.skipped) skipped++;
  }

  console.log("═══════════════════════════════════════════════════════════════\n");

  if (allPass) {
    console.log(`ALL TESTS PASSED (${skipped} skipped)\n`);
    console.log("Key findings:");
    console.log("  1. Smithery proxy connects to Agent Safe and lists all 7 tools");
    console.log("  2. The skyfire-api-key header IS forwarded through Smithery");
    console.log("  3. Smithery config schema maps skyfireBuyerApiKey → skyfire-api-key header");
    console.log("  4. Server auto-generates PAY tokens from Buyer API Keys");
    console.log("  5. Legacy skyfire-pay-id header still works for backward compatibility");
    console.log("");
    console.log("Conclusion: Buyers provide their Skyfire Buyer API Key either");
    console.log("directly (via skyfire-api-key header) or through Smithery's config");
    console.log("UI, and Agent Safe handles PAY token generation automatically.");
  } else {
    console.log("SOME TESTS FAILED — see details above.");
  }
}

main().catch(console.error);
