from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/products", tags=["products"])
logger = logging.getLogger(__name__)

# Cache the embeddings client
embeddings_client = None
def get_embeddings_client():
    from app.main import settings
    global embeddings_client
    if embeddings_client is None and settings.gemini_api_key:
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            embeddings_client = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=settings.gemini_api_key
            )
        except ImportError:
            logger.error("langchain-google-genai is not installed.")
    return embeddings_client


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
def search_products(request: schemas.ProductSearchRequest, db: Session = Depends(get_db)):
    query = db.query(models.Product)
    
    if request.category:
        query = query.filter(models.Product.category == request.category)
    if request.min_price is not None:
        query = query.filter(models.Product.price >= request.min_price)
    if request.max_price is not None:
        query = query.filter(models.Product.price <= request.max_price)
    if request.in_stock:
        query = query.filter(models.Product.inventory > 0)
        
    if request.query:
        emb_client = get_embeddings_client()
        # If we have the Gemini client, run semantic search
        if emb_client:
            try:
                query_vector = emb_client.embed_query(request.query)
                # Order by pgvector's cosine distance `<=>` operator
                query = query.order_by(models.Product.embedding.cosine_distance(query_vector))
            except Exception as e:
                logger.error(f"Semantic search failed: {e}. Falling back to ILIKE.")
                search_term = f"%{request.query}%"
                query = query.filter(models.Product.name.ilike(search_term) | models.Product.description.ilike(search_term))
        else:
            # Fallback to standard ILIKE if no AI available
            search_term = f"%{request.query}%"
            query = query.filter(models.Product.name.ilike(search_term) | models.Product.description.ilike(search_term))
            
    # Limit semantic search to top 10 results
    if request.query:
        query = query.limit(10)
        
    return query.all()
