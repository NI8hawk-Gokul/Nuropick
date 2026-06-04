import os
import json
import asyncio
import importlib.util
import pathlib
import sys

import pytest
from httpx import AsyncClient

HERE = pathlib.Path(__file__).resolve().parents[1]

def load_auth_service():
    for k in list(sys.modules.keys()):
        if k == 'app' or k.startswith('app.'):
            del sys.modules[k]
    auth_path = str(HERE / "services" / "auth_service")
    sys.path.insert(0, auth_path)
    try:
        from app.main import app as auth_app
        from app.crud import create_user
        from app.db import AsyncSessionLocal
        return auth_app, create_user, AsyncSessionLocal
    finally:
        sys.path.remove(auth_path)

def load_reviews_service():
    for k in list(sys.modules.keys()):
        if k == 'app' or k.startswith('app.'):
            del sys.modules[k]
    reviews_path = str(HERE / "services" / "reviews_service")
    sys.path.insert(0, reviews_path)
    try:
        from app.main import app as reviews_app
        return reviews_app
    finally:
        sys.path.remove(reviews_path)


@pytest.mark.asyncio
async def test_moderation_and_audit(run_migrations):
    # Load service apps and db objects
    auth_app, create_user, AsyncSessionLocal = load_auth_service()
    reviews_app = load_reviews_service()

    async with AsyncClient(app=auth_app, base_url="http://testserver") as auth_client, AsyncClient(app=reviews_app, base_url="http://testserver") as reviews_client:
        async with AsyncSessionLocal() as session:
            admin_in = type("U", (), {"email": "admin@test", "username": "admin", "password": "adminpass"})
            admin = await create_user(session, admin_in, role="admin")
            admin_id = str(admin.id)

        # login admin to obtain token
        data = {"username": "admin", "password": "adminpass"}
        resp = await auth_client.post("/login", data=data)
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2) register a normal user via auth API
        body = {"email": "user@test", "username": "user1", "password": "userpass"}
        r = await auth_client.post("/register", json=body)
        assert r.status_code == 201
        user = r.json()
        user_id = user["id"]

        # 3) create a product through products service if required - reviews accept product_id as string; use sample id
        product_id = "prod-xyz"

        # 4) post a review as normal user (we directly call reviews app)
        review_payload = {
            "user_id": user_id,
            "title": "Not great",
            "body": "This product broke after a day",
            "rating": 1
        }
        r2 = await reviews_client.post(f"/reviews?product_id={product_id}", json=review_payload)
        assert r2.status_code == 201
        created = r2.json()
        review_id = created["id"]

        # 5) admin lists pending reviews
        r3 = await reviews_client.get("/reviews?approved_only=false", headers=headers)
        assert r3.status_code == 200
        pend = r3.json()
        assert any(str(x["id"]) == review_id for x in pend)

        # 6) admin approves the review
        r4 = await reviews_client.post(f"/reviews/{review_id}/approve", json={"reason": "Approved by test"}, headers=headers)
        assert r4.status_code == 200
        review_approved = r4.json()
        assert review_approved["is_approved"] is True

        # 7) audit listing: fetch admin actions
        r5 = await reviews_client.get("/admin/actions", headers=headers)
        assert r5.status_code == 200
        actions = r5.json()
        assert any(str(a["review_id"]) == review_id for a in actions)