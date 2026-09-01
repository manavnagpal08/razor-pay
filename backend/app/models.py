from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

JSONType = JSON().with_variant(JSONB, "postgresql")
try:
    from pgvector.sqlalchemy import Vector
    VectorType = JSON().with_variant(Vector(768), "postgresql")
except Exception:
    VectorType = JSON

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="customer")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Customer(Base):
    __tablename__ = "customers"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    segment = Column(String)
    preferences = Column(JSONType, default=dict)
    lifetime_value = Column(Numeric(10, 2), default=0.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    currency = Column(String, default="INR")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="INR")
    inventory = Column(Integer, default=0)
    features = Column(JSONType, default=dict)
    use_cases = Column(JSONType, default=list)
    metadata_ = Column("metadata", JSONType, default=dict)  # 'metadata' is reserved in SQLAlchemy
    embedding = Column(VectorType)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class ProductRelationship(Base):
    __tablename__ = "product_relationships"
    id = Column(String, primary_key=True, index=True)
    source_product_id = Column(String, ForeignKey("products.id"), index=True)
    target_product_id = Column(String, ForeignKey("products.id"), index=True)
    relationship_type = Column(String, index=True) # UPSELL, CROSS_SELL, RELATED, FREQUENTLY_BOUGHT_TOGETHER
    priority = Column(Integer, default=0)
    metadata_ = Column("metadata", JSONType, default=dict)
    
    # Optional relationships to traverse in ORM
    source_product = relationship("Product", foreign_keys=[source_product_id], backref="source_relations")
    target_product = relationship("Product", foreign_keys=[target_product_id], backref="target_relations")

class Cart(Base):
    __tablename__ = "carts"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    status = Column(String, default="active")
    subtotal = Column(Numeric(10, 2), default=0.0)
    discount = Column(Numeric(10, 2), default=0.0)
    total = Column(Numeric(10, 2), default=0.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(String, primary_key=True, index=True)
    cart_id = Column(String, ForeignKey("carts.id"))
    product_id = Column(String, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2))

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    cart_id = Column(String, ForeignKey("carts.id"))
    razorpay_order_id = Column(String, unique=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="CREATED")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True)
    order_id = Column(String, ForeignKey("orders.id"))
    razorpay_payment_id = Column(String, unique=True, index=True)
    status = Column(String, default="PENDING")
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Offer(Base):
    __tablename__ = "offers"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    name = Column(String, nullable=False)
    discount_type = Column(String)
    discount_value = Column(Numeric(10, 2))
    minimum_cart_value = Column(Numeric(10, 2), default=0.0)
    maximum_discount = Column(Numeric(10, 2))
    eligible_products = Column(JSONType, default=list)
    eligible_categories = Column(JSONType, default=list)
    eligible_segments = Column(JSONType, default=list)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    status = Column(String, default="active")

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    name = Column(String, nullable=False)
    objective = Column(String)
    audience = Column(String)
    budget = Column(Numeric(10, 2))
    proposal = Column(JSONType)
    status = Column(String, default="pending")
    approved_by = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class CustomerEvent(Base):
    __tablename__ = "customer_events"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    event_type = Column(String, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    metadata_ = Column("metadata", JSONType, default=dict)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AgentAction(Base):
    __tablename__ = "agent_actions"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), index=True)
    agent_name = Column(String, index=True)
    action_type = Column(String)
    input = Column(JSONType)
    decision = Column(JSONType)
    reason = Column(String)
    policy_result = Column(JSONType)
    approval_status = Column(String)
    execution_status = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class MerchantPolicy(Base):
    __tablename__ = "merchant_policies"
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    max_discount_percent = Column(Numeric(5, 2))
    max_discount_amount = Column(Numeric(10, 2))
    campaign_budget_limit = Column(Numeric(10, 2))
    approval_rules = Column(JSONType, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
