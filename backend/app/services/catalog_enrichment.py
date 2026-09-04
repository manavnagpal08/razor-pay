import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import Product, ProductRelationship


def infer_product_attributes(name: str, category: str | None, description: str | None = None) -> dict[str, Any]:
    text = " ".join(part for part in [name, category or "", description or ""] if part).lower()
    features: dict[str, Any] = {"verified": True}
    use_cases = ["Everyday"]

    if any(word in text for word in ["laptop", "notebook", "macbook", "computer"]):
        features.update({
            "processor": "Intel Core i5 / Ryzen 5 class",
            "ram": "16GB",
            "storage": "512GB SSD",
            "display": "14-15.6 inch FHD",
            "battery": "Up to 8 hours",
        })
        use_cases = ["coding", "office", "study", "creative work"]
    elif any(word in text for word in ["phone", "smartphone", "mobile", "iphone", "android"]):
        features.update({
            "display": "6.1-6.7 inch AMOLED class",
            "storage": "128GB",
            "camera": "50MP main camera class",
            "battery": "All-day battery",
            "connectivity": "4G/5G capable",
        })
        use_cases = ["camera", "daily use", "social", "travel"]
    elif any(word in text for word in ["headphone", "earbud", "audio", "speaker"]):
        features.update({
            "connectivity": "Bluetooth",
            "battery": "Long playback battery",
            "comfort": "Lightweight fit",
        })
        use_cases = ["music", "calls", "travel", "work"]
    elif any(word in text for word in ["watch", "wearable", "band"]):
        features.update({
            "tracking": "Fitness and health tracking",
            "battery": "Multi-day battery",
            "compatibility": "Android and iOS compatible",
        })
        use_cases = ["fitness", "notifications", "health"]

    return {"features": features, "use_cases": use_cases}


def rebuild_merchant_relationships(db: Session, merchant_id: str) -> None:
    products = db.query(Product).filter(Product.merchant_id == merchant_id, Product.inventory > 0).all()
    if len(products) < 2:
        return

    existing = {
        (rel.source_product_id, rel.target_product_id, rel.relationship_type)
        for rel in db.query(ProductRelationship).join(
            Product,
            Product.id == ProductRelationship.source_product_id,
        ).filter(Product.merchant_id == merchant_id).all()
    }

    by_category: dict[str, list[Product]] = {}
    for product in products:
        by_category.setdefault((product.category or "General").lower(), []).append(product)

    for category_products in by_category.values():
        ordered = sorted(category_products, key=lambda item: float(item.price or 0))
        for index, product in enumerate(ordered[:-1]):
            target = ordered[index + 1]
            key = (product.id, target.id, "UPSELL")
            if key not in existing and float(target.price or 0) > float(product.price or 0):
                db.add(ProductRelationship(
                    id=str(uuid.uuid4()),
                    source_product_id=product.id,
                    target_product_id=target.id,
                    relationship_type="UPSELL",
                    priority=10,
                    metadata_={"reason": "Auto-linked to the next higher priced item in the same merchant category."},
                ))

    accessory_products = [
        product for product in products
        if any(word in (product.category or "").lower() for word in ["accessor", "audio", "wearable"])
    ]
    for product in products:
        if product in accessory_products:
            continue
        for accessory in accessory_products[:3]:
            key = (product.id, accessory.id, "CROSS_SELL")
            if key not in existing and product.id != accessory.id:
                db.add(ProductRelationship(
                    id=str(uuid.uuid4()),
                    source_product_id=product.id,
                    target_product_id=accessory.id,
                    relationship_type="CROSS_SELL",
                    priority=5,
                    metadata_={"reason": "Auto-linked as a complementary merchant catalog item."},
                ))
