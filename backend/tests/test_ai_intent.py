from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_intent_parsing_valid():
    response = client.post("/api/ai/intent", json={"text": "I need a gaming laptop under ₹80,000 with at least 16GB RAM"})
    assert response.status_code == 200
    data = response.json()
    intent = data["intent"]
    
    assert intent["category"] == "laptops"
    assert intent["max_price"] == 80000.0
    assert "gaming" in intent["use_cases"]

def test_intent_parsing_audio():
    response = client.post("/api/ai/intent", json={"text": "I need headphones for travel"})
    assert response.status_code == 200
    data = response.json()
    intent = data["intent"]
    
    assert intent["category"] == "audio"
    assert "travel" in intent["use_cases"]

def test_intent_parsing_empty():
    response = client.post("/api/ai/intent", json={"text": ""})
    assert response.status_code == 400
