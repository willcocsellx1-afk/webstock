import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Clock, Home, MessageCircle } from "lucide-react";
import { api, waLink } from "@/lib/api";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setStatus("paid");
          clearInterval(timer);
        } else if (tries > 12) {
          setStatus("pending");
          clearInterval(timer);
        }
      } catch {
        if (tries > 12) {
          setStatus("error");
          clearInterval(timer);
        }
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [sessionId]);

  return (
    <div data-testid="payment-success-page" className="min-h-screen bg-void grid-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-panel border border-line p-10 text-center"
      >
        {status === "checking" && (
          <>
            <Loader2 size={52} className="mx-auto text-neon animate-spin" data-testid="payment-checking-icon" />
            <h1 className="font-display font-bold uppercase text-lg mt-6">Memverifikasi Pembayaran...</h1>
            <p className="text-xs text-slate-400 mt-3 font-mono">Mohon tunggu, kami sedang mengonfirmasi transaksimu.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
              <CheckCircle2 size={60} className="mx-auto text-lime" data-testid="payment-paid-icon" />
            </motion.div>
            <h1 className="font-display font-black uppercase text-xl mt-6" data-testid="payment-success-title">
              Pembayaran <span className="text-lime">Berhasil</span>
            </h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Pesananmu sudah kami terima. Data akun / detail pesanan akan dikirim
              via WhatsApp dalam 5-15 menit.
            </p>
            <p className="text-[10px] font-mono text-slate-600 mt-4 break-all" data-testid="payment-session-id">
              ID Sesi: {sessionId}
            </p>
          </>
        )}
        {status === "pending" && (
          <>
            <Clock size={52} className="mx-auto text-neon" data-testid="payment-pending-icon" />
            <h1 className="font-display font-bold uppercase text-lg mt-6">Pembayaran Diproses</h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Pembayaranmu masih dalam proses konfirmasi. Hubungi CS jika butuh bantuan.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <Clock size={52} className="mx-auto text-coral" data-testid="payment-error-icon" />
            <h1 className="font-display font-bold uppercase text-lg mt-6">Tidak Dapat Memverifikasi</h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Kami tidak menemukan sesi pembayaran ini. Hubungi CS untuk bantuan.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <Link
            to="/"
            data-testid="payment-back-home-button"
            className="flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300"
          >
            <Home size={14} /> Kembali ke Beranda
          </Link>
          <a
            href={waLink(`Halo WillJustPlay, saya mau tanya pesanan dengan sesi: ${sessionId || "-"}`)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="payment-cs-button"
            className="flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors duration-300"
          >
            <MessageCircle size={13} /> Hubungi CS
          </a>
        </div>
      </motion.div>
    </div>
  );
}
