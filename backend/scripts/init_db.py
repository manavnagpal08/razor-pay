import sys
import os

# Add parent dir to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
# Import all models to ensure they are registered with Base
from app.models import (
    User, Customer, Merchant, Product, ProductRelationship, Cart, CartItem,
    Order, Payment, Offer, Campaign, CustomerEvent, AgentAction, MerchantPolicy
)
from sqlalchemy import text

def init_db():
    print(f"Connecting to database at: {engine.url}")
    try:
        with engine.connect() as conn:
            print("Installing pgvector extension...")
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            print("Extension created successfully.")
            
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
