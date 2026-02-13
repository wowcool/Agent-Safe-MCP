import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import locationLedgerMark from "@assets/location-ledger-mark.svg";
import proofOfLifeMark from "@assets/proof-of-life-mark.svg";
import agentSafeMark from "@assets/agent-safe-radar-mark.svg";

const SUITE_ITEMS = [
  {
    name: "Location Ledger",
    href: "https://www.locationledger.com",
    icon: locationLedgerMark,
    alt: "Location Ledger",
  },
  {
    name: "Proof of Life",
    href: "https://proofoflife.io/",
    icon: proofOfLifeMark,
    alt: "Proof of Life",
  },
  {
    name: "Agent Safe",
    href: "https://agentsafe.locationledger.com/",
    icon: agentSafeMark,
    alt: "Agent Safe",
  },
];

export function SiteHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [suiteOpen, setSuiteOpen] = useState(false);
  const [mobileSuiteOpen, setMobileSuiteOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileSuiteOpen(false);
  }, [location]);

  const handleSuiteEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSuiteOpen(true);
  }, []);

  const handleSuiteLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setSuiteOpen(false);
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <header className="bg-background/60 backdrop-blur-[10px] sticky top-0 z-[999] border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" data-testid="link-logo-home">
            <img src={agentSafeMark} alt="Agent Safe" className="h-6 w-6" />
            <span className="font-medium text-lg whitespace-nowrap" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-3" data-testid="nav-desktop">
          <div
            className="relative"
            onMouseEnter={handleSuiteEnter}
            onMouseLeave={handleSuiteLeave}
            data-testid="nav-ai-defense"
          >
            <Button
              variant="ghost"
              className="text-muted-foreground gap-1"
              data-testid="button-ai-defense-trigger"
            >
              AI Defense Suite™
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${suiteOpen ? "rotate-180" : ""}`} />
            </Button>
          </div>

          <Link href="/">
            <Button variant="ghost" className={location === "/" ? "text-foreground" : "text-muted-foreground"} data-testid="link-home-header">Home</Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="ghost" className={location === "/how-it-works" ? "text-foreground" : "text-muted-foreground"} data-testid="link-how-header">How It Works</Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" className={location === "/docs" ? "text-foreground" : "text-muted-foreground"} data-testid="link-docs-header">Docs</Button>
          </Link>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <a href="https://skyfire.xyz" target="_blank" rel="noopener">
            <Button variant="outline" data-testid="link-skyfire-header">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Skyfire
            </Button>
          </a>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle-mobile"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={`hidden md:block fixed top-16 left-0 right-0 z-[998] transition-all duration-300 ease-out ${
          suiteOpen
            ? "opacity-100 visible translate-y-0 pointer-events-auto"
            : "opacity-0 invisible -translate-y-2.5 pointer-events-none"
        }`}
        style={{ background: "#0d1731", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
        onMouseEnter={handleSuiteEnter}
        onMouseLeave={handleSuiteLeave}
        data-testid="panel-ai-defense-dropdown"
      >
        <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-4 flex flex-col items-center">
          <p
            className="text-center text-white/90 font-medium mb-4 leading-relaxed max-w-[40rem]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "calc(16px + 0.125rem)" }}
          >
            Agent Safe is part of our anti-deepfake and agent abuse protection suite built for today and the very near future.
          </p>
          <div className="flex justify-center gap-12">
            {SUITE_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-end gap-3 no-underline px-6 py-4 rounded-xl transition-colors duration-200 min-w-[140px] hover:bg-white/[0.06]"
                data-testid={`link-suite-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-end justify-center flex-1">
                  <img src={item.icon} alt={item.alt} className="max-h-10 w-auto object-contain" />
                </div>
                <span className="text-white font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm" data-testid="nav-mobile">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
            <Button
              variant="ghost"
              onClick={() => setMobileSuiteOpen(!mobileSuiteOpen)}
              className="w-full justify-between text-muted-foreground"
              data-testid="button-ai-defense-mobile"
            >
              <span>AI Defense Suite™</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileSuiteOpen ? "rotate-180" : ""}`} />
            </Button>

            {mobileSuiteOpen && (
              <div className="rounded-lg border border-border/50 overflow-hidden" style={{ background: "#0d1731" }}>
                <p className="text-xs text-white/70 px-4 pt-3 pb-2 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Anti-deepfake &amp; agent abuse protection suite
                </p>
                <div className="flex flex-col gap-1 px-2 pb-2">
                  {SUITE_ITEMS.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md no-underline hover:bg-white/[0.06] transition-colors"
                      data-testid={`link-suite-mobile-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <img src={item.icon} alt={item.alt} className="h-6 w-6 object-contain" />
                      <span className="text-white text-sm font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {item.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Link href="/">
              <Button variant="ghost" className={`w-full justify-start ${location === "/" ? "text-foreground" : "text-muted-foreground"}`} data-testid="link-home-mobile">Home</Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="ghost" className={`w-full justify-start ${location === "/how-it-works" ? "text-foreground" : "text-muted-foreground"}`} data-testid="link-how-mobile">How It Works</Button>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" className={`w-full justify-start ${location === "/docs" ? "text-foreground" : "text-muted-foreground"}`} data-testid="link-docs-mobile">Docs</Button>
            </Link>
            <a href="https://skyfire.xyz" target="_blank" rel="noopener">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" data-testid="link-skyfire-mobile">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Skyfire
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
