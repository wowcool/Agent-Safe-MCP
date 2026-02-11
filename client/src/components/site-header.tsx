import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink, Menu, X, Sun, Moon } from "lucide-react";
import logoImg from "@assets/mcp-logo-v4.png";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

export function SiteHeader() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-background/60 backdrop-blur-[10px] sticky top-0 z-[999] border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" data-testid="link-logo-home">
            <img src={logoImg} alt="Agent Safe" className="h-6 w-6" />
            <span className="font-medium text-lg whitespace-nowrap" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-3" data-testid="nav-desktop">
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

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm" data-testid="nav-mobile">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
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
