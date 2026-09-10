import { Zap } from "lucide-react";
import { FB_LOGO_URL } from "@/lib/api";

export const Navbar = () => (
  <header
    data-testid="main-navbar"
    className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#07080B]/80 border-b border-line"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 group">
        <a
          href={FB_LOGO_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="nav-logo-facebook"
          aria-label="Facebook WillJustPlay"
          className="w-8 h-8 grid place-items-center bg-neon text-void transition-transform duration-300 hover:rotate-12"
        >
          <Zap size={17} strokeWidth={2.75} />
        </a>
        <a href="#top" data-testid="nav-logo" className="font-display font-extrabold text-sm tracking-tight uppercase">
          Will<span className="text-neon">Just</span>Play
        </a>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.25em] text-slate-400">
        <a data-testid="nav-link-catalog" href="#katalog" className="hover:text-neon transition-colors duration-200">
          Katalog
        </a>
        <a data-testid="nav-link-howto" href="#cara-kerja" className="hover:text-neon transition-colors duration-200">
          Cara Kerja
        </a>
        <a data-testid="nav-link-testimonials" href="#testimoni" className="hover:text-neon transition-colors duration-200">
          Testimoni
        </a>
        <a data-testid="nav-link-contact" href="#kontak" className="hover:text-neon transition-colors duration-200">
          Kontak
        </a>
      </nav>
    </div>
  </header>
);
