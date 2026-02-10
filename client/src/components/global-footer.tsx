import { Link } from "wouter";
import logoImg from "@assets/mcp-logo-v4.png";

export function GlobalFooter() {
  return (
    <footer className="relative py-16 px-6" style={{ background: "linear-gradient(180deg, #0a1628 0%, #030a14 100%)", borderTop: "1px solid rgba(16, 106, 243, 0.3)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16, 106, 243, 0.6) 50%, transparent 100%)" }} />
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Link href="/">
              <div className="flex items-center gap-2.5 mb-4 cursor-pointer">
                <img src={logoImg} alt="Agent Safe" className="h-5 w-5" />
                <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
              </div>
            </Link>
            <p className="text-white/80 text-sm leading-relaxed max-w-xs" data-testid="text-footer-tagline">
              A Remote MCP Server that protects AI agents from phishing, social engineering, and manipulation via email.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">MCP SERVER</h4>
            <ul className="space-y-2">
              <li><Link href="/how-it-works" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-how">How It Works</Link></li>
              <li><Link href="/docs" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-docs">Documentation</Link></li>
              <li><a href="https://agentsafe.locationledger.com/mcp" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-endpoint">MCP Endpoint</a></li>
              <li><a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-skyfire">Skyfire Network</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li><a href="https://locationledger.com" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-parent">Location Ledger</a></li>
              <li><a href="https://support.locationledger.com" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-support">Support</a></li>
              <li><Link href="/terms" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: "1px solid #232323" }}>
          <p className="text-white/50 text-sm" data-testid="text-copyright">Part of the Anti-Deepfake/Agent Abuse protection suite</p>
          <p className="text-white/40 text-xs">ALIBI LEDGER, LLC</p>
        </div>
      </div>
    </footer>
  );
}
