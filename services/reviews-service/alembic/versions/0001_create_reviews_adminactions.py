"""create reviews and admin_actions tables

Revision ID: 0001_create_reviews_adminactions
Revises:
Create Date: 2026-02-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

revision = "0001_create_reviews_adminactions"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # reviews table
    op.create_table(
        "reviews",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", sa.String(length=100), nullable=False, index=True),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("title", sa.String(length=300), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.sql.expression.false()),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("moderated_at", sa.DateTime(), nullable=True),
    )

    # admin_actions table
    op.create_table(
        "admin_actions",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_user_id", pg.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("review_id", pg.UUID(as_uuid=True), sa.ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_type", sa.String(length=50), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("timestamp", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_table("admin_actions")
    op.drop_table("reviews")