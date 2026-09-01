from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    currency: str = "INR"
    inventory: int = 0
    features: Dict[str, Any] = Field(default_factory=dict)
    use_cases: List[str] = Field(default_factory=list)
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")

class ProductCreate(ProductBase):
    merchant_id: str

class ProductRelationshipResponse(BaseModel):
    id: str
    target_product_id: str
    relationship_type: str
    priority: int
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")
    
    class Config:
        from_attributes = True
        populate_by_name = True

class ProductResponse(ProductBase):
    id: str
    merchant_id: str
    created_at: datetime
    updated_at: datetime
    source_relations: List[ProductRelationshipResponse] = []

    class Config:
        from_attributes = True
        populate_by_name = True

class ProductSearchRequest(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None

class ShoppingIntent(BaseModel):
    category: Optional[str] = Field(None, description="The broad product category identified (e.g., laptop, accessories, audio)")
    subcategory: Optional[str] = Field(None, description="Specific subcategory if applicable")
    max_price: Optional[float] = Field(None, description="Maximum price constraint")
    min_price: Optional[float] = Field(None, description="Minimum price constraint")
    currency: str = Field("INR", description="Currency code")
    use_cases: List[str] = Field(default_factory=list, description="Extracted use cases (e.g., gaming, travel)")
    required_features: List[str] = Field(default_factory=list, description="Must-have features")
    preferred_features: List[str] = Field(default_factory=list, description="Nice-to-have features")
    keywords: List[str] = Field(default_factory=list, description="General search keywords")

class IntentRequest(BaseModel):
    text: str = Field(..., description="Natural language input from the user")

class IntentResponse(BaseModel):
    intent: ShoppingIntent
    original_text: str
    confidence: float = 1.0

class CartItemSchema(BaseModel):
    id: str
    product_id: str
    name: str
    quantity: int
    unit_price: float
    subtotal: float

class CartValidationSchema(BaseModel):
    valid: bool
    issues: List[str]

class CartResponse(BaseModel):
    id: str
    items: List[CartItemSchema]
    subtotal: float
    discount: float
    charges: float
    total: float
    currency: str
    validation: CartValidationSchema
    
class AddItemRequest(BaseModel):
    product_id: str
    quantity: int = 1

class UpdateItemRequest(BaseModel):
    quantity: int

class ApplyOfferRequest(BaseModel):
    offer_id: str

class OfferProposalRequest(BaseModel):
    offer_id: str
    proposed_discount_percentage: float

class PolicyResult(BaseModel):
    allowed: bool
    reason: str
