import os
from typing import Dict

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_db
from .models import User
from sqlalchemy import select

SECRET_KEY = os.getenv("JWT_SECRET", "change-me-to-a-secure-random-value")
ALGORITHM = "HS256"

# tokenUrl points to auth service login endpoint; it's mainly used by interactive docs
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8001/login")


def decode_access_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    """
    Returns token payload as dictionary. Payload must include 'sub' (user id).
    """
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    # return payload; downstream functions can query DB for fresh role
    return payload


async def require_admin(current_user: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Dict:
    """
    Ensures the user id in token corresponds to an admin role in the users table.
    This makes role changes effective immediately (live check).
    """
    user_id = current_user.get("sub")
    try:
        # query users table for fresh role
        q = select(User).where(User.id == user_id)
        res = await db.execute(q)
        user = res.scalars().first()
    except Exception:
        user = None

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    # include DB user object fields for convenience
    return {"id": str(user.id), "email": user.email, "username": user.username, "role": user.role}