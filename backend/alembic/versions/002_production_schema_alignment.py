"""production schema alignment

Revision ID: 002
Revises: 001
Create Date: 2026-09-04 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def _create_index_if_missing(index_name: str, table_name: str, columns: list[str], unique: bool = False) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = {idx["name"] for idx in inspector.get_indexes(table_name)}
    if index_name not in indexes:
        op.create_index(index_name, table_name, columns, unique=unique)


def upgrade() -> None:
    _add_column_if_missing("users", sa.Column("password_hash", sa.String(), nullable=True))
    _add_column_if_missing("customers", sa.Column("merchant_id", sa.String(), nullable=True))
    _add_column_if_missing("carts", sa.Column("merchant_id", sa.String(), nullable=True))
    _add_column_if_missing("orders", sa.Column("merchant_id", sa.String(), nullable=True))
    _add_column_if_missing("payments", sa.Column("merchant_id", sa.String(), nullable=True))
    _add_column_if_missing("customer_events", sa.Column("merchant_id", sa.String(), nullable=True))
    _add_column_if_missing("agent_actions", sa.Column("merchant_id", sa.String(), nullable=True))

    _create_index_if_missing("ix_carts_merchant_id", "carts", ["merchant_id"])
    _create_index_if_missing("ix_orders_merchant_id", "orders", ["merchant_id"])
    _create_index_if_missing("ix_payments_merchant_id", "payments", ["merchant_id"])
    _create_index_if_missing("ix_customer_events_merchant_id", "customer_events", ["merchant_id"])
    _create_index_if_missing("ix_agent_actions_merchant_id", "agent_actions", ["merchant_id"])


def downgrade() -> None:
    for index_name, table_name in [
        ("ix_agent_actions_merchant_id", "agent_actions"),
        ("ix_customer_events_merchant_id", "customer_events"),
        ("ix_payments_merchant_id", "payments"),
        ("ix_orders_merchant_id", "orders"),
        ("ix_carts_merchant_id", "carts"),
    ]:
        op.drop_index(index_name, table_name=table_name)

    for table_name, column_name in [
        ("agent_actions", "merchant_id"),
        ("customer_events", "merchant_id"),
        ("payments", "merchant_id"),
        ("orders", "merchant_id"),
        ("carts", "merchant_id"),
        ("customers", "merchant_id"),
        ("users", "password_hash"),
    ]:
        op.drop_column(table_name, column_name)
