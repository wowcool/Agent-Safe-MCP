import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle2, Terminal, ArrowRight, ExternalLink } from "lucide-react";
import { SiCursor } from "react-icons/si";

import guideClaudeDesktopImg from "@/assets/images/guide-claude-desktop.png";
import guideClaudeCodeImg from "@/assets/images/guide-claude-code.png";
import guideCursorImg from "@/assets/images/guide-cursor.png";
import guideWindsurfImg from "@/assets/images/guide-windsurf.png";
import guideVscodeImg from "@/assets/images/guide-vscode.png";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-muted-foreground shrink-0"
      data-testid="button-copy-agent-config"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

type AgentId = "claude-desktop" | "claude-code" | "cursor" | "windsurf" | "vscode";

interface AgentInfo {
  id: AgentId;
  name: string;
  icon: React.ReactNode;
  configPath: string;
  configPathWin?: string;
  config: string;
  configRaw: string;
  verifySteps: string[];
  guideImg: string;
  examplePrompt: string;
}

const AGENTS: AgentInfo[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M4.709 15.955l1.378-5.453L4.35 7.37A1.86 1.86 0 015.805 4.6l5.207 1.222L15.955 4.1a1.86 1.86 0 012.543 1.72l-.254 5.347 3.916 3.655a1.86 1.86 0 01-.766 3.143l-5.147 1.47-2.082 4.964a1.86 1.86 0 01-3.22.266l-2.856-4.484-5.392-.637a1.86 1.86 0 01-1.022-3.148z" />
      </svg>
    ),
    configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    configPathWin: "%APPDATA%\\Claude\\claude_desktop_config.json",
    config: `{
  "mcpServers": {
    "agentsafe": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe.locationledger.com/mcp",
        "--header",
        "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
      ]
    }
  }
}`,
    configRaw: `{"mcpServers":{"agentsafe":{"command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}}}`,
    verifySteps: [
      "Quit Claude Desktop completely and reopen it",
      "Look for the MCP indicator (hammer icon) at the bottom-right of the chat input",
      "Click the indicator to see \"agentsafe\" and its 9 tools listed",
    ],
    guideImg: guideClaudeDesktopImg,
    examplePrompt:
      "I received this suspicious email. Can you use Agent Safe to check if it's safe? Here's the email:",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    icon: (
      <Terminal className="h-5 w-5" />
    ),
    configPath: "Run in your terminal:",
    config: `claude mcp add-json agentsafe '{
  "command": "npx",
  "args": [
    "-y", "mcp-remote",
    "https://agentsafe.locationledger.com/mcp",
    "--header",
    "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
  ]
}'`,
    configRaw: `claude mcp add-json agentsafe '{"command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}'`,
    verifySteps: [
      "Run claude mcp list in your terminal",
      "Confirm \"agentsafe\" appears in the server list",
      "Start a Claude Code session and ask it to list available tools",
    ],
    guideImg: guideClaudeCodeImg,
    examplePrompt:
      "Check this SMS for scams using Agent Safe's assess_message tool: 'Hi, I think I have the wrong number. Is this Sarah?'",
  },
  {
    id: "cursor",
    name: "Cursor",
    icon: <SiCursor className="h-5 w-5" />,
    configPath: "~/.cursor/mcp.json",
    config: `{
  "mcpServers": {
    "agentsafe": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe.locationledger.com/mcp",
        "--header",
        "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
      ]
    }
  }
}`,
    configRaw: `{"mcpServers":{"agentsafe":{"command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}}}`,
    verifySteps: [
      "Restart Cursor completely",
      "Go to Settings > Tools & Integrations > MCP Tools",
      "Look for a green dot next to \"agentsafe\" — click to see available tools",
    ],
    guideImg: guideCursorImg,
    examplePrompt:
      "Use the agentsafe MCP to analyze this Slack message for social engineering:",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M3 17.5L8.5 12L3 6.5L5.5 4L13.5 12L5.5 20L3 17.5ZM10.5 17.5L16 12L10.5 6.5L13 4L21 12L13 20L10.5 17.5Z" />
      </svg>
    ),
    configPath: "~/.codeium/windsurf/mcp_config.json",
    config: `{
  "mcpServers": {
    "agentsafe": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe.locationledger.com/mcp",
        "--header",
        "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
      ]
    }
  }
}`,
    configRaw: `{"mcpServers":{"agentsafe":{"command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}}}`,
    verifySteps: [
      "Click the MCPs icon (hammer) in the top-right of the Cascade panel",
      "Confirm \"agentsafe\" appears and shows as connected",
      "You can toggle individual tools on/off from the MCP settings page",
    ],
    guideImg: guideWindsurfImg,
    examplePrompt:
      "I got this WhatsApp message. Run it through Agent Safe's message safety check:",
  },
  {
    id: "vscode",
    name: "VS Code Copilot",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M17.583 2.005L23 4.399v15.202l-5.417 2.394L8.35 15.068l-4.933 3.926L1 18v-12l2.417-.994 4.933 3.926 9.233-6.927zM8.583 12l-4.166-3.32v6.64L8.583 12zM17.583 4.611l-7.334 5.494L17.583 15.6V4.61z" />
      </svg>
    ),
    configPath: ".vscode/mcp.json",
    config: `{
  "servers": {
    "agentsafe": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe.locationledger.com/mcp",
        "--header",
        "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
      ]
    }
  }
}`,
    configRaw: `{"servers":{"agentsafe":{"type":"stdio","command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}}}`,
    verifySteps: [
      "Open the .vscode/mcp.json file and click the \"Start\" button above the server entry",
      "Open GitHub Copilot Chat and switch to Agent mode",
      "Click the Tools icon in the chat panel to see agentsafe tools listed",
    ],
    guideImg: guideVscodeImg,
    examplePrompt:
      "Use the agentsafe tool to check this email thread for manipulation:",
  },
];

