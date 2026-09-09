import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, PackageSearch } from "lucide-react";
import { formatIDR, imgSrc } from "@/lib/api";

const CATEGORIES = ["Semua Kategori", "Akun Game", "Jasa Joki", "Top Up Diamond"];
const SORTS = [
  { v: "populer", l: "Paling Populer" },
  { v: "termurah", l: "Termurah" },
  { v: "termahal", l: "Termahal" },
  { v: "terbaru", l: "Terbaru" },
];

export const Catalog = ({ products, loading, onSelect }) => {
  const [game, setGame] = useState("Semua Game");
  const [category, setCategory] = useState("Semua Kategori");
  const [sort, setSort] = useState("populer");
  const [q, setQ] = useState("");

  const games = useMemo(
    () => ["Semua Game", ...new Set(products.map((p) => p.game))],
    [products]
  );

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        (game === "Semua Game" || p.game === game) &&
        (category === "Semua Kategori" || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q.toLowerCase()))
    );
    const sorters = {
      termurah: (a, b) => a.price - b.price,
      termahal: (a, b) => b.price - a.price,
      populer: (a, b) => (b.sold || 0) - (a.sold || 0),
      terbaru: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    };
    return [...list].sort(sorters[sort]);
  }, [products, game, category, q, sort]);

  return (
    <section id="katalog" data-testid="catalog-section" className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neon/90 font-mono mb-3">
              01 &mdash; Katalog
            </p>
            <h2 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl" data-testid="catalog-title">
              Pilih Senjata<span className="text-neon">mu.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari akun / jasa..."
                data-testid="catalog-search-input"
                className="w-full bg-panel border border-line focus:border-neon/60 outline-none text-xs font-mono pl-9 pr-3 py-2.5 placeholder:text-slate-600 transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              data-testid="catalog-sort-select"
              className="bg-panel border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 text-slate-300 transition-colors"
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4" data-testid="catalog-category-tabs">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              data-testid={`category-tab-${c.toLowerCase().replace(/\s+/g, "-")}`}
              className={`text-[11px] font-bold uppercase tracking-widest px-4 py-2 border transition-colors duration-200 ${
                category === c
                  ? "bg-neon text-void border-neon"
                  : "border-line text-slate-400 hover:text-neon hover:border-neon/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-10" data-testid="catalog-game-chips">
          {games.map((g) => (
            <button
              key={g}
              onClick={() => setGame(g)}
              data-testid={`game-chip-${g.toLowerCase().replace(/\s+/g, "-")}`}
              className={`whitespace-nowrap text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-colors duration-200 ${
                game === g
                  ? "border-coral text-coral"
                  : "border-line text-slate-500 hover:text-slate-300 hover:border-slate-500"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="catalog-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-panel border border-line animate-pulse">
                <div className="aspect-[4/3] bg-panelhover" />
                <div className="p-4 space-y-3">
                  <div className="h-2 w-1/3 bg-panelhover" />
                  <div className="h-4 w-3/4 bg-panelhover" />
                  <div className="h-3 w-1/2 bg-panelhover" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-line bg-panel py-20 text-center" data-testid="catalog-empty">
            <PackageSearch size={36} className="mx-auto text-slate-600 mb-4" />
            <p className="text-sm text-slate-500 font-mono">Tidak ada produk ditemukan. Coba filter lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="catalog-grid">
            {filtered.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                onClick={() => onSelect(p)}
                data-testid={`product-card-${p.id}`}
                className="group text-left bg-panel border border-line hover:border-neon/50 hover:glow-cyan transition-colors duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={imgSrc(p.image)}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-transparent" />
                  {p.badge && (
                    <span className={`absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest px-2 py-1 ${
                      p.badge === "Diskon Hot" ? "bg-coral text-white" : "bg-neon text-void"
                    }`}>
                      {p.badge}
                    </span>
                  )}
                  {p.stock < 1 && (
                    <span data-testid={`stock-out-${p.id}`} className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-coral text-white">
                      Habis
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-neon">
                    {p.game}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                    {p.category}
                    {p.rank ? ` • ${p.rank}` : ""}
                  </p>
                  <h3 className="font-display font-bold text-[13px] leading-snug min-h-[2.4em]">
                    {p.title}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono font-bold text-neon" data-testid={`price-${p.id}`}>
                      {formatIDR(p.price)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.sold} terjual</span>
                  </div>
                  <span className="block text-center text-[10px] font-bold uppercase tracking-[0.25em] border border-line group-hover:bg-neon group-hover:text-void group-hover:border-neon transition-colors duration-300 py-2.5 mt-2">
                    Detail &amp; Beli
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
