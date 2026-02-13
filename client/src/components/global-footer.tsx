import { Link } from "wouter";
import logoImg from "@assets/agent-safe-radar-mark.svg";

export function GlobalFooter() {
  return (
    <footer className="relative py-16 px-6 bg-card border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Link href="/">
              <div className="flex items-center gap-2.5 mb-4 cursor-pointer">
                <img src={logoImg} alt="Agent Safe" className="h-5 w-5" />
                <span className="font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs" data-testid="text-footer-tagline">
              A Remote MCP Server that protects AI agents from phishing, social engineering, and manipulation via email.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">MCP SERVER</h4>
            <ul className="space-y-2">
              <li><Link href="/how-it-works" className="text-muted-foreground text-sm" data-testid="link-footer-how">How It Works</Link></li>
              <li><Link href="/docs" className="text-muted-foreground text-sm" data-testid="link-footer-docs">Documentation</Link></li>
              <li><a href="https://agentsafe.locationledger.com/mcp" target="_blank" rel="noopener" className="text-muted-foreground text-sm" data-testid="link-footer-endpoint">MCP Endpoint</a></li>
              <li><a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-muted-foreground text-sm" data-testid="link-footer-skyfire">Skyfire Network</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li><a href="https://locationledger.com" target="_blank" rel="noopener" className="text-muted-foreground text-sm" data-testid="link-footer-parent">Location Ledger</a></li>
              <li><a href="https://support.locationledger.com" target="_blank" rel="noopener" className="text-muted-foreground text-sm" data-testid="link-footer-support">Support</a></li>
              <li><Link href="/terms" className="text-muted-foreground text-sm" data-testid="link-footer-terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border">
          <p className="text-muted-foreground text-sm" data-testid="text-copyright">Part of the Anti-Deepfake/Agent Abuse protection suite</p>
          <p className="text-muted-foreground/60 text-xs">&copy; 2026 ALIBI LEDGER, LLC</p>
        </div>
      </div>
    </footer>
  );
}
