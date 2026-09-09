import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, Plus, Pencil, Trash2, RotateCcw, LogOut, X, Loader2, Package, Receipt, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatIDR } from "@/lib/api";

const CATEGORIES = ["Akun Game", "Jasa Joki", "Top Up Diamond"];
const BADGES = ["", "Verified Seller", "Garansi 100%", "Diskon Hot"];

const EMPTY_FORM = {
  game: "", category: "Akun Game", title: "", price: 0, rank: "",
  image: "", stock: 1, badge: "", description: "", featured: false, sold: 0, rating: 5.0,
};

export default function Admin() {
  const [key, setKey] = useState(localStorage.getItem("nx_admin_key") || "");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("produk");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const headers = { "x-admin-key": key };

  const load = useCallback(async () => {
    try {
      const [p, o] = await Promise.all([
        api.get("/products"),
        api.get("/admin/orders", { headers }),
      ]);
      setProducts(p.data);
      setOrders(o.data);
    } catch {
      toast.error("Gagal memuat data admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const verify = useCallback(async (k) => {
    setChecking(true);
    try {
      await api.get("/admin/verify", { headers: { "x-admin-key": k } });
      localStorage.setItem("nx_admin_key", k);
      setKey(k);
      setAuthed(true);
    } catch {
      localStorage.removeItem("nx_admin_key");
      if (k) toast.error("Kunci admin salah");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (key) verify(key);
  }, [key, verify]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const logout = () => {
    localStorage.removeItem("nx_admin_key");
    setKey("");
    setAuthed(false);
    setKeyInput("");
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing("new");
  };

  const openEdit = (p) => {
    setForm({
      game: p.game, category: p.category, title: p.title, price: p.price,
      rank: p.rank || "", image: p.image || "", stock: p.stock, badge: p.badge || "",
      description: p.description || "", featured: !!p.featured, sold: p.sold || 0, rating: p.rating || 5,
    });
    setEditing(p.id);
  };

  const save = async () => {
    if (!form.title || !form.game || !form.price) {
      toast.error("Judul, game, dan harga wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), sold: Number(form.sold), rating: Number(form.rating) };
      if (editing === "new") {
        await api.post("/admin/products", payload, { headers });
        toast.success("Produk baru ditambahkan");
      } else {
        await api.put(`/admin/products/${editing}`, payload, { headers });
        toast.success("Produk diperbarui");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus produk ini secara permanen?")) return;
    try {
      await api.delete(`/admin/products/${id}`, { headers });
      toast.success("Produk dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus produk");
    }
  };

  const resetSeed = async () => {
    if (!window.confirm("Reset katalog ke data contoh awal? Semua perubahan akan hilang.")) return;
    try {
      await api.post("/admin/reset", {}, { headers });
      toast.success("Katalog direset ke data contoh");
      load();
    } catch {
      toast.error("Gagal mereset katalog");
    }
  };

  if (!authed) {
    return (
      <div data-testid="admin-login-page" className="min-h-screen bg-void grid-bg flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm w-full bg-panel border border-line p-8"
        >
          <span className="w-11 h-11 grid place-items-center border border-neon/40 text-neon mb-6">
            <ShieldCheck size={20} />
          </span>
          <h1 className="font-display font-bold uppercase text-lg" data-testid="admin-login-title">Panel Admin</h1>
          <p className="text-xs text-slate-500 font-mono mt-2 mb-6">Masukkan kunci admin untuk mengelola katalog.</p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verify(keyInput)}
            placeholder="Kunci admin"
            data-testid="admin-key-input"
            className="w-full bg-void border border-line focus:border-neon/60 outline-none text-sm font-mono px-4 py-3 placeholder:text-slate-600 transition-colors"
          />
          <button
            onClick={() => verify(keyInput)}
            disabled={checking}
            data-testid="admin-login-button"
            className="mt-3 w-full flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300 disabled:opacity-50"
          >
            {checking && <Loader2 size={14} className="animate-spin" />}
            Masuk
          </button>
          <Link to="/" data-testid="admin-back-home-link" className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-neon transition-colors">
            <ArrowLeft size={12} /> Kembali ke beranda
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-void text-slate-100">
      <header className="border-b border-line bg-panel/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 grid place-items-center bg-neon text-void"><ShieldCheck size={15} /></span>
            <span className="font-display font-extrabold text-sm uppercase tracking-tight">Admin <span className="text-neon">NexusGame</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" data-testid="admin-view-store-button" className="text-[11px] uppercase tracking-widest text-slate-400 hover:text-neon border border-line hover:border-neon/50 px-3 py-2 transition-colors">
              Lihat Toko
            </Link>
            <button onClick={logout} data-testid="admin-logout-button" className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-400 hover:text-coral border border-line hover:border-coral/50 px-3 py-2 transition-colors">
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("produk")}
              data-testid="admin-tab-products"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "produk" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <Package size={13} /> Produk ({products.length})
            </button>
            <button
              onClick={() => setTab("pesanan")}
              data-testid="admin-tab-orders"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "pesanan" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <Receipt size={13} /> Pesanan ({orders.length})
            </button>
          </div>
          {tab === "produk" && (
            <div className="flex gap-2">
              <button onClick={resetSeed} data-testid="reset-seed-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border border-coral/50 text-coral hover:bg-coral hover:text-white transition-colors">
                <RotateCcw size={13} /> Reset Data Contoh
              </button>
              <button onClick={openNew} data-testid="add-product-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 bg-neon text-void hover:bg-lime transition-colors">
                <Plus size={13} /> Tambah Produk
              </button>
            </div>
          )}
        </div>

        {tab === "produk" && (
          <div className="border border-line bg-panel overflow-x-auto" data-testid="admin-products-table">
            <table className="w-full text-left text-xs font-mono min-w-[760px]">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 hover:bg-panelhover transition-colors" data-testid={`admin-row-${p.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="w-11 h-11 object-cover border border-line" />
                        <span className="font-sans font-bold text-slate-200 max-w-[220px] truncate">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neon">{p.game}</td>
                    <td className="px-4 py-3 text-slate-400">{p.category}</td>
                    <td className="px-4 py-3 text-neon font-bold">{formatIDR(p.price)}</td>
                    <td className="px-4 py-3">{p.stock < 1 ? <span className="text-coral">Habis</span> : p.stock}</td>
                    <td className="px-4 py-3 text-slate-400">{p.badge || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`} className="w-8 h-8 grid place-items-center border border-line text-slate-400 hover:text-neon hover:border-neon/50 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => remove(p.id)} data-testid={`delete-product-${p.id}`} className="w-8 h-8 grid place-items-center border border-line text-slate-400 hover:text-coral hover:border-coral/50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "pesanan" && (
          <div className="border border-line bg-panel overflow-x-auto" data-testid="admin-orders-table">
            {orders.length === 0 ? (
              <p className="text-center text-xs text-slate-500 font-mono py-16">Belum ada pesanan masuk.</p>
            ) : (
              <table className="w-full text-left text-xs font-mono min-w-[680px]">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3">Sesi</th>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.session_id} className="border-b border-line/60" data-testid={`order-row-${o.session_id.slice(-6)}`}>
                      <td className="px-4 py-3 text-slate-500">...{o.session_id.slice(-10)}</td>
                      <td className="px-4 py-3 text-slate-200 max-w-[240px] truncate">{o.product_title}</td>
                      <td className="px-4 py-3 text-neon font-bold">{formatIDR(o.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          o.payment_status === "paid" ? "bg-lime/15 text-lime" : o.payment_status === "failed" ? "bg-coral/15 text-coral" : "bg-neon/10 text-neon"
                        }`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{(o.created_at || "").slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="product-form-modal">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl bg-panel border border-line max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display font-bold uppercase text-sm" data-testid="product-form-title">
                {editing === "new" ? "Tambah Produk Baru" : "Edit Produk"}
              </h2>
              <button onClick={() => setEditing(null)} data-testid="product-form-close" className="text-slate-500 hover:text-coral transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Judul Produk *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="form-title-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Nama Game *</span>
                <input value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} placeholder="mis. Mobile Legends" data-testid="form-game-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Kategori</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="form-category-select"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Harga (IDR) *</span>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="form-price-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Rank / Tier</span>
                <input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="mis. Mythic Glory" data-testid="form-rank-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Stok</span>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} data-testid="form-stock-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">URL Gambar</span>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." data-testid="form-image-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Badge</span>
                <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} data-testid="form-badge-select"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors">
                  {BADGES.map((b) => <option key={b} value={b}>{b || "Tanpa Badge"}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2.5 pt-6">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="form-featured-checkbox"
                  className="w-4 h-4 accent-[#00F0FF]" />
                <span className="text-[10px] uppercase tracking-widest text-slate-400">Tampilkan sebagai Unggulan di Hero</span>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Deskripsi</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} data-testid="form-description-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 leading-relaxed transition-colors" />
              </label>
            </div>
            <div className="border-t border-line px-6 py-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} data-testid="form-cancel-button" className="text-[11px] font-bold uppercase tracking-widest px-5 py-3 border border-line text-slate-400 hover:text-slate-200 transition-colors">
                Batal
              </button>
              <button onClick={save} disabled={saving} data-testid="save-product-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-5 py-3 bg-neon text-void hover:bg-lime transition-colors disabled:opacity-50">
                {saving && <Loader2 size={13} className="animate-spin" />}
                Simpan Produk
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
