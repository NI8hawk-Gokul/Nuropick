# (keep existing imports and endpoints; appended below is the audit listing endpoint)
from fastapi import Query

# Add this endpoint near moderation endpoints

@app.get("/admin/actions", response_model=List[AdminActionOut], dependencies=[Depends(require_admin)])
async def list_admin_actions(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200), db: AsyncSession = Depends(get_db)):
    """
    Admin-only: list admin action audit logs (paginated)
    """
    offset = (page - 1) * page_size
    q = select(AdminAction).order_by(AdminAction.timestamp.desc()).offset(offset).limit(page_size)
    res = await db.execute(q)
    rows = res.scalars().all()
    out = []
    for a in rows:
        out.append({
            "id": a.id,
            "admin_user_id": a.admin_user_id,
            "review_id": a.review_id,
            "action_type": a.action_type,
            "reason": a.reason,
            "timestamp": a.timestamp,
        })
    return out