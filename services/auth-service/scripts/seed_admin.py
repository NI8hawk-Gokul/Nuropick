#!/usr/bin/env python3
"""
Dev-only admin seeding script.

Run inside the auth-service container or locally with proper env vars set:
python services/auth-service/scripts/seed_admin.py --email admin@local.test --username admin --password adminpass
"""

import argparse
import asyncio
import os
from sqlalchemy.ext.asyncio import AsyncSession
from services.auth_service_app.db import AsyncSessionLocal, engine, Base  # use package import if you structured it
# For resilient import if package path not set, fallback:
try:
    from services.auth_service_app.crud import create_user
except Exception:
    import importlib.util, sys, pathlib
    here = pathlib.Path(__file__).resolve().parents[1] / "app" / "crud.py"
    spec = importlib.util.spec_from_file_location("auth_crud", str(here))
    mod = importlib.util.module_from_spec(spec)
    sys.modules["auth_crud"] = mod
    spec.loader.exec_module(mod)
    create_user = mod.create_user

async def _create_admin(email: str, username: str, password: str):
    async with AsyncSessionLocal() as session:
        # ensure tables exist (dev only)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # try to create admin
        user_in = type("U", (), {"email": email, "username": username, "password": password})
        user = await create_user(session, user_in, role="admin")
        print(f"Admin user created: id={user.id} email={user.email} username={user.username}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    asyncio.run(_create_admin(args.email, args.username, args.password))

if __name__ == "__main__":
    main()