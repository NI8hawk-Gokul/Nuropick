from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from .models import User
from .schemas import UserCreate
from uuid import UUID
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_user_by_email(db: AsyncSession, email: str):
    q = select(User).where(User.email == email)
    res = await db.execute(q)
    return res.scalars().first()


async def get_user_by_username(db: AsyncSession, username: str):
    q = select(User).where(User.username == username)
    res = await db.execute(q)
    return res.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: UUID):
    q = select(User).where(User.id == user_id)
    res = await db.execute(q)
    return res.scalars().first()


async def create_user(db: AsyncSession, user_in: UserCreate, role: Optional[str] = "user"):
    """
    Create a new user. `role` can be 'user' or 'admin' (dev only for seeding).
    """
    hashed = pwd_context.hash(user_in.password)
    user = User(email=user_in.email, username=user_in.username, password_hash=hashed, role=role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)