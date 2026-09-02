from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import logging
from app.database import get_db
from app import models, schemas
from app.core.config import settings

router = APIRouter(prefix="/api/products", tags=["products"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/search", response_model=List[schemas.ProductResponse])
def search_products(request: schemas.ProductSearchRequest, db: Session = Depends(get_db), merchant_id: Optional[str] = None):
    """
    Multi-tier resilient search with multi-tenant merchant scoping:
    1. Scope to merchant_id if specified and merchant has products
    2. Exact category + price filters
    3. Tokenized multi-word search across name, description, features, use_cases
    4. Category fallback if specific keywords yielded 0 results
    5. Storewide top items fallback to avoid dead ends
    """
    base_query = db.query(models.Product)
    
    # Multi-tenant scoping
    if merchant_id:
        merchant_prods_count = base_query.filter(models.Product.merchant_id == merchant_id).count()
        if merchant_prods_count > 0:
            base_query = base_query.filter(models.Product.merchant_id == merchant_id)

    if request.in_stock:
        base_query = base_query.filter(models.Product.inventory > 0)
    if request.min_price is not None:
        base_query = base_query.filter(models.Product.price >= request.min_price)
    if request.max_price is not None:
        base_query = base_query.filter(models.Product.price <= request.max_price)

    # 1. If both category and query provided
    if request.category:
        cat_query = base_query.filter(models.Product.category.ilike(f"%{request.category}%"))
        
        if request.query:
            tokens = [t.strip().lower() for t in request.query.split() if len(t.strip()) > 2]
            if tokens:
                token_filters = [
                    or_(
                        models.Product.name.ilike(f"%{t}%"),
                        models.Product.description.ilike(f"%{t}%")
                    )
                    for t in tokens
                ]
                token_matches = cat_query.filter(or_(*token_filters)).all()
                if token_matches:
                    return token_matches[:10]
        
        # Fallback to category products
        cat_matches = cat_query.all()
        if cat_matches:
            return cat_matches[:10]

    # 2. If only query without category
    if request.query:
        tokens = [t.strip().lower() for t in request.query.split() if len(t.strip()) > 2]
        if tokens:
            token_filters = [
                or_(
                    models.Product.name.ilike(f"%{t}%"),
                    models.Product.description.ilike(f"%{t}%"),
                    models.Product.category.ilike(f"%{t}%")
                )
                for t in tokens
            ]
            matches = base_query.filter(or_(*token_filters)).all()
            if matches:
                return matches[:10]

    # 3. Default fallback: return all available products in price range
    all_prods = base_query.limit(10).all()
    return all_prods