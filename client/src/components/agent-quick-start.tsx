import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, CheckCircle2, ArrowRight, ExternalLink, Settings } from "lucide-react";
import { SiOpenai, SiClaude, SiCodeium, SiGithubcopilot, SiGooglegemini } from "react-icons/si";

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

type AgentId =
  | "chatgpt" | "claude-desktop" | "claude-code" | "cursor" | "windsurf"
  | "vscode" | "grok" | "gemini-cli"
  | "amazon-bedrock" | "amazon-q" | "augment" | "boltai" | "cline"
  | "codex-cli" | "deepgram" | "enconvo" | "goose" | "highlight"
  | "librechat" | "poke" | "qordinate" | "raycast" | "roo-code"
  | "tome" | "vscode-insiders" | "witsy";

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="m415.035 156.35-151.503-87.4695c-4.865-2.8094-10.868-2.8094-15.733 0l-151.4969 87.4695c-4.0897 2.362-6.6146 6.729-6.6146 11.459v176.383c0 4.73 2.5249 9.097 6.6146 11.458l151.5039 87.47c4.865 2.809 10.868 2.809 15.733 0l151.504-87.47c4.089-2.361 6.614-6.728 6.614-11.458v-176.383c0-4.73-2.525-9.097-6.614-11.459zm-9.516 18.528-146.255 253.32c-.988 1.707-3.599 1.01-3.599-.967v-165.872c0-3.314-1.771-6.379-4.644-8.044l-143.645-82.932c-1.707-.988-1.01-3.599.968-3.599h292.509c4.154 0 6.75 4.503 4.673 8.101h-.007z" fill="currentColor"/>
    </svg>
  );
}

function GrokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>
    </svg>
  );
}

