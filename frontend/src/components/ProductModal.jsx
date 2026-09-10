import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShieldCheck, Zap, MessageCircle, Loader2, Star, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { api, formatIDR, waLink, imgSrc } from "@/lib/api";

const badgeCls = (b) =>
  b === "Diskon Hot" ? "bg-coral text-white" : b === "Garansi 100%" ? "bg-lime text-void" : "bg-neon text-void";
const condCls = (c) => {
  const v = (c || "").toLowerCase();
  if (v === "ready") return "bg-lime text-void";
  if (v === "sold") return "bg-slate-600 text-slate-200";
  if (v === "unready") return "bg-coral text-white";
  return "border border-neon/50 text-neon bg-void";
};

export const ProductModal = ({ product, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState([{ id: "midtrans", label: "QRIS / VA / E-Wallet" }]);
  const [method, setMethod] = useState("midtrans");
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [touchX, setTouchX] = useState(null);
  const gallery = product ? [product.image, ...(product.images || [])].filter(Boolean) : [];
  const mBadges = product ? (product.badges?.length ? product.badges : (product.badge ? [product.badge] : [])).slice(0, 3) : [];

  const goNext = () => setActive((i) => (i + 1) % gallery.length);
  const goPrev = () => setActive((i) => (i - 1 + gallery.length) % gallery.length);

  useEffect(() => {
    setLoading(false);
    setActive(0);
    setZoom(false);
    api.get("/payments/methods").then((r) => {
      setMethods(r.data);
      setMethod(r.data[0]?.id || "midtrans");
    }).catch(() => {});
  }, [product]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, gallery.length]);

  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx > 50) goPrev();
    else if (dx < -50) goNext();
    setTouchX(null);
  };

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/payments/midtrans/checkout", {
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
            <div className="relative aspect-square md:aspect-auto md:min-h-[420px] group">
              <img src={imgSrc(gallery[active] || product.image)} alt={product.title} data-testid="modal-main-image" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent pointer-events-none" />
              <button
                onClick={() => setZoom(true)}
                data-testid="modal-zoom-button"
                aria-label="Perbesar gambar"
                className="absolute top-4 right-4 grid place-items-center w-9 h-9 bg-void/70 backdrop-blur text-slate-200 hover:text-neon border border-line/60 hover:border-neon transition-colors duration-200"
              >
                <Maximize2 size={15} />
              </button>
              {gallery.length > 1 && (
                <div className="absolute bottom-3 inset-x-3 flex gap-1.5 justify-center" data-testid="modal-gallery-thumbs">
                  {gallery.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      data-testid={`modal-thumb-${i}`}
                      className={`w-12 h-12 overflow-hidden border transition-colors duration-200 ${active === i ? "border-neon" : "border-line/60 opacity-70 hover:opacity-100"}`}
                    >
                      <img src={imgSrc(g)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {mBadges.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5" data-testid="modal-badges">
                  {mBadges.map((b) => (
                    <span key={b} className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 ${badgeCls(b)}`}>
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8 flex flex-col">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-neon mb-2">
                {product.game} &bull; {product.category}
              </p>
              {product.condition && (
                <span className={`self-start mb-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${condCls(product.condition)}`} data-testid="modal-condition">
                  {product.condition}
                </span>
              )}
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
                  <p className="text-[11px] font-bold mt-1 text-lime" data-testid="modal-warranty">{product.warranty || "100%"}</p>
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
                  href={waLink(`Halo WillJustPlay, saya mau BELI MANUAL produk: ${product.title} (${formatIDR(product.price)})`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="modal-manual-buy-button"
                  className="mt-2 w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors duration-300"
                >
                  <MessageCircle size={13} />
                  Beli Manual
                </a>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500">
                  <ShieldCheck size={12} className="text-lime" />
                  Pembayaran aman via Midtrans (QRIS/VA/E-Wallet) &bull; Garansi uang kembali
                </p>
              </div>
            </div>
          </div>
        )}
        {product && zoom && createPortal((
          <div
            data-testid="zoom-gallery-overlay"
            className="fixed inset-0 z-[120] bg-void/95 backdrop-blur-sm flex flex-col"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400" data-testid="zoom-counter">
                {active + 1} / {gallery.length}
              </span>
              <button
                onClick={() => setZoom(false)}
                data-testid="zoom-close-button"
                aria-label="Tutup"
                className="grid place-items-center w-10 h-10 text-slate-300 hover:text-neon transition-colors duration-200"
              >
                <X size={22} />
              </button>
            </div>
            <div className="relative flex-1 flex items-center justify-center px-2 sm:px-16 overflow-hidden">
              <img
                src={imgSrc(gallery[active])}
                alt={product.title}
                data-testid="zoom-main-image"
                className="max-h-full max-w-full object-contain select-none"
                draggable="false"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    data-testid="zoom-prev-button"
                    aria-label="Sebelumnya"
                    className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 bg-panel/80 border border-line hover:border-neon text-slate-200 hover:text-neon transition-colors duration-200"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goNext}
                    data-testid="zoom-next-button"
                    aria-label="Selanjutnya"
                    className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 bg-panel/80 border border-line hover:border-neon text-slate-200 hover:text-neon transition-colors duration-200"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-1.5 justify-center px-4 py-4 shrink-0 overflow-x-auto" data-testid="zoom-thumbs">
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    data-testid={`zoom-thumb-${i}`}
                    className={`w-14 h-14 shrink-0 overflow-hidden border transition-colors duration-200 ${active === i ? "border-neon" : "border-line/60 opacity-60 hover:opacity-100"}`}
                  >
                    <img src={imgSrc(g)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ), document.body)}
      </DialogContent>
    </Dialog>
  );
};
