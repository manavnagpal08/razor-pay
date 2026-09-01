import uuid
import json
import logging
from app.database import SessionLocal
from app.models import Merchant, Product, ProductRelationship, MerchantPolicy
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_database():
    db = SessionLocal()
    
    if db.query(Merchant).first():
        logger.info("Database already initialized and seeded.")
        return
        
    logger.info("Initializing enterprise catalog & multi-tenant seed data...")
    
    # 1. Initialize Gemini Embeddings
    embeddings = None
    if settings.gemini_api_key and settings.gemini_api_key != "":
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=settings.gemini_api_key
            )
            logger.info("Initialized Gemini Embeddings API for vector indexing.")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini Embeddings: {e}")
    else:
        logger.warning("GEMINI_API_KEY not set. Using zero-vectors.")
    
    # 2. Create Multi-Tenant Merchant
    merchant = Merchant(
        id="demo_merchant",
        name="OmniCommerce Enterprise",
        currency="INR"
    )
    db.add(merchant)

    # 3. Create Default Merchant Policy (Max 25% discount, 50k campaign limit)
    policy = MerchantPolicy(
        id=str(uuid.uuid4()),
        merchant_id=merchant.id,
        max_discount_percent=25.0,
        max_discount_amount=5000.0,
        campaign_budget_limit=50000.0,
        approval_rules={"require_human_approval_above_percent": 20.0}
    )
    db.add(policy)
    
    # 4. Premium Enterprise Products
    products_data = [
        {
            "name": "Titanium Gaming Laptop X",
            "category": "laptops",
            "description": "Ultra-performance workstation with RTX 4080, Intel Core i9, 32GB DDR5 RAM, and 1TB NVMe SSD.",
            "price": 145000.00,
            "inventory": 15,
            "features": {"ram_gb": 32, "storage_gb": 1024, "gpu": "RTX 4080", "cpu": "Core i9-14900HX", "display": "16-inch 240Hz QHD+"},
            "use_cases": ["gaming", "AI/ML", "video_editing", "3D_rendering"],
            "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Student Laptop Essential",
            "category": "laptops",
            "description": "Ultra-portable featherlight aluminum laptop with 18-hour all-day battery life and 16GB unified RAM.",
            "price": 55000.00,
            "inventory": 45,
            "features": {"ram_gb": 16, "storage_gb": 512, "battery_hours": 18, "weight_kg": 1.2, "display": "13.6-inch Liquid Retina"},
            "use_cases": ["college", "office", "travel", "programming"],
            "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Pro Wireless Gaming Mouse",
            "category": "accessories",
            "description": "Zero-latency 4KHz polling wireless mouse with 25K sub-micron optical sensor and ultra-lightweight 58g chassis.",
            "price": 8500.00,
            "inventory": 120,
            "features": {"wireless": True, "weight_g": 58, "dpi": 25600, "battery_hours": 90, "rgb": True},
            "use_cases": ["gaming", "esports", "productivity"],
            "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "AcousticStudio Pro ANC Headphones",
            "category": "audio",
            "description": "Flagship over-ear wireless headphones with dual-chip adaptive active noise cancellation and LDAC Hi-Res Audio.",
            "price": 24999.00,
            "inventory": 35,
            "features": {"wireless": True, "anc": True, "battery_hours": 40, "driver_mm": 40, "codec": "LDAC / AAC"},
            "use_cases": ["travel", "office", "studio_monitoring", "gaming"],
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "Thunderbolt 4 Docking Station Pro",
            "category": "accessories",
            "description": "11-in-1 multi-port docking hub with dual 4K 120Hz display outputs, 100W Power Delivery, and Gigabit Ethernet.",
            "price": 7999.00,
            "inventory": 80,
            "features": {"ports": 11, "thunderbolt": True, "pd_charging_w": 100, "ethernet_gbps": 1, "card_reader": True},
            "use_cases": ["office", "multitasking", "content_creation"],
            "image_url": "https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=800&q=80"
        },
        {
            "name": "UltraWide 34-Inch Curved Gaming Monitor",
            "category": "accessories",
            "description": "144Hz WQHD curved gaming monitor with 1ms response time, HDR400, and sRGB 99% color fidelity.",
            "price": 38999.00,
            "inventory": 20,
            "features": {"size_inch": 34, "resolution": "3440x1440", "refresh_hz": 144, "curved": "1500R", "hdr": True},
            "use_cases": ["gaming", "video_editing", "finance_trading"],
            "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80"
        }
    ]
    
    product_objects = []
    for pd in products_data:
        embed_vector = [0.0] * 768
        if embeddings:
            embed_text = f"{pd['name']} {pd['description']} Category: {pd['category']} Features: {json.dumps(pd['features'])} Use Cases: {','.join(pd['use_cases'])}"
            try:
                embed_vector = embeddings.embed_query(embed_text)
                logger.info(f"Vector indexed: {pd['name']}")
            except Exception as e:
                logger.error(f"Failed to embed {pd['name']}: {e}")
                
        product = Product(
            id=str(uuid.uuid4()),
            merchant_id=merchant.id,
            name=pd["name"],
            category=pd["category"],
            description=pd["description"],
            price=pd["price"],
            currency="INR",
            inventory=pd["inventory"],
            features=pd["features"],
            use_cases=pd["use_cases"],
            metadata_={"image_url": pd["image_url"]},
            embedding=embed_vector 
        )
        db.add(product)
        product_objects.append(product)
        
    db.commit()
    
    # 5. Product Graph Relationships
    laptop_x = next(p for p in product_objects if "Titanium" in p.name)
    laptop_student = next(p for p in product_objects if "Student" in p.name)
    mouse = next(p for p in product_objects if "Mouse" in p.name)
    headphones = next(p for p in product_objects if "Headphones" in p.name)
    dock = next(p for p in product_objects if "Thunderbolt" in p.name)
    monitor = next(p for p in product_objects if "Monitor" in p.name)
    
    relationships = [
        ProductRelationship(
            id=str(uuid.uuid4()),
            source_product_id=laptop_student.id,
            target_product_id=laptop_x.id,
            relationship_type="UPSELL",
            priority=10,
            metadata_={"reason": "Upgrade to RTX 4080 and 32GB RAM for heavy gaming and rendering."}
        ),
        ProductRelationship(
            id=str(uuid.uuid4()),
            source_product_id=laptop_x.id,
            target_product_id=mouse.id,
            relationship_type="CROSS_SELL",
            priority=8,
            metadata_={"reason": "Pair your gaming laptop with zero-latency 25K optical mouse."}
        ),
        ProductRelationship(
            id=str(uuid.uuid4()),
            source_product_id=laptop_x.id,
            target_product_id=monitor.id,
            relationship_type="CROSS_SELL",
            priority=7,
            metadata_={"reason": "Expand your workstation with a 34-inch 144Hz curved display."}
        ),
        ProductRelationship(
            id=str(uuid.uuid4()),
            source_product_id=laptop_x.id,
            target_product_id=headphones.id,
            relationship_type="FREQUENTLY_BOUGHT_TOGETHER",
            priority=5,
            metadata_={"reason": "Complete your audio setup with ANC studio headphones."}
        ),
        ProductRelationship(
            id=str(uuid.uuid4()),
            source_product_id=laptop_student.id,
            target_product_id=dock.id,
            relationship_type="CROSS_SELL",
            priority=6,
            metadata_={"reason": "Add 11 ports and dual 4K monitor support for your desk."}
        )
    ]
    db.add_all(relationships)
    db.commit()

    logger.info("Enterprise database seed completed successfully with 6 verified products and full graph relations.")
    
if __name__ == "__main__":
    seed_database()