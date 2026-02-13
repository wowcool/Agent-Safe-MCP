import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, CheckCircle2, ArrowRight, ExternalLink, Settings, ChevronDown } from "lucide-react";
import { SiClaude, SiCodeium, SiGithubcopilot, SiGooglegemini, SiAmazonwebservices, SiRaycast, SiOpenai } from "react-icons/si";

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
  | "claude-desktop" | "claude-code" | "cursor" | "windsurf"
  | "vscode" | "gemini-cli"
  | "amazon-q" | "augment" | "boltai" | "cline"
  | "codex-cli" | "enconvo" | "goose" | "highlight"
  | "librechat" | "raycast" | "roo-code" | "witsy";

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="m415.035 156.35-151.503-87.4695c-4.865-2.8094-10.868-2.8094-15.733 0l-151.4969 87.4695c-4.0897 2.362-6.6146 6.729-6.6146 11.459v176.383c0 4.73 2.5249 9.097 6.6146 11.458l151.5039 87.47c4.865 2.809 10.868 2.809 15.733 0l151.504-87.47c4.089-2.361 6.614-6.728 6.614-11.458v-176.383c0-4.73-2.525-9.097-6.614-11.459zm-9.516 18.528-146.255 253.32c-.988 1.707-3.599 1.01-3.599-.967v-165.872c0-3.314-1.771-6.379-4.644-8.044l-143.645-82.932c-1.707-.988-1.01-3.599.968-3.599h292.509c4.154 0 6.75 4.503 4.673 8.101h-.007z" fill="currentColor"/>
    </svg>
  );
}

function ClineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.36 7.5 12 10.82 5.64 7.5 12 4.18zM5 9.06l6 3.33v6.55L5 15.61V9.06zm8 9.88v-6.55l6-3.33v6.55l-6 3.33z"/>
    </svg>
  );
}

function RooCodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 3C13.57 3 12 4.57 12 6.5c0 .55.13 1.07.36 1.53L8.54 11.85A3.48 3.48 0 0 0 7 11.5C5.07 11.5 3.5 13.07 3.5 15S5.07 18.5 7 18.5c1.58 0 2.92-1.05 3.36-2.5h3.28c.44 1.45 1.78 2.5 3.36 2.5 1.93 0 3.5-1.57 3.5-3.5 0-1.58-1.05-2.92-2.5-3.36V8.36C19.45 7.92 20.5 6.58 20.5 5c0-1.93-1.57-3.5-3.5-3.5H15.5zM17 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7 13.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm10 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
    </svg>
  );
}

function GooseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 2C9.12 2 8 3.12 8 4.5c0 .58.2 1.11.53 1.53L5.3 10.5C4.5 10 3.79 10 3 10.5c-1.1.7-1.5 2.1-.8 3.3.4.7 1 1.1 1.8 1.2v4c0 1.66 1.34 3 3 3h10c1.66 0 3-1.34 3-3v-4c.77-.1 1.4-.5 1.8-1.2.7-1.2.3-2.6-.8-3.3-.79-.5-1.5-.5-2.3 0L15.47 6.03c.33-.42.53-.95.53-1.53C16 3.12 14.88 2 13.5 2h-3zM12 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-5 8h10v6H7v-6z"/>
    </svg>
  );
}

function AugmentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      <path d="M2 17l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BoltAIIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
    </svg>
  );
}

function LibreChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z"/>
    </svg>
  );
}

function EnconvoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 6h-2V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM7 4h10v2H7V4zm14 14H3V8h18v10zm-7-8H10v2h4v-2zm-4 3h4v2h-4v-2z"/>
    </svg>
  );
}

function HighlightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.24 2.69l5.66 5.66a.5.5 0 0 1 0 .71l-8.49 8.49a.5.5 0 0 1-.35.15H7.41a.5.5 0 0 1-.35-.15L2.4 12.9a.5.5 0 0 1 0-.71l8.49-8.49a.5.5 0 0 1 .71 0l3.64-1.01zM3 21h18v2H3v-2z"/>
    </svg>
  );
}

function WitsyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14 2 9.2h7.6L12 2z"/>
    </svg>
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

const POPULAR_AGENT_IDS: AgentId[] = [
  "claude-desktop", "claude-code", "cursor",
  "windsurf", "vscode", "gemini-cli", "cline", "codex-cli",
];

