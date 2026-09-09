import { Zap, ShieldCheck, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { waLink } from "@/lib/api";

export const Navbar = () => (
  <header
    data-testid="main-navbar"
    className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#07080B]/80 border-b border-line"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <a href="#top" data-testid="nav-logo" className="flex items-center gap-2.5 group">
        <span className="w-8 h-8 grid place-items-center bg-neon text-void transition-transform duration-300 group-hover:rotate-12">
          <Zap size={17} strokeWidth={2.75} />
        </span>
        <span className="font-display font-extrabold text-sm tracking-tight uppercase">
          Nexus<span className="text-neon">Game</span>
        </span>
      </a>

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

      <div className="flex items-center gap-2">
        <Link
          to="/admin"
          data-testid="nav-admin-button"
          className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-400 hover:text-neon border border-line hover:border-neon/50 px-3 py-2 transition-colors duration-200"
        >
          <ShieldCheck size={13} />
          <span className="hidden sm:inline">Admin</span>
        </Link>
        <a
          href={waLink("Halo NEXUSGAME, saya butuh bantuan CS.")}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="nav-whatsapp-button"
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-neon text-void px-3.5 py-2 hover:bg-lime transition-colors duration-200"
        >
          <MessageCircle size={13} />
          <span className="hidden sm:inline">Live CS</span>
        </a>
      </div>
    </div>
  </header>
);
