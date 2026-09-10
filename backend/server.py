import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Depends, UploadFile, File
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import requests
import uuid
import base64
import hashlib
import hmac

from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_KEY = os.environ.get('ADMIN_KEY', 'NEXUS-ADMIN-8888')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
MIDTRANS_SERVER_KEY = os.environ.get('MIDTRANS_SERVER_KEY', '')
MIDTRANS_BASE = "https://app.sandbox.midtrans.com" if MIDTRANS_SERVER_KEY.startswith("SB-") else "https://app.midtrans.com"

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "nexusgame"
storage_key = None

logger = logging.getLogger(__name__)


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def iso(days_ago=0):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


IMG = {
    "cyber": "https://images.unsplash.com/photo-1653142267767-a66c7cf17bc1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwzfHxlc3BvcnRzJTIwZ2FtaW5nJTIwd2FsbHBhcGVyJTIwbmVvbiUyMGN5YmVycHVua3xlbnwwfHx8fDE3ODg5ODQ5MzJ8MA&ixlib=rb-4.1.0&q=85",
    "setup": "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NDQ2MzR8MHwxfHNlYXJjaHwyfHxnYW1pbmclMjBzZXR1cHxlbnwwfHx8fDE3ODg5ODQ5NDJ8MA&ixlib=rb-4.1.0&q=85",
    "controller": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxnYW1lJTIwY29udHJvbGxlcnxlbnwwfHx8fDE3ODg5ODQ5NDJ8MA&ixlib=rb-4.1.0&q=85",
    "arena": "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NDQ2Mzl8MHwxfHNlYXJjaHwxfHxlc3BvcnRzJTIwYXJlbmF8ZW58MHx8fHwxNzg4OTg0OTQyfDA&ixlib=rb-4.1.0&q=85",
    "room": "https://images.pexels.com/photos/9072216/pexels-photo-9072216.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "crowd": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1080&auto=format&fit=crop",
    "arcade": "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1080&auto=format&fit=crop",
    "retro": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1080&auto=format&fit=crop",
    "ps": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=1080&auto=format&fit=crop",
}

