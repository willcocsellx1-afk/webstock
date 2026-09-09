import os
import hashlib
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://gaming-sales-pro-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_KEY = "Musangpandan"
MIDTRANS_SERVER_KEY = "Mid-server-T7pMK-C072I736LTrIoIssW7"

s = requests.Session()


# --- Payment methods ---
def test_payment_methods_order():
    r = s.get(f"{API}/payments/methods", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 2
    assert data[0]["id"] == "midtrans"
    assert any(m["id"] == "stripe" for m in data)


# --- Midtrans checkout ---
midtrans_session_id = None

def test_midtrans_checkout():
    global midtrans_session_id
    r = s.post(f"{API}/payments/midtrans/checkout", json={"product_id": "gi-joki-abyss", "origin_url": BASE_URL}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["checkout_url"].startswith("https://app.midtrans.com")
    assert data["session_id"].startswith("NXG-")
    midtrans_session_id = data["session_id"]


# --- Midtrans webhook signature validation ---
def test_midtrans_webhook_invalid_signature():
    r = s.post(f"{API}/webhook/midtrans", json={
        "order_id": midtrans_session_id or "NXG-FAKE", "status_code": "200",
        "gross_amount": "150000.00", "signature_key": "invalid", "transaction_status": "settlement"
    }, timeout=15)
    assert r.status_code == 403


def _sig(order_id, status_code, gross_amount):
    raw = f"{order_id}{status_code}{gross_amount}{MIDTRANS_SERVER_KEY}"
    return hashlib.sha512(raw.encode()).hexdigest()


def test_midtrans_webhook_mismatched_amount():
    assert midtrans_session_id
    order_id = midtrans_session_id
    gross = "99999.00"
    r = s.post(f"{API}/webhook/midtrans", json={
        "order_id": order_id, "status_code": "200", "gross_amount": gross,
        "signature_key": _sig(order_id, "200", gross), "transaction_status": "settlement"
    }, timeout=15)
    assert r.status_code == 400


def test_midtrans_webhook_valid_marks_paid():
    assert midtrans_session_id
    order_id = midtrans_session_id
    gross = "150000.00"
    r = s.post(f"{API}/webhook/midtrans", json={
        "order_id": order_id, "status_code": "200", "gross_amount": gross,
        "signature_key": _sig(order_id, "200", gross), "transaction_status": "settlement",
        "fraud_status": "accept", "payment_type": "qris"
    }, timeout=15)
    assert r.status_code == 200, r.text
    # verify status paid
    st = s.get(f"{API}/payments/status/{order_id}", timeout=15).json()
    assert st["payment_status"] == "paid"


# --- Testimonials ---
def test_testimonials_list_seeded():
    r = s.get(f"{API}/testimonials", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 4


def test_testimonial_admin_required():
    r = s.post(f"{API}/admin/testimonials", json={"name": "x", "text": "y"}, timeout=15)
    assert r.status_code == 401


test_testimonial_id = None

def test_testimonial_create_and_clamp():
    global test_testimonial_id
    r = s.post(f"{API}/admin/testimonials",
               headers={"x-admin-key": ADMIN_KEY},
               json={"name": "TEST_Reviewer", "text": "great", "game": "ML", "rating": 99},
               timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["rating"] == 5
    test_testimonial_id = data["id"]


def test_testimonial_delete():
    assert test_testimonial_id
    r = s.delete(f"{API}/admin/testimonials/{test_testimonial_id}", headers={"x-admin-key": ADMIN_KEY}, timeout=15)
    assert r.status_code == 200


# --- Admin products ---
test_product_id = None

def test_admin_create_product():
    global test_product_id
    r = s.post(f"{API}/admin/products",
               headers={"x-admin-key": ADMIN_KEY},
               json={"game": "ML", "category": "Akun Game", "title": "TEST_Product", "price": 10000},
               timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    test_product_id = data["id"]
    assert data["title"] == "TEST_Product"


def test_admin_delete_product():
    assert test_product_id
    r = s.delete(f"{API}/admin/products/{test_product_id}", headers={"x-admin-key": ADMIN_KEY}, timeout=15)
    assert r.status_code == 200


def test_admin_product_unauth():
    r = s.post(f"{API}/admin/products",
               json={"game": "X", "category": "Y", "title": "Z", "price": 1}, timeout=15)
    assert r.status_code == 401


# --- Cleanup: restore stock/sold for gi-joki-abyss after webhook test ---
def test_zzz_cleanup_restore_stock():
    """Restore stock/sold of gi-joki-abyss and remove test transaction."""
    from pymongo import MongoClient
    mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    dbname = os.environ.get("DB_NAME", "test_database")
    dbm = mongo[dbname]
    dbm.products.update_one({"id": "gi-joki-abyss"}, {"$set": {"stock": 99, "sold": 567}})
    if midtrans_session_id:
        dbm.payment_transactions.delete_one({"session_id": midtrans_session_id})
    mongo.close()
