import os
import json
import asyncio
import importlib.util
import pathlib
import sys

import pytest
from httpx import AsyncClient

HERE = pathlib.Path(__file__).resolve().parents[1]

def _load_app_from_path(module_path: pathlib.Path, attr="app"):
    spec = importlib.util.spec_from_file_location("tmp_module", str(module_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return getattr(mod, attr)


@pytest.mark.asyncio
async def test_moderation_and_audit(run_migrations):
    # ensure services pick DATABASE_URL from env
    # Load auth app and reviews app from file paths
    auth_main = HERE / "services" / "auth-service" / "app" / "main.py"
    reviews_main = HERE / "services" / "reviews-service" / "app" / "main.py"

    auth_app = _load_app_from_path(auth_main)
    reviews_app = _load_app_from_path(reviews_main)

    async with AsyncClient(app=auth_app, base_url="http://testserver") as auth_client, AsyncClient(app=reviews_app, base_url="http://testserver") as reviews_client:
        # 1) seed admin by creating user via auth's create_user function directly (import)
        crud_path = HERE / "services" / "auth-service" / "app" / "crud.py"
        spec = importlib.util.spec_from_file_location("auth_crud", str(crud_path))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        create_user = mod.create_user

        db_path = HERE / "services" / "auth-service" / "app" / "db.py"
        spec2 = importlib.util.spec_from_file_location("auth_db", str(db_path))
        mod2 = importlib.util.module_from_spec(spec2)
        spec2.loader.exec_module(mod2)
        AsyncSessionLocal = mod2.AsyncSessionLocal

        # create admin user
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
        r2 = await reviews_client.post(f"/products/{product_id}/reviews", json=review_payload)
        assert r2.status_code == 201
        created = r2.json()
        review_id = created["id"]

        # 5) admin lists pending reviews
        r3 = await reviews_client.get("/moderation/reviews", headers=headers)
        assert r3.status_code == 200
        pend = r3.json()
        assert any(str(x["id"]) == review_id for x in pend)

        # 6) admin approves the review
        r4 = await reviews_client.post(f"/moderation/reviews/{review_id}/approve", headers=headers)
        assert r4.status_code == 200
        action = r4.json()
        assert action["action_type"] == "approve"
        assert action["review_id"] == review_id

        # 7) audit listing: fetch admin actions
        r5 = await reviews_client.get("/admin/actions", headers=headers)
        assert r5.status_code == 200
        actions = r5.json()
        assert any(a["id"] == action["id"] for a in actions)