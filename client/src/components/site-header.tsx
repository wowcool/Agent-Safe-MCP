import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Menu, X } from "lucide-react";
import logoImg from "@assets/mcp-logo-v4.png";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-black/60 backdrop-blur-[10px] sticky top-0 z-[999]">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" data-testid="link-logo-home">
            <img src={logoImg} alt="Agent Safe" className="h-6 w-6" />
            <span className="text-white font-medium text-lg whitespace-nowrap" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-3" data-testid="nav-desktop">
          <Link href="/how-it-works">
            <Button variant="ghost" className={location === "/how-it-works" ? "text-white" : "text-white/80"} data-testid="link-how-header">How It Works</Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" className={location === "/docs" ? "text-white" : "text-white/80"} data-testid="link-docs-header">Docs</Button>
          </Link>
          <a href="https://skyfire.xyz" target="_blank" rel="noopener">
            <Button variant="outline" data-testid="link-skyfire-header">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Skyfire
            </Button>
          </a>
        </nav>

        <Button
          size="icon"
          variant="ghost"
          className="md:hidden text-white/80"
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10" style={{ background: "rgba(0,0,0,0.9)" }} data-testid="nav-mobile">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
            <Link href="/how-it-works">
              <Button variant="ghost" className={`w-full justify-start ${location === "/how-it-works" ? "text-white" : "text-white/70"}`} data-testid="link-how-mobile">How It Works</Button>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" className={`w-full justify-start ${location === "/docs" ? "text-white" : "text-white/70"}`} data-testid="link-docs-mobile">Docs</Button>
            </Link>
            <a href="https://skyfire.xyz" target="_blank" rel="noopener">
              <Button variant="ghost" className="w-full justify-start text-white/70" data-testid="link-skyfire-mobile">
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