const AGENTS: AgentInfo[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    icon: <SiClaude className="h-4 w-4" />,
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
    icon: <SiClaude className="h-4 w-4" />,
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
    icon: <CursorIcon className="h-4 w-4" />,
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
    icon: <SiCodeium className="h-4 w-4" />,
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
    icon: <SiGithubcopilot className="h-4 w-4" />,
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
    id: "gemini-cli",
    name: "Gemini CLI",
    icon: <SiGooglegemini className="h-4 w-4" />,
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
    id: "cline",
    name: "Cline",
    icon: <ClineIcon className="h-4 w-4" />,
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
    icon: <SiOpenai className="h-4 w-4" />,
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
    id: "roo-code",
    name: "Roo Code",
    icon: <RooCodeIcon className="h-4 w-4" />,
    configPath: ".roo/mcp.json (project) or Edit Global MCP in Roo Code panel",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Create .roo/mcp.json in your project root, or click the MCP icon in Roo Code and select \"Edit Global MCP\"",
      "Save the file — Roo Code auto-detects and loads MCP servers",
      "Click the MCP icon to confirm \"agentsafe\" shows as connected with available tools",
    ],
    examplePrompt:
      "Use agentsafe to analyze this email for social engineering:",
  },
  {
    id: "amazon-q",
    name: "Amazon Q Developer",
    icon: <SiAmazonwebservices className="h-4 w-4" />,
    configPath: "~/.aws/amazonq/mcp.json (CLI) or .amazonq/mcp.json (workspace)",
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
      "Open Amazon Q Developer in your IDE or start a CLI session with q chat",
      "Click the Tools icon or run /tools to see available MCP servers",
      "Confirm \"agentsafe\" appears and shows as connected",
    ],
    examplePrompt:
      "Use Agent Safe to analyze this suspicious message:",
  },
  {
    id: "augment",
    name: "Augment Code",
    icon: <AugmentIcon className="h-4 w-4" />,
    configPath: "Augment Panel > Settings > Tools > Import from JSON",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open the Augment panel, click the menu icon, then Settings > Tools",
      "Click \"Import from JSON\" and paste the config above",
      "Click Confirm — agentsafe should appear in the MCP list. Toggle it on.",
    ],
    examplePrompt:
      "Check this email for social engineering using Agent Safe:",
  },
  {
    id: "boltai",
    name: "BoltAI",
    icon: <BoltAIIcon className="h-4 w-4" />,
    configPath: "~/.boltai/mcp.json",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Edit ~/.boltai/mcp.json or go to Settings > Plugins > MCP Servers and paste the config",
      "You can also import from Cursor or Claude Desktop via Settings > Plugins > Import",
      "Restart BoltAI and confirm \"agentsafe\" appears in the plugins list",
    ],
    examplePrompt:
      "Run Agent Safe on this suspicious message I received:",
  },
  {
    id: "enconvo",
    name: "Enconvo",
    icon: <EnconvoIcon className="h-4 w-4" />,
    configPath: "Settings > MCP Servers or MCP Store",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Enconvo Settings and navigate to MCP Servers",
      "Add the JSON config or paste the command and args manually",
      "Confirm \"agentsafe\" appears and is connected",
    ],
    examplePrompt:
      "Use Agent Safe to scan this message for threats:",
  },
  {
    id: "goose",
    name: "Goose",
    icon: <GooseIcon className="h-4 w-4" />,
    configPath: "~/.config/goose/config.yaml",
    config: `extensions:
  agentsafe:
    name: agentsafe
    type: stdio
    cmd: npx
    args:
      - '-y'
      - 'mcp-remote'
      - 'https://agentsafe.locationledger.com/mcp'
      - '--header'
      - 'skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>'
    enabled: true
    timeout: 300`,
    configRaw: `extensions:\n  agentsafe:\n    name: agentsafe\n    type: stdio\n    cmd: npx\n    args: ['-y', 'mcp-remote', 'https://agentsafe.locationledger.com/mcp', '--header', 'skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>']\n    enabled: true\n    timeout: 300`,
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
    icon: <HighlightIcon className="h-4 w-4" />,
    configPath: "Settings > Plugins > Custom Plugin (stdio type)",
    config: `Command: npx
Args: -y mcp-remote https://agentsafe.locationledger.com/mcp --header "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
Plugin Name: agentsafe`,
    configRaw: `npx -y mcp-remote https://agentsafe.locationledger.com/mcp --header "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"`,
    verifySteps: [
      "Go to Plugins page in Highlight and click \"Custom Plugin\"",
      "Select \"stdio\" as the plugin type",
      "Enter the command (npx) and args above, set Plugin Name to \"agentsafe\"",
      "The plugin should appear in your installed plugins list",
    ],
    examplePrompt:
      "Check this message for phishing with Agent Safe:",
  },
  {
    id: "librechat",
    name: "LibreChat",
    icon: <LibreChatIcon className="h-4 w-4" />,
    configPath: "librechat.yaml",
    config: `mcpServers:
  agentsafe:
    type: streamable-http
    url: https://agentsafe.locationledger.com/mcp
    headers:
      skyfire-api-key: "<YOUR_SKYFIRE_BUYER_API_KEY>"`,
    configRaw: `mcpServers:\n  agentsafe:\n    type: streamable-http\n    url: https://agentsafe.locationledger.com/mcp\n    headers:\n      skyfire-api-key: "<YOUR_SKYFIRE_BUYER_API_KEY>"`,
    verifySteps: [
      "Add the config to your librechat.yaml file",
      "Add agentsafe.locationledger.com to your mcpSettings allowedDomains list",
      "Restart LibreChat for the MCP server to initialize",
      "Select a tool-compatible model and check the tools dropdown below the chat input",
    ],
    examplePrompt:
      "Use Agent Safe to analyze this email for threats:",
  },
  {
    id: "raycast",
    name: "Raycast",
    icon: <SiRaycast className="h-4 w-4" />,
    configPath: "Manage MCP Servers > Show Config File in Finder",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Open Raycast and type \"Manage MCP Servers\"",
      "Select \"Show Config File in Finder\" to open mcp-config.json",
      "Paste the config and save — agentsafe tools will appear when you @mention MCP in AI Chat",
    ],
    examplePrompt:
      "Use Agent Safe to check this message for scams:",
  },
  {
    id: "witsy",
    name: "Witsy",
    icon: <WitsyIcon className="h-4 w-4" />,
    configPath: "Settings > MCP Servers",
    config: STANDARD_CONFIG,
    configRaw: STANDARD_CONFIG_RAW,
    verifySteps: [
      "Click the fountain pen icon in the menu bar, then Settings > MCP Servers",
      "Add a new server with the command and args from the config above",
      "Confirm \"agentsafe\" appears and tools are available in your chat",
    ],
    examplePrompt:
      "Use Agent Safe to check this message for phishing:",
  },
];

