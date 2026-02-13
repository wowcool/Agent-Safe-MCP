import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, CheckCircle2, Terminal, ArrowRight, ExternalLink, Settings } from "lucide-react";

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

type AgentId = "chatgpt" | "claude-desktop" | "claude-code" | "cursor" | "windsurf" | "vscode" | "gemini-cli";

interface AgentInfo {
  id: AgentId;
  name: string;
  icon: React.ReactNode;
  configPath: string;
  configPathWin?: string;
  config: string;
  configRaw: string;
  verifySteps: string[];
  examplePrompt: string;
}

const AGENTS: AgentInfo[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.61.4a6.044 6.044 0 00-5.79 4.214 5.985 5.985 0 00-3.995 2.896 6.046 6.046 0 00.749 7.112 5.985 5.985 0 00.516 4.911 6.046 6.046 0 006.51 2.9 6.065 6.065 0 003.645 1.567 6.044 6.044 0 005.79-4.214 5.985 5.985 0 003.995-2.896 6.046 6.046 0 00-.749-7.112zM12.39 21.784a4.526 4.526 0 01-2.907-1.055l.144-.083 4.83-2.789a.784.784 0 00.396-.68v-6.806l2.042 1.179a.072.072 0 01.04.056v5.637a4.544 4.544 0 01-4.545 4.541zM3.865 17.817a4.52 4.52 0 01-.541-3.044l.144.084 4.83 2.788a.784.784 0 00.787 0l5.897-3.405v2.359a.073.073 0 01-.029.062l-4.883 2.82a4.544 4.544 0 01-6.205-1.664zM2.632 7.755a4.525 4.525 0 012.366-1.99V11.5a.784.784 0 00.392.68l5.896 3.405-2.042 1.18a.073.073 0 01-.068.005l-4.883-2.82A4.544 4.544 0 012.632 7.755zm16.245 3.783l-5.897-3.405 2.043-1.18a.073.073 0 01.067-.005l4.884 2.82a4.544 4.544 0 01-1.642 8.216V12.22a.784.784 0 00-.392-.682zm2.032-3.074l-.145-.084-4.83-2.788a.784.784 0 00-.786 0L9.25 9.996V7.637a.073.073 0 01.028-.062l4.883-2.82a4.544 4.544 0 016.748 4.709zM8.166 12.61l-2.043-1.18a.072.072 0 01-.039-.056V5.737a4.544 4.544 0 017.452-3.486l-.144.083-4.83 2.789a.784.784 0 00-.396.68zm1.109-2.39l2.627-1.517 2.627 1.517v3.035l-2.627 1.517-2.627-1.517z" />
      </svg>
    ),
    configPath: "Settings > Connectors > Create",
    config: `MCP Server URL:
https://agentsafe.locationledger.com/mcp

Authentication: API Key
Header Name: skyfire-api-key
Header Value: <YOUR_SKYFIRE_BUYER_API_KEY>`,
    configRaw: `https://agentsafe.locationledger.com/mcp`,
    verifySteps: [
      "Go to chatgpt.com > Settings > Connectors > Advanced > enable Developer Mode",
      "Click \"Create\" next to Browser connectors and enter the MCP Server URL above",
      "Set authentication to API Key, add the skyfire-api-key header with your key",
      "Start a new chat — your connected tools will appear in the conversation",
    ],
    examplePrompt:
      "I got this suspicious email. Can you use Agent Safe to check if it's a phishing attempt? Here's the email:",
  },
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
    examplePrompt:
      "Check this SMS for scams using Agent Safe's assess_message tool: 'Hi, I think I have the wrong number. Is this Sarah?'",
  },
  {
    id: "cursor",
    name: "Cursor",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z" />
      </svg>
    ),
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
    examplePrompt:
      "Use the agentsafe tool to check this email thread for manipulation:",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6l3.6 8.4-3.6 8.4-3.6-8.4L12 3.6z" />
      </svg>
    ),
    configPath: "~/.gemini/settings.json",
    config: `{
  "mcpServers": {
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
    configRaw: `{"mcpServers":{"agentsafe":{"type":"stdio","command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}}}`,
    verifySteps: [
      "Start a Gemini CLI session",
      "Type /mcp to see available MCP servers and their tools",
      "Confirm \"agentsafe\" appears and shows 9 tools connected",
    ],
    examplePrompt:
      "Check this Discord message for social engineering using Agent Safe:",
  },
];

const UNIVERSAL_CONFIG = `{
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
}`;

export function AgentQuickStart() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("chatgpt");
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
                      Step 1 — {agent.id === "chatgpt" ? "Enable Developer Mode" : "Open your config file"}
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
                        Step 2 — {agent.id === "claude-code" ? "Run this command" : agent.id === "chatgpt" ? "Enter these details" : "Paste this config"}
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

        <Card className="mt-6" data-testid="card-universal-agent">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="universal" className="border-0">
                <AccordionTrigger className="py-0" data-testid="button-universal-agent-toggle">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="text-left">
                      <span className="font-semibold text-sm">Using a different MCP client?</span>
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">Universal config for any MCP-compatible agent</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground" data-testid="text-universal-intro">
                      Most MCP clients use the <code className="text-foreground">mcpServers</code> format below. Paste this into your client's MCP configuration file.
                    </p>
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">MCP Client Configuration</span>
                        <CopyBtn text={UNIVERSAL_CONFIG} />
                      </div>
                      <pre
                        className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground overflow-x-auto leading-relaxed"
                        data-testid="code-universal-config"
                      >
                        <code>{UNIVERSAL_CONFIG}</code>
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2" data-testid="text-universal-api-note">
                        Replace <code className="text-foreground">&lt;YOUR_SKYFIRE_BUYER_API_KEY&gt;</code> with your key from{" "}
                        <a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-primary underline" data-testid="link-skyfire-universal">skyfire.xyz</a>
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <span className="text-primary font-bold text-xs">1</span>
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid="text-universal-step-1">
                          Get a Skyfire Buyer API Key at <a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-primary underline">skyfire.xyz</a>
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <span className="text-primary font-bold text-xs">2</span>
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid="text-universal-step-2">Paste the config into your MCP client's configuration file</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <span className="text-primary font-bold text-xs">3</span>
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid="text-universal-step-3">
                          Call <strong>assess_message</strong> (free) to triage, then run the recommended paid tools at $0.02 each
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
