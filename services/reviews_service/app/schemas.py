from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ReviewCreate(BaseModel):
    user_id: UUID
    title: Optional[str] = None
    body: str
    rating: int


class ReviewOut(ReviewCreate):
    id: UUID
    is_approved: bool = False
    product_id: str
    created_at: Optional[datetime]
    moderated_at: Optional[datetime]


class AdminActionCreate(BaseModel):
    reason: Optional[str] = None


class AdminActionOut(BaseModel):
    id: UUID
    admin_user_id: UUID
    review_id: UUID
    action_type: str
    reason: Optional[str]
    timestamp: Optional[datetime]

    class Config:
        orm_mode = True