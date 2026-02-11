const SMITHERY_MCP = "https://server.smithery.ai/agent-safe-email/agentsafeemail/mcp";
const DIRECT_MCP = "https://agentsafe.locationledger.com/mcp";
const SMITHERY_KEY = process.env.SMITHERY_API!;

const TOOL_CALL_BODY = JSON.stringify({
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "check_attachment_safety",
    arguments: { attachments: [{ name: "test.txt", mimeType: "text/plain", size: 100 }] },
  },
});

const INIT_BODY = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0" },
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
}

async function runTest(test: TestCase): Promise<{ label: string; pass: boolean; response: string }> {
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
        : `verdict=${inner.overallVerdict || inner.verdict}, risk=${inner.overallRiskScore || inner.riskScore}`;
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
  console.log("║    Agent Safe — Smithery Proxy Integration Test Suite       ║");
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
      label: "2. Direct: Tool call, no token → Payment required",
      url: DIRECT_MCP,
      headers: {},
      body: TOOL_CALL_BODY,
      expected: "Payment required",
    },
    {
      label: "3. Direct: Tool call, fake token → Invalid token",
      url: DIRECT_MCP,
      headers: { "skyfire-pay-id": "fake-token-12345" },
      body: TOOL_CALL_BODY,
      expected: "Invalid Skyfire token",
    },
    {
      label: "4. Direct: Query param token → Invalid token",
      url: `${DIRECT_MCP}?SKYFIRE_PAY_TOKEN=fake-query-token`,
      headers: {},
      body: TOOL_CALL_BODY,
      expected: "Invalid Skyfire token",
    },
    {
      label: "5. Smithery: List tools",
      url: `${SMITHERY_MCP}?api_key=${encodeURIComponent(SMITHERY_KEY)}`,
      headers: {},
      body: LIST_TOOLS_BODY,
      expected: "7 tools",
    },
    {
      label: "6. Smithery: Tool call, no token → Payment required",
      url: `${SMITHERY_MCP}?api_key=${encodeURIComponent(SMITHERY_KEY)}`,
      headers: {},
      body: TOOL_CALL_BODY,
      expected: "Payment required",
    },
    {
      label: "7. Smithery: skyfire-pay-id header forwarded → Invalid token",
      url: `${SMITHERY_MCP}?api_key=${encodeURIComponent(SMITHERY_KEY)}`,
      headers: { "skyfire-pay-id": "fake-smithery-token-xyz" },
      body: TOOL_CALL_BODY,
      expected: "Invalid Skyfire token",
    },
  ];

  const results = await Promise.all(tests.map(runTest));

  console.log("Results:\n");
  let allPass = true;
  for (const r of results) {
    const icon = r.pass ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${r.label}`);
    console.log(`         → ${r.response}\n`);
    if (!r.pass) allPass = false;
  }

  console.log("═══════════════════════════════════════════════════════════════\n");

  if (allPass) {
    console.log("ALL TESTS PASSED\n");
    console.log("Key findings:");
    console.log("  1. Smithery proxy connects to Agent Safe and lists all 7 tools");
    console.log("  2. The skyfire-pay-id header IS forwarded through Smithery");
    console.log("  3. Server correctly validates/rejects tokens through the proxy");
    console.log("  4. Query parameter fallback also works for direct connections");
    console.log("");
    console.log("Conclusion: When users provide a valid Skyfire PAY token via");
    console.log("the skyfire-pay-id header in their MCP client config, it will");
    console.log("flow through Smithery to Agent Safe and work correctly.");
  } else {
    console.log("SOME TESTS FAILED — see details above.");
  }
}

main().catch(console.error);