function LetterIcon({ letter, className }: { letter: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center font-bold text-[10px] leading-none w-5 h-5 rounded bg-muted text-muted-foreground ${className || ""}`}>
      {letter}
    </div>
  );
}

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

const STANDARD_CONFIG = `{
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

const STANDARD_CONFIG_RAW = `{"mcpServers":{"agentsafe":{"command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}}}`;

const VSCODE_CONFIG = `{
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
}`;

const VSCODE_CONFIG_RAW = `{"servers":{"agentsafe":{"type":"stdio","command":"npx","args":["-y","mcp-remote","https://agentsafe.locationledger.com/mcp","--header","skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]}}}`;

const AGENTS: AgentInfo[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: <SiOpenai className="h-5 w-5" />,
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
    icon: <SiClaude className="h-5 w-5" />,
    configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    configPathWin: "%APPDATA%\\Claude\\claude_desktop_config.json",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
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
    icon: <SiClaude className="h-5 w-5" />,
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
    icon: <CursorIcon className="h-5 w-5" />,
    configPath: "~/.cursor/mcp.json",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
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
    icon: <SiCodeium className="h-5 w-5" />,
    configPath: "~/.codeium/windsurf/mcp_config.json",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
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
    icon: <SiGithubcopilot className="h-5 w-5" />,
    configPath: ".vscode/mcp.json",
    config: VSCODE_CONFIG,
    configRaw: VSCODE_CONFIG_RAW,
    verifySteps: [
      "Open the .vscode/mcp.json file and click the \"Start\" button above the server entry",
      "Open GitHub Copilot Chat and switch to Agent mode",
      "Click the Tools icon in the chat panel to see agentsafe tools listed",
    ],
    examplePrompt:
      "Use the agentsafe tool to check this email thread for manipulation:",
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    icon: <GrokIcon className="h-5 w-5" />,
    configPath: "console.x.ai → API Keys → MCP Connections",
    config: `MCP Server URL:
https://agentsafe.locationledger.com/mcp

Header: skyfire-api-key
Value: <YOUR_SKYFIRE_BUYER_API_KEY>

Note: Grok MCP is configured via the xAI developer
panel, not a local config file. You need an xAI API
account at console.x.ai to set up MCP connections.`,
    configRaw: `https://agentsafe.locationledger.com/mcp`,
    verifySteps: [
      "Go to console.x.ai and sign in to your xAI developer account",
      "Navigate to API Keys or MCP Connections in the developer panel",
      "Add Agent Safe's MCP server URL and your Skyfire API key header",
      "Open Grok and confirm Agent Safe tools are available in the conversation",
    ],
    examplePrompt:
      "Use Agent Safe to check if this message is a scam:",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    icon: <SiGooglegemini className="h-5 w-5" />,
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
  {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    icon: <LetterIcon letter="AB" />,
    configPath: "Add to your Bedrock MCP client config",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Add the config to your Bedrock-compatible MCP client settings",
      "Restart the client or reload MCP servers",
      "Confirm \"agentsafe\" appears in available tools",
    ],
    examplePrompt:
      "Use Agent Safe to check this email for phishing attempts:",
  },
  {
    id: "amazon-q",
    name: "Amazon Q",
    icon: <LetterIcon letter="Q" />,
    configPath: "~/.aws/amazonq/mcp.json",
    config: `{
  "mcpServers": {
    "agentsafe": {
      "type": "http",
      "url": "https://agentsafe.locationledger.com/mcp",
      "headers": {
        "skyfire-api-key": "<YOUR_SKYFIRE_BUYER_API_KEY>"
      }
    }
  }
}`,
    configRaw: `{"mcpServers":{"agentsafe":{"type":"http","url":"https://agentsafe.locationledger.com/mcp","headers":{"skyfire-api-key":"<YOUR_SKYFIRE_BUYER_API_KEY>"}}}}`,
    verifySteps: [
      "Open Amazon Q Developer in your IDE or CLI",
      "Click the Tools icon or run /tools to see available MCP servers",
      "Confirm \"agentsafe\" appears and shows as connected",
    ],
    examplePrompt:
      "Use Agent Safe to analyze this suspicious message:",
  },
  {
    id: "augment",
    name: "Augment",
    icon: <LetterIcon letter="Au" />,
    configPath: "Augment Settings Panel > Import JSON",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open the Augment options menu and click Settings",
      "Import the JSON config or add the MCP server manually",
      "Test the connection and confirm agentsafe tools are available",
    ],
    examplePrompt:
      "Check this email for social engineering using Agent Safe:",
  },
  {
    id: "boltai",
    name: "BoltAI",
    icon: <LetterIcon letter="Bo" />,
    configPath: "Settings > Plugins > MCP Servers",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Go to BoltAI Settings > Plugins",
      "Add the JSON config in the MCP servers editor",
      "Confirm \"agentsafe\" appears in the plugins list",
    ],
    examplePrompt:
      "Run Agent Safe on this suspicious message I received:",
  },
  {
    id: "cline",
    name: "Cline",
    icon: <LetterIcon letter="Cl" />,
    configPath: "~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
    configPathWin: "%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Click the MCP Servers icon in Cline's top navigation bar",
      "Check for a green indicator next to \"agentsafe\"",
      "Restart VS Code if the server doesn't appear",
    ],
    examplePrompt:
      "Use agentsafe to check this email for threats:",
  },
  {
    id: "codex-cli",
    name: "Codex CLI",
    icon: <SiOpenai className="h-5 w-5" />,
    configPath: "Run in your terminal:",
    config: `codex mcp add agentsafe -- npx -y mcp-remote \\
  https://agentsafe.locationledger.com/mcp \\
  --header "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"`,
    configRaw: `codex mcp add agentsafe -- npx -y mcp-remote https://agentsafe.locationledger.com/mcp --header "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"`,
    verifySteps: [
      "Run codex mcp list in your terminal",
      "Confirm \"agentsafe\" appears in the server list",
      "Start a Codex session and ask it to list available tools",
    ],
    examplePrompt:
      "Check this message for scams using Agent Safe:",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    icon: <LetterIcon letter="Dg" />,
    configPath: "MCP settings in your Deepgram client",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Add the config to your Deepgram MCP settings",
      "Restart the client or reload servers",
      "Confirm \"agentsafe\" appears in available tools",
    ],
    examplePrompt:
      "Analyze this message for security threats with Agent Safe:",
  },
  {
    id: "enconvo",
    name: "Enconvo",
    icon: <LetterIcon letter="En" />,
    configPath: "Settings > MCP Servers",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Enconvo Settings and find the MCP servers section",
      "Add the JSON config or enter the server details manually",
      "Confirm \"agentsafe\" appears and is connected",
    ],
    examplePrompt:
      "Use Agent Safe to scan this message for threats:",
  },
  {
    id: "goose",
    name: "Goose",
    icon: <LetterIcon letter="Go" />,
    configPath: "~/.config/goose/config.yaml",
    config: `extensions:
  agentsafe:
    name: agentsafe
    cmd: npx
    args:
      - '-y'
      - 'mcp-remote'
      - 'https://agentsafe.locationledger.com/mcp'
      - '--header'
      - 'skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>'
    enabled: true
    type: stdio`,
    configRaw: `extensions:\n  agentsafe:\n    name: agentsafe\n    cmd: npx\n    args: ['-y', 'mcp-remote', 'https://agentsafe.locationledger.com/mcp', '--header', 'skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>']\n    enabled: true\n    type: stdio`,
    verifySteps: [
      "Run goose configure or edit ~/.config/goose/config.yaml directly",
      "Start a Goose session with goose session",
      "Ask Goose to list available tools — agentsafe should appear",
    ],
    examplePrompt:
      "Use Agent Safe to check this suspicious email:",
  },
  {
    id: "highlight",
    name: "Highlight",
    icon: <LetterIcon letter="Hi" />,
    configPath: "MCP settings in Highlight",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Highlight's MCP configuration settings",
      "Add the JSON config for agentsafe",
      "Confirm the server connects and tools are available",
    ],
    examplePrompt:
      "Check this message for phishing with Agent Safe:",
  },
  {
    id: "librechat",
    name: "LibreChat",
    icon: <LetterIcon letter="LC" />,
    configPath: "librechat.yaml",
    config: `mcpServers:
  agentsafe:
    type: stdio
    command: npx
    args:
      - -y
      - mcp-remote
      - https://agentsafe.locationledger.com/mcp
      - --header
      - "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"`,
    configRaw: `mcpServers:\n  agentsafe:\n    type: stdio\n    command: npx\n    args: [-y, mcp-remote, https://agentsafe.locationledger.com/mcp, --header, "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"]`,
    verifySteps: [
      "Add the config to your librechat.yaml file",
      "Restart LibreChat for the MCP server to initialize",
      "Select a tool-compatible model and check the tools dropdown below the chat input",
    ],
    examplePrompt:
      "Use Agent Safe to analyze this email for threats:",
  },
  {
    id: "poke",
    name: "Poke",
    icon: <LetterIcon letter="Pk" />,
    configPath: "MCP settings in Poke",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Poke's MCP server configuration",
      "Add the JSON config for agentsafe",
      "Confirm the server connects and tools are available",
    ],
    examplePrompt:
      "Run Agent Safe on this suspicious message:",
  },
  {
    id: "qordinate",
    name: "Qordinate",
    icon: <LetterIcon letter="Qo" />,
    configPath: "MCP settings in Qordinate",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Qordinate's MCP server configuration",
      "Add the JSON config for agentsafe",
      "Confirm the server connects and tools are available",
    ],
    examplePrompt:
      "Check this message with Agent Safe:",
  },
  {
    id: "raycast",
    name: "Raycast",
    icon: <LetterIcon letter="Ra" />,
    configPath: "Raycast Settings > Extensions > MCP",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Raycast Settings and navigate to Extensions",
      "Add Agent Safe as an MCP server",
      "Confirm agentsafe tools are available in Raycast AI",
    ],
    examplePrompt:
      "Use Agent Safe to check this message for scams:",
  },
  {
    id: "roo-code",
    name: "Roo Code",
    icon: <LetterIcon letter="Ro" />,
    configPath: ".roo/mcp.json (project) or global MCP settings",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Create .roo/mcp.json in your project root, or click \"Edit Global MCP\" in Roo Code",
      "Click the MCP icon in Roo Code to check server status",
      "Confirm \"agentsafe\" shows as connected with available tools",
    ],
    examplePrompt:
      "Use agentsafe to analyze this email for social engineering:",
  },
  {
    id: "tome",
    name: "Tome",
    icon: <LetterIcon letter="To" />,
    configPath: "MCP settings in Tome",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Tome's MCP server configuration",
      "Add the JSON config for agentsafe",
      "Confirm the server connects and tools are available",
    ],
    examplePrompt:
      "Analyze this message for threats using Agent Safe:",
  },
  {
    id: "vscode-insiders",
    name: "VS Code Insiders",
    icon: <SiGithubcopilot className="h-5 w-5" />,
    configPath: ".vscode/mcp.json",
    config: VSCODE_CONFIG,
    configRaw: VSCODE_CONFIG_RAW,
    verifySteps: [
      "Open the .vscode/mcp.json file and click the \"Start\" button above the server entry",
      "Open GitHub Copilot Chat and switch to Agent mode",
      "Click the Tools icon in the chat panel to see agentsafe tools listed",
    ],
    examplePrompt:
      "Use the agentsafe tool to check this email for threats:",
  },
  {
    id: "witsy",
    name: "Witsy",
    icon: <LetterIcon letter="Wi" />,
    configPath: "Settings > MCP Servers",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Witsy Settings and navigate to MCP servers",
      "Add the JSON config or use Smithery to install Agent Safe",
      "Confirm \"agentsafe\" appears and tools are available",
    ],
    examplePrompt:
      "Use Agent Safe to check this message for phishing:",
  },
];

const UNIVERSAL_CONFIG = STANDARD_CONFIG;

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

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {AGENTS.map((a) => (
            <Button
              key={a.id}
              variant={selectedAgent === a.id ? "outline" : "ghost"}
              size="sm"
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
                      Step 1 — {agent.id === "chatgpt" ? "Enable Developer Mode" : agent.id === "grok" ? "Open the xAI developer panel" : agent.id === "claude-code" || agent.id === "codex-cli" ? "Open your terminal" : "Open your config file"}
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
                        Step 2 — {agent.id === "claude-code" || agent.id === "codex-cli" ? "Run this command" : agent.id === "chatgpt" || agent.id === "grok" ? "Enter these details" : "Paste this config"}
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