const UNIVERSAL_CONFIG = STANDARD_CONFIG;

const popularAgents = AGENTS.filter((a) => POPULAR_AGENT_IDS.includes(a.id));
const moreAgents = AGENTS.filter((a) => !POPULAR_AGENT_IDS.includes(a.id));

export function AgentQuickStart() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("claude-desktop");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const agent = AGENTS.find((a) => a.id === selectedAgent)!;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

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

        <div className="relative max-w-sm mx-auto mb-8" ref={dropdownRef}>
          <Button
            variant="outline"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full justify-between gap-3"
            data-testid="button-agent-selector"
          >
            <span className="flex items-center gap-2">
              {agent.icon}
              <span className="font-medium">{agent.name}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </Button>

          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
              <div className="max-h-80 overflow-y-auto py-1">
                <p className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Popular</p>
                {popularAgents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAgent(a.id); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover-elevate cursor-pointer ${
                      selectedAgent === a.id ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    data-testid={`button-agent-${a.id}`}
                  >
                    {a.icon}
                    <span>{a.name}</span>
                  </button>
                ))}
                <div className="mx-3 my-1 border-t" />
                <p className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">More Agents</p>
                {moreAgents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAgent(a.id); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover-elevate cursor-pointer ${
                      selectedAgent === a.id ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    data-testid={`button-agent-${a.id}`}
                  >
                    {a.icon}
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
                      Step 1 — {agent.id === "claude-code" || agent.id === "codex-cli" ? "Open your terminal" : agent.id === "highlight" ? "Open the Plugins page" : "Open your config file"}
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
                        Step 2 — {agent.id === "claude-code" || agent.id === "codex-cli" ? "Run this command" : agent.id === "highlight" ? "Enter these details" : "Paste this config"}
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
