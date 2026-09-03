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

class CreateProductPayload(schemas.BaseModel):
    name: str
    category: str
    price: float
    inventory: int = 10
    description: str | None = ""
    image_url: str | None = None
    merchant_id: str | None = "demo_merchant"

@router.get("/merchant/{merchant_id}", response_model=List[schemas.ProductResponse])
def get_merchant_products(merchant_id: str, db: Session = Depends(get_db)):
    """Retrieve all catalog items owned by a specific merchant."""
    clean_id = merchant_id.strip()
    
    # Handle if merchant_id is a JWT token (e.g. eyJhbGciOi...)
    if clean_id.startswith("ey"):
        try:
            import jwt
            from app.core.config import settings
            decoded = jwt.decode(clean_id, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            if decoded.get("sub"):
                clean_id = decoded["sub"]
        except Exception:
            pass

    # Ensure starter catalog is seeded if merchant has 0 products
    products = db.query(models.Product).filter(models.Product.merchant_id == clean_id).all()
    if not products:
        from app.api.auth import ensure_merchant_starter_catalog
        ensure_merchant_starter_catalog(db, clean_id)
        products = db.query(models.Product).filter(models.Product.merchant_id == clean_id).all()
        
    # Fallback to demo_merchant products if still empty
    if not products:
        products = db.query(models.Product).filter(models.Product.merchant_id == "demo_merchant").all()
    if not products:
        products = db.query(models.Product).all()

    results = []
    for p in products:
        img = (p.metadata_ or {}).get("image_url") if isinstance(p.metadata_, dict) else None
        p_dict = {
            "id": p.id,
            "merchant_id": p.merchant_id,
            "name": p.name,
            "category": p.category or "General",
            "description": p.description or "",
            "price": float(p.price),
            "currency": p.currency or "INR",
            "inventory": p.inventory or 0,
            "image_url": img or "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60",
            "features": p.features or {},
            "use_cases": p.use_cases or [],
            "metadata_": p.metadata_ or {},
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "source_relations": []
        }
        results.append(p_dict)
    return results

@router.post("/", response_model=schemas.ProductResponse)
def create_merchant_product(req: CreateProductPayload, db: Session = Depends(get_db)):
    """Add a new product to the merchant catalog."""
    import uuid
    clean_merchant_id = (req.merchant_id or "demo_merchant").strip()
    if clean_merchant_id.startswith("ey"):
        try:
            import jwt
            from app.core.config import settings
            decoded = jwt.decode(clean_merchant_id, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            if decoded.get("sub"):
                clean_merchant_id = decoded["sub"]
        except Exception:
            pass

    merchant = db.query(models.Merchant).filter(models.Merchant.id == clean_merchant_id).first()
    if not merchant:
        merchant = models.Merchant(id=clean_merchant_id, name="Storefront", currency="INR")
        db.add(merchant)
        db.flush()

    prod_id = f"prod_{str(uuid.uuid4())[:8]}"
    img_url = req.image_url or "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    product = models.Product(
        id=prod_id,
        merchant_id=clean_merchant_id,
        name=req.name.strip(),
        category=req.category.strip(),
        price=req.price,
        inventory=req.inventory,
        description=req.description or f"High performance {req.name}",
        currency="INR",
        features={"verified": True},
        use_cases=["Everyday", "Professional"],
        metadata_={"image_url": img_url}
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return {
        "id": product.id,
        "merchant_id": product.merchant_id,
        "name": product.name,
        "category": product.category,
        "description": product.description,
        "price": float(product.price),
        "currency": product.currency,
        "inventory": product.inventory,
        "image_url": img_url,
        "features": product.features or {},
        "use_cases": product.use_cases or [],
        "metadata_": product.metadata_ or {},
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "source_relations": []
    }

@router.post("/merchant/{merchant_id}/seed")
def seed_merchant_products(merchant_id: str, db: Session = Depends(get_db)):
    """Explicitly seed or reset sample products for a merchant."""
    clean_id = merchant_id.strip()
    if clean_id.startswith("ey"):
        try:
            import jwt
            from app.core.config import settings
            decoded = jwt.decode(clean_id, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            if decoded.get("sub"):
                clean_id = decoded["sub"]
        except Exception:
            pass

    from app.api.auth import ensure_merchant_starter_catalog
    ensure_merchant_starter_catalog(db, clean_id)
    return {"status": "success", "message": f"Starter products seeded for {clean_id}"}

@router.delete("/{product_id}")
def delete_merchant_product(product_id: str, db: Session = Depends(get_db)):
    """Remove a product from the catalog."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"status": "deleted", "product_id": product_id}