SEED_PRODUCTS = [
    {"id": "ml-sultan-mythic", "game": "Mobile Legends", "category": "Akun Game", "title": "Akun Sultan Mythic Glory — 320 Skin & 120 Hero", "price": 4500000, "rank": "Mythical Glory", "image": IMG["cyber"], "stock": 1, "badge": "Verified Seller", "featured": True, "sold": 214, "rating": 4.9, "created_at": iso(2), "description": "Akun Mobile Legends tier Mythical Glory dengan 320+ skin termasuk Legend, Collector, dan Zodiac lengkap. Win rate 68%, bind email pribadi, semua data diganti setelah pembayaran. Garansi penuh 30 hari."},
    {"id": "ml-joki-mythic", "game": "Mobile Legends", "category": "Jasa Joki", "title": "Jasa Joki Rank ke Mythic — Pro Player Fast Track", "price": 350000, "rank": "Epic → Mythic", "image": IMG["setup"], "stock": 99, "badge": "Garansi 100%", "featured": False, "sold": 891, "rating": 5.0, "created_at": iso(5), "description": "Dijoki langsung oleh pro player top global. Proses 1-3 hari tergantung rank awal. Privasi akun 100% aman, tanpa cheat, tanpa VPN berbahaya. Update progres harian via WhatsApp."},
    {"id": "ml-topup-1000dm", "game": "Mobile Legends", "category": "Topup Game", "title": "Top Up 1000 Diamond Mobile Legends Instant", "price": 250000, "rank": "Via ID Server", "image": IMG["controller"], "stock": 999, "badge": "", "featured": False, "sold": 2300, "rating": 4.8, "created_at": iso(1), "description": "Top up diamond ML legal 100% via ID & server. Masuk otomatis 1-5 menit setelah pembayaran terkonfirmasi. Bonus diamond event mengikuti ketentuan Moonton."},
    {"id": "pubg-conqueror", "game": "PUBG Mobile", "category": "Akun Game", "title": "Akun Conqueror S24 — Maxed M416 Glacier", "price": 6800000, "rank": "Conqueror", "image": IMG["arena"], "stock": 1, "badge": "Verified Seller", "featured": False, "sold": 87, "rating": 4.9, "created_at": iso(8), "description": "Akun PUBG Mobile Conqueror season 24 dengan M416 Glacier max level, 15 outfit langka, dan RP lengkap sejak S10. Data lengkap, email ganti, garansi seumur akun."},
    {"id": "pubg-joki-conqueror", "game": "PUBG Mobile", "category": "Jasa Joki", "title": "Jasa Push Rank Conqueror — Squad Pro", "price": 750000, "rank": "Ace → Conqueror", "image": IMG["crowd"], "stock": 50, "badge": "Garansi 100%", "featured": False, "sold": 342, "rating": 4.9, "created_at": iso(4), "description": "Push rank ke Conqueror oleh squad pro berpengalaman turnamen. KD terjaga, statistik rapi, tanpa program ilegal. Estimasi 3-7 hari, laporan progres tiap hari."},
    {"id": "gi-ar58-whale", "game": "Genshin Impact", "category": "Akun Game", "title": "Akun AR58 Whale — 10 Limited 5★ C6 R1", "price": 5500000, "rank": "AR 58", "image": IMG["arcade"], "stock": 1, "badge": "Diskon Hot", "featured": False, "sold": 45, "rating": 5.0, "created_at": iso(3), "description": "Akun Genshin Impact AR58 server Asia. 10 karakter limited 5★ (Raiden, Hu Tao, Ayaka, dll), beberapa C6 dengan signature weapon R1. Abyss 36★ clear. Username bisa diganti, email ikut."},
    {"id": "gi-joki-abyss", "game": "Genshin Impact", "category": "Jasa Joki", "title": "Jasa Joki Spiral Abyss Full 36★", "price": 150000, "rank": "Floor 12 — 9★", "image": IMG["room"], "stock": 99, "badge": "", "featured": False, "sold": 567, "rating": 4.8, "created_at": iso(6), "description": "Clear Spiral Abyss floor 9-12 full bintang 36 oleh theorycrafter berpengalaman. Selesai dalam 1 hari. Akun dijamin aman, tidak ada resource yang dihabiskan tanpa izin."},
    {"id": "valo-immortal", "game": "Valorant", "category": "Akun Game", "title": "Akun Immortal 3 — 20 Skin Premium Reaver & Prime", "price": 3200000, "rank": "Immortal 3", "image": IMG["retro"], "stock": 1, "badge": "Verified Seller", "featured": False, "sold": 63, "rating": 4.9, "created_at": iso(9), "description": "Akun Valorant Immortal 3 region AP dengan 20 skin premium termasuk Reaver Operator, Prime Vandal, dan Glitchpop. Full agent unlock, Riot ID bisa diganti, email pertama ikut diserahkan."},
    {"id": "valo-joki-radiant", "game": "Valorant", "category": "Jasa Joki", "title": "Jasa Joki ke Radiant — Ex Pro Scene", "price": 900000, "rank": "Diamond → Radiant", "image": IMG["setup"], "stock": 20, "badge": "Garansi 100%", "featured": False, "sold": 128, "rating": 5.0, "created_at": iso(7), "description": "Dijoki oleh mantan pemain pro scene Valorant. Win rate joki 85%+, bisa request agent spesifik. Proses aman dengan VPN lokasi yang sama, tidak terdeteksi smurf."},
    {"id": "ff-sultan-bundle", "game": "Free Fire", "category": "Akun Game", "title": "Akun Sultan FF — Bundle Rare & Evo Gun Max", "price": 1800000, "rank": "Grandmaster", "image": IMG["ps"], "stock": 1, "badge": "Diskon Hot", "featured": False, "sold": 156, "rating": 4.8, "created_at": iso(11), "description": "Akun Free Fire Grandmaster dengan bundle langka (Criminal, Hip Hop, Sakura), Evo Gun MP40 & AK max, serta 50+ emote rare. Login FB bisa dilepas, data aman."},
    {"id": "ff-topup-2180", "game": "Free Fire", "category": "Topup Game", "title": "Top Up 2180 Diamond Free Fire Termurah", "price": 285000, "rank": "Via ID Player", "image": IMG["controller"], "stock": 999, "badge": "", "featured": False, "sold": 3100, "rating": 4.9, "created_at": iso(2), "description": "Top up diamond FF resmi via ID player, proses otomatis 1-5 menit. Harga termurah se-Indonesia, aman 100% tanpa risiko banned."},
    {"id": "hsr-tl70", "game": "Honkai Star Rail", "category": "Akun Game", "title": "Akun TL70 — Full Eidolon Seele & Jing Yuan", "price": 7200000, "rank": "Trailblaze 70", "image": IMG["cyber"], "stock": 1, "badge": "Verified Seller", "featured": False, "sold": 29, "rating": 5.0, "created_at": iso(1), "description": "Akun Honkai Star Rail TL70 server Asia. Seele E6 & Jing Yuan E6 dengan Light Cone signature, MoC full clear. Akun whale lengkap, email dan data ikut diserahkan."},
]


