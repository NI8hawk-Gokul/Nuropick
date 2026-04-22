import os
from typing import List, Dict, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .db import engine, Base, get_db
from .models import Review, AdminAction
from .schemas import ReviewCreate, ReviewOut, AdminActionCreate, AdminActionOut
from .security import require_admin

app = FastAPI(title="NeuroPick Review Service")

@app.on_event("startup")
async def startup():
    # Only creating tables in dev. In prod, use Alembic.
    ENV = os.getenv("ENV", "development")
    if ENV == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "reviews"}

@app.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(payload: ReviewCreate, product_id: str = Query(...), db: AsyncSession = Depends(get_db)):
    """
    Submit a new review for a product.
    """
    review = Review(
        product_id=product_id,
        user_id=str(payload.user_id),
        title=payload.title,
        body=payload.body,
        rating=payload.rating,
        source="internal"
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review

@app.get("/reviews", response_model=List[ReviewOut])
async def list_reviews(
    product_id: Optional[str] = None,
    approved_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    List reviews, optionally filtered by product_id and approval status.
    """
    q = select(Review)
    if product_id:
        q = q.where(Review.product_id == product_id)
    if approved_only:
        q = q.where(Review.is_approved == True)
    
    res = await db.execute(q)
    return res.scalars().all()

@app.post("/reviews/{review_id}/approve", response_model=ReviewOut)
async def approve_review(
    review_id: str,
    payload: AdminActionCreate,
    admin_user: Dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin: Approve a review.
    """
    q = select(Review).where(Review.id == review_id)
    res = await db.execute(q)
    review = res.scalars().first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_approved = True
    review.moderated_at = datetime.utcnow()
    
    action = AdminAction(
        admin_user_id=admin_user["id"],
        review_id=review_id,
        action_type="approve",
        reason=payload.reason
    )
    db.add(action)
    await db.commit()
    await db.refresh(review)
    return review

@app.post("/reviews/{review_id}/reject", response_model=ReviewOut)
async def reject_review(
    review_id: str,
    payload: AdminActionCreate,
    admin_user: Dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin: Reject a review.
    """
    q = select(Review).where(Review.id == review_id)
    res = await db.execute(q)
    review = res.scalars().first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_approved = False
    review.moderated_at = datetime.utcnow()
    
    action = AdminAction(
        admin_user_id=admin_user["id"],
        review_id=review_id,
        action_type="reject",
        reason=payload.reason
    )
    db.add(action)
    await db.commit()
    await db.refresh(review)
    return review

@app.get("/admin/actions", response_model=List[AdminActionOut])
async def list_admin_actions(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin_user: Dict = Depends(require_admin)
):
    """
    Admin-only: list admin action audit logs (paginated)
    """
    offset = (page - 1) * page_size
    q = select(AdminAction).order_by(AdminAction.timestamp.desc()).offset(offset).limit(page_size)
    res = await db.execute(q)
    rows = res.scalars().all()
    return rows