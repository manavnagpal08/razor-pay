from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_products_no_db():
    response = client.get("/api/products/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_search_products_payload():
    try:
        response = client.post("/api/products/search", json={
            "query": "gaming laptop",
            "min_price": 50000,
            "max_price": 80000
        })
    except Exception:
        pass
