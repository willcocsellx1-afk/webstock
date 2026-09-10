"""Auth (JWT), wishlist, orders, admin JWT tests for WillJustPlay."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def _pick_product_id():
    r = requests.get(f"{API}/products", timeout=15)
    r.raise_for_status()
    prods = [p for p in r.json() if p.get("stock", 0) > 0]
    assert prods, "No products with stock available"
    return prods[0]["id"]


PRODUCT_ID = _pick_product_id()

ADMIN_EMAIL = "admin@willjustplay.com"
ADMIN_PASSWORD = "Musangpandan123"


def _random_email():
    return f"testbuyer+{uuid.uuid4().hex[:8]}@test.com"


# ---------------- Buyer register / login ----------------
buyer_state = {}


def test_register_new_buyer():
    email = _random_email()
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "buyer123", "name": "Test Buyer"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["token"]
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "buyer"
    assert data["user"]["name"] == "Test Buyer"
    buyer_state["email"] = email
    buyer_state["password"] = "buyer123"
    buyer_state["token"] = data["token"]
    buyer_state["id"] = data["user"]["id"]


def test_register_short_password_rejected():
    r = requests.post(f"{API}/auth/register", json={"email": _random_email(), "password": "123", "name": "x"}, timeout=15)
    assert r.status_code in (400, 422)


def test_register_duplicate_email():
    assert buyer_state.get("email")
    r = requests.post(f"{API}/auth/register", json={"email": buyer_state["email"], "password": "buyer123", "name": "dup"}, timeout=15)
    assert r.status_code == 400
    assert "sudah terdaftar" in r.text.lower()


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": buyer_state["email"], "password": "wrongpass"}, timeout=15)
    assert r.status_code == 401


def test_login_success():
    r = requests.post(f"{API}/auth/login", json={"email": buyer_state["email"], "password": buyer_state["password"]}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["email"] == buyer_state["email"]
    assert data["user"]["role"] == "buyer"
    buyer_state["token"] = data["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_auth_me():
    r = requests.get(f"{API}/auth/me", headers=_auth(buyer_state["token"]), timeout=15)
    assert r.status_code == 200
    assert r.json()["email"] == buyer_state["email"]


def test_auth_me_no_token():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401


# ---------------- Wishlist ----------------
def test_wishlist_toggle_and_persist():
    pid = PRODUCT_ID
    r = requests.post(f"{API}/me/wishlist/{pid}", headers=_auth(buyer_state["token"]), timeout=15)
    assert r.status_code == 200
    assert pid in r.json()["wishlist"]
    # verify GET returns product
    g = requests.get(f"{API}/me/wishlist", headers=_auth(buyer_state["token"]), timeout=15)
    assert g.status_code == 200
    ids = [p["id"] for p in g.json()]
    assert pid in ids
    # toggle off
    r2 = requests.post(f"{API}/me/wishlist/{pid}", headers=_auth(buyer_state["token"]), timeout=15)
    assert pid not in r2.json()["wishlist"]
    # re-add for account page test
    requests.post(f"{API}/me/wishlist/{pid}", headers=_auth(buyer_state["token"]), timeout=15)


def test_wishlist_requires_auth():
    r = requests.get(f"{API}/me/wishlist", timeout=15)
    assert r.status_code == 401


# ---------------- Guest checkout + user_id ----------------
guest_state = {}


def test_guest_checkout_no_auth():
    r = requests.post(f"{API}/payments/midtrans/checkout",
                     json={"product_id": PRODUCT_ID, "origin_url": BASE_URL}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["checkout_url"].startswith("https://app.midtrans.com")
    assert data["session_id"].startswith("NXG-")
    guest_state["session_id"] = data["session_id"]


def test_authed_checkout_sets_user_id():
    r = requests.post(f"{API}/payments/midtrans/checkout",
                     headers=_auth(buyer_state["token"]),
                     json={"product_id": PRODUCT_ID, "origin_url": BASE_URL}, timeout=30)
    assert r.status_code == 200, r.text
    sid = r.json()["session_id"]
    buyer_state["session_id"] = sid
    # verify appears in /me/orders and delivery_info hidden while pending
    time.sleep(0.5)
    o = requests.get(f"{API}/me/orders", headers=_auth(buyer_state["token"]), timeout=15)
    assert o.status_code == 200
    orders = o.json()
    match = [x for x in orders if x["session_id"] == sid]
    assert match, "Order not linked to user"
    assert match[0]["payment_status"] == "pending"
    assert "delivery_info" not in match[0], "delivery_info leaked while pending"


def test_payment_status_hides_delivery_until_paid():
    r = requests.get(f"{API}/payments/status/{buyer_state['session_id']}", timeout=20)
    assert r.status_code == 200
    d = r.json()
    assert d["payment_status"] == "pending"
    assert "delivery_info" not in d


# ---------------- Admin login via JWT ----------------
admin_state = {}


def test_admin_login_email_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "admin"
    admin_state["token"] = data["token"]


def test_admin_verify_with_jwt():
    r = requests.get(f"{API}/admin/verify", headers=_auth(admin_state["token"]), timeout=15)
    assert r.status_code == 200


def test_admin_verify_rejects_buyer_jwt():
    r = requests.get(f"{API}/admin/verify", headers=_auth(buyer_state["token"]), timeout=15)
    assert r.status_code == 401


def test_admin_legacy_header_still_works():
    r = requests.get(f"{API}/admin/verify", headers={"x-admin-key": "Musangpandan"}, timeout=15)
    assert r.status_code == 200


def test_admin_orders_and_products_with_jwt():
    r = requests.get(f"{API}/admin/orders", headers=_auth(admin_state["token"]), timeout=15)
    assert r.status_code == 200
    # Create product with JWT
    c = requests.post(f"{API}/admin/products",
                      headers=_auth(admin_state["token"]),
                      json={"game": "ML", "category": "Akun Game", "title": "TEST_JWT_Product", "price": 5000},
                      timeout=15)
    assert c.status_code == 200, c.text
    pid = c.json()["id"]
    admin_state["product_id"] = pid
    # Update
    u = requests.put(f"{API}/admin/products/{pid}",
                     headers=_auth(admin_state["token"]),
                     json={"game": "ML", "category": "Akun Game", "title": "TEST_JWT_Product_v2", "price": 6000},
                     timeout=15)
    assert u.status_code == 200
    assert u.json()["title"] == "TEST_JWT_Product_v2"
    # Delete
    d = requests.delete(f"{API}/admin/products/{pid}", headers=_auth(admin_state["token"]), timeout=15)
    assert d.status_code == 200


# ---------------- Cleanup ----------------
def test_zzz_cleanup():
    from pymongo import MongoClient
    mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    dbm = mongo[os.environ.get("DB_NAME", "test_database")]
    if buyer_state.get("session_id"):
        dbm.payment_transactions.delete_one({"session_id": buyer_state["session_id"]})
    if guest_state.get("session_id"):
        dbm.payment_transactions.delete_one({"session_id": guest_state["session_id"]})
    if buyer_state.get("email"):
        dbm.users.delete_one({"email": buyer_state["email"]})
    mongo.close()