SEED_TESTIMONIALS = [
    {"id": "t-rizky", "name": "Rizky A.", "game": "Mobile Legends", "product": "Akun Sultan Mythic Glory", "rating": 5, "image": "", "created_at": iso(3), "text": "Akun sesuai deskripsi, skin lengkap semua. Proses 10 menit langsung dikirim data login + email. Recommended banget!"},
    {"id": "t-dinda", "name": "Dinda P.", "game": "Genshin Impact", "product": "Jasa Joki Spiral Abyss", "rating": 5, "image": "", "created_at": iso(6), "text": "Abyss 36 bintang kelar dalam sehari, resin gak disentuh sama sekali. Adminnya ramah, fast respon di WA."},
    {"id": "t-fajar", "name": "Fajar N.", "game": "Valorant", "product": "Jasa Joki ke Radiant", "rating": 5, "image": "", "created_at": iso(9), "text": "Awalnya ragu, ternyata legit. Diamond ke Radiant 5 hari, update progres tiap malam. Aman tanpa smurf detect."},
    {"id": "t-ayu", "name": "Ayu S.", "game": "Free Fire", "product": "Top Up 2180 Diamond", "rating": 4, "image": "", "created_at": iso(12), "text": "Diamond masuk 3 menit setelah bayar QRIS. Harganya paling murah dibanding tempat lain. Bakal langganan."},
]


class ProductIn(BaseModel):
    game: str
    category: str
    title: str
    price: int
    description: str = ""
    rank: str = ""
    image: str = ""
    images: list[str] = []
    stock: int = 1
    badge: str = ""
    featured: bool = False
    sold: int = 0
    rating: float = 5.0


class CheckoutIn(BaseModel):
    product_id: str
    origin_url: str


class TestimonialIn(BaseModel):
    name: str
    game: str = ""
    product: str = ""
    rating: int = 5
    text: str
    image: str = ""


