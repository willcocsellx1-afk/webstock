import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, Home, MessageCircle } from "lucide-react";
import { waLink } from "@/lib/api";

export default function PaymentCancel() {
  return (
    <div data-testid="payment-cancel-page" className="min-h-screen bg-void grid-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-panel border border-line p-10 text-center"
      >
        <XCircle size={60} className="mx-auto text-coral" data-testid="payment-cancel-icon" />
        <h1 className="font-display font-black uppercase text-xl mt-6" data-testid="payment-cancel-title">
          Pembayaran <span className="text-coral">Dibatalkan</span>
        </h1>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Tidak masalah! Kamu bisa kembali ke katalog dan mencoba lagi kapan saja.
          Tidak ada biaya yang dikenakan.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Link
            to="/"
            data-testid="cancel-back-home-button"
            className="flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300"
          >
            <Home size={14} /> Kembali ke Katalog
          </Link>
          <a
            href={waLink("Halo NEXUSGAME, saya mengalami kendala saat pembayaran.")}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="cancel-cs-button"
            className="flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors duration-300"
          >
            <MessageCircle size={13} /> Hubungi CS
          </a>
        </div>
      </motion.div>
    </div>
  );
}
