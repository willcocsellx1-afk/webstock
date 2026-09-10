import { Zap, User, LogOut, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { FB_LOGO_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const { user, openAuth, logout } = useAuth();

  return (
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
          <Link to="/" data-testid="nav-logo" className="font-display font-extrabold text-sm tracking-tight uppercase">
            Will<span className="text-neon">Just</span>Play
          </Link>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.25em] text-slate-400">
            <a data-testid="nav-link-catalog" href="/#katalog" className="hover:text-neon transition-colors duration-200">Katalog</a>
            <a data-testid="nav-link-howto" href="/#cara-kerja" className="hover:text-neon transition-colors duration-200">Cara Kerja</a>
            <a data-testid="nav-link-testimonials" href="/#testimoni" className="hover:text-neon transition-colors duration-200">Testimoni</a>
            <a data-testid="nav-link-contact" href="/#kontak" className="hover:text-neon transition-colors duration-200">Kontak</a>
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/akun"
                data-testid="nav-account-link"
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-200 hover:text-neon border border-line hover:border-neon/50 px-3 py-2 transition-colors"
              >
                <User size={13} /> {(user.name || "Akun").split(" ")[0]}
              </Link>
              <button
                onClick={logout}
                data-testid="nav-logout-button"
                aria-label="Keluar"
                className="w-8 h-8 grid place-items-center text-slate-400 hover:text-coral border border-line hover:border-coral/50 transition-colors"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuth("login")}
              data-testid="nav-login-button"
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-neon text-void px-4 py-2 hover:bg-lime transition-colors duration-300"
            >
              <User size={13} /> Masuk
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
