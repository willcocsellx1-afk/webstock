import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Catalog } from "@/components/Catalog";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { ProductModal } from "@/components/ProductModal";
import { api, waLink } from "@/lib/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .get("/products")
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = useMemo(
    () => products.find((p) => p.featured) || products[0],
    [products]
  );

  return (
    <div data-testid="home-page" className="bg-void min-h-screen text-slate-100">
      <Navbar />
      <Hero featured={featured} products={products} />
      <Marquee />
      <Catalog products={products} loading={loading} onSelect={setSelected} />
      <HowItWorks />
      <Testimonials />
      <Footer />
      <ProductModal product={selected} onClose={() => setSelected(null)} />

      <a
        href={waLink("Halo WillJustPlay, saya butuh bantuan.")}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="floating-whatsapp-button"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 p-3.5 bg-lime text-void hover:bg-neon transition-colors duration-300 glow-cyan"
        aria-label="Chat WhatsApp"
      >
        <MessageCircle size={22} />
      </a>
    </div>
  );
}
