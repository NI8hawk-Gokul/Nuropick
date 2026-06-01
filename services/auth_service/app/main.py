import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from .schemas import UserCreate, UserOut, Token
from .db import engine, Base, get_db
from .crud import create_user, get_user_by_email, verify_password, get_user_by_username, get_user_by_id
from .security import create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

from jose import JWTError

app = FastAPI(title="NeuroPick Auth Service")

oauth2_scheme = None  # not needed here

ENV = os.getenv("ENV", "development")


@app.on_event("startup")
async def startup():
    # ensure DB tables exist (for development). Use Alembic for production migrations.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth"}


@app.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    # simple duplicate checks
    existing_email = await get_user_by_email(db, payload.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_username = await get_user_by_username(db, payload.username)
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = await create_user(db, payload)
    return user


@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # OAuth2PasswordRequestForm uses 'username' field for login; we accept email or username
    identifier = form_data.username
    user = await get_user_by_email(db, identifier)
    if not user:
        user = await get_user_by_username(db, identifier)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or email")
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # include role claim in token for convenience; downstream services should verify role live when needed
    token = create_access_token(str(user.id), role=user.role, expires_delta=access_token_expires)
    return {"access_token": token, "token_type": "bearer"}


async def get_current_user(token: str = Depends(lambda: None), db: AsyncSession = Depends(get_db)):
    # This function is intentionally unused here; other services call /me
    pass


# -------------------------
# Dev-only: seed admin user
# -------------------------
@app.post("/seed-admin", response_model=UserOut)
async def seed_admin(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Dev-only endpoint: creates an admin user with role='admin'.
    Only allowed when ENV=development.
    """
    if ENV != "development":
        raise HTTPException(status_code=403, detail="Seeding admin is allowed only in development")

    existing = await get_user_by_email(db, payload.email)
    if existing:
        # if exists, upgrade role to admin
        existing.role = "admin"
        db.add(existing)
        await db.commit()
        await db.refresh(existing)
        return existing

    user = await create_user(db, payload, role="admin")
    return user