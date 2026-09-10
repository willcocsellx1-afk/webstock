import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, Facebook, ShieldCheck, Timer, BadgeCheck } from "lucide-react";
import { formatIDR, imgSrc, FB_URL } from "@/lib/api";

const LINES = [
  { text: "BELI AKUN GAME", cls: "text-slate-100" },
  { text: "& JASA JOKI", cls: "text-neon" },
  { text: "INSTANT.", cls: "text-stroke" },
];

const EASE = [0.16, 1, 0.3, 1];

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K+` : `${n}`);

export const Hero = ({ featured, products = [] }) => {
  const totalSold = products.reduce((s, p) => s + (p.sold || 0), 0);
  const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : "5.0";
  const ref = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 120, damping: 18 });

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMove}
      data-testid="hero-section"
      className="relative overflow-hidden grid-bg pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-neon/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-coral/10 blur-[140px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-2 h-2 bg-lime animate-pulse-dot" />
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-neon/90 font-mono" data-testid="hero-eyebrow">
              Marketplace Game Indonesia &bull; 100% Garansi Aman
            </p>
          </motion.div>

          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.95] text-4xl sm:text-5xl lg:text-6xl" data-testid="hero-title">
            {LINES.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2 + i * 0.14, duration: 0.9, ease: EASE }}
                  className={`block ${line.cls}`}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8, ease: EASE }}
            className="mt-7 max-w-xl text-sm sm:text-base leading-relaxed text-slate-400"
            data-testid="hero-subtitle"
          >
            Store game terpercaya, dapatkan akun game berkualitas dan joki dengan
            harga terjangkau, proses cepat dan tanpa ribet juga bergaransi.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#katalog"
              data-testid="hero-cta-catalog"
              className="group inline-flex items-center gap-3 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] px-7 py-4 hover:bg-lime transition-colors duration-300"
            >
              Jelajahi Katalog
              <ArrowDown size={15} className="transition-transform duration-300 group-hover:translate-y-1" />
            </a>
            <a
              href={FB_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-cta-social"
              className="inline-flex items-center gap-3 border border-line hover:border-neon/60 text-slate-300 hover:text-neon font-display font-bold text-xs uppercase tracking-[0.2em] px-7 py-4 transition-colors duration-300"
            >
              <Facebook size={15} />
              Sosial Media
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="mt-14 grid grid-cols-3 max-w-md divide-x divide-line border border-line"
            data-testid="hero-metrics"
          >
            {[
              { v: compact(totalSold), l: "Produk Terjual", t: "hero-metric-sold" },
              { v: `${avgRating}/5`, l: "Rating Pembeli", t: "hero-metric-rating" },
              { v: "10.00-22.00", l: "Jam Operasional", t: "hero-metric-cs" },
            ].map((s) => (
              <div key={s.l} className="px-4 py-4">
                <p className="font-display font-bold text-lg sm:text-xl text-neon" data-testid={s.t}>{s.v}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="lg:col-span-5" style={{ perspective: 1200 }}>
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 1.1, ease: EASE }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative"
            data-testid="hero-featured-card"
          >
            <div className="absolute -inset-px bg-gradient-to-br from-neon/50 via-transparent to-coral/40 pointer-events-none" />
            <div className="relative bg-panel border border-line glow-cyan">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={imgSrc(featured?.image)}
                  alt={featured?.title || "Produk unggulan"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />
                <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-neon text-void text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5">
                  <BadgeCheck size={12} /> Unggulan
                </span>
              </div>
              <div className="p-5 border-t border-line" style={{ transform: "translateZ(30px)" }}>
                <p className="text-[10px] uppercase tracking-[0.25em] text-neon mb-2">
                  {featured?.game || "Mobile Legends"}
                </p>
                <h3 className="font-display font-bold text-sm leading-snug">
                  {featured?.title || "Akun Sultan Mythic Glory"}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono font-bold text-lg text-neon">
                    {featured ? formatIDR(featured.price) : "Rp 4.500.000"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {featured?.sold ?? 214} terjual
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 top-8 hidden sm:flex items-center gap-2 bg-panel border border-lime/40 px-3 py-2 animate-float" style={{ transform: "translateZ(50px)" }}>
              <ShieldCheck size={14} className="text-lime" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-lime">Garansi 100%</span>
            </div>
            <div className="absolute -left-3 bottom-16 hidden sm:flex items-center gap-2 bg-panel border border-neon/40 px-3 py-2 animate-float" style={{ transform: "translateZ(40px)", animationDelay: "1.2s" }}>
              <Timer size={14} className="text-neon" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neon">Proses 5-15 Menit</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