export function AgentQuickStart() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("claude-desktop");
  const agent = AGENTS.find((a) => a.id === selectedAgent)!;

  return (
    <section id="use-in-your-agent" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4" data-testid="badge-quick-start">
            Quick Start
          </Badge>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            data-testid="text-use-in-agent-heading"
          >
            Use In Your Agent
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-quick-start-intro">
            Select your agent below, paste the config, and start securing messages in under a minute
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {AGENTS.map((a) => (
            <Button
              key={a.id}
              variant={selectedAgent === a.id ? "outline" : "ghost"}
              onClick={() => setSelectedAgent(a.id)}
              className={`toggle-elevate ${
                selectedAgent === a.id
                  ? "toggle-elevated border-primary bg-primary/10"
                  : "text-muted-foreground"
              }`}
              data-testid={`button-agent-${a.id}`}
            >
              {a.icon}
              <span className="font-medium">{a.name}</span>
            </Button>
          ))}
        </div>

        <Card data-testid={`card-agent-instructions-${selectedAgent}`}>
          <CardContent className="pt-6">
            <Tabs defaultValue="install" className="w-full">
              <TabsList className="mb-6" data-testid="tabs-agent-guide">
                <TabsTrigger value="install" data-testid="tab-install">
                  Install
                </TabsTrigger>
                <TabsTrigger value="use" data-testid="tab-use">
                  How to Use
                </TabsTrigger>
              </TabsList>

              <TabsContent value="install">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground" data-testid="text-install-step-1">
                      Step 1 — Open your config file
                    </h3>
                    <div className="bg-muted/50 rounded-md p-3">
                      <code className="text-sm break-all" data-testid="text-config-path">
                        {agent.configPath}
                      </code>
                      {agent.configPathWin && (
                        <div className="mt-1">
                          <span className="text-xs text-muted-foreground">Windows: </span>
                          <code className="text-xs break-all" data-testid="text-config-path-win">{agent.configPathWin}</code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className="text-sm font-semibold text-muted-foreground" data-testid="text-install-step-2">
                        Step 2 — {agent.id === "claude-code" ? "Run this command" : "Paste this config"}
                      </h3>
                      <CopyBtn text={agent.config} />
                    </div>
                    <pre
                      className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground overflow-x-auto leading-relaxed"
                      data-testid="code-agent-config"
                    >
                      <code>{agent.config}</code>
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2" data-testid="text-api-key-note">
                      Replace <code className="text-foreground">&lt;YOUR_SKYFIRE_BUYER_API_KEY&gt;</code> with your key from{" "}
                      <a
                        href="https://skyfire.xyz"
                        target="_blank"
                        rel="noopener"
                        className="text-primary underline"
                        data-testid="link-skyfire-install"
                      >
                        skyfire.xyz
                      </a>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground" data-testid="text-install-step-3">
                      Step 3 — Verify the connection
                    </h3>
                    <div className="space-y-2">
                      {agent.verifySteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-primary font-bold text-[10px]">{i + 1}</span>
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`text-verify-step-${i}`}>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <p className="text-xs text-muted-foreground mb-3 font-medium">
                      Where to find MCP settings in {agent.name}
                    </p>
                    <img
                      src={agent.guideImg}
                      alt={`${agent.name} MCP configuration guide`}
                      className="w-full rounded-md border"
                      data-testid={`img-guide-${agent.id}`}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="use">
                <div className="space-y-8">
                  <div>
                    <h3
                      className="text-lg font-bold mb-2"
                      data-testid="text-usage-heading"
                    >
                      3-Step Workflow
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6" data-testid="text-usage-intro">
                      Once Agent Safe is connected, every agent uses the same 3-step pattern: triage, analyze, and improve.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
                        <span className="text-chart-4 font-bold text-sm">1</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold" data-testid="text-step-triage">Triage</span>
                          <Badge className="text-xs bg-chart-4 text-white no-default-hover-elevate">FREE</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Send your message to <strong>assess_message</strong> and get back a prioritized list of which security checks to run. No charge.
                        </p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Example prompt:</p>
                          <p className="text-sm italic text-foreground">
                            "{agent.examplePrompt} [paste your message here]"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold" data-testid="text-step-checks">Run Recommended Checks</span>
                          <Badge variant="secondary" className="text-xs">$0.02 each</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          The triage response tells your agent exactly which tools to run. Your agent calls them automatically — <strong>check_email_safety</strong>, <strong>check_url_safety</strong>, <strong>check_sender_reputation</strong>, etc.
                        </p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Example prompt:</p>
                          <p className="text-sm italic text-foreground">
                            "Now run the security checks it recommended"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
                        <span className="text-chart-4 font-bold text-sm">3</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold" data-testid="text-step-feedback">Submit Feedback</span>
                          <Badge className="text-xs bg-chart-4 text-white no-default-hover-elevate">FREE</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Rate the analysis quality with <strong>submit_feedback</strong>. No charge. Your feedback directly improves threat detection for all agents.
                        </p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Example prompt:</p>
                          <p className="text-sm italic text-foreground">
                            "Submit feedback that this analysis was helpful"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-1" />
                      <p className="text-sm text-muted-foreground">
                        <strong>That's it.</strong> Your agent handles all the tool calls automatically. You just describe what you need checked in natural language, and Agent Safe does the rest.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <p className="text-xs text-muted-foreground mb-1 font-medium" data-testid="text-prerequisite-label">Prerequisite</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-prerequisite-detail">
                      You need a Skyfire Buyer API Key to use the 7 paid tools ($0.02 each). The 2 free tools (assess_message + submit_feedback) work without payment.{" "}
                      <a
                        href="https://skyfire.xyz"
                        target="_blank"
                        rel="noopener"
                        className="text-primary underline inline-flex items-center gap-1"
                        data-testid="link-skyfire-usage"
                      >
                        Get your key at skyfire.xyz <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
