import uuid

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.database import SessionLocal
from app.main import app
from app.models import Merchant, Product, ProductRelationship, User


client = TestClient(app)


def create_merchant(name: str = "Secure Merchant"):
    db = SessionLocal()
    merchant_id = f"merchant_{uuid.uuid4().hex[:12]}"
    user = User(
        id=merchant_id,
        name=name,
        email=f"{merchant_id}@example.com",
        password_hash="hash",
        role="merchant",
    )
    merchant = Merchant(id=merchant_id, name=name, currency="INR")
    db.add_all([user, merchant])
    db.commit()
    db.close()
    return merchant_id, create_access_token(subject=merchant_id)


def test_product_creation_requires_merchant_auth():
    response = client.post(
        "/api/products/",
        json={
            "name": "Unauthorized Product",
            "category": "Security",
            "price": 999.0,
            "inventory": 5,
            "merchant_id": "victim_merchant",
        },
    )

    assert response.status_code == 401


def test_product_create_ignores_body_merchant_id_and_uses_token_owner():
    merchant_id, token = create_merchant()

    response = client.post(
        "/api/products/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Verified Catalog Item",
            "category": "Accessories",
            "price": 1999.0,
            "inventory": 10,
            "merchant_id": "attacker_selected_merchant",
        },
    )

    assert response.status_code == 200
    assert response.json()["merchant_id"] == merchant_id


def test_product_create_enriches_laptop_specs_and_builds_relationships():
    merchant_id, token = create_merchant("Enriched Merchant")

    first = client.post(
        "/api/products/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Student Laptop",
            "category": "Laptops",
            "price": 45000.0,
            "inventory": 8,
            "description": "Laptop for college and coding",
        },
    )
    second = client.post(
        "/api/products/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Creator Laptop Pro",
            "category": "Laptops",
            "price": 75000.0,
            "inventory": 5,
            "description": "Laptop for editing and creative work",
        },
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["features"]["ram"] == "16GB"
    assert "coding" in first.json()["use_cases"]

    db = SessionLocal()
    try:
        assert db.query(ProductRelationship).filter(
            ProductRelationship.source_product_id == first.json()["id"],
            ProductRelationship.target_product_id == second.json()["id"],
            ProductRelationship.relationship_type == "UPSELL",
        ).first() is not None
    finally:
        db.close()


def test_merchant_cannot_delete_another_merchants_product():
    owner_id, _owner_token = create_merchant("Owner Merchant")
    _other_id, other_token = create_merchant("Other Merchant")

    db = SessionLocal()
    product = Product(
        id=f"prod_{uuid.uuid4().hex[:8]}",
        merchant_id=owner_id,
        name="Protected Product",
        category="Protected",
        price=5000.0,
        inventory=3,
        currency="INR",
        features={},
        use_cases=[],
        metadata_={},
    )
    db.add(product)
    db.commit()
    product_id = product.id
    db.close()

    response = client.delete(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 403

    db = SessionLocal()
    try:
        assert db.query(Product).filter(Product.id == product_id).first() is not None
    finally:
        db.close()