async def require_admin(x_admin_key: Optional[str] = Header(None)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Kunci admin salah")


@api_router.get("/")
async def root():
    return {"message": "NEXUSGAME API online"}


@api_router.get("/products")
async def list_products(game: Optional[str] = None, category: Optional[str] = None, q: Optional[str] = None):
    query = {}
    if game and game != "Semua Game":
        query["game"] = game
    if category and category != "Semua Kategori":
        query["category"] = category
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    return await db.products.find(query, {"_id": 0}).to_list(1000)


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Produk tidak ditemukan")
    return product


@api_router.get("/games")
async def list_games():
    return await db.products.distinct("game")


@api_router.get("/admin/verify")
async def admin_verify(admin=Depends(require_admin)):
    return {"ok": True}


@api_router.post("/admin/products")
async def create_product(data: ProductIn, admin=Depends(require_admin)):
    doc = data.model_dump()
    doc["images"] = [u for u in doc["images"] if u][:5]
    doc["id"] = str(uuid.uuid4())[:8]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, data: ProductIn, admin=Depends(require_admin)):
    doc = data.model_dump()
    doc["images"] = [u for u in doc["images"] if u][:5]
    res = await db.products.update_one({"id": product_id}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(404, "Produk tidak ditemukan")
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(require_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Produk tidak ditemukan")
    return {"ok": True}


@api_router.post("/admin/reset")
async def reset_products(admin=Depends(require_admin)):
    await db.products.delete_many({})
    await db.products.insert_many([dict(p) for p in SEED_PRODUCTS])
    return {"ok": True, "count": len(SEED_PRODUCTS)}


@api_router.get("/admin/orders")
async def list_orders(admin=Depends(require_admin)):
    return await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


async def mark_paid(session_id: str):
    res = await db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if res.modified_count == 1:
        tx = await db.payment_transactions.find_one({"session_id": session_id})
        if tx:
            await db.products.update_one({"id": tx["product_id"]}, {"$inc": {"stock": -1, "sold": 1}})


@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutIn, request: Request):
    product = await db.products.find_one({"id": req.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Produk tidak ditemukan")
    if product.get("stock", 0) < 1:
        raise HTTPException(400, "Stok produk habis")
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=float(product["price"]),
        currency="idr",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        metadata={"product_id": product["id"], "product_title": product["title"]},
    ))
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "product_id": product["id"],
        "product_title": product["title"],
        "amount": float(product["price"]),
        "currency": "idr",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.session_id}


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    if record.get("payment_status") != "paid" and record.get("provider") == "midtrans":
        await sync_midtrans_status(session_id)
        record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    elif record.get("payment_status") != "paid" and not record.get("provider"):
        try:
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
            status = await stripe_checkout.get_checkout_status(session_id)
            if status.payment_status == "paid":
                await mark_paid(session_id)
                record["payment_status"] = "paid"
                record["status"] = "completed"
        except Exception as e:
            logger.warning(f"Stripe status check failed: {e}")
    return {"session_id": record["session_id"], "status": record["status"], "payment_status": record["payment_status"]}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        resp = await stripe_checkout.handle_webhook(body, sig)
        if resp.payment_status == "paid":
            await mark_paid(resp.session_id)
        elif resp.event_type in ("checkout.session.expired", "checkout.session.async_payment_failed"):
            await db.payment_transactions.update_one(
                {"session_id": resp.session_id},
                {"$set": {"status": "failed", "payment_status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(400, "Webhook error")
    return {"status": "ok"}


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@api_router.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), admin=Depends(require_admin)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Hanya file gambar (JPG, PNG, WEBP, GIF) yang diizinkan")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Ukuran gambar maksimal 5MB")
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/uploads/{uuid.uuid4().hex}.{ext}"
    try:
        result = put_object(path, data, file.content_type)
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(502, "Gagal mengupload gambar")
    await db.files.insert_one({
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": f"/api/files/{result['path']}"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "File tidak ditemukan")
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(404, "File tidak ditemukan")
    return Response(content=data, media_type=record.get("content_type", content_type))


@api_router.get("/payments/methods")
async def payment_methods():
    methods = []
    if MIDTRANS_SERVER_KEY:
        methods.append({"id": "midtrans", "label": "QRIS / VA / E-Wallet"})
    methods.append({"id": "stripe", "label": "Kartu (Stripe)"})
    return methods


def midtrans_headers():
    token = base64.b64encode(f"{MIDTRANS_SERVER_KEY}:".encode()).decode()
    return {"Authorization": f"Basic {token}", "Accept": "application/json", "Content-Type": "application/json"}


def midtrans_status_map(payload: dict):
    ts = payload.get("transaction_status")
    fraud = payload.get("fraud_status")
    if ts in ("capture", "settlement") and fraud in (None, "accept"):
        return "paid"
    if ts == "pending":
        return "pending"
    if ts in ("deny", "cancel", "expire", "failure"):
        return "failed"
    return None


async def apply_midtrans_status(order_id: str, payload: dict):
    new_status = midtrans_status_map(payload)
    if new_status == "paid":
        await mark_paid(order_id)
    elif new_status == "failed":
        await db.payment_transactions.update_one(
            {"session_id": order_id, "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "failed", "payment_status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
    if payload.get("payment_type"):
        await db.payment_transactions.update_one({"session_id": order_id}, {"$set": {"payment_type": payload["payment_type"]}})


async def sync_midtrans_status(order_id: str):
    try:
        api_base = MIDTRANS_BASE.replace("app.", "api.")
        resp = requests.get(f"{api_base}/v2/{order_id}/status", headers=midtrans_headers(), timeout=15)
        if resp.status_code == 200:
            await apply_midtrans_status(order_id, resp.json())
    except Exception as e:
        logger.warning(f"Midtrans status check failed: {e}")


@api_router.post("/payments/midtrans/checkout")
async def midtrans_checkout(req: CheckoutIn):
    if not MIDTRANS_SERVER_KEY:
        raise HTTPException(503, "Pembayaran Midtrans (QRIS/VA/E-Wallet) belum diaktifkan")
    product = await db.products.find_one({"id": req.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Produk tidak ditemukan")
    if product.get("stock", 0) < 1:
        raise HTTPException(400, "Stok produk habis")
    order_id = f"NXG-{uuid.uuid4().hex[:16].upper()}"
    await db.payment_transactions.insert_one({
        "session_id": order_id,
        "provider": "midtrans",
        "product_id": product["id"],
        "product_title": product["title"],
        "amount": float(product["price"]),
        "currency": "idr",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    try:
        resp = requests.post(
            f"{MIDTRANS_BASE}/snap/v1/transactions",
            headers=midtrans_headers(),
            json={
                "transaction_details": {"order_id": order_id, "gross_amount": int(product["price"])},
                "item_details": [{"id": product["id"], "price": int(product["price"]), "quantity": 1, "name": product["title"][:50]}],
                "callbacks": {"finish": f"{req.origin_url}/payment/success?session_id={order_id}", "error": f"{req.origin_url}/payment/cancel"},
            },
            timeout=20,
        )
        resp.raise_for_status()
        snap = resp.json()
    except Exception as e:
        logger.error(f"Midtrans snap error: {e}")
        await db.payment_transactions.update_one(
            {"session_id": order_id},
            {"$set": {"status": "payment_error", "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        raise HTTPException(502, "Penyedia pembayaran tidak tersedia")
    await db.payment_transactions.update_one(
        {"session_id": order_id},
        {"$set": {"snap_token": snap["token"], "invoice_url": snap["redirect_url"], "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"checkout_url": snap["redirect_url"], "session_id": order_id}


@api_router.post("/webhook/midtrans")
async def midtrans_webhook(request: Request):
    payload = await request.json()
    raw = f"{payload.get('order_id', '')}{payload.get('status_code', '')}{payload.get('gross_amount', '')}{MIDTRANS_SERVER_KEY}"
    expected = hashlib.sha512(raw.encode()).hexdigest()
    if not hmac.compare_digest(expected, str(payload.get("signature_key", ""))):
        raise HTTPException(403, "Signature tidak valid")
    order_id = payload.get("order_id")
    tx = await db.payment_transactions.find_one({"session_id": order_id})
    if not tx:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    if float(payload.get("gross_amount", 0)) != float(tx["amount"]):
        raise HTTPException(400, "Jumlah tidak cocok")
    await apply_midtrans_status(order_id, payload)
    return {"ok": True}


@api_router.get("/testimonials")
async def list_testimonials():
    return await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/admin/testimonials")
async def create_testimonial(data: TestimonialIn, admin=Depends(require_admin)):
    doc = data.model_dump()
    doc["rating"] = max(1, min(5, doc["rating"]))
    doc["id"] = str(uuid.uuid4())[:8]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.testimonials.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/testimonials/{tid}")
async def delete_testimonial(tid: str, admin=Depends(require_admin)):
    res = await db.testimonials.delete_one({"id": tid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Testimoni tidak ditemukan")
    return {"ok": True}


@app.on_event("startup")
async def seed_products():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([dict(p) for p in SEED_PRODUCTS])
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products")
    if await db.testimonials.count_documents({}) == 0:
        await db.testimonials.insert_many([dict(t) for t in SEED_TESTIMONIALS])


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
