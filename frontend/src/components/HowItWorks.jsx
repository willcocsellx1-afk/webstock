import { motion } from "framer-motion";
import { MousePointerClick, CreditCard, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: MousePointerClick,
    title: "Pilih Akun / Jasa",
    desc: "Cari produk game impianmu di katalog atau pilih paket jasa joki rank sesuai kebutuhan & budget.",
  },
  {
    num: "02",
    icon: CreditCard,
    title: "Bayar Instant",
    desc: "Lakukan pembayaran aman via Stripe. Proses otomatis, terenkripsi, dan terverifikasi real-time.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Terima & Garansi",
    desc: "Data akun atau proses joki langsung dikirim dalam 5-15 menit. Dilengkapi garansi 100% aman.",
  },
];

export const HowItWorks = () => (
  <section id="cara-kerja" data-testid="how-it-works-section" className="py-16 sm:py-24 border-t border-line bg-[#0A0D14]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.3em] text-neon/90 font-mono mb-3">
        02 &mdash; Cara Kerja
      </p>
      <h2 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl mb-14" data-testid="how-it-works-title">
        Tiga Langkah. <span className="text-stroke">Nol Ribet.</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            data-testid={`step-card-${s.num}`}
            className="group relative bg-panel border border-line hover:border-neon/40 p-7 transition-colors duration-300"
          >
            <span className="font-display font-black text-6xl text-stroke opacity-60 group-hover:opacity-100 transition-opacity duration-300">
              {s.num}
            </span>
            <div className="mt-6 flex items-center gap-3">
              <span className="w-9 h-9 grid place-items-center border border-neon/40 text-neon">
                <s.icon size={16} />
              </span>
              <h3 className="font-display font-bold text-base uppercase tracking-tight">{s.title}</h3>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">{s.desc}</p>
            <span className="absolute top-0 left-0 w-0 h-px bg-neon transition-all duration-500 group-hover:w-full" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
