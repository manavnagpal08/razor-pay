from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.core.security import get_password_hash
import pytest
from unittest.mock import MagicMock

client = TestClient(app)

def test_register_and_login_customer():
    mock_user = MagicMock()
    mock_user.password_hash = get_password_hash("password123")
    mock_user.role = "customer"
    mock_user.name = "Test Cust"
    mock_user.id = "test-user-id"
    mock_user.email = "testcust@example.com"

    mock_db = MagicMock()
    # First call for register (check existing) returns None, second call for login returns mock_user
    mock_db.query.return_value.filter.return_value.first.side_effect = [None, mock_user]
    app.dependency_overrides[get_db] = lambda: mock_db
    
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": "testcust@example.com",
            "password": "password123",
            "name": "Test Cust",
            "role": "customer"
        }
    )
    assert register_response.status_code == 200
    assert "access_token" in register_response.json()

    login_response = client.post(
        "/api/auth/login",
        json={"email": "testcust@example.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    
    app.dependency_overrides.clear()

def test_unauthorized_access():
    response = client.get("/api/merchant/orders")
    assert response.status_code == 401

def test_invalid_token():
    response = client.get(
        "/api/merchant/orders",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401