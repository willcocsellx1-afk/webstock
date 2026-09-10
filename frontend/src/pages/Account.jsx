import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, Heart, Loader2, KeyRound, ExternalLink, Copy, LogIn, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api, formatIDR, imgSrc } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductModal } from "@/components/ProductModal";

const statusStyle = (s) =>
  s === "paid" ? "bg-lime/15 text-lime" : s === "failed" ? "bg-coral/15 text-coral" : "bg-neon/10 text-neon";

const DeliveryBox = ({ info }) => {
  const isLink = /^https?:\/\//i.test((info || "").trim());
  return (
    <div className="mt-3 border border-neon/40 bg-neon/5 p-3.5" data-testid="account-delivery-box">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound size={13} className="text-neon" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon">Info Akun / Akses</span>
      </div>
      {isLink ? (
        <a href={info.trim()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] py-2.5 hover:bg-lime transition-colors break-all">
          <ExternalLink size={13} /> Buka Link Akun
        </a>
      ) : (
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-slate-200 leading-relaxed">{info}</pre>
      )}
      <button
        onClick={() => navigator.clipboard.writeText(info).then(() => toast.success("Info akun disalin"))}
        className="mt-2 w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-400 hover:text-neon text-[10px] font-bold uppercase tracking-[0.2em] py-2 transition-colors"
      >
        <Copy size={11} /> Salin Info
      </button>
    </div>
  );
};

export default function Account() {
  const { user, initializing, openAuth } = useAuth();
  const [tab, setTab] = useState("pesanan");
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, w] = await Promise.all([api.get("/me/orders"), api.get("/me/wishlist")]);
      setOrders(o.data);
      setWishlist(w.data);
    } catch {
      toast.error("Gagal memuat data akun");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  return (
    <div className="bg-void min-h-screen text-slate-100" data-testid="account-page">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 min-h-[70vh]">
        <Link to="/" data-testid="account-back-home" className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-neon transition-colors mb-6">
          <ArrowLeft size={12} /> Kembali ke beranda
        </Link>

        {initializing ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-neon" /></div>
        ) : !user ? (
          <div className="border border-line bg-panel py-20 text-center" data-testid="account-login-prompt">
            <LogIn size={34} className="mx-auto text-slate-600 mb-4" />
            <p className="text-sm text-slate-400 font-mono mb-6">Silakan login untuk melihat pesanan & favoritmu.</p>
            <button onClick={() => openAuth("login")} data-testid="account-open-auth" className="text-[11px] font-bold uppercase tracking-[0.2em] bg-neon text-void px-6 py-3 hover:bg-lime transition-colors">
              Masuk / Daftar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-neon/90 font-mono mb-2">Halo, {user.name}</p>
              <h1 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl">Akun Saya</h1>
              <p className="text-[11px] font-mono text-slate-500 mt-1">{user.email}</p>
            </div>

            <div className="flex gap-2 mb-6">
              <button onClick={() => setTab("pesanan")} data-testid="account-tab-orders" className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "pesanan" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}>
                <Receipt size={13} /> Pesanan ({orders.length})
              </button>
              <button onClick={() => setTab("favorit")} data-testid="account-tab-wishlist" className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "favorit" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}>
                <Heart size={13} /> Favorit ({wishlist.length})
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-neon" /></div>
            ) : tab === "pesanan" ? (
              orders.length === 0 ? (
                <div className="border border-line bg-panel py-16 text-center" data-testid="account-orders-empty">
                  <p className="text-sm text-slate-500 font-mono">Belum ada pesanan. Yuk belanja di katalog!</p>
                </div>
              ) : (
                <div className="space-y-3" data-testid="account-orders-list">
                  {orders.map((o) => (
                    <div key={o.session_id} className="border border-line bg-panel p-4" data-testid={`account-order-${o.session_id.slice(-6)}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display font-bold text-sm text-slate-100">{o.product_title}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1">{(o.created_at || "").slice(0, 16).replace("T", " ")} &bull; {(o.provider || "midtrans").toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-neon">{formatIDR(o.amount)}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusStyle(o.payment_status)}`}>{o.payment_status}</span>
                        </div>
                      </div>
                      {o.payment_status === "paid" && o.delivery_info && <DeliveryBox info={o.delivery_info} />}
                      {o.payment_status === "paid" && !o.delivery_info && (
                        <p className="mt-3 text-[11px] font-mono text-slate-500">Detail akun akan dikirim via WhatsApp dalam 5-15 menit.</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : wishlist.length === 0 ? (
              <div className="border border-line bg-panel py-16 text-center" data-testid="account-wishlist-empty">
                <Heart size={30} className="mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 font-mono">Belum ada produk favorit. Tekan ikon hati di katalog.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="account-wishlist-grid">
                {wishlist.map((p) => (
                  <button key={p.id} onClick={() => setSelected(p)} data-testid={`account-fav-${p.id}`} className="group text-left bg-panel border border-line hover:border-neon/50 transition-colors">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={imgSrc(p.image)} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-transparent" />
                      <span className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-neon">{p.game}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-bold text-[13px] leading-snug min-h-[2.4em]">{p.title}</h3>
                      <p className="font-mono font-bold text-neon mt-2">{formatIDR(p.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
