#!/bin/bash
BASE_URL="https://agentsafe.locationledger.com"
PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1 - $2"; FAIL=$((FAIL + 1)); }

echo "=== SafeMessage Production Tests ==="
echo "Target: $BASE_URL"
echo ""

echo "--- Test 1: MCP Initialize ---"
RESP=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"t1","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}')
if echo "$RESP" | grep -q 'AgentSafe'; then
  pass "MCP initialize returns AgentSafe server info"
else
  fail "MCP initialize" "$RESP"
fi

echo "--- Test 2: MCP tools/list ---"
RESP=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"t2","method":"tools/list","params":{}}')
if echo "$RESP" | grep -q 'check_email_safety'; then
  pass "tools/list returns check_email_safety tool"
else
  fail "tools/list" "$RESP"
fi

echo "--- Test 3: MCP tools/call without payment ---"
RESP=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"t3","method":"tools/call","params":{"name":"check_email_safety","arguments":{"from":"test@evil.com","subject":"Click here","body":"Urgent action required"}}}')
if echo "$RESP" | grep -q 'Payment required'; then
  pass "tools/call without payment returns Payment required"
else
  fail "tools/call without payment" "$RESP"
fi

echo "--- Test 4: MCP tools/call with invalid Skyfire token ---"
RESP=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "skyfire-pay-id: fake.invalid.token" \
  -d '{"jsonrpc":"2.0","id":"t4","method":"tools/call","params":{"name":"check_email_safety","arguments":{"from":"test@evil.com","subject":"Click here","body":"Urgent"}}}')
if echo "$RESP" | grep -q 'Invalid Skyfire token'; then
  pass "Invalid Skyfire token rejected properly"
else
  fail "Invalid Skyfire token" "$RESP"
fi

echo "--- Test 5: MCP tools/call with invalid Bearer token ---"
RESP=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer invalidtoken123" \
  -d '{"jsonrpc":"2.0","id":"t5","method":"tools/call","params":{"name":"check_email_safety","arguments":{"from":"test@evil.com","subject":"Click here","body":"Urgent"}}}')
if echo "$RESP" | grep -q 'Payment required\|Invalid token'; then
  pass "Invalid Bearer token rejected (returns Payment required or Invalid token)"
else
  fail "Invalid Bearer token" "$RESP"
fi

echo "--- Test 6: MCP GET returns 405 ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/mcp")
if [ "$HTTP_CODE" = "405" ]; then
  pass "GET /mcp returns 405 Method Not Allowed"
else
  fail "GET /mcp status" "Expected 405, got $HTTP_CODE"
fi

echo "--- Test 7: REST Discovery endpoint ---"
RESP=$(curl -s "$BASE_URL/mcp/discover")
if echo "$RESP" | grep -q 'skyfire_pay' && echo "$RESP" | grep -q 'Agent Safe'; then
  pass "REST /mcp/discover returns service info with Skyfire"
else
  fail "REST /mcp/discover" "$RESP"
fi

echo "--- Test 8: REST check_email_safety without auth ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/mcp/tools/check_email_safety" \
  -H "Content-Type: application/json" \
  -d '{"email":{"from":"test@test.com","subject":"test","body":"test"}}')
if [ "$HTTP_CODE" = "401" ]; then
  pass "REST email check without auth returns 401"
else
  fail "REST email check no auth" "Expected 401, got $HTTP_CODE"
fi

echo "--- Test 9: REST Skyfire registration with invalid token ---"
RESP=$(curl -s -X POST "$BASE_URL/mcp/register/skyfire" \
  -H "Content-Type: application/json" \
  -H "skyfire-pay-id: bad.jwt.token" \
  -d '{"agentName":"TestBot"}')
if echo "$RESP" | grep -q 'Invalid Skyfire token'; then
  pass "REST Skyfire register rejects invalid token"
else
  fail "REST Skyfire register" "$RESP"
fi

echo "--- Test 10: MCP Invalid method ---"
RESP=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"t10","method":"nonexistent/method","params":{}}')
if echo "$RESP" | grep -q 'error'; then
  pass "Invalid MCP method returns error"
else
  fail "Invalid MCP method" "$RESP"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
