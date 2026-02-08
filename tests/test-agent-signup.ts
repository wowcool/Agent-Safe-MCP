import crypto from "crypto";

const BASE_URL = "http://localhost:5000";

interface DiscoveryResponse {
  service: string;
  version: string;
  description: string;
  capabilities: string[];
  pricing: { perCheck: number; currency: string };
  paymentMethods: string[];
  endpoints: {
    register: { delegated: string; autonomous: string };
    tools: { checkEmailSafety: string };
  };
  trustSignals: { uptime: string; avgResponseMs: number; agentsServed: number; threatsBlocked: number };
}

function log(emoji: string, msg: string) {
  console.log(`\n${emoji}  ${msg}`);
}

function logDetail(msg: string) {
  console.log(`   ${msg}`);
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`   FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`   PASS: ${msg}`);
}

async function testDiscovery(): Promise<DiscoveryResponse> {
  log("1/6", "STEP 1: Agent discovers SafeMessage MCP service");
  logDetail("An autonomous agent finds this service and calls GET /mcp/discover");
  logDetail("to understand what the service does, how much it costs, and how to register.");

  const res = await fetch(`${BASE_URL}/mcp/discover`);
  const data = await res.json() as DiscoveryResponse;

  assert(res.status === 200, "Discovery endpoint returns 200");
  assert(data.service === "SafeMessage Guard", "Service name is correct");
  assert(data.capabilities.includes("email_safety_check"), "Has email_safety_check capability");
  assert(data.pricing.perCheck === 0.05, "Price per check is $0.05");
  assert(data.paymentMethods.includes("crypto_wallet"), "Supports crypto wallet payments");
  assert(data.endpoints.register.autonomous === "/mcp/register/autonomous", "Autonomous registration endpoint exists");
  assert(data.endpoints.tools.checkEmailSafety === "/mcp/tools/check_email_safety", "Email check tool endpoint exists");
  assert(typeof data.trustSignals.uptime === "string", "Trust signals include uptime");

  logDetail("The agent now knows: the service checks emails for $0.05 each,");
  logDetail("accepts crypto wallets, and the agent can register autonomously.");

  return data;
}

async function testAutonomousRegistration(): Promise<string> {
  log("2/6", "STEP 2: Autonomous agent registers with its own wallet");
  logDetail("The agent has its own Ethereum wallet. It signs a proof-of-ownership");
  logDetail("message and submits it along with wallet details to register.");

  const agentId = crypto.randomUUID();
  const agentName = `TestBot_${Date.now()}`;
  const walletAddress = "0x" + crypto.randomBytes(20).toString("hex");
  const proof = "0x" + crypto.randomBytes(65).toString("hex");

  const res = await fetch(`${BASE_URL}/mcp/register/autonomous`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId,
      agentName,
      walletAddress,
      walletType: "ethereum",
      proof,
    }),
  });

  const data = await res.json();

  assert(res.status === 200, "Autonomous registration returns 200");
  assert(data.success === true, "Registration succeeded");
  assert(typeof data.apiToken === "string", "API token was returned");
  assert(data.apiToken.startsWith("sm_live_"), "Token has correct prefix");
  assert(data.walletVerified === true, "Wallet was verified");
  assert(data.pricePerCheck === 0.05, "Price per check confirmed");

  logDetail(`Agent '${agentName}' registered successfully.`);
  logDetail(`Wallet balance: $${data.currentBalance}, minimum: $${data.minBalanceRequired}`);
  logDetail(`API token received: ${data.apiToken.substring(0, 20)}...`);

  return data.apiToken;
}

async function testRegistrationWithInvalidWallet() {
  log("3/6", "STEP 3: Test registration with invalid wallet (should fail)");
  logDetail("If an agent provides a bad wallet address or invalid proof,");
  logDetail("the service should reject the registration.");

  const res = await fetch(`${BASE_URL}/mcp/register/autonomous`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: crypto.randomUUID(),
      agentName: "BadAgent",
      walletAddress: "not-a-real-wallet",
      walletType: "ethereum",
      proof: "invalid-proof",
    }),
  });

  assert(res.status === 401, "Invalid wallet returns 401 Unauthorized");
  const data = await res.json();
  assert(data.error === "Invalid wallet proof", "Error message is clear");

  logDetail("Correctly rejected: agents can't register with fake wallets.");
}

async function testRegistrationMissingFields() {
  log("4/6", "STEP 4: Test registration with missing fields (should fail)");
  logDetail("An agent that sends an incomplete request should get a clear error.");

  const res = await fetch(`${BASE_URL}/mcp/register/autonomous`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentName: "IncompleteAgent",
    }),
  });

  assert(res.status === 400, "Missing fields returns 400");
  const data = await res.json();
  assert(data.error === "Missing required fields", "Error message explains the issue");

  logDetail("Correctly rejected: agents must provide all required fields.");
}

async function testTokenWorks(apiToken: string) {
  log("5/6", "STEP 5: Agent uses its token to call the email check tool");
  logDetail("After registration, the agent uses its API token to check an email.");
  logDetail("This verifies the full flow: register -> get token -> use service.");

  const res = await fetch(`${BASE_URL}/mcp/tools/check_email_safety`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      email: {
        from: "colleague@company.com",
        subject: "Meeting notes from today",
        body: "Hi, here are the meeting notes we discussed. Let me know if you have questions.",
      },
    }),
  });

  assert(res.status === 200, "Email check returns 200 with valid token");
  const data = await res.json();
  assert(["safe", "suspicious", "dangerous"].includes(data.verdict), "Got a valid verdict");
  assert(typeof data.riskScore === "number", "Got a risk score");
  assert(typeof data.checkId === "string", "Got a check ID for audit trail");

  logDetail(`Verdict: ${data.verdict} (risk: ${data.riskScore}, confidence: ${data.confidence})`);
  logDetail(`Recommendation: ${data.recommendation}`);
  logDetail("Token works - autonomous agent can use the service independently.");
}

async function testInvalidToken() {
  log("6/6", "STEP 6: Test with invalid/fake token (should fail)");
  logDetail("If someone tries to use the service without a valid token,");
  logDetail("they should be rejected.");

  const res = await fetch(`${BASE_URL}/mcp/tools/check_email_safety`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sm_live_fake_token_not_real",
    },
    body: JSON.stringify({
      email: {
        from: "test@example.com",
        subject: "Test",
        body: "Test body",
      },
    }),
  });

  assert(res.status === 401, "Invalid token returns 401");
  const data = await res.json();
  assert(typeof data.error === "string", "Error message returned");

  logDetail("Correctly rejected: no free rides without a valid token.");
}

async function runAllTests() {
  console.log("=".repeat(70));
  console.log("  AUTONOMOUS AGENT SIGNUP FLOW TEST");
  console.log("  Simulates an AI agent discovering and signing up for SafeMessage MCP");
  console.log("=".repeat(70));

  let passed = 0;
  let failed = 0;

  try {
    await testDiscovery();
    passed++;

    const apiToken = await testAutonomousRegistration();
    passed++;

    await testRegistrationWithInvalidWallet();
    passed++;

    await testRegistrationMissingFields();
    passed++;

    await testTokenWorks(apiToken);
    passed++;

    await testInvalidToken();
    passed++;

  } catch (err: any) {
    failed++;
    console.error(`\nFATAL: ${err.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of 6 tests`);
  console.log("=".repeat(70));

  if (failed > 0) process.exit(1);
}

runAllTests();
