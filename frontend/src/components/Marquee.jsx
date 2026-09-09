import { Sparkles } from "lucide-react";

const ITEMS = [
  "100% Garansi Akun Aman",
  "Joki Pro Player Fast Rank",
  "Top Up Otomatis 24/7",
  "Proses Hanya 5-15 Menit",
  "Chat CS WhatsApp Responsif",
];

export const Marquee = () => (
  <div
    data-testid="marquee-strip"
    className="relative border-y border-line bg-[#0A0D14] overflow-hidden py-4 select-none"
  >
    <div className="flex w-max animate-marquee">
      {[...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS].map((t, i) => (
        <span
          key={i}
          className="flex items-center gap-8 px-8 font-display text-xs uppercase tracking-[0.35em] text-neon/60"
          aria-hidden={i >= ITEMS.length * 2}
        >
          {t}
          <Sparkles size={12} className="text-coral/70" />
        </span>
      ))}
    </div>
  </div>
);
