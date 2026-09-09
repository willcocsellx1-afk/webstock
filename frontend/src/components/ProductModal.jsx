import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShieldCheck, Zap, MessageCircle, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { api, formatIDR, waLink, imgSrc } from "@/lib/api";

export const ProductModal = ({ product, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState([{ id: "stripe", label: "Kartu (Stripe)" }]);
  const [method, setMethod] = useState("stripe");

  useEffect(() => {
    setLoading(false);
    setMethod("stripe");
    api.get("/payments/methods").then((r) => setMethods(r.data)).catch(() => {});
  }, [product]);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const endpoint = method === "xendit" ? "/payments/xendit/checkout" : "/payments/checkout";
      const { data } = await api.post(endpoint, {
        product_id: product.id,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal membuat sesi pembayaran");
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-testid="product-modal"
        className="max-w-3xl bg-panel border-line text-slate-100 p-0 overflow-hidden gap-0"
      >
        {product && (
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-square md:aspect-auto md:min-h-[420px]">
              <img src={imgSrc(product.image)} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
              {product.badge && (
                <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 ${
                  product.badge === "Diskon Hot" ? "bg-coral text-white" : "bg-neon text-void"
                }`}>
                  {product.badge}
                </span>
              )}
            </div>
            <div className="p-6 sm:p-8 flex flex-col">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-neon mb-2">
                {product.game} &bull; {product.category}
              </p>
              <h3 className="font-display font-bold text-lg leading-snug" data-testid="modal-product-title">
                {product.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-lime">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-mono">{product.rating}</span>
                <span className="text-[10px] font-mono text-slate-500 ml-1">({product.sold} terjual)</span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">{product.description}</p>

              <div className="grid grid-cols-3 gap-px bg-line border border-line mt-5 text-center">
                <div className="bg-void px-2 py-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Rank</p>
                  <p className="text-[11px] font-bold mt-1">{product.rank || "-"}</p>
                </div>
                <div className="bg-void px-2 py-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Stok</p>
                  <p className="text-[11px] font-bold mt-1" data-testid="modal-stock">{product.stock}</p>
                </div>
                <div className="bg-void px-2 py-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Garansi</p>
                  <p className="text-[11px] font-bold mt-1 text-lime">100%</p>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <p className="font-mono font-bold text-2xl text-neon" data-testid="modal-price">
                  {formatIDR(product.price)}
                </p>
                {methods.length > 1 && (
                  <div className="mt-3 grid grid-cols-2 gap-2" data-testid="payment-method-selector">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        data-testid={`payment-method-${m.id}`}
                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-2.5 border transition-colors duration-200 ${
                          method === m.id ? "border-neon text-neon bg-neon/10" : "border-line text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleBuy}
                  disabled={loading || product.stock < 1}
                  data-testid="modal-buy-button"
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] py-4 hover:bg-lime transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Zap size={15} />
                  )}
                  {product.stock < 1 ? "Stok Habis" : loading ? "Memproses..." : "Beli Sekarang"}
                </button>
                <a
                  href={waLink(`Halo NEXUSGAME, saya mau tanya tentang: ${product.title}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="modal-whatsapp-button"
                  className="mt-2 w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors duration-300"
                >
                  <MessageCircle size={13} />
                  Tanya Penjual
                </a>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500">
                  <ShieldCheck size={12} className="text-lime" />
                  Pembayaran aman via Stripe &bull; Garansi uang kembali
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
